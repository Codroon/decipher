// Story Service
// This file contains all story-related API calls

import { API_ENDPOINTS, getHeaders } from './server.js'
import { LENGTH_KEYS, TONES, PREF_DEFAULTS, normalizeLength, normalizeTone } from '../utils/storyPrefs.js'

// ── Failure shape ────────────────────────────────────────────────────────────
// A failed call answers `{ success: false, status, error, code, details }`,
// matching billingService. `code` and `details` are the whole difference
// between a refusal a reader can act on and a dead end: the backend attaches
// `{ required, balance, shortfall }` to a 402 and the unlocking plan to a 403,
// and utils/billingErrors.js renders those numbers straight into the copy
// ("This costs 18 credits and you have 5"). Forwarding `code` but dropping
// `details` is worse than forwarding neither — it passes the check that opens
// the credit modal and then renders `undefined` into the sentence.
//
// ── Passage length ───────────────────────────────────────────────────────────
// Every call below that makes the model write a passage carries a `length`
// ('short' | 'medium' | 'long', inside its `controls`) in the request body, where
// the backend's extractPreferencesFromRequest reads it. It is not decoration:
// the backend prices a turn by length (short 0.6x, long 1.75x) and falls back
// to 'medium' for a body that omits it, so a client that keeps the reader's
// choice to itself quotes one price in the picker and is charged another.
//
// A model may refuse a length outright — the catalogue's `unsupportedLengths`
// — which comes back as 400 `LENGTH_UNSUPPORTED` and is not a billing refusal,
// so it needs its own handling at the call site.
//
// ── Story controls ───────────────────────────────────────────────────────────
// Length is one of four controls the reader sets on the story screen, and all
// four travel together on every call that writes or rewrites a passage:
// `{ model, length, tone, creativity }`, built by buildStoryPayload below. The
// backend reads them in extractPreferencesFromRequest; a missing one silently
// falls back to its default (creativity 5, Adventurous, medium, default
// model), which is how the Creativity slider and Tone picker used to do
// nothing at all. `creativity` here is the API scale, 0–10 — the 0–100 slider
// is converted by utils/storyPrefs.toApiCreativity before it gets here.

const API_CREATIVITY_DEFAULT = Math.round(PREF_DEFAULTS.creativity / 10)

/**
 * The control fields every story-writing request carries. Validates rather
 * than trusts: an out-of-range or missing value becomes the backend's own
 * default explicitly, so what is sent is always what will be used.
 *
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls]
 * @returns {{model?:string, length:'short'|'medium'|'long', tone:string, creativity:number}}
 */
export function buildStoryPayload(controls = {}) {
  const c = controls || {}
  const n = Number(c.creativity)
  const payload = {
    length: LENGTH_KEYS.includes(c.length) ? c.length : normalizeLength(c.length),
    tone: TONES.includes(c.tone) ? c.tone : normalizeTone(c.tone),
    creativity: c.creativity !== undefined && c.creativity !== null && c.creativity !== '' && Number.isFinite(n)
      ? Math.min(10, Math.max(0, Math.round(n)))
      : API_CREATIVITY_DEFAULT,
  }
  // No model means "the catalogue default" — the backend resolves that, so an
  // absent id is left absent rather than guessed at here.
  if (typeof c.model === 'string' && c.model.trim()) payload.model = c.model.trim()
  return payload
}

// ── Story lock retry ─────────────────────────────────────────────────────────
// The backend serializes writes to a story behind a per-story lock, and the
// background summariser (which runs after roughly every third turn) holds
// that lock through its own LLM call. A write that lands while it's running
// gets refused with 409 { code: 'STORY_BUSY' } rather than being allowed to
// race the summary — a deliberate backend trade (a visible occasional 409
// beats silent story corruption). The summariser's call is bounded by
// SUMMARY_TIMEOUT_MS (25s server-side, see services/storySummarizer.js in the
// backend) and its lock is heartbeat-renewed only while that call is actually
// in flight, so 25s is the real worst case for how long a story can stay
// locked — this is the one status code a well-behaved client should retry on
// its own rather than surfacing to the reader.
//
// Every other status (429 rate limit, 4xx validation, 5xx) is returned
// untouched on the first try — only STORY_BUSY is ours to paper over.
const LOCK_RETRY_INITIAL_MS = 1500 // summarisation "usually finishes in a couple of seconds" per a real turn, so the first retry already catches the common case
const LOCK_RETRY_BACKOFF_FACTOR = 2
const LOCK_RETRY_MAX_DELAY_MS = 8000 // don't let a single wait balloon past what still feels like "retrying", not "hung"
const LOCK_RETRY_BUDGET_MS = 30000 // ~25s server-side worst case + a small margin, still short enough that a person watching an honest "finishing…" message will wait it out

