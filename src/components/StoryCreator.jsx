import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import './StoryCreator.css'
import * as storyService from '../services/storyService'
import { BASE_URL } from '../services/server'
import { readLengthPrefixedFrames } from '../utils/chunkAudioStream.js'
import { splitChunkSegments } from '../utils/splitChunkSegments.js'

/** Curly apostrophes → ASCII so segment strings match story text from the API. */
function normalizeForSegmentMatch(str) {
  return str.replace(/\u2018/g, "'").replace(/\u2019/g, "'")
}

/**
 * @param {string} fullText
 * @param {string[]} segments
 * @returns {{ start: number, end: number, index: number }[] | null}
 */
function buildSegmentRanges(fullText, segments) {
  const text = normalizeForSegmentMatch(fullText)
  let pos = 0
  const ranges = []
  for (let i = 0; i < segments.length; i++) {
    const seg = normalizeForSegmentMatch(segments[i])
    const start = text.indexOf(seg, pos)
    if (start === -1) return null
    ranges.push({ start, end: start + seg.length, index: i })
    pos = start + seg.length
  }
  return ranges
}

/**
 * @param {{ content: string, index: number }} chunk
 * @param {{ mode: string, chunkIndex: number | null, segmentIndex: number | null }} ttsHighlight
 * @param {number | null} playingChunkIndex
 */
function renderChunkWithTtsHighlight(chunk, ttsHighlight, playingChunkIndex) {
  const full = chunk.content
  const segments = splitChunkSegments(full).filter(Boolean)
  const ranges = segments.length > 0 ? buildSegmentRanges(full, segments) : null
  const useSentenceHighlight =
    ttsHighlight.mode === 'sentence' &&
    ttsHighlight.chunkIndex === chunk.index &&
    playingChunkIndex === chunk.index &&
    typeof ttsHighlight.segmentIndex === 'number'

  const paraStrings = full.split(/\n\n/).filter((p) => p.trim())
  let searchFrom = 0

  return paraStrings.map((paraRaw, pi) => {
    const trimmed = paraRaw.trim()
    const pStart = full.indexOf(trimmed, searchFrom)
    if (pStart === -1) {
      return (
        <p key={`para-${chunk.index}-${pi}`} className="story-paragraph editable-paragraph">
          {trimmed}
        </p>
      )
    }
    const pEnd = pStart + trimmed.length
    searchFrom = pEnd

    const children = []
    if (!ranges) {
      children.push(trimmed)
    } else {
      const overlapping = ranges.filter((r) => r.end > pStart && r.start < pEnd)
      let c = pStart
      for (const r of overlapping) {
        if (c < r.start) {
          const gap = full.slice(c, Math.min(r.start, pEnd))
          if (gap) children.push(gap)
          c = Math.min(r.start, pEnd)
        }
        const segStart = Math.max(c, r.start)
        const segEnd = Math.min(pEnd, r.end)
        if (segStart < segEnd) {
          const text = full.slice(segStart, segEnd)
          const active = useSentenceHighlight && r.index === ttsHighlight.segmentIndex
          children.push(
            <span
              key={`${chunk.index}-${pi}-seg-${r.index}-${segStart}`}
              className={`story-tts-segment${active ? ' story-tts-segment--active' : ''}`}
            >
              {text}
            </span>
          )
          c = segEnd
        }
      }
      if (c < pEnd) {
        const tail = full.slice(c, pEnd)
        if (tail) children.push(tail)
      }
    }

    return (
      <p key={`para-${chunk.index}-${pi}`} className="story-paragraph editable-paragraph">
        {children}
      </p>
    )
  })
}

