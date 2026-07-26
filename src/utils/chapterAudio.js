/**
 * Narration playback for a chapter or a single passage.
 *
 * Replaces the old Kokoro pipeline, which received one WAV per sentence and
 * chained them on an <audio> element via `onended`. That produced audible seams,
 * could not seek, and required the browser to re-run the backend's sentence
 * splitter byte-for-byte to know what to highlight.
 *
 * ElevenLabs returns one continuous MP3 plus character-level timings, so here we
 * feed a single MediaSource buffer and derive highlighting from the alignment
 * data. Playback is seekable and the splitter is gone.
 *
 * Two paths:
 *   cached → fetch the finished MP3, play it as a blob (instant, fully seekable)
 *   live   → stream NDJSON from the backend, appending audio as it arrives
 */
import { getHeaders } from '../services/server'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const audioUrl = (storyId, scope, ref, suffix = '') =>
  `${BASE_URL}/api/story/${storyId}/audio/${scope}/${ref}${suffix}`

/** MediaSource for raw MP3 is absent/unreliable on some Safari builds. */
function canStreamMp3() {
  return (
    typeof window !== 'undefined' &&
    'MediaSource' in window &&
    window.MediaSource.isTypeSupported('audio/mpeg')
  )
}

function base64ToBytes(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Is this narration already generated? Also returns the alignment when cached,
 * so a replay can highlight without touching the provider.
 */
export async function fetchNarrationMeta(storyId, scope, ref) {
  const response = await fetch(audioUrl(storyId, scope, ref), { headers: getHeaders(true) })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.message || 'Could not check narration')
  }
  return data
}

/**
 * Growable character timeline. `characters` concatenates to exactly the narrated
 * text, so index N here is offset N in the script — which is what lets us map a
 * playback time straight onto a character range without re-parsing anything.
 */
export class Alignment {
  constructor() {
    this.characters = []
    this.starts = []
    this.ends = []
  }

  extend({ characters = [], starts = [], ends = [] }) {
    this.characters.push(...characters)
    this.starts.push(...starts)
    this.ends.push(...ends)
  }

  get length() {
    return this.characters.length
  }

  /** Index of the character being spoken at `time`, or -1 before/after. */
  characterIndexAt(time) {
    const { starts } = this
    if (!starts.length || time < starts[0]) return -1
    // Rightmost start <= time.
    let lo = 0
    let hi = starts.length - 1
    let found = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (starts[mid] <= time) {
        found = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return found
  }

  /**
   * Word boundaries around the character at `time` — what actually gets
   * highlighted, since per-character highlighting reads as strobing.
   *
   * The spaces between words carry their own timings, and those gaps are real
   * time — noticeably long after punctuation. Treating them as "no word" blinked
   * the highlight off between every single word, so a gap holds the word that
   * was just spoken until the next one actually starts.
   *
   * @returns {{ start: number, end: number } | null} null only before the first word
   */
  wordRangeAt(time) {
    const idx = this.characterIndexAt(time)
    if (idx < 0) return null
    const isSpace = (c) => !c || /\s/.test(c)

    // Walk back off any whitespace onto the word that preceded it.
    let cursor = idx
    while (cursor >= 0 && isSpace(this.characters[cursor])) cursor--
    if (cursor < 0) return null

    let start = cursor
    while (start > 0 && !isSpace(this.characters[start - 1])) start--
    let end = cursor
    while (end < this.characters.length - 1 && !isSpace(this.characters[end + 1])) end++
    return { start, end: end + 1 }
  }
}

/**
 * Translate a range in script coordinates (what the alignment speaks in) into a
 * range inside one passage (what the DOM renders).
 *
 * `parts` comes from the backend and records where each passage landed in the
 * combined chapter script, so this is arithmetic rather than text matching — the
 * old implementation had to re-split the text in the browser and hope its output
 * matched the server's exactly.
 *
 * @param {{ start: number, end: number }} range
 * @param {Array<{ chunkIndex: number, start: number, end: number }>} parts
 * @returns {{ chunkIndex: number, start: number, end: number } | null}
 */
export function scriptRangeToChunk(range, parts) {
  if (!range || !parts?.length) return null
  const part = parts.find((p) => range.start >= p.start && range.start < p.end)
  if (!part) return null
  return {
    chunkIndex: part.chunkIndex,
    start: range.start - part.start,
    // A word never spans passages (they are joined by a blank line), but clamp
    // anyway so a highlight can't run past the end of the passage.
    end: Math.min(range.end, part.end) - part.start,
  }
}

/**
 * One playback session. Create, `start()`, and `stop()` when the user switches
 * chapters or leaves — stopping aborts the request, which also aborts generation
 * server-side so we stop paying for audio nobody will hear.
 */
export class NarrationSession {
  /**
   * @param {object} opts
   * @param {HTMLAudioElement} opts.audioEl
   * @param {(state: 'loading'|'playing'|'paused'|'ended'|'error') => void} [opts.onState]
   * @param {(alignment: Alignment) => void} [opts.onAlignment] fired as timings arrive
   * @param {(message: string) => void} [opts.onError]
   */
  constructor({ storyId, scope, ref, audioEl, onState, onAlignment, onError }) {
    this.storyId = storyId
    this.scope = scope
    this.ref = ref
    this.audioEl = audioEl
    this.onState = onState || (() => {})
    this.onAlignment = onAlignment || (() => {})
    this.onError = onError || (() => {})

    this.alignment = new Alignment()
    this.parts = []
    this.controller = new AbortController()
    this.objectUrl = null
    this.stopped = false

    // MediaSource append plumbing
    this.mediaSource = null
    this.sourceBuffer = null
    this.pendingAppends = []
    this.streamComplete = false
  }

