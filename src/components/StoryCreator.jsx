import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './StoryCreator.css'
import * as storyService from '../services/storyService'
import * as libraryService from '../services/libraryService'
import ShareModal from './ShareModal'
import CreditPrompt from './CreditPrompt'
import { useBilling } from '../contexts/BillingContext'
import ModelPicker from './ModelPicker'
import { formatCredits, getPlans } from '../services/billingService'
import { describeBillingError } from '../utils/billingErrors'
import { NarrationSession, scriptRangeToChunk } from '../utils/chapterAudio'
import { STORY_LENGTHS, TONES, lengthLabel, lengthKeyFromLabel, loadStoryPrefs, resolveModelId, toApiCreativity } from '../utils/storyPrefs'

/** Split a story chunk into paragraphs (blank-line separated). */
function splitParagraphs(content) {
  const paras = content.split(/\n\n/).filter((p) => p.trim())
  return paras.length ? paras.map((p) => p.trim()) : [content]
}

/**
 * Where each paragraph begins inside its passage.
 *
 * The narration script is built from the passage's trimmed content, so
 * highlight offsets are relative to that — we walk the original string to find
 * each rendered paragraph and record its position.
 */
function paragraphOffsets(content) {
  const trimmed = content.trim()
  const paras = splitParagraphs(content)
  const offsets = []
  let cursor = 0
  for (const para of paras) {
    const at = trimmed.indexOf(para, cursor)
    const start = at === -1 ? cursor : at
    offsets.push(start)
    cursor = start + para.length
  }
  return offsets
}

/**
 * Break a paragraph into word tokens and the whitespace between them.
 *
 * The narrated word used to be highlighted by slicing the paragraph into
 * before/word/after around it, which meant every word rebuilt the paragraph's
 * text nodes — the highlight could never animate, because the element carrying
 * it was destroyed and recreated each time. Tokenizing once instead gives every
 * word a span that persists for the whole passage, so moving the highlight is a
 * class change on two elements and CSS can transition it.
 *
 * `start` is passage-relative (rebased by `paraStart`) to match the alignment
 * coordinates the backend's `parts` map into.
 */
function tokenizeParagraph(para, paraStart) {
  const tokens = []
  const wordRe = /\S+/g
  let cursor = 0
  let match
  while ((match = wordRe.exec(para)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: 'gap', text: para.slice(cursor, match.index) })
    }
    tokens.push({ type: 'word', text: match[0], start: paraStart + match.index })
    cursor = match.index + match[0].length
  }
  if (cursor < para.length) tokens.push({ type: 'gap', text: para.slice(cursor) })
  return tokens
}

/** Identifies one word span in the DOM: passage index + offset within it. */
const wordKey = (chunkIndex, start) => `${chunkIndex}:${start}`

const I = {
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  up: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8" />
    </svg>
  ),
  pen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
    </svg>
  ),
  paw: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="10" r="2" />
      <circle cx="10" cy="6" r="2" />
      <circle cx="14" cy="6" r="2" />
      <circle cx="18" cy="10" r="2" />
      <path d="M9 14c-2 1.5-3 3-3 4.5A2.5 2.5 0 0 0 8.5 21c1 0 1.8-.5 3.5-.5s2.5.5 3.5.5A2.5 2.5 0 0 0 18 18.5c0-1.5-1-3-3-4.5a3.5 3.5 0 0 0-6 0z" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  speaker: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4v16M14 4v16" />
    </svg>
  ),
  sliders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
    </svg>
  ),
  stats: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4M9 4h6M9 14h.01M15 14h.01M9 17h6" />
    </svg>
  ),
  chev: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
}

// STORY_LENGTHS (label ↔ charge-table key) lives in utils/storyPrefs so the
// Settings page and this picker can never disagree about what a length is.

const WORKSPACE_TABS = [
  { id: 'story', label: 'Story', icon: I.pen },
  { id: 'character', label: 'Character', icon: I.user },
  { id: 'world', label: 'World', icon: I.globe },
  { id: 'creatures', label: 'Creatures', icon: I.paw },
]