/**
 * Fires while a write call is waiting out a 409 STORY_BUSY, so the UI can say
 * something honest ("finishing the previous passage…") instead of sitting
 * silent through the wait.
 *
 * Event type is always 'retry'; `detail` is `{ storyId, active, attempt }` —
 * `active` flips true right before the first wait and false once the retry
 * loop is done (whether it ultimately succeeded or gave up).
 */
export const storyLockEvents = new EventTarget()

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Runs `fetch(url, options)`, retrying with backoff only while the response
 * is a 409 STORY_BUSY — every other outcome (success, or any other error
 * status) is returned on the first try. Gives up once the next wait would
 * push total elapsed time past LOCK_RETRY_BUDGET_MS, returning the last busy
 * response so the caller's normal error handling takes over.
 *
 * Reads the body via a clone to check the busy code, so the caller's own
 * response.json()/response.text() on the returned Response still works
 * exactly as if this wrapper weren't here.
 */
async function fetchWithLockRetry(url, options, { storyId } = {}) {
  let elapsed = 0
  let delay = LOCK_RETRY_INITIAL_MS
  let attempt = 0

  for (;;) {
    const response = await fetch(url, options)

    let busy = false
    if (response.status === 409) {
      try {
        const peeked = await response.clone().json()
        busy = peeked?.code === 'STORY_BUSY'
      } catch {
        busy = false
      }
    }

    if (!busy) {
      if (attempt > 0) {
        storyLockEvents.dispatchEvent(new CustomEvent('retry', { detail: { storyId, active: false, attempt } }))
      }
      return response
    }

    if (elapsed + delay > LOCK_RETRY_BUDGET_MS) {
      storyLockEvents.dispatchEvent(new CustomEvent('retry', { detail: { storyId, active: false, attempt } }))
      return response
    }

    attempt += 1
    storyLockEvents.dispatchEvent(new CustomEvent('retry', { detail: { storyId, active: true, attempt } }))
    await sleep(delay)
    elapsed += delay
    delay = Math.min(LOCK_RETRY_MAX_DELAY_MS, delay * LOCK_RETRY_BACKOFF_FACTOR)
  }
}

/**
 * Suggest 5 protagonist archetypes that fit a setting.
 *
 * Used by the creation wizard for a custom setting, where there is no
 * hand-written roster to fall back on. The backend never errors here — an
 * unreachable model returns generic archetypes with `generated: false` — so a
 * failure only ever means the network call itself did not complete.
 *
 * @param {string} setting - The setting the player typed
 * @returns {Promise<{success: boolean, characters?: string[], generated?: boolean, error?: string}>}
 */
export const suggestCharacters = async (setting) => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.SUGGEST_CHARACTERS, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ setting })
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        characters: Array.isArray(data.characters) ? data.characters : [],
        generated: data.generated !== false
      }
    }
    return {
      success: false,
      status: response.status,
      error: data.message || 'Failed to suggest characters',
      code: data.code || null,
      details: data.details || null
    }
  } catch (error) {
    console.error('Suggest Characters Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Create a new story
 * @param {string} setting - The story setting/world
 * @param {string} character - The character type/role
 * @param {string} characterName - The character's name
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls] - Story controls (see buildStoryPayload)
 * @returns {Promise<Object>} Story creation result
 */
export const createStory = async (setting, character, characterName, controls = {}) => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.CREATE, {
      method: 'POST',
      headers: getHeaders(true), // Include auth token
      body: JSON.stringify({
        setting,
        character,
        characterName,
        ...buildStoryPayload(controls)
      })
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        story: data.story
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to create story',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Create Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Create a new story from a scenario
 * @param {string} scenarioId - The scenario ID
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls] - Story controls (see buildStoryPayload)
 * @returns {Promise<Object>} Story creation result
 */
export const createStoryFromScenario = async (scenarioId, controls = {}) => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.CREATE, {
      method: 'POST',
      headers: getHeaders(true), // Include auth token
      body: JSON.stringify({
        scenarioId,
        ...buildStoryPayload(controls)
      })
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        story: data.story
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to create story from scenario',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Create Story From Scenario Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Initialize a story with character-building questions (Pre-Game Interview)
 * @param {string} setting - The story setting/world
 * @param {string} character - The character type/role
 * @param {string} characterName - The character's name
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls] - Story controls (see buildStoryPayload)
 * @returns {Promise<Object>} { storyId, questions }
 */
export const initializeStoryWithQuestions = async (setting, character, characterName, controls = {}) => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.INITIALIZE, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ setting, character, characterName, ...buildStoryPayload(controls) })
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        storyId: data.storyId,
        questions: data.questions
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to initialize story',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Initialize Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Initialize a story from a scenario with character-building questions
 * @param {string} scenarioId - The scenario ID
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls] - Story controls (see buildStoryPayload)
 * @returns {Promise<Object>} { storyId, questions }
 */
