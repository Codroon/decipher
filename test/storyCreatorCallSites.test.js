// Static guard: StoryCreator (and the scenario launchers) must pass the
// reader's story controls into every story-writing call. Parses the source
// rather than rendering it, so it needs no DOM and no React.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { STORY_CALLS } from './storyCalls.js'

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')

/** Every `<prefix><fn>(…)` call in `src`, with its argument text (balanced parens). */
function findCalls(src, prefix) {
  const out = []
  const re = new RegExp(`${prefix.replace('.', '\\.')}(${STORY_CALLS.join('|')})\\s*\\(`, 'g')
  let m
  while ((m = re.exec(src))) {
    let depth = 1
    let i = re.lastIndex
    for (; i < src.length && depth; i++) {
      if (src[i] === '(') depth++
      else if (src[i] === ')') depth--
    }
    out.push({ fn: m[1], args: src.slice(re.lastIndex, i - 1), line: src.slice(0, m.index).split('\n').length })
  }
  return out
}

const storyCreator = read('components/StoryCreator.jsx')

test('StoryCreator passes model, length, tone and creativity to every story call', () => {
  const calls = findCalls(storyCreator, 'storyService.')
  const fns = new Set(calls.map((c) => c.fn))
  for (const fn of ['initializeStoryWithQuestions', 'submitAnswers', 'continueStory', 'submitInquiryReply',
    'regenerateLastChunk', 'editLastParagraph', 'startChapter']) {
    assert.ok(fns.has(fn), `StoryCreator still calls ${fn}`)
  }
  for (const { fn, args, line } of calls) {
    for (const field of ['model', 'tone', 'creativity']) {
      assert.match(args, new RegExp(`\\b${field}\\b`), `${fn} (line ${line}) is missing ${field}`)
    }
    assert.match(args, /\blength\s*:\s*lengthKey\b/, `${fn} (line ${line}) is missing length: lengthKey`)
  }
})

test('the values StoryCreator sends come from its controls', () => {
  assert.match(storyCreator, /const creativity = toApiCreativity\(creativityLevel\)/)
  assert.match(storyCreator, /const lengthKey = useMemo\(\(\) => lengthKeyFromLabel\(storyLength\)/)
  // Controls start from the saved Settings, not hard-coded literals.
  assert.match(storyCreator, /useState\(startPrefs\.creativity\)/)
  assert.match(storyCreator, /useState\(startPrefs\.tone\)/)
  assert.match(storyCreator, /lengthLabel\(startPrefs\.length\)/)
  assert.match(storyCreator, /resolveModelId\(startPrefs\.model, /)
})

test('scenario launchers pass the saved story controls', () => {
  for (const file of ['components/ScenarioCreator.jsx', 'components/PublicScenario.jsx']) {
    const calls = findCalls(read(file), '')
    assert.ok(calls.length > 0, `${file} starts a story`)
    for (const { fn, args } of calls) assert.match(args, /storyControlsFromPrefs\(\)/, `${file} ${fn}`)
  }
})