  async start() {
    this.onState('loading')
    try {
      const meta = await fetchNarrationMeta(this.storyId, this.scope, this.ref)
      if (this.stopped) return

      if (!meta.enabled) {
        throw new Error('Narration is not available right now')
      }
      this.parts = meta.parts || []

      if (meta.cached && meta.alignment) {
        this.alignment.extend(meta.alignment)
        this.onAlignment(this.alignment)
        await this.playCached()
      } else {
        await this.playLive()
      }
    } catch (error) {
      if (this.stopped) return
      this.onState('error')
      this.onError(error?.message || 'Narration failed')
    }
  }

  /** Cache hit: pull the finished file and hand the browser a complete blob. */
  async playCached() {
    const response = await fetch(audioUrl(this.storyId, this.scope, this.ref, '/file'), {
      headers: getHeaders(true),
      signal: this.controller.signal,
    })
    if (!response.ok) {
      // The row can outlive the file; fall back to regenerating.
      if (response.status === 404) return this.playLive()
      throw new Error('Could not load narration')
    }
    const blob = await response.blob()
    if (this.stopped) return
    this.objectUrl = URL.createObjectURL(blob)
    this.audioEl.src = this.objectUrl
    await this.beginPlayback()
  }

  /** Cache miss: stream generation, playing as the audio arrives. */
  async playLive() {
    const streaming = canStreamMp3()
    const fallbackChunks = []

    if (streaming) {
      await this.openMediaSource()
      if (this.stopped) return
    }

    const response = await fetch(audioUrl(this.storyId, this.scope, this.ref, '/stream'), {
      headers: getHeaders(true),
      signal: this.controller.signal,
    })
    if (!response.ok || !response.body) {
      let message = 'Narration failed'
      try {
        const body = await response.json()
        if (body?.message) message = body.message
      } catch {
        /* non-JSON error body */
      }
      throw new Error(message)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffered = ''
    let started = false
    let streamError = null

    const handleEvent = (event) => {
      switch (event.type) {
        case 'meta':
          this.parts = event.parts || []
          break
        case 'audio': {
          const bytes = base64ToBytes(event.data)
          if (streaming) {
            this.queueAppend(bytes)
          } else {
            fallbackChunks.push(bytes)
          }
          break
        }
        case 'alignment':
          this.alignment.extend(event)
          this.onAlignment(this.alignment)
          break
        case 'error':
          streamError = event.message || 'Narration failed'
          break
        default:
          break
      }
    }

    const handleLine = (line) => {
      const trimmed = line.trim()
      if (!trimmed) return
      try {
        handleEvent(JSON.parse(trimmed))
      } catch {
        /* partial or malformed line — skip it rather than kill playback */
      }
    }

    while (true) {
      const { done, value } = await reader.read()
      if (this.stopped) return
      if (value?.length) {
        buffered += decoder.decode(value, { stream: true })
        let newline
        while ((newline = buffered.indexOf('\n')) !== -1) {
          handleLine(buffered.slice(0, newline))
          buffered = buffered.slice(newline + 1)
          // Start as soon as there is something to play, not when it all arrives.
          if (!started && streaming && this.sourceBuffer) {
            started = true
            this.beginPlayback()
          }
        }
      }
      if (done) break
    }
    handleLine(buffered)

    if (streamError) throw new Error(streamError)

    this.streamComplete = true
    if (streaming) {
      this.finishMediaSource()
    } else {
      // No MSE: assemble the whole thing, then play.
      const total = fallbackChunks.reduce((n, c) => n + c.length, 0)
      const merged = new Uint8Array(total)
      let offset = 0
      for (const c of fallbackChunks) {
        merged.set(c, offset)
        offset += c.length
      }
      this.objectUrl = URL.createObjectURL(new Blob([merged], { type: 'audio/mpeg' }))
      this.audioEl.src = this.objectUrl
      await this.beginPlayback()
    }
  }

  openMediaSource() {
    return new Promise((resolve, reject) => {
      this.mediaSource = new MediaSource()
      this.objectUrl = URL.createObjectURL(this.mediaSource)
      this.audioEl.src = this.objectUrl
      this.mediaSource.addEventListener(
        'sourceopen',
        () => {
          try {
            this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/mpeg')
            this.sourceBuffer.addEventListener('updateend', () => this.drainAppends())
            resolve()
          } catch (error) {
            reject(error)
          }
        },
        { once: true }
      )
    })
  }

  /** appendBuffer is single-flight — queue and drain on updateend. */
  queueAppend(bytes) {
    this.pendingAppends.push(bytes)
    this.drainAppends()
  }

  drainAppends() {
    if (!this.sourceBuffer || this.sourceBuffer.updating) return
    const next = this.pendingAppends.shift()
    if (next) {
      try {
        this.sourceBuffer.appendBuffer(next)
      } catch {
        /* buffer full or closed — drop; playback continues with what we have */
      }
      return
    }
    if (this.streamComplete) this.finishMediaSource()
  }

  finishMediaSource() {
    if (!this.mediaSource || this.mediaSource.readyState !== 'open') return
    if (this.pendingAppends.length || this.sourceBuffer?.updating) return
    try {
      this.mediaSource.endOfStream()
    } catch {
      /* already ended */
    }
  }

  async beginPlayback() {
    const el = this.audioEl
    el.onended = () => this.onState('ended')
    el.onpause = () => {
      if (!el.ended) this.onState('paused')
    }
    el.onplay = () => this.onState('playing')
    try {
      await el.play()
    } catch {
      // Autoplay policy: the click that started this should satisfy it, but a
      // slow cache miss can outlive the gesture.
      if (!this.stopped) {
        this.onState('paused')
      }
    }
  }

  stop() {
    this.stopped = true
    this.controller.abort()
    const el = this.audioEl
    if (el) {
      el.onended = null
      el.onpause = null
      el.onplay = null
      el.pause()
      el.removeAttribute('src')
      el.load()
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }
    this.sourceBuffer = null
    this.mediaSource = null
    this.pendingAppends = []
  }
}