export const initializeStoryFromScenario = async (scenarioId, controls = {}) => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.INITIALIZE, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ scenarioId, ...buildStoryPayload(controls) })
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        storyId: data.storyId,
        questions: data.questions
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to initialize story from scenario',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Initialize Story From Scenario Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Submit answers to character questions and awaken the story
 * @param {string} storyId - The story ID
 * @param {string[]} answers - Array of 5 answer strings
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls] - Story controls (see buildStoryPayload)
 * @returns {Promise<Object>} Updated story
 */
export const submitAnswers = async (storyId, answers, controls = {}) => {
  try {
    const response = await fetchWithLockRetry(API_ENDPOINTS.STORY.SUBMIT_ANSWERS(storyId), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ answers, ...buildStoryPayload(controls) })
    }, { storyId })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        story: data.story
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to submit answers',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Submit Answers Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Get all stories for the current user
 * @returns {Promise<Object>} User's stories
 */
export const getAllStories = async () => {
  try {
    console.log('Fetching stories from:', API_ENDPOINTS.STORY.GET_ALL)
    const token = localStorage.getItem('token')
    console.log('Token available:', !!token)

    const response = await fetch(API_ENDPOINTS.STORY.GET_ALL, {
      method: 'GET',
      headers: getHeaders(true)
    })

    console.log('Stories response status:', response.status)
    const data = await response.json()
    console.log('Stories response data:', data)

    if (response.ok) {
      return {
        success: true,
        stories: data.stories,
        count: data.count
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to fetch stories',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Get Stories Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Get a specific story by ID
 * @param {string} storyId - The story ID
 * @returns {Promise<Object>} Story data
 */
export const getStoryById = async (storyId) => {
  try {
    console.log('Fetching story:', storyId)
    const token = localStorage.getItem('token')
    console.log('Token available:', !!token)

    const response = await fetch(API_ENDPOINTS.STORY.GET_BY_ID(storyId), {
      method: 'GET',
      headers: getHeaders(true)
    })

    console.log('Story response status:', response.status)
    const data = await response.json()
    console.log('Story response data:', data)

    if (response.ok) {
      return {
        success: true,
        story: data.story
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to fetch story',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Get Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Update a story
 * @param {string} storyId - The story ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Update result
 */
export const updateStory = async (storyId, updateData) => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.UPDATE(storyId), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updateData)
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        story: data.story
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to update story',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Update Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Delete a story
 * @param {string} storyId - The story ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteStory = async (storyId) => {
  try {
    const response = await fetchWithLockRetry(API_ENDPOINTS.STORY.DELETE(storyId), {
      method: 'DELETE',
      headers: getHeaders(true)
    }, { storyId })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to delete story',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Delete Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Regenerate last chunk of story
 * @param {string} storyId - The story ID
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls] - Story controls (see buildStoryPayload)
 * @returns {Promise<Object>} Regeneration result
 */
export const regenerateLastChunk = async (storyId, controls = {}) => {
  try {
    const response = await fetchWithLockRetry(API_ENDPOINTS.STORY.REGENERATE(storyId), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(buildStoryPayload(controls))
    }, { storyId })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        story: data.story
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to regenerate story chunk',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Regenerate Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Continue the story
 * @param {string} storyId - The story ID
 * @param {string} userAction - Optional player action text
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls] - Story controls (see buildStoryPayload)
 * @returns {Promise<Object>} Continue result
 */
export const continueStory = async (storyId, userAction = '', controls = {}) => {
  try {
    const body = buildStoryPayload(controls)
    if (userAction && userAction.trim()) {
      body.userAction = userAction.trim()
    }

    const response = await fetchWithLockRetry(API_ENDPOINTS.STORY.CONTINUE(storyId), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(body)
    }, { storyId })

    const data = await response.json()

    if (response.ok) {
      // Check if the router agent interrupted the flow
      if (data.status === 'interrupted' && data.type === 'question') {
        console.log('[ContinueStory] Router agent interrupted with question:', {
          questionId: data.questionId,
          text: data.text,
          rawData: data
        })
        return {
          success: true,
          interrupted: true,
          questionId: data.questionId,
          questionText: data.text
        }
      }

      return {
        success: true,
        message: data.message,
        // Set when this turn also opened a new chapter — either because the
        // author asked for one in the composer ('author') or the AI detected a
        // scene break ('auto'). Lets the UI follow the story to the new chapter.
        chapterStarted: !!data.chapterStarted,
        chapterStartedBy: data.chapterStartedBy || null,
        chapterOrder: data.chapterOrder,
        story: data.story
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to continue story',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Continue Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Submit an inquiry reply (answer to a clarification question) and auto-continue the story
 * @param {string} storyId - The story ID
 * @param {string} questionId - The Mongoose _id of the characterQuestion
 * @param {string} answer - The player's answer text
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls] - Story controls (see buildStoryPayload)
 * @returns {Promise<Object>} Continue result with the new story chunk
 */
export const submitInquiryReply = async (storyId, questionId, answer, controls = {}) => {
  try {
    const response = await fetchWithLockRetry(API_ENDPOINTS.STORY.CONTINUE(storyId), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        ...buildStoryPayload(controls),
        inquiryReply: { questionId, answer }
      })
    }, { storyId })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        story: data.story
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to submit answer',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Submit Inquiry Reply Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Edit last paragraph of story
 * @param {string} storyId - The story ID
 * @param {string} minorEditInstruction - Instruction for editing
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls] - Story controls (see buildStoryPayload)
 * @returns {Promise<Object>} Edit result
 */
export const editLastParagraph = async (storyId, minorEditInstruction, controls = {}) => {
  try {
    const url = API_ENDPOINTS.STORY.EDIT(storyId)
    const payload = { minorEditInstruction, ...buildStoryPayload(controls) }
    console.log('Edit URL:', url)
    console.log('Edit payload:', payload)

    const response = await fetchWithLockRetry(url, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    }, { storyId })

    console.log('Edit response status:', response.status)
    console.log('Edit response headers:', response.headers)

    // Check if response is ok before parsing
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edit Story Error Response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        return {
          success: false,
          status: response.status,
          error: `Server error:  `
        }
      }
      return {
        success: false,
        status: response.status,
        error: errorData.message || errorData.error || 'Failed to edit story',
        code: errorData.code || null,
        details: errorData.details || null
      }
    }

    // Parse JSON response
    let data
    let responseText = ''
    try {
      responseText = await response.text()
      if (!responseText) {
        return {
          success: false,
          error: 'Server returned empty response'
        }
      }

      // Check if response is HTML (ngrok warning page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('Received HTML instead of JSON (possibly ngrok warning):', responseText.substring(0, 200))
        return {
          success: false,
          error: 'Received HTML response. Please check ngrok configuration or try again.'
        }
      }

      data = JSON.parse(responseText)
      console.log('Edit success data:', data)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Response text:', responseText?.substring(0, 200))
      return {
        success: false,
        error: 'Invalid JSON response from server'
      }
    }

    return {
      success: true,
      message: data.message,
      revisedChunk: data.revisedChunk,
      story: data.story
    }
  } catch (error) {
    console.error('Edit Story Network Error:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })

    // Check for CORS error
    if (error.message.includes('CORS') || error.message.includes('preflight')) {
      return {
        success: false,
        error: 'CORS Error: Backend server needs to allow PATCH method in CORS configuration. Please contact backend developer.'
      }
    }

    return {
      success: false,
      error: `Network error: ${error.message}. Please check your connection and try again.`
    }
  }
}

/**
 * Edit a specific chunk manually
 * @param {string} storyId - The story ID
 * @param {number} chunkIndex - The index of the chunk to edit
 * @param {string} newContent - The new content for the chunk
 * @returns {Promise<Object>} Edit chunk result
 */
export const editChunk = async (storyId, chunkIndex, newContent) => {
  try {
    const url = API_ENDPOINTS.STORY.EDIT_CHUNK(storyId)
    console.log('Edit Chunk URL:', url)
    console.log('Edit Chunk payload:', { chunkIndex, newContent })

    const response = await fetchWithLockRetry(url, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ chunkIndex, newContent })
    }, { storyId })

    console.log('Edit Chunk response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edit Chunk Error Response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        return {
          success: false,
          status: response.status,
          error: `Server error:  `
        }
      }
      return {
        success: false,
        status: response.status,
        error: errorData.message || errorData.error || 'Failed to edit chunk',
        code: errorData.code || null,
        details: errorData.details || null
      }
    }

    let responseText = ''
    let data
    try {
      responseText = await response.text()
      if (!responseText) {
        return {
          success: false,
          error: 'Server returned empty response'
        }
      }

      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('Received HTML instead of JSON:', responseText.substring(0, 200))
        return {
          success: false,
          error: 'Received HTML response. Please check ngrok configuration or try again.'
        }
      }

      data = JSON.parse(responseText)
      console.log('Edit Chunk success data:', data)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      return {
        success: false,
        error: 'Invalid JSON response from server'
      }
    }

    return {
      success: true,
      message: data.message,
      story: data.story
    }
  } catch (error) {
    console.error('Edit Chunk Network Error:', error)

    // Check for CORS error
    if (error.message.includes('CORS') || error.message.includes('preflight')) {
      return {
        success: false,
        error: 'CORS Error: Backend server needs to allow PATCH method in CORS configuration. Please contact backend developer.'
      }
    }

    return {
      success: false,
      error: `Network error: ${error.message}. Please check your connection and try again.`
    }
  }
}