function StoryCreator() {
  const { storyId } = useParams()
  const [activeTab, setActiveTab] = useState('story')
  const [creativityLevel, setCreativityLevel] = useState(80)
  const [storyLength, setStoryLength] = useState('Medium (3-4 paragraphs)')
  const [tone, setTone] = useState('Mysterious')
  const [model, setModel] = useState('qwen2.5-32b-instruct')
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

  // Tab view state
  const [isTabView, setIsTabView] = useState(false) // false = main story page, true = tab cards view

  // Story action states
  const [actionLoading, setActionLoading] = useState(null) // 'regenerate', 'continue', 'edit', or null
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

  // Question wizard states
  const [questionWizardActive, setQuestionWizardActive] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [wizardStoryId, setWizardStoryId] = useState(null)
  const [isWeaving, setIsWeaving] = useState(false)

  // Audio playback state
  const audioRef = useRef(null)
  const audioUrlsRef = useRef({})
  const fetchPromisesRef = useRef({})
  const chunkStreamAbortRef = useRef(null)
  /** Chunk index when a stream session is active — used to abort only that session on clearChunkAudioState */
  const streamTargetChunkRef = useRef(null)
  const [playingChunkIndex, setPlayingChunkIndex] = useState(null)
  const [audioStatus, setAudioStatus] = useState({})
  const [ttsHighlight, setTtsHighlight] = useState({
    mode: 'none',
    chunkIndex: null,
    segmentIndex: null,
  })

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(audioUrlsRef.current).forEach(url => URL.revokeObjectURL(url))
      audioUrlsRef.current = {}
    }
  }, [])

  const clearChunkAudioState = (index) => {
    const wasStreamingThisChunk = streamTargetChunkRef.current === index
    if (wasStreamingThisChunk) {
      chunkStreamAbortRef.current?.abort()
      streamTargetChunkRef.current = null
    }
    if (audioUrlsRef.current[index]) {
      URL.revokeObjectURL(audioUrlsRef.current[index])
      delete audioUrlsRef.current[index]
    }
    delete fetchPromisesRef.current[index]
    setAudioStatus(prev => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    if (wasStreamingThisChunk) {
      setTtsHighlight({ mode: 'none', chunkIndex: null, segmentIndex: null })
      setPlayingChunkIndex(null)
    }
  }

  /**
   * Fetch length-prefixed WAV stream; play each sentence as it arrives, queued on one audio element.
   */
  const startChunkStreamPlayback = (index) => {
    if (!generatedStory?.MainStory || index >= generatedStory.MainStory.length) return
    const audioEl = audioRef.current
    if (!audioEl) return

    chunkStreamAbortRef.current?.abort()
    const ac = new AbortController()
    chunkStreamAbortRef.current = ac
    streamTargetChunkRef.current = index

    const token = localStorage.getItem('token')
    const storyId = generatedStory._id

    setAudioStatus(prev => ({ ...prev, [index]: 'loading' }))
    setTtsHighlight({ mode: 'chunk', chunkIndex: index, segmentIndex: null })

    const queue = []
    let readerDone = false
    let waitingForData = true
    let firstClipStarted = false
    let framesReceived = 0
    let clipIndex = 0
    let useSentenceSync = false

    const teardown = () => {
      if (chunkStreamAbortRef.current === ac) {
        chunkStreamAbortRef.current = null
      }
      if (streamTargetChunkRef.current === index) {
        streamTargetChunkRef.current = null
      }
    }

    const finishPlayback = () => {
      teardown()
      setPlayingChunkIndex(null)
      setTtsHighlight({ mode: 'none', chunkIndex: null, segmentIndex: null })
      setAudioStatus(prev => ({ ...prev, [index]: 'ready' }))
    }

    const playHead = () => {
      if (ac.signal.aborted) return
      if (queue.length > 0) {
        waitingForData = false
        const frame = queue.shift()
        const clipIdx = clipIndex++
        if (useSentenceSync) {
          setTtsHighlight({ mode: 'sentence', chunkIndex: index, segmentIndex: clipIdx })
        }
        const url = URL.createObjectURL(new Blob([frame], { type: 'audio/wav' }))
        audioEl.onended = () => {
          URL.revokeObjectURL(url)
          // Brief gap + wait for decode reduces clipped/mumbled first word on the next clip.
          setTimeout(() => playHead(), 20)
        }
        audioEl.onerror = () => {
          URL.revokeObjectURL(url)
          console.error(
            '[TTS] Chunk audio clip failed to load/decode; stopping playback (clip',
            clipIdx,
            ')'
          )
          setAudioStatus((prev) => ({ ...prev, [index]: 'error' }))
          finishPlayback()
        }
        audioEl.src = url
        const startPlayback = () => {
          audioEl.play().catch((err) => {
            console.error('Playback failed:', err)
            URL.revokeObjectURL(url)
            setAudioStatus(prev => ({ ...prev, [index]: 'error' }))
            finishPlayback()
          })
        }
        if (audioEl.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
          startPlayback()
        } else {
          audioEl.addEventListener('canplay', startPlayback, { once: true })
        }
        if (!firstClipStarted) {
          firstClipStarted = true
          setAudioStatus(prev => ({ ...prev, [index]: 'ready' }))
        }
        return
      }
      if (readerDone) {
        finishPlayback()
      } else {
        waitingForData = true
      }
    }

    const onFrame = (frame) => {
      queue.push(frame)
      framesReceived++
      if (framesReceived >= 2) {
        useSentenceSync = true
        const seg = Math.max(0, clipIndex - 1)
        setTtsHighlight({ mode: 'sentence', chunkIndex: index, segmentIndex: seg })
      }
      if (waitingForData) {
        playHead()
      }
    }

    ;(async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/story/${storyId}/audio/${index}/stream`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              // ngrok free tier returns an HTML warning page without CORS headers unless skipped
              'ngrok-skip-browser-warning': 'true',
            },
            signal: ac.signal,
          }
        )
        if (!res.ok) {
          throw new Error('Audio stream failed')
        }
        const reader = res.body.getReader()
        await readLengthPrefixedFrames(reader, onFrame, ac.signal)
        readerDone = true
        useSentenceSync = framesReceived > 1
        if (!useSentenceSync) {
          setTtsHighlight((prev) =>
            prev.chunkIndex === index ? { mode: 'chunk', chunkIndex: index, segmentIndex: null } : prev
          )
        } else {
          setTtsHighlight((prev) =>
            prev.chunkIndex === index ? { ...prev, mode: 'sentence' } : prev
          )
        }
        playHead()
      } catch (err) {
        if (err?.name === 'AbortError') {
          audioEl.pause()
          teardown()
          setPlayingChunkIndex(null)
          setTtsHighlight({ mode: 'none', chunkIndex: null, segmentIndex: null })
          return
        }
        console.error('Chunk audio stream error:', err)
        setAudioStatus(prev => ({ ...prev, [index]: 'error' }))
        finishPlayback()
      }
    })()
  }

  const togglePlayChunk = async (e, index) => {
    e.stopPropagation() // Prevent opening the chunk inline editor
    if (!generatedStory?.MainStory || index >= generatedStory.MainStory.length) return

    // Stop if clicking the currently playing chunk
    if (playingChunkIndex === index && audioRef.current && !audioRef.current.paused) {
      chunkStreamAbortRef.current?.abort()
      audioRef.current.pause()
      streamTargetChunkRef.current = null
      setPlayingChunkIndex(null)
      setTtsHighlight({ mode: 'none', chunkIndex: null, segmentIndex: null })
      setAudioStatus(prev => ({ ...prev, [index]: 'ready' }))
      return
    }

    setPlayingChunkIndex(index)
    startChunkStreamPlayback(index)
  }

  const handleAudioEnded = () => {
    if (streamTargetChunkRef.current != null) return
    setPlayingChunkIndex(null)
    setTtsHighlight({ mode: 'none', chunkIndex: null, segmentIndex: null })
  }

  const handleAudioError = (e) => {
    console.error('Audio playback error:', e)
    streamTargetChunkRef.current = null
    setPlayingChunkIndex(null)
    setTtsHighlight({ mode: 'none', chunkIndex: null, segmentIndex: null })
  }

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

        // If current model is not in list (and we haven't manually changed it yet from default)
        // ensure we default to the requested 8b model if available, otherwise first one
        // But we initialized state with 'qwen3-vl-8b-instruct', so let's check if it exists
        const defaultModel = 'qwen3-vl-8b-instruct'
        const hasDefault = result.models.some(m => m.id === defaultModel)

        if (!hasDefault && result.models.length > 0) {
          // Fallback to first available if preferred default is missing
          // But only if we are creating a new story (don't override if user selected something else? 
          // actually on mount this runs once, safe to set initial default if needed)
          // matching the user request: "set 8b as default please"
        }
      }
    }

    loadStory()
    loadModels()
  }, [storyId])

  // Predefined settings
  const settingOptions = [
    { id: 'magic', name: 'Land of Magic', icon: '✨' },
    { id: 'medieval', name: 'Medieval Kingdom', icon: '🏰' },
    { id: 'space', name: 'Space Adventure', icon: '🚀' },
    { id: 'fantasy', name: 'Fantasy Realm', icon: '🐉' },
    { id: 'mystery', name: 'Mystery Manor', icon: '🔍' },
    { id: 'custom', name: 'Custom Setting', icon: '✏️' }
  ]

  // Predefined characters
  const characterOptions = [
    { id: 'warrior', name: 'Warrior', icon: '⚔️' },
    { id: 'wizard', name: 'Wizard', icon: '🧙' },
    { id: 'rogue', name: 'Rogue', icon: '🗡️' },
    { id: 'explorer', name: 'Explorer', icon: '🧭' },
    { id: 'hero', name: 'Hero', icon: '🦸' },
    { id: 'Barbarian', name: 'Barbarian', icon: '👤' }
  ]

  const tabs = [
    { id: 'story', label: 'Story', icon: '/script-icon.png' },
    { id: 'character', label: 'Character', icon: '/user-icon.png' },
    { id: 'world', label: 'World', icon: '/worldwide-icon.png' },
    { id: 'creatures', label: 'creatures', icon: '/spaghetti-monster-icon.png' }
  ]

  // Handle tab change - switch to tab cards view
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setIsTabView(true) // Switch to tab cards view
  }


  // Story action handlers
  const handleRegenerateChunk = async () => {
    if (!generatedStory?._id) return

    setActionLoading('regenerate')
    const result = await storyService.regenerateLastChunk(generatedStory._id, model)
    setActionLoading(null)

    if (result.success) {
      if (generatedStory?.MainStory?.length > 0) {
        const lastIdx = generatedStory.MainStory[generatedStory.MainStory.length - 1].index
        clearChunkAudioState(lastIdx)
      }
      setGeneratedStory(result.story)
    } else {
      alert(result.error || 'Failed to regenerate story chunk')
    }
  }

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
      clearChunkAudioState(editingChunkIndex)
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
      clearChunkAudioState(editingChunkIndex)
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
      clearChunkAudioState(inlineEditingChunkIndex)
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

  // Render creation wizard
  if (isCreating) {
    return (
      <div className="story-creator">
        <div className="creation-wizard-overlay">
          <div className="creation-wizard">
            <div className="wizard-header">
              <button className="back-button-wizard" onClick={() => {
                if (creationStep > 1) {
                  setCreationStep(creationStep - 1)
                  if (creationStep === 2) setSetting('')
                  if (creationStep === 3) setCharacter('')
                } else {
                  window.history.back()
                }
              }}>
                <img src="/up-arrow-icon.png" alt="Back" style={{ transform: 'rotate(90deg)' }} />
              </button>
              <h1 className="wizard-title">Create Your Story</h1>
              <div className="wizard-step-indicator">
                <span className={creationStep >= 1 ? 'active' : ''}>1</span>
                <span className={creationStep >= 2 ? 'active' : ''}>2</span>
                <span className={creationStep >= 3 ? 'active' : ''}>3</span>
              </div>
            </div>

            {/* Step 1: Setting Selection */}
            {creationStep === 1 && (
              <div className="wizard-step step-setting">
                <h2 className="step-title">Choose Your Story Setting</h2>
                <p className="step-subtitle">Where will your adventure take place?</p>

                <div className="options-grid">
                  {settingOptions.map((option) => (
                    <button
                      key={option.id}
                      className={`option-card ${setting === option.id ? 'selected' : ''}`}
                      onClick={() => handleSettingSelect(option.id)}
                    >
                      <span className="option-icon">{option.icon}</span>
                      <span className="option-name">{option.name}</span>
                    </button>
                  ))}
                </div>

                {setting === 'custom' && (
                  <div className="custom-input-area">
                    <input
                      type="text"
                      placeholder="Enter your custom setting..."
                      value={customSetting}
                      onChange={(e) => setCustomSetting(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomSettingSubmit()}
                      className="custom-input"
                      autoFocus
                    />
                    <button
                      className="wizard-next-btn"
                      onClick={handleCustomSettingSubmit}
                      disabled={!customSetting.trim()}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Character Selection */}
            {creationStep === 2 && (
              <div className="wizard-step step-character">
                <h2 className="step-title">Choose Your Character</h2>
                <p className="step-subtitle">Who will be the hero of your story?</p>

                <div className="options-grid">
                  {characterOptions.map((option) => (
                    <button
                      key={option.id}
                      className={`option-card ${character === option.name ? 'selected' : ''}`}
                      onClick={() => handleCharacterSelect(option.id)}
                    >
                      <span className="option-icon">{option.icon}</span>
                      <span className="option-name">{option.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Character Name */}
            {creationStep === 3 && (
              <div className="wizard-step step-name">
                <h2 className="step-title">Name Your Character</h2>
                <p className="step-subtitle">Give your {character} a memorable name</p>

                <div className="name-input-area">
                  <input
                    type="text"
                    placeholder="Enter character name..."
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateStory()}
                    className="name-input"
                    autoFocus
                  />

                  {error && <p className="error-message">{error}</p>}

                  <button
                    className="wizard-create-btn"
                    onClick={handleCreateStory}
                    disabled={isLoading || !characterName.trim()}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Creating Your Story...
                      </>
                    ) : (
                      'Create Story'
                    )}
                  </button>

                  <div className="creation-summary">
                    <p><strong>Setting:</strong> {setting === 'custom' ? customSetting : setting}</p>
                    <p><strong>Character:</strong> {character}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Handle back button navigation
  const handleBack = () => {
    if (isTabView) {
      // If in tab view, go back to main story page
      setIsTabView(false)
      setActiveTab('story') // Reset to story tab
    } else {
      // If in main story page, go back to home
      window.history.back()
    }
  }

  return (
    <div className="story-creator">
      {/* Header Section */}
      <div className="story-creator-header">
        <div className="header-content">
          <button className="back-button" onClick={handleBack}>
            <img src="/up-arrow-icon.png" alt="Back" style={{ transform: 'rotate(90deg)' }} />
          </button>

          <div className="story-title-section">
            <h1 className="story-title">
              {isTabView
                ? (generatedStory?.characterName
                  ? `${generatedStory.characterName}'s Adventure - ${activeTab === 'character' ? 'Characters' : activeTab === 'world' ? 'World' : activeTab === 'creatures' ? 'Creatures' : activeTab === 'story' ? 'Story Chapters' : ''}`
                  : `Story Adventure - ${activeTab === 'character' ? 'Characters' : activeTab === 'world' ? 'World' : activeTab === 'creatures' ? 'Creatures' : activeTab === 'story' ? 'Story Chapters' : ''}`)
                : (generatedStory?.characterName
                  ? `${generatedStory.characterName}'s Adventure`
                  : 'Story Adventure')
              }
            </h1>
            <p className="story-subtitle">{generatedStory?.setting}</p>
          </div>

          <button className="save-button" onClick={handleNewStory}>
            <img src="/generate-icon.png" alt="New" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-section">
        <div className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <img src={tab.icon} alt={tab.label} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>



      {/* Main Content Area */}
      <div className="story-content-area">
        <div className="story-editor">
          <div className="chapter-header">
            <div className="chapter-info">
              <h2>
                {isTabView ? (
                  <>
                    {activeTab === 'story' && 'Story Chapters'}
                    {activeTab === 'character' && 'Characters'}
                    {activeTab === 'world' && 'World & Locations'}
                    {activeTab === 'creatures' && 'Creatures'}
                  </>
                ) : (
                  'Chapter 1: The Beginning'
                )}
              </h2>
              <p className="last-updated">Last updated: Just now</p>
            </div>
            <div className="chapter-actions">
              <img src="/editor-action-icons.svg" alt="Editor Actions" className="editor-actions-svg" />
            </div>
          </div>

          {/* Main Story Page (default view) */}
          {!isTabView && (
            <>
              <div className="story-text-area">
                <audio 
                    ref={audioRef} 
                    onEnded={handleAudioEnded} 
                    onError={handleAudioError}
                    style={{ display: 'none' }}
                />
                <div className="story-text scrollable-content">
                  {generatedStory?.MainStory && generatedStory.MainStory.length > 0 ? (
                    // Show all story chunks combined, with paragraph breaks
                    generatedStory.MainStory.map((chunk) => {
                      // Check if this chunk is being edited inline
                      const isEditing = inlineEditingChunkIndex === chunk.index

                      if (isEditing) {
                        // Show editable textarea with save button
                        return (
                          <div key={`chunk-edit-${chunk.index}`} className="inline-edit-container">
                            <textarea
                              className="inline-edit-textarea"
                              value={inlineEditContent}
                              onChange={(e) => setInlineEditContent(e.target.value)}
                              autoFocus
                              rows={Math.max(5, inlineEditContent.split('\n').length + 2)}
                            />
                            <div className="inline-edit-actions">
                              <button
                                className="inline-save-btn"
                                onClick={handleSaveInlineChunk}
                                disabled={actionLoading !== null || !inlineEditContent.trim()}
                              >
                                {actionLoading === 'editChunk' ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                className="inline-cancel-btn"
                                onClick={handleCancelInlineEdit}
                                disabled={actionLoading !== null}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )
                      } else {
                        // Show normal paragraph(s) - clickable to edit
                        return (
                          <div
                            key={`chunk-${chunk.index}`}
                            className={`chunk-display-wrapper${playingChunkIndex === chunk.index ? ' story-audio-playing' : ''}`}
                            onClick={() => handleInlineEditChunk(chunk.index, chunk.content)}
                            title="Click to edit this chunk"
                          >
                            <button 
                              className="chunk-audio-btn" 
                              onClick={(e) => togglePlayChunk(e, chunk.index)}
                              title={playingChunkIndex === chunk.index ? "Stop playing" : "Play chunk"}
                            >
                                {audioStatus[chunk.index] === 'loading'
                                  ? <span className="audio-loading-spinner" />
                                  : playingChunkIndex === chunk.index ? "⏹️" : "🔊"}
                            </button>
                            {renderChunkWithTtsHighlight(chunk, ttsHighlight, playingChunkIndex)}
                          </div>
                        )
                      }
                    })
                  ) : (
                    <p className="story-paragraph">Your story will appear here...</p>
                  )}
                </div>
              </div>

              <div className="story-actions">
                <button
                  className="action-btn"
                  onClick={handleRegenerateChunk}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'regenerate' ? (
                    <>
                      <span className="loading-spinner"></span>
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <h3>Regenerate Last Chunk</h3>
                    </>
                  )}
                </button>

                {/* Player Action Input */}
                <div className="player-action-input-area">
                  <div className="player-action-input-wrapper">
                    <input
                      type="text"
                      className="player-action-input"
                      placeholder="What does your character do next? (Optional)"
                      value={userAction}
                      onChange={(e) => setUserAction(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !actionLoading && handleContinueStory()}
                      disabled={actionLoading !== null}
                    />
                    {userAction && (
                      <button
                        className="player-action-clear"
                        onClick={() => setUserAction('')}
                        disabled={actionLoading !== null}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <button
                  className="action-btn continue-action-btn"
                  onClick={handleContinueStory}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'continue' ? (
                    <>
                      <span className="loading-spinner"></span>
                      <span>Continuing...</span>
                    </>
                  ) : (
                    <>
                      <h3>{userAction.trim() ? '⚡ Act & Continue' : 'Continue Story'}</h3>
                    </>
                  )}
                </button>
              </div>

              {/* Clarification Question Modal */}
              {clarificationData && (
                <div className="clarification-overlay">
                  <div className="clarification-modal" onClick={(e) => e.stopPropagation()}>
                    {clarificationLoading ? (
                      <div className="clarification-loading">
                        <div className="weaving-orb">
                          <div className="weaving-orb-inner"></div>
                          <div className="weaving-ring weaving-ring-1"></div>
                          <div className="weaving-ring weaving-ring-2"></div>
                        </div>
                        <h2 className="clarification-title">Weaving your fate...</h2>
                        <p className="clarification-subtitle">Your answer is shaping the next chapter</p>
                      </div>
                    ) : (
                      <>
                        <div className="clarification-icon">✦</div>
                        <h2 className="clarification-title">The Story Needs You</h2>
                        <p className="clarification-text">{clarificationData.text}</p>
                        <textarea
                          className="clarification-input"
                          placeholder="Speak your decision..."
                          value={clarificationAnswer}
                          onChange={(e) => setClarificationAnswer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && clarificationAnswer.trim()) {
                              e.preventDefault()
                              handleSubmitClarification()
                            }
                          }}
                          rows={3}
                          autoFocus
                        />
                        <div className="clarification-actions">
                          <button
                            className="clarification-dismiss-btn"
                            onClick={() => { setClarificationData(null); setClarificationAnswer(''); }}
                          >Dismiss</button>
                          <button
                            className="clarification-submit-btn"
                            onClick={handleSubmitClarification}
                            disabled={!clarificationAnswer.trim()}
                          >✦ Submit Answer</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Chunk Editor Modal */}
              {showChunkEditor && (
                <div className="chunk-editor-overlay" onClick={() => !editingChunkIndex && setShowChunkEditor(false)}>
                  <div className="chunk-editor-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="chunk-editor-header">
                      <h2>Edit Story Chunks</h2>
                      <button
                        className="close-chunk-editor"
                        onClick={() => {
                          setShowChunkEditor(false)
                          handleCancelChunkEdit()
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {editingChunkIndex === null ? (
                      // Show all chunks list
                      <div className="chunks-list">
                        {generatedStory?.MainStory && generatedStory.MainStory.length > 0 ? (
                          generatedStory.MainStory.map((chunk, index) => (
                            <div key={chunk._id || index} className="chunk-item">
                              <div className="chunk-item-header">
                                <h3>Chunk {chunk.index + 1}</h3>
                                <button
                                  className="edit-chunk-btn"
                                  onClick={() => handleEditChunk(chunk.index, chunk.content)}
                                >
                                  Edit
                                </button>
                              </div>
                              <div className="chunk-preview">
                                {chunk.content.split('\n\n').slice(0, 2).map((para, i) => (
                                  <p key={i}>{para.substring(0, 200)}...</p>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="no-chunks">No chunks available</p>
                        )}
                      </div>
                    ) : (
                      // Show editor for selected chunk
                      <div className="chunk-editor-content">
                        <h3>Editing Chunk {editingChunkIndex + 1}</h3>
                        <textarea
                          className="chunk-edit-textarea"
                          value={chunkEditContent}
                          onChange={(e) => setChunkEditContent(e.target.value)}
                          placeholder="Enter your chunk content here..."
                          rows="15"
                        />
                        <div className="chunk-editor-actions">
                          <button
                            className="action-btn save-chunk-btn"
                            onClick={handleSaveChunk}
                            disabled={actionLoading !== null || !chunkEditContent.trim()}
                          >
                            {actionLoading === 'editChunk' ? 'Saving...' : 'Save Changes'}
                          </button>

                          <button
                            className="action-btn cancel-chunk-btn"
                            onClick={handleCancelChunkEdit}
                            disabled={actionLoading !== null}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tab Cards View (when tab is clicked) */}
          {isTabView && activeTab === 'story' && (
            <div className="tab-content-area">
              {generatedStory?.storyChapters && generatedStory.storyChapters.length > 0 ? (
                <div className="content-cards-grid">
                  {generatedStory.storyChapters.map((chapter, index) => (
                    <div
                      key={chapter._id || index}
                      className="content-card"
                    >
                      <div className="content-card-header">
                        <span className="content-icon">📖</span>
                        <h3>{chapter.title || `Chapter ${chapter.index + 1}`}</h3>
                      </div>
                      <p className="content-description">
                        {chapter.content?.substring(0, 100) || 'No description'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : generatedStory?.MainStory && generatedStory.MainStory.length > 0 ? (
                <div className="content-cards-grid">
                  {generatedStory.MainStory.map((chapter, index) => (
                    <div
                      key={chapter._id || index}
                      className="content-card"
                    >
                      <div className="content-card-header">
                        <span className="content-icon">📖</span>
                        <h3>Chapter {chapter.index + 1}</h3>
                      </div>
                      <p className="content-description">
                        {chapter.content?.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📖</span>
                  <p>No story chapters found yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Character Tab Content */}
          {isTabView && activeTab === 'character' && (
            <div className="tab-content-area">
              {generatedStory?.characters && generatedStory.characters.length > 0 ? (
                <div className="content-cards-grid">
                  {generatedStory.characters.map((char, index) => (
                    <div key={char._id || index} className="content-card">
                      <div className="content-card-header">
                        <span className="content-icon">👤</span>
                        <h3>{char.name}</h3>
                      </div>
                      <p className="content-description">{char.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">👤</span>
                  <p>No characters found in your story yet.</p>
                </div>
              )}
            </div>
          )}

          {/* World Tab Content */}
          {isTabView && activeTab === 'world' && (
            <div className="tab-content-area">
              {generatedStory?.locations && generatedStory.locations.length > 0 ? (
                <div className="content-cards-grid">
                  {generatedStory.locations.map((location, index) => (
                    <div key={location._id || index} className="content-card">
                      <div className="content-card-header">
                        <span className="content-icon">🌍</span>
                        <h3>{location.name}</h3>
                      </div>
                      <p className="content-description">{location.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">🌍</span>
                  <p>No locations found in your story yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Creatures Tab Content */}
          {isTabView && activeTab === 'creatures' && (
            <div className="tab-content-area">
              {generatedStory?.creatures && generatedStory.creatures.length > 0 ? (
                <div className="content-cards-grid">
                  {generatedStory.creatures.map((creature, index) => (
                    <div key={creature._id || index} className="content-card">
                      <div className="content-card-header">
                        <span className="content-icon">🐉</span>
                        <h3>{creature.name}</h3>
                      </div>
                      <p className="content-description">{creature.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">🐉</span>
                  <p>No creatures found in your story yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="story-sidebar">
          {/* AI Assistant */}
          <div className="sidebar-card ai-assistant-card">
            <div className="card-header">
              <img src="/chatbot-icon.png" alt="AI" />
              <h3>AI Assistant</h3>
            </div>
            <div className="ai-input-area">
              <textarea
                placeholder="Guide The AI With Your Creative Direction..."
                rows="3"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                disabled={actionLoading === 'edit'}
              ></textarea>
            </div>
            <div className="ai-buttons">
              <button
                className="send-btn"
                onClick={handleEditParagraph}
                disabled={actionLoading !== null || !aiInstruction.trim()}
              >
                {actionLoading === 'edit' ? 'Editing...' : 'Send'}
              </button>
              <button
                className="clear-btn"
                onClick={handleClearAiInput}
                disabled={actionLoading === 'edit'}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Story Controls */}
          <div className="sidebar-card story-controls-card">
            <div className="card-header">
              <img src="/settings-icon.png" alt="Controls" />
              <h3>Story Controls</h3>
            </div>

            <div className="control-group">
              <label>Creativity Level</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={creativityLevel}
                  onChange={(e) => setCreativityLevel(e.target.value)}
                  className="creativity-slider"
                />
                <div className="slider-labels">
                  <span>Predictable</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>

            <div className="control-group">
              <label>Story Length</label>
              <div className="select-wrapper">
                <select value={storyLength} onChange={(e) => setStoryLength(e.target.value)}>
                  <option>Short (1-2 paragraphs)</option>
                  <option>Medium (3-4 paragraphs)</option>
                  <option>Long (5+ paragraphs)</option>
                </select>
              </div>
            </div>

            <div className="control-group">
              <label>Tone</label>
              <div className="select-wrapper">
                <select value={tone} onChange={(e) => setTone(e.target.value)}>
                  <option>Mysterious</option>
                  <option>Adventurous</option>
                  <option>Dark</option>
                  <option>Lighthearted</option>
                </select>
              </div>
            </div>

            <div className="control-group">
              <label>Model</label>
              <div className="select-wrapper">
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                  {availableModels.length > 0 ? (
                    availableModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="qwen3-vl-8b-instruct">qwen3-vl-8b-instruct (Default)</option>
                      <option value="llama-3.2-3b-instruct">llama-3.2-3b-instruct</option>
                      <option value="qwen2.5-32b-instruct">qwen2.5-32b-instruct</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Story Stats */}
          <div className="sidebar-card story-stats-card">
            <div className="card-header">
              <img src="/reading-book-icon.png" alt="Stats" />
              <h3>Story Stats</h3>
            </div>

            <div className="stats-list">
              <div className="stat-row">
                <span className="stat-label">Words:</span>
                <span className="stat-value">{generatedStory?.storyStats?.totalWords || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Characters:</span>
                <span className="stat-value">{generatedStory?.storyStats?.Characters || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Paragraphs:</span>
                <span className="stat-value">{generatedStory?.storyStats?.paragraphs || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Reading Time:</span>
                <span className="stat-value">{generatedStory?.storyStats?.readingTime || 0} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoryCreator

