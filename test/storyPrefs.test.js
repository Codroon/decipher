import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  STORAGE_KEY,
  PREF_DEFAULTS,
  loadStoryPrefs,
  saveStoryPrefs,
  normalizeStoryPrefs,
  resolveModelId,
  toApiCreativity,
  storyControlsFromPrefs,
  lengthLabel,
  lengthKeyFromLabel,
  STORY_LENGTHS,
} from '../src/utils/storyPrefs.js'

const memStorage = (initial = {}) => ({
  store: { ...initial },
  getItem(k) { return k in this.store ? this.store[k] : null },
  setItem(k, v) { this.store[k] = String(v) },
})

test('defaults when nothing is stored, storage is missing, or it throws', () => {
  assert.deepEqual(loadStoryPrefs(memStorage()), { ...PREF_DEFAULTS })
  assert.deepEqual(loadStoryPrefs(null), { ...PREF_DEFAULTS })
  const throwing = { getItem() { throw new Error('denied') }, setItem() { throw new Error('denied') } }
  assert.deepEqual(loadStoryPrefs(throwing), { ...PREF_DEFAULTS })
  assert.deepEqual(saveStoryPrefs({ tone: 'Dark' }, throwing), { ...PREF_DEFAULTS, tone: 'Dark' })
})

test('corrupt JSON reads as defaults', () => {
  assert.deepEqual(loadStoryPrefs(memStorage({ [STORAGE_KEY]: '{not json' })), { ...PREF_DEFAULTS })
})

test('bad stored values are replaced field by field', () => {
  const stored = { creativity: 'loud', tone: 'Heroic', length: 'epic', model: 42, rating: 'R' }
  assert.deepEqual(loadStoryPrefs(memStorage({ [STORAGE_KEY]: JSON.stringify(stored) })), { ...PREF_DEFAULTS })
  assert.equal(normalizeStoryPrefs({ creativity: 250 }).creativity, 100)
  assert.equal(normalizeStoryPrefs({ creativity: -4 }).creativity, 0)
  assert.equal(normalizeStoryPrefs({ creativity: '65' }).creativity, 65)
})

test("the old Settings page's values are migrated, its fake profile dropped on save", () => {
  const legacy = {
    name: 'Aria Vale', email: 'aria@decipher.app', model: 'Decipher 32B', creativity: 65,
    tone: 'mysterious', length: 'Medium (3–4 paragraphs)', rating: 'Teen', autoContinue: false,
  }
  const storage = memStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })
  assert.deepEqual(loadStoryPrefs(storage), {
    creativity: 65, tone: 'Mysterious', length: 'medium', model: 'Decipher 32B', rating: 'teen',
  })
  saveStoryPrefs({ length: 'long' }, storage)
  const written = JSON.parse(storage.store[STORAGE_KEY])
  assert.deepEqual(Object.keys(written).sort(), ['creativity', 'length', 'model', 'rating', 'tone'])
  assert.equal(written.length, 'long')
})

test('slider 0–100 maps to API 0–10, rounded and clamped', () => {
  const cases = [[0, 0], [4, 0], [5, 1], [50, 5], [65, 7], [94, 9], [95, 10], [100, 10], [150, 10], [-20, 0]]
  for (const [slider, api] of cases) assert.equal(toApiCreativity(slider), api, `slider ${slider}`)
  assert.equal(toApiCreativity('nope'), Math.round(PREF_DEFAULTS.creativity / 10))
})

test('stored model falls back to the catalogue default when not offered', () => {
  const catalogue = [{ id: 'a/x' }, { id: 'b/y', isDefault: true }, { id: 'c/z' }]
  assert.equal(resolveModelId('c/z', catalogue), 'c/z')
  assert.equal(resolveModelId('Decipher 32B', catalogue), 'b/y')
  assert.equal(resolveModelId(null, catalogue), 'b/y')
  assert.equal(resolveModelId('c/z', catalogue, (m) => m.id !== 'c/z'), 'b/y', 'not usable on this plan')
  assert.equal(resolveModelId('zzz', [{ id: 'only' }]), 'only', 'no flagged default → first entry')
  assert.equal(resolveModelId('a/x', []), null)
  assert.equal(resolveModelId('a/x', undefined), null)
})

test('length keys and labels round-trip with the story screen picker', () => {
  for (const { key, label } of STORY_LENGTHS) {
    assert.equal(lengthLabel(key), label)
    assert.equal(lengthKeyFromLabel(label), key)
  }
  assert.deepEqual(STORY_LENGTHS.map((l) => l.key), ['short', 'medium', 'long'])
})

test('storyControlsFromPrefs gives API-scale controls', () => {
  assert.deepEqual(storyControlsFromPrefs({ creativity: 80, tone: 'Dark', length: 'short', model: 'm/1' }),
    { creativity: 8, tone: 'Dark', length: 'short', model: 'm/1' })
})