/**
 * Change a story's sharing state (private / unlisted / published)
 * @param {string} storyId - The story ID
 * @param {'private'|'unlisted'|'published'} visibility
 * @param {string} [contentRating] - Optional content rating
 * @returns {Promise<Object>} Update result
 */
export const setStoryVisibility = async (storyId, visibility, contentRating) => {
  try {
    const body = { visibility }
    if (contentRating !== undefined) body.contentRating = contentRating

    const response = await fetch(API_ENDPOINTS.STORY.VISIBILITY(storyId), {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true, message: data.message, story: data.story }
    }
    return {
      success: false,
      status: response.status,
      error: data.message || 'Failed to update visibility',
      code: data.code || null,
      details: data.details || null
    }
  } catch (error) {
    console.error('Set Story Visibility Error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Start a new chapter. Closes + finalizes the current chapter and opens a fresh
 * writing head; the next continuation opens the new chapter with a fresh scene.
 * @param {string} storyId
 * @param {string} [title] Optional chapter title; the AI predicts one when blank.
 * @param {{model?:string, length?:string, tone?:string, creativity?:number}} [controls] - Story controls (see buildStoryPayload)
 */
export const startChapter = async (storyId, title = '', controls = {}) => {
  try {
    const body = buildStoryPayload(controls)
    if (title && title.trim()) body.title = title.trim()

    const response = await fetchWithLockRetry(API_ENDPOINTS.STORY.NEW_CHAPTER(storyId), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(body)
    }, { storyId })

    const data = await response.json()

    if (response.ok) {
      return { success: true, message: data.message, story: data.story }
    }
    return {
      success: false,
      status: response.status,
      error: data.message || 'Failed to start a new chapter',
      code: data.code || null,
      details: data.details || null
    }
  } catch (error) {
    console.error('Start Chapter Error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Get available models from backend
 * @returns {Promise<Object>} List of models
 */
export const getModels = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.MODELS, {
      method: 'GET',
      headers: getHeaders(true)
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        models: data.models
      }
    } else {
      return {
        success: false,
        status: response.status,
        error: data.message || 'Failed to fetch models',
        code: data.code || null,
        details: data.details || null
      }
    }
  } catch (error) {
    console.error('Get Models Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

