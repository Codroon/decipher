// Story preferences — the one place the reader's story defaults live.
//
// Settings writes these and the story screen starts from them; nothing else
// reads `decipher_settings` directly. Every value is validated on the way in
// AND on the way out, because localStorage is a string bag anyone (an older
// build, a hand edit, a different tab) can have written: an older Settings
// page stored the length as a label ("Medium (3–4 paragraphs)"), the tone in
// any case, and a model *label* ("Decipher 32B") instead of a catalogue id.
//
// The value ranges mirror the backend's normalizeChunkPreferences
// (Decipher-Backend/controllers/storyController.js): tone is one of four
// fixed strings, length is a LENGTH_GUIDANCE key, creativity is 0–10 on the
// wire. The slider is 0–100 for resolution, so toApiCreativity is the only
// conversion and every call site goes through it.
//
// Pure module — no React, no Vite-only imports — so `node --test` can load it.

export const STORAGE_KEY = 'decipher_settings'

export const TONES = ['Mysterious', 'Adventurous', 'Dark', 'Lighthearted']

/**
 * The length options, paired with the key the charge table prices them under.
 * Keys are what the API takes; labels are what the pickers show.
 */
export const STORY_LENGTHS = [
  { key: 'short', label: 'Short (1-2 paragraphs)' },
  { key: 'medium', label: 'Medium (3-4 paragraphs)' },
  { key: 'long', label: 'Long (5+ paragraphs)' },
]
export const LENGTH_KEYS = STORY_LENGTHS.map((l) => l.key)

/** Same enum as the backend's story/scenario `contentRating`. */
export const CONTENT_RATINGS = [
  { value: 'unrated', label: 'Unrated' },
  { value: 'everyone', label: 'Everyone' },
  { value: 'teen', label: 'Teen' },
  { value: 'mature', label: 'Mature' },
]
const RATING_VALUES = CONTENT_RATINGS.map((r) => r.value)

/**
 * Defaults match what the backend actually used before these controls were
 * wired (DEFAULT_CHUNK_PREFERENCES: creativity 5, Adventurous, medium), so a
 * reader who never opens Settings gets the same stories as before.
 * `model: null` means "the catalogue's default" — resolved against the live
 * list by resolveModelId, never hard-coded here.
 */
export const PREF_DEFAULTS = Object.freeze({
  creativity: 50, // slider scale, 0–100
  tone: 'Adventurous',
  length: 'medium',
  model: null,
  rating: 'unrated',
})

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

/** Slider (0–100) → API (0–10 integer). */
export const toApiCreativity = (sliderValue) => {
  const n = Number(sliderValue)
  if (!Number.isFinite(n)) return Math.round(PREF_DEFAULTS.creativity / 10)
  return clamp(Math.round(n / 10), 0, 10)
}

export const normalizeCreativity = (value) => {
  if (value === null || value === undefined || value === '') return PREF_DEFAULTS.creativity
  const n = Number(value)
  return Number.isFinite(n) ? clamp(Math.round(n), 0, 100) : PREF_DEFAULTS.creativity
}

export const normalizeTone = (value) => {
  if (typeof value !== 'string') return PREF_DEFAULTS.tone
  const v = value.trim().toLowerCase()
  return TONES.find((t) => t.toLowerCase() === v) || PREF_DEFAULTS.tone
}

/** Accepts a key ('long') or a label, current or legacy ('Long (5+ paragraphs)'). */
export const normalizeLength = (value) => {
  if (typeof value !== 'string') return PREF_DEFAULTS.length
  const v = value.trim().toLowerCase()
  return LENGTH_KEYS.find((k) => v === k || v.startsWith(k)) || PREF_DEFAULTS.length
}

export const normalizeRating = (value) => {
  if (typeof value !== 'string') return PREF_DEFAULTS.rating
  const v = value.trim().toLowerCase()
  return RATING_VALUES.includes(v) ? v : PREF_DEFAULTS.rating
}

const normalizeModel = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null)

export const lengthLabel = (key) =>
  (STORY_LENGTHS.find((l) => l.key === key) || STORY_LENGTHS.find((l) => l.key === PREF_DEFAULTS.length)).label

export const lengthKeyFromLabel = (label) =>
  STORY_LENGTHS.find((l) => l.label === label)?.key || normalizeLength(label)

export function normalizeStoryPrefs(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  return {
    creativity: normalizeCreativity(src.creativity),
    tone: normalizeTone(src.tone),
    length: normalizeLength(src.length),
    model: normalizeModel(src.model),
    rating: normalizeRating(src.rating),
  }
}

const defaultStorage = () => {
  try {
    return globalThis.localStorage || null
  } catch {
    return null
  }
}

/** Read and validate. Never throws; a missing or corrupt entry reads as defaults. */
export function loadStoryPrefs(storage = defaultStorage()) {
  try {
    const text = storage?.getItem(STORAGE_KEY)
    return normalizeStoryPrefs(text ? JSON.parse(text) : {})
  } catch {
    return normalizeStoryPrefs({})
  }
}

/**
 * Merge `patch` into the stored prefs and write back only the known, valid
 * keys — anything an older build left behind (fake profile data, settings
 * nothing reads) is dropped on the first save. Returns what was stored.
 */
export function saveStoryPrefs(patch, storage = defaultStorage()) {
  const next = normalizeStoryPrefs({ ...loadStoryPrefs(storage), ...(patch || {}) })
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Private mode / quota — the prefs still apply for this page view.
  }
  return next
}

/**
 * Pick the model to start from: the stored id if the live catalogue still
 * offers it (and, when `isUsable` is given, the reader's plan allows it),
 * otherwise the catalogue's default, otherwise its first entry.
 *
 * @param {string|null} storedId
 * @param {Array<{id:string,isDefault?:boolean}>} models
 * @param {(model:object)=>boolean} [isUsable]
 * @returns {string|null}
 */
export function resolveModelId(storedId, models, isUsable = () => true) {
  const list = Array.isArray(models) ? models.filter((m) => m && typeof m.id === 'string') : []
  if (!list.length) return null
  const stored = list.find((m) => m.id === storedId)
  if (stored && isUsable(stored)) return stored.id
  return (list.find((m) => m.isDefault) || list[0]).id
}

/**
 * The saved prefs as story-call controls (`{ model, length, tone, creativity }`,
 * creativity on the API's 0–10 scale) — for calls made outside the story
 * screen, which has no controls of its own to read. A stale model id is fine
 * here: the backend resolves anything it does not offer to its default.
 */
export function storyControlsFromPrefs(prefs = loadStoryPrefs()) {
  const p = normalizeStoryPrefs(prefs)
  return { model: p.model, length: p.length, tone: p.tone, creativity: toApiCreativity(p.creativity) }
}
