// Behavioural contract for services/storyService.js: every story call sends
// model, length, tone and creativity (API scale 0–10) with the right method
// and URL. Runs under plain `node --test` with a stubbed fetch/localStorage.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { STORY_CALLS } from './storyCalls.js'

const calls = []
const originalFetch = globalThis.fetch
const originalLog = console.log

before(() => {
  globalThis.localStorage = {
    store: { token: 't0k' },
    getItem(k) { return k in this.store ? this.store[k] : null },
    setItem(k, v) { this.store[k] = String(v) },
    removeItem(k) { delete this.store[k] },
  }
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, method: options.method, headers: options.headers, body: options.body ? JSON.parse(options.body) : undefined })
    return new Response(JSON.stringify({ message: 'ok', story: { _id: 's1' }, storyId: 's1', questions: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  console.log = () => {} // the service logs payloads; keep test output readable
})

after(() => {
  globalThis.fetch = originalFetch
  console.log = originalLog
})

const svc = await import('../src/services/storyService.js')
const BASE = 'http://localhost:5001/api/story'
const CONTROLS = { model: 'anthropic/claude-sonnet-4.6', length: 'long', tone: 'Dark', creativity: 7 }

// [name, invoke(controls), method, url, extra body assertions]
const CASES = {
  createStory: [(c) => svc.createStory('Land of Magic', 'Mage', 'Ilya', c), 'POST', `${BASE}/create`,
    (b) => assert.equal(b.characterName, 'Ilya')],
  createStoryFromScenario: [(c) => svc.createStoryFromScenario('sc1', c), 'POST', `${BASE}/create`,
    (b) => assert.equal(b.scenarioId, 'sc1')],
  initializeStoryWithQuestions: [(c) => svc.initializeStoryWithQuestions('Space', 'Pilot', 'Vey', c), 'POST', `${BASE}/initialize`,
    (b) => assert.equal(b.setting, 'Space')],
  initializeStoryFromScenario: [(c) => svc.initializeStoryFromScenario('sc2', c), 'POST', `${BASE}/initialize`,
    (b) => assert.equal(b.scenarioId, 'sc2')],
  submitAnswers: [(c) => svc.submitAnswers('st1', ['a', 'b'], c), 'POST', `${BASE}/submit-answers/st1`,
    (b) => assert.deepEqual(b.answers, ['a', 'b'])],
  continueStory: [(c) => svc.continueStory('st1', '  open the door ', c), 'POST', `${BASE}/continue/st1`,
    (b) => assert.equal(b.userAction, 'open the door')],
  submitInquiryReply: [(c) => svc.submitInquiryReply('st1', 'q1', 'the red one', c), 'POST', `${BASE}/continue/st1`,
    (b) => assert.deepEqual(b.inquiryReply, { questionId: 'q1', answer: 'the red one' })],
  regenerateLastChunk: [(c) => svc.regenerateLastChunk('st1', c), 'POST', `${BASE}/regenerate/st1`, () => {}],
  editLastParagraph: [(c) => svc.editLastParagraph('st1', 'make it rain', c), 'PATCH', `${BASE}/edit/st1`,
    (b) => assert.equal(b.minorEditInstruction, 'make it rain')],
  startChapter: [(c) => svc.startChapter('st1', ' The Fall ', c), 'POST', `${BASE}/st1/chapter`,
    (b) => assert.equal(b.title, 'The Fall')],
}

test('every story call in the shared list has a contract case', () => {
  assert.deepEqual(Object.keys(CASES).sort(), [...STORY_CALLS].sort())
  for (const name of STORY_CALLS) assert.equal(typeof svc[name], 'function', `${name} is exported`)
})

for (const name of STORY_CALLS) {
  test(`${name} sends model, length, tone and creativity`, async () => {
    const [invoke, method, url, extra] = CASES[name]
    calls.length = 0
    const result = await invoke(CONTROLS)
    assert.equal(result.success, true)
    assert.equal(calls.length, 1)
    const [call] = calls
    assert.equal(call.method, method)
    assert.equal(call.url, url)
    assert.equal(call.headers.Authorization, 'Bearer t0k')
    assert.equal(call.body.model, CONTROLS.model)
    assert.equal(call.body.length, 'long')
    assert.equal(call.body.tone, 'Dark')
    assert.equal(call.body.creativity, 7)
    assert.ok(Number.isInteger(call.body.creativity) && call.body.creativity >= 0 && call.body.creativity <= 10)
    extra(call.body)
  })

  test(`${name} still sends valid length/tone/creativity when controls are missing or bad`, async () => {
    const [invoke] = CASES[name]
    for (const controls of [undefined, { length: 'huge', tone: 'Zany', creativity: 'lots', model: '' }]) {
      calls.length = 0
      await invoke(controls)
      const { body } = calls[0]
      assert.equal(body.length, 'medium')
      assert.equal(body.tone, 'Adventurous')
      assert.equal(body.creativity, 5)
      assert.equal('model' in body, false, 'an absent model is left for the backend to default')
    }
  })
}

test('buildStoryPayload clamps creativity to the API range and normalises case/labels', () => {
  assert.deepEqual(svc.buildStoryPayload({ creativity: 42, tone: 'dark', length: 'Short (1-2 paragraphs)', model: ' m ' }),
    { creativity: 10, tone: 'Dark', length: 'short', model: 'm' })
  assert.equal(svc.buildStoryPayload({ creativity: -3 }).creativity, 0)
  assert.equal(svc.buildStoryPayload({ creativity: 6.6 }).creativity, 7)
  assert.equal(svc.buildStoryPayload({ creativity: 0 }).creativity, 0)
})