function StoryCreator() {
  const { storyId } = useParams()
  const navigate = useNavigate()
  // Prices, entitlements and the balance, shared with every other picker in
  // the app so the number here and the number charged are one lookup.
  const {
    billing,
    charges,
    priceOfTurn,
    canUseModel,
    narrationAllowed,
    refresh: refreshBilling,
  } = useBilling()
  // The plan catalogue, used only to name the plan that unlocks something. A
  // lock the reader can see is a reason to upgrade; a lock that just says "no"
  // is a dead end (design §7).
  const [planCatalogue, setPlanCatalogue] = useState([])
  // The failed result of a charged action, when the reason was billing.
  // CreditPrompt turns it into copy; anything else stays null.
  const [billingError, setBillingError] = useState(null)
  const [activeTab, setActiveTab] = useState('story')
  // The reader's Settings are where the controls *start*; changing them here
  // applies to this session only and is not written back. Read once per mount.
  const [startPrefs] = useState(loadStoryPrefs)
  const [creativityLevel, setCreativityLevel] = useState(startPrefs.creativity)
  const [storyLength, setStoryLength] = useState(() => lengthLabel(startPrefs.length))
  const [tone, setTone] = useState(startPrefs.tone)
  // Empty until the catalogue loads; the backend resolves a missing model to
  // its default, so nothing sent before then is a guessed id.
  const [model, setModel] = useState('')
  const [availableModels, setAvailableModels] = useState([])

  // Report modal
  const [showShare, setShowShare] = useState(false)

  // Story creation states
  const [isCreating, setIsCreating] = useState(!storyId)
  const [creationStep, setCreationStep] = useState(1)
  // Which setting tile was chosen ('magic' | … | 'custom'). `setting` holds the
  // display text; this holds the key the character roster is looked up by.
  const [settingId, setSettingId] = useState('')
  // Model-suggested roster for a custom setting: string[] | null
  const [suggested, setSuggested] = useState(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestFellBack, setSuggestFellBack] = useState(false)
  const [suggestError, setSuggestError] = useState('')
  // "Write your own" character, parallel to customSetting
  const [customCharacter, setCustomCharacter] = useState('')
  const [pickingCustomCharacter, setPickingCustomCharacter] = useState(false)
  const [setting, setSetting] = useState('')
  const [customSetting, setCustomSetting] = useState('')
  const [character, setCharacter] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedStory, setGeneratedStory] = useState(null)

  // The backend updates a story's memory (Codex entries, chapter titles and
  // summaries) in the background after it answers a turn, so the turn's own
  // response carries the memory from before that passage. Re-read the story
  // shortly after each new or changed passage and merge in only those fields,
  // leaving the passages and any newer local state alone.
  const memoryKey = generatedStory?._id
    ? `${generatedStory._id}:${generatedStory.MainStory?.length || 0}:${(generatedStory.MainStory?.at(-1)?.content || '').length}`
    : null
  useEffect(() => {
    if (!memoryKey) return undefined
    const storyId = memoryKey.split(':')[0]
    let cancelled = false
    const refresh = async () => {
      const result = await storyService.getStoryById(storyId)
      if (cancelled || !result?.success || !result.story) return
      const fresh = result.story
      setGeneratedStory((prev) => (prev && prev._id === fresh._id
        ? {
            ...prev,
            characters: fresh.characters,
            locations: fresh.locations,
            creatures: fresh.creatures,
            items: fresh.items,
            storyChapters: fresh.storyChapters,
          }
        : prev))
    }
    const timers = [4000, 12000].map((ms) => setTimeout(refresh, ms))
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [memoryKey])

  const actionInputRef = useRef(null)

  // Story action states
  const [actionLoading, setActionLoading] = useState(null)
  const [aiInstruction, setAiInstruction] = useState('')
  const [userAction, setUserAction] = useState('') // Player action input for continue story
  const [activeChapterOrder, setActiveChapterOrder] = useState(null) // null = follow the writing head
  const [chapterModalOpen, setChapterModalOpen] = useState(false)
  const [chapterTitleInput, setChapterTitleInput] = useState('')
  const [clarificationData, setClarificationData] = useState(null) // { questionId, text }
  const [clarificationAnswer, setClarificationAnswer] = useState('')
  const [clarificationLoading, setClarificationLoading] = useState(false)

  // True for as long as a story action is retrying a 409 STORY_BUSY (the
  // background summariser holding the write lock) — see storyService's
  // storyLockEvents. Swaps the generic "loading" copy below for something
  // honest instead of leaving the UI silently stuck.
  const [retryingLock, setRetryingLock] = useState(false)
  // The failures this component surfaces inline (matching narrationError)
  // rather than in an alert(), because the reader fixes them by doing
  // something on this screen: a story still locked after every retry (wait a
  // beat), and a length the chosen model does not offer (change one of the two
  // dropdowns in the rail). An alert() would cover the very controls the
  // message is telling them to use.
  const [inlineActionError, setInlineActionError] = useState('')

  // Inline editing states (for clicking a single paragraph in the story)
  const [editingPara, setEditingPara] = useState(null) // { chunkIndex, paraIndex }
  const [inlineEditContent, setInlineEditContent] = useState('')

  // Voice dictation for the action input
  // Which input the microphone is currently feeding: 'action' | 'clarify' | null
  const [listeningFor, setListeningFor] = useState(null)
  const recognitionRef = useRef(null)

  // Narration playback (ElevenLabs). One session at a time; switching chapters
  // or leaving the page aborts it, which also stops generation server-side.
  const audioElRef = useRef(null)
  const narrationRef = useRef(null)
  const alignmentRef = useRef(null)
  const partsRef = useRef([])
  const [narrationState, setNarrationState] = useState('idle')
  const [narrationError, setNarrationError] = useState('')
  // What is being narrated: { scope: 'chapter'|'chunk', ref } — drives which
  // button shows the playing state, and which passages get word spans.
  const [narrationTarget, setNarrationTarget] = useState(null)
  // The highlight is moved imperatively (see the rAF loop) rather than held in
  // state: at several words a second, re-rendering the chapter per word was the
  // stutter. These track the DOM node currently lit so it can be un-lit.
  const storyBodyRef = useRef(null)
  const clarifyInputRef = useRef(null)
  const activeWordRef = useRef(null)
  const activeWordKeyRef = useRef(null)

  // Library entity selection states
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [librarySaveState, setLibrarySaveState] = useState({ loading: false, success: false, error: null })

  // Question wizard states
  const [questionWizardActive, setQuestionWizardActive] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [wizardStoryId, setWizardStoryId] = useState(null)
  const [isWeaving, setIsWeaving] = useState(false)


  // Load existing story if storyId is provided
  useEffect(() => {
    const loadStory = async () => {
      if (storyId) {
        setIsLoading(true)
        const result = await storyService.getStoryById(storyId)
        if (result.success) {
          const story = result.story
          // If story has unanswered questions, enter wizard mode
          if (story.unansweredQuestions && story.characterQuestions && story.characterQuestions.length > 0) {
            setQuestions(story.characterQuestions.map(cq => cq.question))
            setAnswers(story.characterQuestions.map(cq => cq.answer || ''))
            setWizardStoryId(story._id)
            setCurrentQuestionIndex(0)
            setQuestionWizardActive(true)
            setIsCreating(false)
          } else {
            setGeneratedStory(story)
            setIsCreating(false)
          }
        } else {
          setError(result.error || 'Failed to load story')
        }
        setIsLoading(false)
      }
    }

    // Load available models
    const loadModels = async () => {
      const result = await storyService.getModels()
      if (result.success && result.models && result.models.length > 0) {
        setAvailableModels(result.models)

        // Start from the model chosen in Settings while the catalogue still
        // offers it; otherwise the catalogue's default (flagged isDefault).
        const preferred = resolveModelId(startPrefs.model, result.models)
        if (preferred) setModel(preferred)
      }
    }

    loadStory()
    loadModels()
  }, [storyId, startPrefs.model])

  // The plan catalogue. Only ever read to answer "which plan unlocks this?",
  // so a failure is silent — a missing plan name degrades a lock to "Locked",
  // which is still honest, and must never block the story from loading.
  useEffect(() => {
    let alive = true
    getPlans()
      .then((result) => {
        if (alive && result.success && Array.isArray(result.plans)) setPlanCatalogue(result.plans)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // ── Prices and locks ──────────────────────────────────────────────────────

  /** The charge-table key for whatever the length picker is showing. */
  const lengthKey = useMemo(() => lengthKeyFromLabel(storyLength), [storyLength])

  /** The slider is 0–100; the API takes 0–10. Sent on every story call. */
  const creativity = toApiCreativity(creativityLevel)

  /** Cheapest purchasable plan matching a predicate, or null. */
  const cheapestPlan = useCallback(
    (matches) => {
      const options = planCatalogue.filter((p) => p.purchasable && matches(p))
      if (!options.length) return null
      return options.reduce((a, b) => ((a.priceUsd ?? Infinity) <= (b.priceUsd ?? Infinity) ? a : b))
    },
    [planCatalogue]
  )

  const planUnlockingTier = useCallback(
    (tier) => cheapestPlan((p) => Array.isArray(p.tiers) && p.tiers.includes(tier)),
    [cheapestPlan]
  )

  const planWithNarration = useMemo(
    () => cheapestPlan((p) => p.narration === true),
    [cheapestPlan]
  )

  /**
   * Narration is locked only once we actually know the plan. `narrationAllowed`
   * is false while billing is still in flight, and treating that as a lock
   * would grey out the Listen button on every page load for people who have
   * paid for it.
   */
  const narrationLocked = Boolean(billing) && !narrationAllowed
  // Per-passage figure for an *average* passage — the real charge is by
  // character count, so this is labelled as approximate wherever it is shown.
  const narrationPrice = charges?.narrationPerMeanPassage ?? null

  /** Price, lock state and unlocking plan for one catalogue entry. */
  const describeModel = useCallback(
    (m) => {
      const allowed = m.tier ? canUseModel(m.tier) : null
      return {
        price: priceOfTurn(m.id, lengthKey),
        // `canUseModel` returns null until the plan arrives; only an explicit
        // false is a lock, so nothing is greyed out on a slow connection.
        locked: allowed === false,
        unlock: allowed === false ? planUnlockingTier(m.tier) : null,
      }
    },
    [canUseModel, priceOfTurn, lengthKey, planUnlockingTier]
  )

  const selectedModel = useMemo(
    () => availableModels.find((m) => m.id === model) || null,
    [availableModels, model]
  )
  const selectedModelInfo = useMemo(
    () => (selectedModel ? describeModel(selectedModel) : null),
    [selectedModel, describeModel]
  )

  /**
   * Lengths the selected model refuses, straight from the catalogue.
   *
   * The backend answers this combination with 400 LENGTH_UNSUPPORTED, so
   * showing it as pickable is offering something that cannot be bought. It
   * stays visible-but-disabled rather than hidden, for the same reason a
   * locked model does: a wall you can see is an explanation, a missing row is
   * a mystery. A length already chosen before the model changed survives as a
   * disabled selection — failStoryAction catches the request that follows.
   */
  const unsupportedLengths = useMemo(
    () => (Array.isArray(selectedModel?.unsupportedLengths) ? selectedModel.unsupportedLengths : []),
    [selectedModel]
  )

  // Predefined settings
  const settingOptions = [
    { id: 'magic', name: 'Land of Magic', img: '/recent-image-1-52dd4f.png' },
    { id: 'medieval', name: 'Medieval Kingdom', img: '/Group 7.png' },
    { id: 'space', name: 'Space Adventure', img: '/fantasy-art-style.png' },
    { id: 'fantasy', name: 'Fantasy Realm', img: '/recent-image-3.png' },
    { id: 'mystery', name: 'Mystery Manor', img: '/image 9.png' },
    { id: 'custom', name: 'Custom Setting', custom: true },
  ]

  // Who you can play depends on where the story happens — a Void Marine has
  // no business in Mystery Manor. Five archetypes per built-in setting, keyed
  // by the setting's id; a custom setting gets its five from the model instead
  // (see loadCharactersForCustomSetting). A 6th "write your own" tile is added
  // to every roster at render time.
  const charactersBySetting = {
    magic: [
      { id: 'archmage', name: 'Archmage', img: '/fantasy-art-style.png' },
      { id: 'hedge-witch', name: 'Hedge Witch', img: '/anime-art-style.png' },
      { id: 'runesmith', name: 'Runesmith', img: '/ai_storytelling_platform_balanced 1.png' },
      { id: 'beast-charmer', name: 'Beast Charmer', img: '/recent-image-3.png' },
      { id: 'spellbreaker', name: 'Spellbreaker', img: '/image 9.png' },
    ],
    medieval: [
      { id: 'knight-errant', name: 'Knight Errant', img: '/Group 7.png' },
      { id: 'court-spy', name: 'Court Spy', img: '/image 9.png' },
      { id: 'blacksmith', name: 'Blacksmith', img: '/realistic-art-style-52592d.png' },
      { id: 'fallen-noble', name: 'Disgraced Noble', img: '/story-card-image-4ea8ab.png' },
      { id: 'sellsword', name: 'Sellsword', img: '/ai_storytelling_platform_balanced 1.png' },
    ],
    space: [
      { id: 'captain', name: 'Starship Captain', img: '/fantasy-art-style.png' },
      { id: 'void-marine', name: 'Void Marine', img: '/ai_storytelling_platform_balanced 5.png' },
      { id: 'xenobiologist', name: 'Xenobiologist', img: '/storytelling_hero_background_modern 2.png' },
      { id: 'salvage-runner', name: 'Salvage Runner', img: '/recent-image-2.png' },
      { id: 'ship-ai', name: 'Ship AI', img: '/image 7.png' },
    ],
    fantasy: [
      { id: 'ranger', name: 'Ranger', img: '/recent-image-3.png' },
      { id: 'dwarven-warden', name: 'Dwarven Warden', img: '/realistic-art-style-52592d.png' },
      { id: 'elven-duelist', name: 'Elven Duelist', img: '/anime-art-style.png' },
      { id: 'dragon-rider', name: 'Dragon Rider', img: '/recent-image-1-52dd4f.png' },
      { id: 'bard', name: 'Bard', img: '/cartoon-art-style.png' },
    ],
    mystery: [
      { id: 'detective', name: 'Detective', img: '/image 9.png' },
      { id: 'reluctant-heir', name: 'Reluctant Heir', img: '/story-card-image-4ea8ab.png' },
      { id: 'housekeeper', name: 'Housekeeper', img: '/Frame 18588.png' },
      { id: 'medium', name: 'Séance Medium', img: '/image 7 (1).png' },
      { id: 'journalist', name: 'Journalist', img: '/realistic-art-style-52592d.png' },
    ],
  }

  // Stand-in art for model-suggested characters, which arrive as names only.
  const generatedArt = [
    '/fantasy-art-style.png',
    '/recent-image-3.png',
    '/image 9.png',
    '/anime-art-style.png',
    '/ai_storytelling_platform_balanced 5.png',
  ]

  // The five tiles shown on the character step, for whichever setting is live.
  const characterOptions =
    settingId === 'custom'
      ? (suggested || []).map((name, i) => ({
          id: `suggested-${i}`,
          name,
          img: generatedArt[i % generatedArt.length],
        }))
      : charactersBySetting[settingId] || []

  const handleTabChange = (tabId) => setActiveTab(tabId)

  /**
   * Story actions all share the same failure shape — `error`, plus `code` and
   * `details` when the backend attached them.
   *
   * Two codes are answered on the page instead of in a modal. A STORY_BUSY
   * means storyService's own retry (see fetchWithLockRetry) already waited out
   * the background summariser and gave up — still just "try again in a
   * moment". A LENGTH_UNSUPPORTED means the model refused the passage length
   * (the catalogue's `unsupportedLengths`); the backend's message names both
   * ways out, and both of them are dropdowns in the rail, so an alert() would
   * sit on top of the fix. It is deliberately not a CreditPrompt: nothing was
   * charged and describeBillingError returns null for it, which would render
   * an empty modal.
   */
  const failStoryAction = (result, fallback) => {
    // A billing refusal is a decision, not an error: it gets the modal that
    // names the price, the balance and the way forward (design §7), never an
    // alert() the reader can only acknowledge.
    if (describeBillingError(result)) {
      setBillingError(result)
      return
    }
    if (result.code === 'STORY_BUSY' || result.code === 'LENGTH_UNSUPPORTED') {
      setInlineActionError(result.error || fallback)
    } else {
      alert(result.error || fallback)
    }
  }

  const handleRegenerateChunk = async () => {
    if (!generatedStory?._id) return

    setActionLoading('regenerate')
    setInlineActionError('')
    const result = await storyService.regenerateLastChunk(generatedStory._id, { model, length: lengthKey, tone, creativity })
    setActionLoading(null)
    // The turn has settled either way — a charge that stands, or a hold that
    // was released. Re-read the balance so the number on screen isn't stale.
    refreshBilling()

    if (result.success) {
      setGeneratedStory(result.story)
    } else {
      failStoryAction(result, 'Failed to regenerate story chunk')
    }
  }

  const handleEraseLastChunk = async () => {
    if (!generatedStory?._id || !generatedStory.MainStory?.length) return
    if (!window.confirm('Undo the last passage? Only the most recent addition to the story will be removed — everything before it stays.')) return
    const lastChunk = generatedStory.MainStory[generatedStory.MainStory.length - 1]
    setActionLoading('editChunk')
    setInlineActionError('')
    const result = await storyService.editChunk(generatedStory._id, lastChunk.index, '')
    setActionLoading(null)
    if (result.success) {
      setGeneratedStory(result.story)
      setEditingPara(null)
    } else {
      failStoryAction(result, 'Failed to remove chunk')
    }
  }

  /**
   * Voice dictation (Web Speech API), shared by the action composer and the
   * inline clarifying-question field. `field` names which input receives the
   * transcript, and only that field's mic shows the listening state — one
   * recogniser is live at a time.
   */
  const toggleDictation = (field = 'action') => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }

    const wasListeningTo = listeningFor
    if (wasListeningTo) {
      recognitionRef.current?.stop()
      // Tapping the mic you're already dictating into just stops.
      if (wasListeningTo === field) return
    }

    const setters = { action: setUserAction, clarify: setClarificationAnswer }
    const current = field === 'clarify' ? clarificationAnswer : userAction
    const write = setters[field]
    const base = current.trim() ? `${current.trim()} ` : ''

    const begin = () => {
      const rec = new SR()
      rec.lang = 'en-US'
      rec.continuous = true
      rec.interimResults = true
      rec.onresult = (e) => {
        let transcript = ''
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript
        }
        write(base + transcript.trimStart())
      }
      // Only clear the indicator if this recogniser is still the live one —
      // otherwise a previous session's `onend` would switch off the new mic.
      const settle = () => {
        if (recognitionRef.current === rec) setListeningFor(null)
      }
      rec.onend = settle
      rec.onerror = settle
      recognitionRef.current = rec
      setListeningFor(field)
      try {
        rec.start()
      } catch {
        settle()
      }
    }

    // Handing the microphone from one field to the other needs the previous
    // session to finish releasing it first.
    if (wasListeningTo) setTimeout(begin, 150)
    else begin()
  }

  useEffect(() => () => recognitionRef.current?.abort(), [])

  // Story actions (continue/regenerate/chapter/edit/…) retry silently against
  // a locked story in storyService; this just mirrors that retry state so the
  // loading copy below can say "finishing the previous passage…" instead of
  // sitting there with no explanation.
  useEffect(() => {
    const onLockRetry = (e) => setRetryingLock(!!e.detail?.active)
    storyService.storyLockEvents.addEventListener('retry', onLockRetry)
    return () => storyService.storyLockEvents.removeEventListener('retry', onLockRetry)
  }, [])

  /**
   * The clarifying question is appended to the end of a story that is usually
   * taller than the pane, so it can arrive off-screen. Whenever one appears,
   * ride the story pane to the bottom and put the cursor in the field so it
   * can be answered without hunting for it.
   */
  useEffect(() => {
    if (!clarificationData || clarificationLoading) return
    const body = storyBodyRef.current
    if (!body) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    // Wait for the block to be laid out, or scrollHeight is measured stale.
    const frame = requestAnimationFrame(() => {
      body.scrollTo({ top: body.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
      // preventScroll: focusing must not fight the smooth scroll above.
      clarifyInputRef.current?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [clarificationData, clarificationLoading])

  /** Un-light the currently highlighted word, if any. */
  const clearHighlight = useCallback(() => {
    activeWordRef.current?.classList.remove('story-tts-segment--active')
    activeWordRef.current = null
    activeWordKeyRef.current = null
  }, [])

  const stopNarration = useCallback(() => {
    narrationRef.current?.stop()
    narrationRef.current = null
    alignmentRef.current = null
    partsRef.current = []
    setNarrationState('idle')
    setNarrationTarget(null)
    clearHighlight()
  }, [clearHighlight])

  // Never leave a session running past the component.
  useEffect(() => () => narrationRef.current?.stop(), [])

  // Switching chapters must not leave one chapter's audio playing over
  // another's text — the highlight offsets would point into the wrong passages.
  useEffect(() => {
    stopNarration()
  }, [activeChapterOrder, stopNarration])

  /**
   * Follow the alignment as the audio plays. Driving this from rAF rather than
   * the element's `timeupdate` event matters: timeupdate fires about 4x/second,
   * which is visibly behind the speech.
   *
   * The move itself is two classList calls on spans that already exist, so a
   * word change costs no React render and no layout of the surrounding text —
   * which is what lets the CSS transition actually read as a glide.
   */
  useEffect(() => {
    if (narrationState !== 'playing') return
    let frame

    const follow = (el) => {
      // Only chase the word when it has left the viewport, so ordinary reading
      // isn't interrupted by the page pulling itself around every line.
      const box = el.getBoundingClientRect()
      const margin = 96
      if (box.top >= margin && box.bottom <= window.innerHeight - margin) return
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
    }

    const tick = () => {
      const audio = audioElRef.current
      const alignment = alignmentRef.current
      const body = storyBodyRef.current
      if (audio && body && alignment?.length) {
        const range = alignment.wordRangeAt(audio.currentTime)
        const mapped = range ? scriptRangeToChunk(range, partsRef.current) : null
        const key = mapped ? wordKey(mapped.chunkIndex, mapped.start) : null

        if (key !== activeWordKeyRef.current) {
          const next = key
            ? body.querySelector(`[data-w="${CSS.escape(key)}"]`)
            : null
          // A miss means the alignment and the rendered text disagree about
          // where this word starts; hold the current highlight rather than
          // dropping it, which would read as a flicker.
          if (next || !key) {
            activeWordRef.current?.classList.remove('story-tts-segment--active')
            next?.classList.add('story-tts-segment--active')
            activeWordRef.current = next
            activeWordKeyRef.current = key
            if (next) follow(next)
          }
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [narrationState])

  /** Is this exactly what's loaded right now — the chapter, or one passage? */
  const isNarrating = (scope, ref) =>
    narrationTarget?.scope === scope && narrationTarget?.ref === ref

  /**
   * Play, pause or resume narration for a target. Only one session exists at a
   * time, so asking for a different target replaces the current one — starting a
   * passage while the chapter is playing stops the chapter.
   */
  const toggleNarration = async (scope, ref) => {
    const el = audioElRef.current
    if (!el) return
    // Don't spend a round trip discovering a lock the picker already shows.
    if (narrationLocked) return

    // Pause/resume the target that is already loaded rather than regenerating.
    if (isNarrating(scope, ref)) {
      if (narrationState === 'playing') {
        el.pause()
        return
      }
      if (narrationState === 'paused' && narrationRef.current) {
        el.play().catch(() => setNarrationState('paused'))
        return
      }
    }

    stopNarration()
    setNarrationError('')
    setNarrationTarget({ scope, ref })

    const session = new NarrationSession({
      storyId: generatedStory._id,
      scope,
      ref,
      audioEl: el,
      onState: (state) => {
        setNarrationState(state)
        // Nothing is loaded any more once it finishes or fails, so release the
        // target: the buttons drop back to "Listen" and the word spans go away.
        if (state === 'ended' || state === 'error') {
          clearHighlight()
          setNarrationTarget(null)
          // Narration is billed per passage persisted, so what it actually
          // cost is only known once the session stops.
          refreshBilling()
        }
      },
      onAlignment: (alignment) => {
        alignmentRef.current = alignment
        partsRef.current = session.parts
      },
      onError: (message) => setNarrationError(message),
    })
    narrationRef.current = session
    await session.start()
    partsRef.current = session.parts
  }

  const growActionInput = useCallback((el) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(240, el.scrollHeight)}px`
  }, [])

  useEffect(() => {
    growActionInput(actionInputRef.current)
  }, [userAction, growActionInput])

  const handleContinueStory = async () => {
    if (!generatedStory?._id) return

    setActionLoading('continue')
    setInlineActionError('')
    const result = await storyService.continueStory(generatedStory._id, userAction, { model, length: lengthKey, tone, creativity })
    setActionLoading(null)
    refreshBilling()

    if (result.success) {
      if (result.interrupted) {
        // Router agent is asking the player a clarification question
        setClarificationData({ questionId: result.questionId, text: result.questionText })
        setClarificationAnswer('')
      } else {
        setGeneratedStory(result.story)
        setUserAction('') // Clear action input on success
        // The turn may have opened a new chapter (the author asked for one in the
        // composer, or the AI broke on a scene jump) — follow the writing head so
        // the passage that was just written is the one on screen.
        if (result.chapterStarted) setActiveChapterOrder(null)
      }
    } else {
      failStoryAction(result, 'Failed to continue story')
    }
  }

  // Start a new chapter. Closes the current one; the next passage opens the new
  // chapter with a fresh scene. Jump the view to the new (empty) writing head.
  const handleStartChapter = () => {
    if (!generatedStory?._id) return
    setChapterTitleInput('')
    setChapterModalOpen(true)
  }

  const confirmStartChapter = async () => {
    if (!generatedStory?._id) return
    const title = chapterTitleInput
    setChapterModalOpen(false)
    setActionLoading('chapter')
    setInlineActionError('')
    const result = await storyService.startChapter(generatedStory._id, title, { model, length: lengthKey, tone, creativity })
    setActionLoading(null)
    refreshBilling()

    if (result.success) {
      setGeneratedStory(result.story)
      setActiveChapterOrder(null) // follow the new writing head
    } else {
      failStoryAction(result, 'Failed to start a new chapter')
    }
  }

  const handleSubmitClarification = async () => {
    console.log('[Clarification] Submit clicked', {
      clarificationData,
      clarificationAnswer,
      storyId: generatedStory?._id
    })

    if (!clarificationAnswer.trim()) {
      console.warn('[Clarification] Empty answer, aborting')
      return
    }
    if (!generatedStory?._id) {
      console.warn('[Clarification] No story ID, aborting')
      return
    }

    // Use questionId if available, fall back to a placeholder
    const questionId = clarificationData?.questionId || 'unknown'

    setClarificationLoading(true)
    setInlineActionError('')
    try {
      const result = await storyService.submitInquiryReply(
        generatedStory._id,
        questionId,
        clarificationAnswer.trim(),
        { model, length: lengthKey, tone, creativity }
      )

      console.log('[Clarification] API result:', result)

      if (result.success) {
        setGeneratedStory(result.story)
        setClarificationData(null)
        setClarificationAnswer('')
        setUserAction('')
      } else {
        failStoryAction(result, 'Failed to continue after answering')
      }
    } catch (err) {
      console.error('[Clarification] Error:', err)
      alert('Network error. Please try again.')
    } finally {
      setClarificationLoading(false)
      refreshBilling()
    }
  }

  const handleEditParagraph = async () => {
    if (!generatedStory?._id || !aiInstruction.trim()) {
      alert('Please enter edit instructions')
      return
    }

    setActionLoading('edit')
    setInlineActionError('')
    const result = await storyService.editLastParagraph(generatedStory._id, aiInstruction.trim(), { model, length: lengthKey, tone, creativity })
    setActionLoading(null)
    refreshBilling()

    if (result.success) {
      setGeneratedStory(result.story)
      setAiInstruction('')
    } else {
      failStoryAction(result, 'Failed to edit story')
    }
  }

  const handleClearAiInput = () => {
    setAiInstruction('')
  }


  // Inline paragraph editing (click one paragraph to edit just that paragraph)
  const handleEditPara = (chunkIndex, paraIndex, text) => {
    setEditingPara({ chunkIndex, paraIndex })
    setInlineEditContent(text)
  }

  const handleSavePara = async (chunk) => {
    if (!generatedStory?._id || !editingPara) return

    const paras = splitParagraphs(chunk.content)
    paras[editingPara.paraIndex] = inlineEditContent.trim()
    const newContent = paras.filter(Boolean).join('\n\n')

    setActionLoading('editChunk')
    setInlineActionError('')
    const result = await storyService.editChunk(generatedStory._id, chunk.index, newContent)
    setActionLoading(null)

    if (result.success) {
      setGeneratedStory(result.story)
      setEditingPara(null)
      setInlineEditContent('')
    } else {
      failStoryAction(result, 'Failed to edit paragraph')
    }
  }

  const handleCancelInlineEdit = () => {
    setEditingPara(null)
    setInlineEditContent('')
  }

  // Choosing a different setting invalidates whoever was picked for the old
  // one, so the character step always opens on a roster that matches.
  const resetCharacterChoice = () => {
    setCharacter('')
    setCustomCharacter('')
    setPickingCustomCharacter(false)
  }

  // Handle setting selection
  const handleSettingSelect = (settingId) => {
    resetCharacterChoice()
    if (settingId === 'custom') {
      setSetting('custom')
      setSuggested(null)
      setSuggestError('')
      setSuggestFellBack(false)
    } else {
      const selectedSetting = settingOptions.find(s => s.id === settingId)
      setSettingId(settingId)
      setSetting(selectedSetting.name)
      setCreationStep(2)
    }
  }

  /** Ask the fast model for five archetypes that suit a typed setting. */
  const loadCharactersForCustomSetting = async (text) => {
    setSuggestLoading(true)
    setSuggestError('')
    setSuggestFellBack(false)
    const result = await storyService.suggestCharacters(text)
    setSuggestLoading(false)
    if (result.success) {
      setSuggested(result.characters)
      setSuggestFellBack(!result.generated)
    } else {
      setSuggested(null)
      setSuggestError(result.error)
    }
  }

  // Handle custom setting submission
  const handleCustomSettingSubmit = () => {
    const text = customSetting.trim()
    if (!text) return
    resetCharacterChoice()
    setSettingId('custom')
    setSetting(text)
    setCreationStep(2)
    loadCharactersForCustomSetting(text)
  }

  // Handle character selection
  const handleCharacterSelect = (characterId) => {
    if (characterId === 'custom') {
      setPickingCustomCharacter(true)
      return
    }
    const selectedCharacter = characterOptions.find(c => c.id === characterId)
    if (!selectedCharacter) return
    setPickingCustomCharacter(false)
    setCharacter(selectedCharacter.name)
    setCreationStep(3)
  }

  const handleCustomCharacterSubmit = () => {
    const text = customCharacter.trim()
    if (!text) return
    setCharacter(text)
    setCreationStep(3)
  }

  // Handle story creation — now initializes with questions instead of generating directly
  const handleCreateStory = async () => {
    if (!characterName.trim()) {
      setError('Please enter a character name')
      return
    }

    setIsLoading(true)
    setError('')

    const finalSetting = setting === 'custom' ? customSetting : setting
    const result = await storyService.initializeStoryWithQuestions(finalSetting, character, characterName.trim(), { model, length: lengthKey, tone, creativity })

    setIsLoading(false)
    refreshBilling()

    if (result.success) {
      setQuestions(result.questions)
      setAnswers(new Array(result.questions.length).fill(''))
      setWizardStoryId(result.storyId)
      setCurrentQuestionIndex(0)
      setQuestionWizardActive(true)
      setIsCreating(false)
    } else {
      if (describeBillingError(result)) setBillingError(result)
      else setError(result.error)
    }
  }

  // Handle question wizard answer submission
  const handleQuestionNext = () => {
    if (!answers[currentQuestionIndex]?.trim()) return
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleQuestionBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleAnswerChange = (value) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = value
    setAnswers(newAnswers)
  }

  // Final submission — awaken the story
  const handleAwakenStory = async () => {
    if (!answers[currentQuestionIndex]?.trim()) return
    setIsWeaving(true)
    setQuestionWizardActive(false)

    const result = await storyService.submitAnswers(wizardStoryId, answers, { model, length: lengthKey, tone, creativity })

    setIsWeaving(false)
    refreshBilling()

    if (result.success) {
      setGeneratedStory(result.story)
    } else {
      if (describeBillingError(result)) setBillingError(result)
      else setError(result.error || 'Failed to awaken story')
      setQuestionWizardActive(true) // Let them retry
    }
  }

  // Reset creation flow
  const handleNewStory = () => {
    setIsCreating(true)
    setCreationStep(1)
    setSetting('')
    setCustomSetting('')
    setCharacter('')
    setCharacterName('')
    setError('')
    setGeneratedStory(null)
  }

  // ── Chapter model ─────────────────────────────────────────────────────────
  // storyChapters is a real per-chapter list; each chunk's `chapter` says which
  // one it belongs to. Legacy/empty stories collapse to a single chapter 0.
  // Derived above the loading/wizard/creation returns below, because the
  // narration memo is a hook and hooks cannot sit after a conditional return.
  const chapterList = (() => {
    const list = Array.isArray(generatedStory?.storyChapters) ? generatedStory.storyChapters : []
    const real = list.filter((c) => typeof c.order === 'number')
    if (real.length === 0) {
      return [{ order: 0, title: generatedStory?.title || 'Chapter 1', status: 'writing' }]
    }
    return [...real].sort((a, b) => a.order - b.order)
  })()
  const writingOrder = chapterList[chapterList.length - 1]?.order ?? 0
  const viewingOrder = activeChapterOrder ?? writingOrder
  const viewingIsHead = viewingOrder === writingOrder
  const activeChapterMeta = chapterList.find((c) => c.order === viewingOrder) || chapterList[0]
  const visibleChunks = (generatedStory?.MainStory || []).filter(
    (c) => (typeof c.chapter === 'number' ? c.chapter : 0) === viewingOrder
  )
  // A bare "Chapter N" title is provisional — don't echo it after the prefix.
  const activeChapterTitle =
    activeChapterMeta?.title && !/^chapter\s*\d+$/i.test(activeChapterMeta.title)
      ? activeChapterMeta.title
      : ''

  /**
   * Paragraph text for the visible passages, split once per change instead of on
   * every render — this used to re-scan every passage's text several times a
   * second while narrating.
   *
   * Word spans are built only for passages the current narration can actually
   * highlight (the whole chapter, or the single passage being read), so a story
   * that isn't being narrated renders as plain text.
   */
  const renderedChunks = useMemo(() => {
    const narratedIndexes =
      narrationTarget?.scope === 'chapter'
        ? new Set(visibleChunks.map((c) => c.index))
        : narrationTarget?.scope === 'chunk'
          ? new Set([narrationTarget.ref])
          : new Set()

    return visibleChunks.map((chunk) => {
      const paras = splitParagraphs(chunk.content)
      const starts = paragraphOffsets(chunk.content)
      return {
        chunk,
        paragraphs: paras.map((text, i) => ({
          text,
          tokens: narratedIndexes.has(chunk.index) ? tokenizeParagraph(text, starts[i]) : null,
        })),
      }
    })
    // visibleChunks is rebuilt on every render; its contents are what matter,
    // and those change with MainStory and the chapter being viewed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    generatedStory?.MainStory,
    viewingOrder,
    narrationTarget?.scope,
    narrationTarget?.ref,
  ])

  // Show loading state when fetching existing story
  if (isLoading && storyId) {
    return (
      <div className="story-creator">
        <div className="loading-story-container">
          <div className="loading-spinner-large"></div>
          <p>Loading your story...</p>
        </div>
      </div>
    )
  }

  // "Weaving your world..." transition overlay
  if (isWeaving) {
    return (
      <div className="story-creator">
        <div className="weaving-overlay">
          <div className="weaving-content">
            <div className="weaving-orb">
              <div className="weaving-orb-inner"></div>
              <div className="weaving-ring weaving-ring-1"></div>
              <div className="weaving-ring weaving-ring-2"></div>
              <div className="weaving-ring weaving-ring-3"></div>
            </div>
            <h2 className="weaving-title">Weaving your world...</h2>
            <p className="weaving-subtitle">Your answers are shaping the story</p>
          </div>
        </div>
      </div>
    )
  }

  // Question Wizard — The Initiation State
  if (questionWizardActive && questions.length > 0) {
    const isLastQuestion = currentQuestionIndex === questions.length - 1
    const currentAnswer = answers[currentQuestionIndex] || ''
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
      <div className="story-creator">
        <div className="question-wizard-overlay">
          <div className="question-wizard">
            {/* Progress bar */}
            <div className="question-progress-bar">
              <div className="question-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Progress indicator */}
            <div className="question-progress-text">
              <span className="question-step-label">Question</span>
              <span className="question-step-number">{currentQuestionIndex + 1}</span>
              <span className="question-step-divider">/</span>
              <span className="question-step-total">{questions.length}</span>
            </div>

            {/* Question slide */}
            <div className="question-slide" key={currentQuestionIndex}>
              <div className="question-icon">✦</div>
              <h2 className="question-text">{questions[currentQuestionIndex]}</h2>
              <textarea
                className="question-answer-input"
                placeholder="Speak your truth..."
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>

            {/* handleAwakenStory sends the reader back here on any failure that
                isn't a billing refusal (those get the CreditPrompt below), but
                until this line there was nowhere for that message to land — the
                Awaken button simply appeared not to work. */}
            {error && <p className="error-message">{error}</p>}

            {/* Navigation */}
            <div className="question-nav">
              <button
                className="question-back-btn"
                onClick={handleQuestionBack}
                disabled={currentQuestionIndex === 0}
              >
                ← Back
              </button>

              {isLastQuestion ? (
                <button
                  className="question-awaken-btn"
                  onClick={handleAwakenStory}
                  disabled={!currentAnswer.trim()}
                >
                  ✦ Awaken ✦
                </button>
              ) : (
                <button
                  className="question-next-btn"
                  onClick={handleQuestionNext}
                  disabled={!currentAnswer.trim()}
                >
                  Next →
                </button>
              )}
            </div>

            {/* Step dots */}
            <div className="question-dots">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`question-dot ${idx === currentQuestionIndex ? 'active' : ''} ${idx < currentQuestionIndex ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
        <CreditPrompt error={billingError} onClose={() => setBillingError(null)} onRefreshBilling={refreshBilling} />
      </div>
    )
  }

  const handleWizardBack = () => {
    if (creationStep > 1) {
      if (creationStep === 2) {
        setSetting('')
        setSettingId('')
        setCustomSetting('')
        setSuggested(null)
        setSuggestError('')
        setSuggestFellBack(false)
        resetCharacterChoice()
      }
      if (creationStep === 3) {
        setCharacter('')
        setPickingCustomCharacter(false)
      }
      setCreationStep(creationStep - 1)
    } else {
      window.history.back()
    }
  }

  const selectedSettingOption = settingOptions.find(
    (s) => (s.custom && setting === 'custom') || s.name === setting
  )
  const selectedCharacterOption = characterOptions.find((c) => c.name === character)
  const settingSummaryLabel = setting === 'custom' ? customSetting || 'Custom Setting' : setting

  // Render creation wizard
  if (isCreating) {
    return (
      <div className="story-creator">
        <div className="wz-overlay">
          <div className="wz-card">
            <div className="wz-top">
              <button type="button" className="wz-back" onClick={handleWizardBack} aria-label="Back">
                {creationStep > 1 ? I.back : I.up}
              </button>
              <span className="wz-eyebrow">Create your story</span>
              <div className="wz-steps">
                {[1, 2, 3].map((n, i) => (
                  <span key={n} style={{ display: 'contents' }}>
                    {i > 0 && <span className="wz-line" />}
                    <span className={`wz-step ${creationStep === n ? 'active' : creationStep > n ? 'done' : ''}`}>
                      {creationStep > n ? I.check : n}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {creationStep === 1 && (
              <div className="wizard-step step-setting">
                <h2 className="wz-h">Choose your story setting</h2>
                <p className="wz-sub">Where will your adventure take place?</p>

                <div className="wz-tiles">
                  {settingOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`wz-tile ${option.custom ? 'custom' : ''} ${
                        (option.custom && setting === 'custom') || setting === option.name ? 'selected' : ''
                      }`}
                      onClick={() => handleSettingSelect(option.id)}
                    >
                      {option.custom ? (
                        <span className="ci">{I.pen}</span>
                      ) : (
                        <>
                          <img src={option.img} alt="" />
                          <span className="shade" />
                        </>
                      )}
                      <span className="check">{I.check}</span>
                      <span className="label">{option.name}</span>
                    </button>
                  ))}
                </div>

                {setting === 'custom' && (
                  <div className="wz-custom-row">
                    <input
                      type="text"
                      placeholder="Enter your custom setting…"
                      value={customSetting}
                      onChange={(e) => setCustomSetting(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomSettingSubmit()}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-md"
                      onClick={handleCustomSettingSubmit}
                      disabled={!customSetting.trim()}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {creationStep === 2 && (
              <div className="wizard-step step-character">
                <h2 className="wz-h">Choose your character</h2>
                <p className="wz-sub">
                  {settingId === 'custom'
                    ? <>Who could carry a story set in <strong>{setting}</strong>?</>
                    : <>Who will be the hero of your {setting.toLowerCase()} story?</>}
                </p>

                {suggestLoading ? (
                  <>
                    <div className="wz-tiles">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div className="wz-tile wz-tile-skel" key={i} aria-hidden="true" />
                      ))}
                    </div>
                    <p className="wz-note wz-note-busy">
                      <span className="loading-spinner" />
                      Casting for characters who belong in {setting}…
                    </p>
                  </>
                ) : suggestError ? (
                  <div className="wz-retry">
                    <p>{suggestError}</p>
                    <button
                      type="button"
                      className="btn btn-ghost btn-md"
                      onClick={() => loadCharactersForCustomSetting(setting)}
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="wz-tiles">
                      {characterOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`wz-tile ${character === option.name ? 'selected' : ''}`}
                          onClick={() => handleCharacterSelect(option.id)}
                        >
                          <img src={option.img} alt="" />
                          <span className="shade" />
                          <span className="check">{I.check}</span>
                          <span className="label">{option.name}</span>
                        </button>
                      ))}

                      {/* Sixth tile: none of the above. */}
                      <button
                        type="button"
                        className={`wz-tile custom ${pickingCustomCharacter ? 'selected' : ''}`}
                        onClick={() => handleCharacterSelect('custom')}
                      >
                        <span className="ci">{I.pen}</span>
                        <span className="check">{I.check}</span>
                        <span className="label">Write your own</span>
                      </button>
                    </div>

                    {suggestFellBack && (
                      <p className="wz-note">
                        Couldn&apos;t reach the model for tailored characters, so these are general
                        archetypes — or write your own.
                      </p>
                    )}

                    {pickingCustomCharacter && (
                      <div className="wz-custom-row">
                        <input
                          type="text"
                          placeholder="Describe your character… (e.g. exiled cartographer)"
                          value={customCharacter}
                          onChange={(e) => setCustomCharacter(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCustomCharacterSubmit()}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-primary btn-md"
                          onClick={handleCustomCharacterSubmit}
                          disabled={!customCharacter.trim()}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {creationStep === 3 && (
              <div className="wizard-step step-name">
                <h2 className="wz-h">Name your character</h2>
                <p className="wz-sub">Give your {character} a memorable name</p>

                <div className="wz-name">
                  <input
                    type="text"
                    placeholder="Enter character name…"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateStory()}
                    autoFocus
                  />

                  {error && <p className="error-message">{error}</p>}

                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handleCreateStory}
                    disabled={isLoading || !characterName.trim()}
                    style={{ gap: 8 }}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading-spinner" />
                        Creating your story…
                      </>
                    ) : (
                      <>
                        {I.spark}
                        Create story
                      </>
                    )}
                  </button>

                  <div className="wz-summary">
                    <div className="sr">
                      <span className="k">Setting</span>
                      {selectedSettingOption && !selectedSettingOption.custom && (
                        <img className="mini" src={selectedSettingOption.img} alt="" />
                      )}
                      <span className="vv">{settingSummaryLabel}</span>
                    </div>
                    <div className="sr">
                      <span className="k">Character</span>
                      {selectedCharacterOption && (
                        <img className="mini" src={selectedCharacterOption.img} alt="" />
                      )}
                      <span className="vv">{character}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <CreditPrompt error={billingError} onClose={() => setBillingError(null)} onRefreshBilling={refreshBilling} />
      </div>
    )
  }

  const handleBack = () => {
    if (activeTab !== 'story') {
      setActiveTab('story')
    } else {
      window.history.back()
    }
  }

  const creativityLabel =
    creativityLevel < 34 ? 'Predictable' : creativityLevel > 66 ? 'Creative' : 'Balanced'

  const storyTitle = generatedStory?.characterName
    ? `${generatedStory.characterName}'s Adventure`
    : 'Story Adventure'

  const isStoryBusy =
    actionLoading === 'continue' ||
    actionLoading === 'regenerate' ||
    actionLoading === 'chapter' ||
    clarificationLoading

  const TAB_EMPTY = {
    character: 'Characters you create and meet will be tracked here with their traits and memories.',
    world: 'Locations and lore you establish will be collected here as your world grows.',
    creatures: 'Creatures and companions encountered in your story will appear here.',
  }

  const openEntity = (type, data) => {
    setSelectedEntity({ type, data })
    setLibrarySaveState({ loading: false, success: false, error: null })
  }

  const renderCodexTab = (items, type, tabIcon, cardEmoji) => {
    if (!items?.length) {
      const tabMeta = WORKSPACE_TABS.find((t) => t.id === type)
      return (
        <div className="tab-empty">
          <div className="eic">{tabIcon}</div>
          <h3>{tabMeta?.label} codex</h3>
          <p>{TAB_EMPTY[type]}</p>
          <button type="button" className="btn btn-ghost btn-md" onClick={() => setActiveTab('story')}>
            {I.back} Back to story
          </button>
        </div>
      )
    }

    return (
      <div className="chapter-card codex-panel">
        <div className="content-cards-grid">
          {items.map((item, index) => (
            <button
              key={item._id || `${type}-${index}`}
              type="button"
              className="content-card"
              onClick={() => openEntity(type === 'world' ? 'location' : type, item)}
            >
              <div className="content-card-header">
                <span className="content-icon">{cardEmoji}</span>
                <h3>{item.name}</h3>
              </div>
              <p className="content-description">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="story-creator">
      {chapterModalOpen && (
        <div
          className="chap-modal-overlay"
          role="presentation"
          onClick={() => setChapterModalOpen(false)}
        >
          <div
            className="chap-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chap-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chap-modal-head">
              <span className="ic">{I.pen}</span>
              <h3 id="chap-modal-title">Start a new chapter</h3>
            </div>
            <p className="chap-modal-sub">
              Give it a title, or leave this blank — the AI will predict one now and finalize it
              from the chapter’s content once it’s complete.
            </p>
            <input
              className="chap-modal-input"
              value={chapterTitleInput}
              placeholder="Chapter title (optional)…"
              maxLength={80}
              autoFocus
              onChange={(e) => setChapterTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirmStartChapter()
                } else if (e.key === 'Escape') {
                  setChapterModalOpen(false)
                }
              }}
            />
            <div className="chap-modal-acts">
              <button
                type="button"
                className="btn btn-ghost btn-md"
                onClick={() => setChapterModalOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-md" onClick={confirmStartChapter}>
                {I.spark} Start chapter
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="sc-content">
        <div className="sc-head">
          <button type="button" className="sc-back" onClick={handleBack} aria-label="Back">
            {I.back}
          </button>
          <div className="sc-titles">
            <h1>{storyTitle}</h1>
            {generatedStory?.setting && (
              <span className="setting">
                <span className="chip">{generatedStory.setting}</span>
              </span>
            )}
          </div>
          {(generatedStory?._id || storyId) && (
            <button
              type="button"
              className="report-trigger"
              onClick={() => setShowShare(true)}
              title="Share this story"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {generatedStory?.visibility && generatedStory.visibility !== 'private' ? 'Shared' : 'Share'}
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-md" onClick={handleNewStory} style={{ gap: 7 }}>
            {I.spark} New
          </button>
        </div>

        {showShare && (generatedStory?._id || storyId) && (
          <ShareModal
            resourceType="story"
            resource={{
              _id: generatedStory?._id || storyId,
              title: storyTitle,
              visibility: generatedStory?.visibility || 'private',
              contentRating: generatedStory?.contentRating || 'unrated',
            }}
            onClose={() => setShowShare(false)}
            onUpdated={(fields) => setGeneratedStory((prev) => (prev ? { ...prev, ...fields } : prev))}
          />
        )}

        <div className="sc-tabs">
          {WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`sc-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="sc-grid">
          <div className="sc-center">
            {activeTab === 'story' ? (
              <>
                {generatedStory?.MainStory?.length > 0 && (
                  <div className="chapter-rail" role="tablist" aria-label="Chapters">
                    {chapterList.map((ch) => (
                      <button
                        key={ch.order}
                        type="button"
                        role="tab"
                        aria-selected={ch.order === viewingOrder}
                        className={`chap-chip ${ch.order === viewingOrder ? 'active' : ''}`}
                        onClick={() => setActiveChapterOrder(ch.order)}
                        title={ch.title || `Chapter ${ch.order + 1}`}
                      >
                        <span className="chap-chip-n">Ch {ch.order + 1}</span>
                        {ch.title && !/^chapter\s*\d+$/i.test(ch.title) && (
                          <span className="chap-chip-t">{ch.title}</span>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="chap-chip chap-chip-new"
                      onClick={handleStartChapter}
                      disabled={isStoryBusy || !generatedStory?.MainStory?.length}
                      title="Close the current chapter and start a fresh one"
                    >
                      {actionLoading === 'chapter' ? (retryingLock ? 'Finishing…' : 'Starting…') : '+ New chapter'}
                    </button>
                  </div>
                )}

                <div className="chapter-card">
                  <div className="chapter-head">
                    <div>
                      <h2>Chapter {viewingOrder + 1}{activeChapterTitle ? `: ${activeChapterTitle}` : ''}</h2>
                      <div className="upd">
                        {viewingIsHead ? 'Writing now' : 'Completed chapter · read-only'}
                      </div>
                    </div>
                    <div className="chapter-acts">
                      {/* The price sits next to the play control, not in
                          settings: narration is the one action that can cost
                          fifty times a turn, and someone who only learns that
                          afterwards experiences the plan as small (§7). */}
                      {narrationLocked ? (
                        <button
                          type="button"
                          className="cact-narr-lock"
                          onClick={() => navigate('/settings#plan')}
                        >
                          {I.speaker}
                          {planWithNarration
                            ? `${planWithNarration.label} adds narration`
                            : 'Narration is a paid feature'}
                        </button>
                      ) : (
                        narrationPrice != null && (
                          <span
                            className="cact-narr-price"
                            title="Narration is charged on the passage's real character count, so the exact figure moves with its length. This is a typical passage."
                          >
                            ~{formatCredits(narrationPrice)} cr per passage
                          </span>
                        )
                      )}
                      {(() => {
                        // The chapter button reflects playback only when the
                        // chapter is what's loaded — narrating a single passage
                        // must not make this read "Pause".
                        const mine = isNarrating('chapter', viewingOrder)
                        const state = mine ? narrationState : 'idle'
                        return (
                          <button
                            type="button"
                            className={`cact-listen ${state === 'playing' ? 'on' : ''}`}
                            title={narrationLocked ? 'Narration is not on your plan' : 'Read this chapter aloud'}
                            onClick={() => toggleNarration('chapter', viewingOrder)}
                            disabled={narrationLocked || !visibleChunks.length || (mine && narrationState === 'loading')}
                          >
                            {state === 'playing' ? I.pause : I.speaker}
                            {state === 'loading'
                              ? 'Preparing…'
                              : state === 'playing'
                                ? 'Pause'
                                : state === 'paused'
                                  ? 'Resume'
                                  : 'Listen'}
                          </button>
                        )
                      })()}
                      <button
                        type="button"
                        className="cact-undo"
                        title="Removes only the most recent passage — earlier story stays untouched"
                        onClick={handleEraseLastChunk}
                        disabled={isStoryBusy || !viewingIsHead || !generatedStory?.MainStory?.length}
                      >
                        {I.trash} Undo last passage
                      </button>
                    </div>
                  </div>

                  {narrationError && (
                    <div className="narration-error" role="alert">
                      {narrationError}
                    </div>
                  )}
                  {inlineActionError && (
                    <div className="narration-error" role="alert">
                      {inlineActionError}
                    </div>
                  )}
                  {/* Driven entirely by NarrationSession; never shown directly. */}
                  <audio ref={audioElRef} hidden preload="none" />

                  <div className="story-history" ref={storyBodyRef}>
                    {renderedChunks.length > 0 ? (
                      renderedChunks.map(({ chunk, paragraphs }, idx) => {
                        const chunkPlaying = isNarrating('chunk', chunk.index)
                        const chunkState = chunkPlaying ? narrationState : 'idle'
                        return (
                        <div
                          key={`chunk-${chunk.index}`}
                          className={`chunk ${chunkPlaying && narrationState === 'playing' ? 'is-narrating' : ''}`}
                        >
                          {idx > 0 && (
                            <div className="chunk-mark">
                              <span className="ln" />
                              <span className="b">Continued</span>
                              <span className="ln" />
                            </div>
                          )}
                          <button
                            type="button"
                            className={`chunk-listen ${chunkState !== 'idle' ? 'on' : ''}`}
                            title={
                              narrationLocked
                                ? 'Narration is not on your plan'
                                : chunkState === 'playing'
                                  ? 'Pause this passage'
                                  : narrationPrice != null
                                    ? `Read just this passage aloud · about ${formatCredits(narrationPrice)} credits`
                                    : 'Read just this passage aloud'
                            }
                            aria-label={
                              chunkState === 'playing'
                                ? 'Pause this passage'
                                : 'Read just this passage aloud'
                            }
                            onClick={() => toggleNarration('chunk', chunk.index)}
                            disabled={narrationLocked || (chunkPlaying && narrationState === 'loading')}
                          >
                            {chunkState === 'loading' ? (
                              <span className="chunk-listen-spin" aria-hidden="true" />
                            ) : chunkState === 'playing' ? (
                              I.pause
                            ) : (
                              I.speaker
                            )}
                          </button>
                          {paragraphs.map(({ text: para, tokens }, pi) => {
                            const isEditingThis =
                              editingPara &&
                              editingPara.chunkIndex === chunk.index &&
                              editingPara.paraIndex === pi

                            if (isEditingThis) {
                              return (
                                <div key={`para-edit-${chunk.index}-${pi}`} className="chunk-edit">
                                  <textarea
                                    value={inlineEditContent}
                                    onChange={(e) => {
                                      setInlineEditContent(e.target.value)
                                      growActionInput(e.target)
                                    }}
                                    ref={(el) => growActionInput(el)}
                                    autoFocus
                                  />
                                  <div className="row">
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleSavePara(chunk)}
                                      disabled={actionLoading !== null || !inlineEditContent.trim()}
                                    >
                                      {actionLoading === 'editChunk' ? (retryingLock ? 'Finishing…' : 'Saving…') : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      onClick={handleCancelInlineEdit}
                                      disabled={actionLoading !== null}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )
                            }

                            return (
                              <p
                                key={`para-${chunk.index}-${pi}`}
                                className="para"
                                role="button"
                                tabIndex={0}
                                onClick={() => handleEditPara(chunk.index, pi, para)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditPara(chunk.index, pi, para)
                                }}
                              >
                                {tokens
                                  ? tokens.map((tok, ti) =>
                                      tok.type === 'word' ? (
                                        <span
                                          key={ti}
                                          className="story-tts-segment"
                                          data-w={wordKey(chunk.index, tok.start)}
                                        >
                                          {tok.text}
                                        </span>
                                      ) : (
                                        tok.text
                                      )
                                    )
                                  : para}
                                <span className="para-edit-hint" aria-hidden="true">
                                  {I.pen} Edit
                                </span>
                              </p>
                            )
                          })}
                        </div>
                        )
                      })
                    ) : generatedStory?.MainStory?.length > 0 ? (
                      <p className="chapter-empty-note">
                        This chapter is empty — use the composer below to write its opening scene.
                      </p>
                    ) : (
                      <p>Your story will appear here…</p>
                    )}

                    {clarificationData && !clarificationLoading && (
                      <div className="ai-ask chunk-appear">
                        <div className="ai-ask-head">
                          <span className="ai-ask-mark">{I.ai}</span>
                          <span>Decipher needs a detail</span>
                        </div>
                        <p className="ai-ask-q">{clarificationData.text}</p>
                        <div className="ai-ask-field">
                          <input
                            ref={clarifyInputRef}
                            value={clarificationAnswer}
                            placeholder="Answer in your own words…"
                            disabled={clarificationLoading}
                            onChange={(e) => setClarificationAnswer(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && clarificationAnswer.trim()) {
                                e.preventDefault()
                                handleSubmitClarification()
                              }
                            }}
                          />
                          <button
                            type="button"
                            className={`ai-ask-mic ${listeningFor === 'clarify' ? 'on' : ''}`}
                            onClick={() => toggleDictation('clarify')}
                            disabled={clarificationLoading}
                            aria-label={listeningFor === 'clarify' ? 'Stop dictation' : 'Answer out loud'}
                            title={listeningFor === 'clarify' ? 'Listening… click to stop' : 'Answer out loud'}
                          >
                            {I.mic}
                          </button>
                          <button
                            type="button"
                            className="ai-ask-go"
                            disabled={clarificationLoading || !clarificationAnswer.trim()}
                            onClick={handleSubmitClarification}
                            aria-label="Send answer"
                          >
                            {I.up}
                          </button>
                        </div>
                        <p className="ai-ask-hint">
                          {listeningFor === 'clarify'
                            ? 'Listening — speak your answer, then tap the mic to stop.'
                            : 'Press Enter to send. Your answer goes straight into the scene.'}
                        </p>
                      </div>
                    )}

                    {isStoryBusy && (
                      <div className="gen-row">
                        <span>{retryingLock ? 'Finishing the previous passage…' : 'The story unfolds'}</span>
                        <span className="dots">
                          <i />
                          <i />
                          <i />
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {viewingIsHead ? (
                  <div className="sc-dock">
                    <div className="sc-input">
                      <span className="lead">Do</span>
                      <textarea
                        ref={actionInputRef}
                        value={userAction}
                        placeholder="What does your character do next?  (optional — or ask: “start a new chapter”)"
                        onChange={(e) => setUserAction(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if (!isStoryBusy) handleContinueStory()
                          }
                        }}
                        rows={1}
                        disabled={isStoryBusy}
                      />
                      <button
                        type="button"
                        className={`sc-mic ${listeningFor === 'action' ? 'on' : ''}`}
                        onClick={() => toggleDictation('action')}
                        disabled={isStoryBusy}
                        aria-label={listeningFor === 'action' ? 'Stop dictation' : 'Dictate your action'}
                        title={listeningFor === 'action' ? 'Listening… click to stop' : 'Speak your action'}
                      >
                        {I.mic}
                      </button>
                    </div>
                    <div className="sc-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-md"
                        onClick={handleContinueStory}
                        disabled={isStoryBusy}
                      >
                        {actionLoading === 'continue' ? (retryingLock ? 'Finishing…' : 'Weaving…') : 'Continue story'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-md"
                        onClick={handleRegenerateChunk}
                        disabled={isStoryBusy || !generatedStory?.MainStory?.length}
                      >
                        {I.refresh} Regenerate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="sc-dock sc-dock-readonly">
                    <p className="readonly-note">
                      You’re viewing a past chapter — the story only continues from the latest one.
                      <button type="button" className="linklike" onClick={() => setActiveChapterOrder(null)}>
                        Jump to Chapter {writingOrder + 1} →
                      </button>
                    </p>
                  </div>
                )}
              </>
            ) : activeTab === 'character' ? (
              renderCodexTab(generatedStory?.characters, 'character', I.user, '👤')
            ) : activeTab === 'world' ? (
              renderCodexTab(generatedStory?.locations, 'world', I.globe, '🌍')
            ) : (
              renderCodexTab(generatedStory?.creatures, 'creatures', I.paw, '🐉')
            )}
          </div>

          <div className="sc-rail">
            <div className="sc-card">
              <div className="sc-card-head">
                <span className="ic">{I.ai}</span>
                <h3>AI Assistant</h3>
              </div>
              <textarea
                className="ai-field"
                placeholder="Guide the AI with your creative direction…"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                disabled={actionLoading === 'edit'}
              />
              <div className="ai-btns">
                <button
                  type="button"
                  className="btn btn-primary btn-md"
                  onClick={handleEditParagraph}
                  disabled={actionLoading !== null || !aiInstruction.trim()}
                >
                  {actionLoading === 'edit' ? (retryingLock ? 'Finishing…' : 'Editing…') : 'Send'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-md"
                  onClick={handleClearAiInput}
                  disabled={actionLoading === 'edit'}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="sc-card">
              <div className="sc-card-head">
                <span className="ic">{I.sliders}</span>
                <h3>Story Controls</h3>
              </div>
              <div className="ctrl">
                <div className="ctrl-label">
                  Creativity level <span className="v">{creativityLabel}</span>
                </div>
                <input
                  className="slider"
                  type="range"
                  min="0"
                  max="100"
                  value={creativityLevel}
                  onChange={(e) => setCreativityLevel(Number(e.target.value))}
                />
                <div className="slider-ends">
                  <span>Predictable</span>
                  <span>Creative</span>
                </div>
              </div>
              <div className="ctrl">
                <div className="ctrl-label">Story length</div>
                <div className="sc-select">
                  <select value={storyLength} onChange={(e) => setStoryLength(e.target.value)}>
                    {STORY_LENGTHS.map((l) => {
                      const offered = !unsupportedLengths.includes(l.key)
                      return (
                        <option key={l.key} value={l.label} disabled={!offered}>
                          {l.label + (offered ? '' : ' — not offered by this model')}
                        </option>
                      )
                    })}
                  </select>
                  <span className="ch">{I.chev}</span>
                </div>
              </div>
              <div className="ctrl">
                <div className="ctrl-label">Tone</div>
                <div className="sc-select">
                  <select value={tone} onChange={(e) => setTone(e.target.value)}>
                    {TONES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <span className="ch">{I.chev}</span>
                </div>
              </div>
              <div className="ctrl">
                {/* No price here any more: the picker's own trigger carries it,
                    and its panel explains what the column means. Two live
                    figures for one number is one too many. */}
                <div className="ctrl-label">Model</div>
                <ModelPicker
                  models={availableModels}
                  value={model}
                  onChange={setModel}
                  describeModel={describeModel}
                />
                {selectedModelInfo?.locked && (
                  <button
                    type="button"
                    className="sc-lock-note"
                    onClick={() => navigate('/settings#plan')}
                  >
                    {I.spark}
                    <span>
                      {selectedModelInfo.unlock
                        ? `${selectedModelInfo.unlock.label} unlocks this model`
                        : 'This model is not on your plan'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="sc-card">
              <div className="sc-card-head">
                <span className="ic">{I.stats}</span>
                <h3>Story Stats</h3>
              </div>
              <div className="stat-row">
                <span className="k">Words</span>
                <span className="v">
                  <span className="grad-text">{generatedStory?.storyStats?.totalWords || 0}</span>
                </span>
              </div>
              <div className="stat-row">
                <span className="k">Characters</span>
                <span className="v">
                  <span className="grad-text">{generatedStory?.storyStats?.Characters || 0}</span>
                </span>
              </div>
              <div className="stat-row">
                <span className="k">Paragraphs</span>
                <span className="v">
                  <span className="grad-text">{generatedStory?.storyStats?.paragraphs || 0}</span>
                </span>
              </div>
              <div className="stat-row">
                <span className="k">Reading time</span>
                <span className="v">
                  <span className="grad-text">{generatedStory?.storyStats?.readingTime || 0} min</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedEntity && (
        <div className="clarification-overlay entity-library-overlay" onClick={() => setSelectedEntity(null)}>
          <div className="clarification-modal entity-library-modal" onClick={(e) => e.stopPropagation()}>
            <div className="entity-modal-header">
              <div className="clarification-icon entity-modal-icon">
                {selectedEntity.type === 'character' ? '👤' : selectedEntity.type === 'location' ? '🌍' : '🐉'}
              </div>
              <h2 className="clarification-title entity-modal-title">{selectedEntity.data.name}</h2>
            </div>

            <div className="entity-modal-content">
              <p className="clarification-text entity-modal-description">{selectedEntity.data.description}</p>
            </div>

            <div className="clarification-actions entity-modal-actions">
              {librarySaveState.error && (
                <p className="player-action-transcribe-error">{librarySaveState.error}</p>
              )}

              <button
                type="button"
                className="clarification-dismiss-btn"
                onClick={() => {
                  setSelectedEntity(null)
                  setLibrarySaveState({ loading: false, success: false, error: null })
                }}
              >
                Close
              </button>

              {librarySaveState.success ? (
                <button
                  type="button"
                  className="clarification-submit-btn success-btn"
                  style={{
                    background: 'rgba(0, 255, 128, 0.2)',
                    border: '1px solid rgba(0, 255, 128, 0.4)',
                    color: '#00ff80',
                  }}
                  disabled
                >
                  ✓ Added to Library
                </button>
              ) : (
                <button
                  type="button"
                  className="clarification-submit-btn"
                  onClick={async () => {
                    setLibrarySaveState({ loading: true, success: false, error: null })
                    const res = await libraryService.saveEntityToLibrary(
                      selectedEntity.type,
                      selectedEntity.data.name,
                      selectedEntity.data.description
                    )
                    if (res.success) {
                      setLibrarySaveState({ loading: false, success: true, error: null })
                    } else {
                      setLibrarySaveState({ loading: false, success: false, error: res.error })
                    }
                  }}
                  disabled={librarySaveState.loading}
                >
                  {librarySaveState.loading ? 'Adding…' : '✦ Add to Library'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <CreditPrompt error={billingError} onClose={() => setBillingError(null)} onRefreshBilling={refreshBilling} />
    </div>
  )
}

export default StoryCreator
