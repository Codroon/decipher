// The story-writing calls in services/storyService.js — every one of them must
// carry the reader's four story controls. Shared by the contract tests so a new
// call added to one list cannot be forgotten in the other.
export const STORY_CALLS = [
  'createStory',
  'createStoryFromScenario',
  'initializeStoryWithQuestions',
  'initializeStoryFromScenario',
  'submitAnswers',
  'continueStory',
  'submitInquiryReply',
  'regenerateLastChunk',
  'editLastParagraph',
  'startChapter',
]
