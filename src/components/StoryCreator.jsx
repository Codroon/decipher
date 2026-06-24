import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import './StoryCreator.css'
import * as storyService from '../services/storyService'
import * as libraryService from '../services/libraryService'

/** Render a story chunk as plain paragraphs (split on blank lines). */
function renderChunkParagraphs(chunk) {
  const paraStrings = chunk.content.split(/\n\n/).filter((p) => p.trim())
  if (paraStrings.length === 0) {
    return <p key={`para-${chunk.index}-0`}>{chunk.content}</p>
  }
  return paraStrings.map((para, pi) => (
    <p key={`para-${chunk.index}-${pi}`}>{para.trim()}</p>
  ))
}

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

const WORKSPACE_TABS = [
  { id: 'story', label: 'Story', icon: I.pen },
  { id: 'character', label: 'Character', icon: I.user },
  { id: 'world', label: 'World', icon: I.globe },
  { id: 'creatures', label: 'Creatures', icon: I.paw },
]

function StoryCreator() {
  const { storyId } = useParams()
  const [activeTab, setActiveTab] = useState('story')
  const [creativityLevel, setCreativityLevel] = useState(80)
  const [storyLength, setStoryLength] = useState('Medium (3-4 paragraphs)')
  const [tone, setTone] = useState('Mysterious')
  const [model, setModel] = useState('google/gemini-3.1-flash-lite')
  const [availableModels, setAvailableModels] = useState([])

  // Story creation states
  const [isCreating, setIsCreating] = useState(!storyId)
  const [creationStep, setCreationStep] = useState(1)
  const [setting, setSetting] = useState('')
  const [customSetting, setCustomSetting] = useState('')
  const [character, setCharacter] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedStory, setGeneratedStory] = useState(null)

  const actionInputRef = useRef(null)

  // Story action states
  const [actionLoading, setActionLoading] = useState(null)
  const [aiInstruction, setAiInstruction] = useState('')
  const [userAction, setUserAction] = useState('') // Player action input for continue story
  const [clarificationData, setClarificationData] = useState(null) // { questionId, text }
  const [clarificationAnswer, setClarificationAnswer] = useState('')
  const [clarificationLoading, setClarificationLoading] = useState(false)

  // Manual chunk editing states
  const [showChunkEditor, setShowChunkEditor] = useState(false)
  const [editingChunkIndex, setEditingChunkIndex] = useState(null)
  const [chunkEditContent, setChunkEditContent] = useState('')

  // Inline editing states (for clicking on chunks in display)
  const [inlineEditingChunkIndex, setInlineEditingChunkIndex] = useState(null)
  const [inlineEditContent, setInlineEditContent] = useState('')

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

        // Select the catalog's default model (flagged isDefault) on first load.
        const preferred = result.models.find(m => m.isDefault) || result.models[0]
        if (preferred) setModel(preferred.id)
      }
    }

    loadStory()
    loadModels()
  }, [storyId])

  // Predefined settings
  const settingOptions = [
    { id: 'magic', name: 'Land of Magic', img: '/recent-image-1-52dd4f.png' },
    { id: 'medieval', name: 'Medieval Kingdom', img: '/Group 7.png' },
    { id: 'space', name: 'Space Adventure', img: '/fantasy-art-style.png' },
    { id: 'fantasy', name: 'Fantasy Realm', img: '/recent-image-3.png' },
    { id: 'mystery', name: 'Mystery Manor', img: '/image 9.png' },
    { id: 'custom', name: 'Custom Setting', custom: true },
  ]

  // Predefined characters
  const characterOptions = [
    { id: 'warrior', name: 'Warrior', img: '/ai_storytelling_platform_balanced 1.png' },
    { id: 'wizard', name: 'Wizard', img: '/fantasy-art-style.png' },
    { id: 'rogue', name: 'Rogue', img: '/image 9.png' },
    { id: 'explorer', name: 'Explorer', img: '/ai_storytelling_platform_balanced 5.png' },
    { id: 'hero', name: 'Hero', img: '/realistic-art-style-52592d.png' },
    { id: 'barbarian', name: 'Barbarian', img: '/recent-image-3.png' },
  ]

  const handleTabChange = (tabId) => setActiveTab(tabId)


  const handleRegenerateChunk = async () => {
    if (!generatedStory?._id) return

    setActionLoading('regenerate')
    const result = await storyService.regenerateLastChunk(generatedStory._id, model)
    setActionLoading(null)

    if (result.success) {
      setGeneratedStory(result.story)
    } else {
      alert(result.error || 'Failed to regenerate story chunk')
    }
  }

  const handleEraseLastChunk = async () => {
    if (!generatedStory?._id || !generatedStory.MainStory?.length) return
    if (!window.confirm('Remove the last story chunk?')) return
    const lastChunk = generatedStory.MainStory[generatedStory.MainStory.length - 1]
    setActionLoading('editChunk')
    const result = await storyService.editChunk(generatedStory._id, lastChunk.index, '')
    setActionLoading(null)
    if (result.success) {
      setGeneratedStory(result.story)
      setInlineEditingChunkIndex(null)
    } else {
      alert(result.error || 'Failed to remove chunk')
    }
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
    const result = await storyService.continueStory(generatedStory._id, model, userAction)
    setActionLoading(null)

    if (result.success) {
      if (result.interrupted) {
        // Router agent is asking the player a clarification question
        setClarificationData({ questionId: result.questionId, text: result.questionText })
        setClarificationAnswer('')
      } else {
        setGeneratedStory(result.story)
        setUserAction('') // Clear action input on success
      }
    } else {
      alert(result.error || 'Failed to continue story')
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
    try {
      const result = await storyService.submitInquiryReply(
        generatedStory._id,
        questionId,
        clarificationAnswer.trim(),
        model
      )

      console.log('[Clarification] API result:', result)

      if (result.success) {
        setGeneratedStory(result.story)
        setClarificationData(null)
        setClarificationAnswer('')
        setUserAction('')
      } else {
        alert(result.error || 'Failed to continue after answering')
      }
    } catch (err) {
      console.error('[Clarification] Error:', err)
      alert('Network error. Please try again.')
    } finally {
      setClarificationLoading(false)
    }
  }

  const handleEditParagraph = async () => {
    if (!generatedStory?._id || !aiInstruction.trim()) {
      alert('Please enter edit instructions')
      return
    }

    setActionLoading('edit')
    const result = await storyService.editLastParagraph(generatedStory._id, aiInstruction.trim(), model)
    setActionLoading(null)

    if (result.success) {
      setGeneratedStory(result.story)
      setAiInstruction('')
    } else {
      alert(result.error || 'Failed to edit story')
    }
  }

  const handleClearAiInput = () => {
    setAiInstruction('')
  }


  // Handle manual chunk editing
  const handleOpenChunkEditor = () => {
    setShowChunkEditor(true)
  }

  const handleEditChunk = (chunkIndex, currentContent) => {
    setEditingChunkIndex(chunkIndex)
    setChunkEditContent(currentContent)
  }

  const handleSaveChunk = async () => {
    if (!generatedStory?._id || editingChunkIndex === null) return

    setActionLoading('editChunk')
    const result = await storyService.editChunk(
      generatedStory._id,
      editingChunkIndex,
      chunkEditContent.trim()
    )
    setActionLoading(null)

    if (result.success) {
      setGeneratedStory(result.story)
      setEditingChunkIndex(null)
      setChunkEditContent('')
      setShowChunkEditor(false)
    } else {
      alert(result.error || 'Failed to edit chunk')
    }
  }

  const handleDeleteChunk = async () => {
    if (!generatedStory?._id || editingChunkIndex === null) return

    if (!confirm('Are you sure you want to delete this chunk? This cannot be undone.')) {
      return
    }

    setActionLoading('editChunk')
    // Send empty string to delete
    const result = await storyService.editChunk(
      generatedStory._id,
      editingChunkIndex,
      ''
    )
    setActionLoading(null)

    if (result.success) {
      setGeneratedStory(result.story)
      setEditingChunkIndex(null)
      setChunkEditContent('')
      setShowChunkEditor(false)
    } else {
      alert(result.error || 'Failed to delete chunk')
    }
  }

  const handleCancelChunkEdit = () => {
    setEditingChunkIndex(null)
    setChunkEditContent('')
  }

  // Handle inline chunk editing (click on chunk to edit)
  const handleInlineEditChunk = (chunkIndex, currentContent) => {
    setInlineEditingChunkIndex(chunkIndex)
    setInlineEditContent(currentContent)
  }

  const handleSaveInlineChunk = async () => {
    if (!generatedStory?._id || inlineEditingChunkIndex === null) return

    setActionLoading('editChunk')
    const result = await storyService.editChunk(
      generatedStory._id,
      inlineEditingChunkIndex,
      inlineEditContent.trim()
    )
    setActionLoading(null)

    if (result.success) {
      setGeneratedStory(result.story)
      setInlineEditingChunkIndex(null)
      setInlineEditContent('')
    } else {
      alert(result.error || 'Failed to edit chunk')
    }
  }

  const handleCancelInlineEdit = () => {
    setInlineEditingChunkIndex(null)
    setInlineEditContent('')
  }

  // Handle setting selection
  const handleSettingSelect = (settingId) => {
    if (settingId === 'custom') {
      setSetting('custom')
    } else {
      const selectedSetting = settingOptions.find(s => s.id === settingId)
      setSetting(selectedSetting.name)
      setCreationStep(2)
    }
  }

  // Handle custom setting submission
  const handleCustomSettingSubmit = () => {
    if (customSetting.trim()) {
      setSetting(customSetting.trim())
      setCreationStep(2)
    }
  }

  // Handle character selection
  const handleCharacterSelect = (characterId) => {
    const selectedCharacter = characterOptions.find(c => c.id === characterId)
    setCharacter(selectedCharacter.name)
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
    const result = await storyService.initializeStoryWithQuestions(finalSetting, character, characterName.trim(), model)

    setIsLoading(false)

    if (result.success) {
      setQuestions(result.questions)
      setAnswers(new Array(result.questions.length).fill(''))
      setWizardStoryId(result.storyId)
      setCurrentQuestionIndex(0)
      setQuestionWizardActive(true)
      setIsCreating(false)
    } else {
      setError(result.error)
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

    const result = await storyService.submitAnswers(wizardStoryId, answers, model)

    setIsWeaving(false)

    if (result.success) {
      setGeneratedStory(result.story)
    } else {
      setError(result.error || 'Failed to awaken story')
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
      </div>
    )
  }

  const handleWizardBack = () => {
    if (creationStep > 1) {
      if (creationStep === 2) {
        setSetting('')
        setCustomSetting('')
      }
      if (creationStep === 3) setCharacter('')
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
                      className="btn btn-primary"
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
                <p className="wz-sub">Who will be the hero of your story?</p>

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
                </div>
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
          <button type="button" className="btn btn-ghost btn-md" onClick={handleNewStory} style={{ gap: 7 }}>
            {I.spark} New
          </button>
        </div>

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
                <div className="chapter-card">
                  <div className="chapter-head">
                    <div>
                      <h2>Chapter 1: The Beginning</h2>
                      <div className="upd">Last updated · Just now</div>
                    </div>
                    <div className="chapter-acts">
                      <button
                        type="button"
                        className="cact"
                        title="Regenerate last chunk"
                        onClick={handleRegenerateChunk}
                        disabled={isStoryBusy || !generatedStory?.MainStory?.length}
                      >
                        {I.refresh}
                      </button>
                      <button
                        type="button"
                        className="cact danger"
                        title="Erase last chunk"
                        onClick={handleEraseLastChunk}
                        disabled={isStoryBusy || !generatedStory?.MainStory?.length}
                      >
                        {I.trash}
                      </button>
                    </div>
                  </div>

                  <div className="story-history">
                    {generatedStory?.MainStory?.length > 0 ? (
                      generatedStory.MainStory.map((chunk, idx) => {
                        const isEditing = inlineEditingChunkIndex === chunk.index

                        if (isEditing) {
                          return (
                            <div key={`chunk-edit-${chunk.index}`} className="chunk chunk-edit">
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
                                  onClick={handleSaveInlineChunk}
                                  disabled={actionLoading !== null || !inlineEditContent.trim()}
                                >
                                  {actionLoading === 'editChunk' ? 'Saving…' : 'Save'}
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
                          <div
                            key={`chunk-${chunk.index}`}
                            className="chunk editable"
                            onClick={() => handleInlineEditChunk(chunk.index, chunk.content)}
                            title="Click to edit"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineEditChunk(chunk.index, chunk.content)
                              }
                            }}
                          >
                            {idx > 0 && (
                              <div className="chunk-mark">
                                <span className="ln" />
                                <span className="b">Continued</span>
                                <span className="ln" />
                              </div>
                            )}
                            {renderChunkParagraphs(chunk)}
                          </div>
                        )
                      })
                    ) : (
                      <p>Your story will appear here…</p>
                    )}

                    {clarificationData && !clarificationLoading && (
                      <div className="ai-ask chunk-appear">
                        <div className="ai-ask-head">
                          {I.ai}
                          <span>Decipher needs a detail</span>
                        </div>
                        <p className="ai-ask-q">{clarificationData.text}</p>
                        <div className="ai-ask-field">
                          <input
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
                            className="ai-ask-go"
                            disabled={clarificationLoading || !clarificationAnswer.trim()}
                            onClick={handleSubmitClarification}
                            aria-label="Answer"
                          >
                            {I.up}
                          </button>
                        </div>
                      </div>
                    )}

                    {isStoryBusy && (
                      <div className="gen-row">
                        <span>The story unfolds</span>
                        <span className="dots">
                          <i />
                          <i />
                          <i />
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sc-dock">
                  <div className="sc-input">
                    <span className="lead">Do</span>
                    <textarea
                      ref={actionInputRef}
                      value={userAction}
                      placeholder="What does your character do next?  (optional)"
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
                      className="sc-send"
                      onClick={handleContinueStory}
                      disabled={isStoryBusy}
                      aria-label="Continue"
                    >
                      {I.up}
                    </button>
                  </div>
                  <div className="sc-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-md"
                      onClick={handleContinueStory}
                      disabled={isStoryBusy}
                    >
                      {actionLoading === 'continue' ? 'Weaving…' : 'Continue story'}
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
                  {actionLoading === 'edit' ? 'Editing…' : 'Send'}
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
                    <option>Short (1-2 paragraphs)</option>
                    <option>Medium (3-4 paragraphs)</option>
                    <option>Long (5+ paragraphs)</option>
                  </select>
                  <span className="ch">{I.chev}</span>
                </div>
              </div>
              <div className="ctrl">
                <div className="ctrl-label">Tone</div>
                <div className="sc-select">
                  <select value={tone} onChange={(e) => setTone(e.target.value)}>
                    <option>Mysterious</option>
                    <option>Adventurous</option>
                    <option>Dark</option>
                    <option>Lighthearted</option>
                  </select>
                  <span className="ch">{I.chev}</span>
                </div>
              </div>
              <div className="ctrl">
                <div className="ctrl-label">Model</div>
                <div className="sc-select">
                  <select value={model} onChange={(e) => setModel(e.target.value)}>
                    {availableModels.length > 0 ? (
                      availableModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {(m.label || m.id)
                            + (m.tier ? ` · ${m.tier}` : '')
                            + (m.priceOut != null ? ` ($${m.priceOut}/1M out)` : '')
                            + (m.isDefault ? ' — default' : '')}
                        </option>
                      ))
                    ) : (
                      <option value="google/gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Default)</option>
                    )}
                  </select>
                  <span className="ch">{I.chev}</span>
                </div>
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
    </div>
  )
}

export default StoryCreator
