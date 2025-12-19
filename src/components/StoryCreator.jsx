import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './StoryCreator.css'
import * as storyService from '../services/storyService'

function StoryCreator() {
  const { storyId } = useParams()
  const [activeTab, setActiveTab] = useState('story')
  const [creativityLevel, setCreativityLevel] = useState(80)
  const [storyLength, setStoryLength] = useState('Medium (3-4 paragraphs)')
  const [tone, setTone] = useState('Mysterious')
  const [model, setModel] = useState('llama3.2:3b')
  
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
  
  // Manual chunk editing states
  const [showChunkEditor, setShowChunkEditor] = useState(false)
  const [editingChunkIndex, setEditingChunkIndex] = useState(null)
  const [chunkEditContent, setChunkEditContent] = useState('')
  
  // Inline editing states (for clicking on chunks in display)
  const [inlineEditingChunkIndex, setInlineEditingChunkIndex] = useState(null)
  const [inlineEditContent, setInlineEditContent] = useState('')
  
  // Load existing story if storyId is provided
  useEffect(() => {
    const loadStory = async () => {
      if (storyId) {
        setIsLoading(true)
        const result = await storyService.getStoryById(storyId)
        if (result.success) {
          setGeneratedStory(result.story)
          setIsCreating(false)
        } else {
          setError(result.error || 'Failed to load story')
        }
        setIsLoading(false)
      }
    }
    
    loadStory()
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
      setGeneratedStory(result.story)
    } else {
      alert(result.error || 'Failed to regenerate story chunk')
    }
  }
  
  const handleContinueStory = async () => {
    if (!generatedStory?._id) return
    
    setActionLoading('continue')
    const result = await storyService.continueStory(generatedStory._id, model)
    setActionLoading(null)
    
    if (result.success) {
      setGeneratedStory(result.story)
    } else {
      alert(result.error || 'Failed to continue story')
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
  
  // Handle story creation
  const handleCreateStory = async () => {
    if (!characterName.trim()) {
      setError('Please enter a character name')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    const finalSetting = setting === 'custom' ? customSetting : setting
    const result = await storyService.createStory(finalSetting, character, characterName.trim())
    
    setIsLoading(false)
    
    if (result.success) {
      setGeneratedStory(result.story)
      setIsCreating(false)
    } else {
      setError(result.error)
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
                <img src="/up-arrow-icon.png" alt="Back" style={{transform: 'rotate(90deg)'}} />
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
            <img src="/up-arrow-icon.png" alt="Back" style={{transform: 'rotate(90deg)'}} />
          </button>
          
          <div className="story-title-section">
            <h1 className="story-title">
              {isTabView 
                ? `${generatedStory?.characterName}'s Adventure - ${activeTab === 'character' ? 'Characters' : activeTab === 'world' ? 'World' : activeTab === 'creatures' ? 'Creatures' : activeTab === 'story' ? 'Story Chapters' : ''}`
                : `${generatedStory?.characterName}'s Adventure`
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
                <div className="story-text scrollable-content">
                  {generatedStory?.MainStory && generatedStory.MainStory.length > 0 ? (
                    // Show all story chunks combined, with paragraph breaks
                    generatedStory.MainStory.map((chunk, chunkIndex) => {
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
                        const paragraphs = chunk.content.split('\n\n').filter(p => p.trim())
                        return (
                          <div 
                            key={`chunk-${chunk.index}`}
                            className="chunk-display-wrapper"
                            onClick={() => handleInlineEditChunk(chunk.index, chunk.content)}
                            title="Click to edit this chunk"
                          >
                            {paragraphs.map((paragraph, paraIndex) => (
                              <p 
                                key={`${chunkIndex}-${paraIndex}`} 
                                className="story-paragraph editable-paragraph"
                              >
                                {paragraph.trim()}
                              </p>
                            ))}
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
                
                <button 
                  className="action-btn"
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
                      <h3>Continue Story</h3>
                    </>
                  )}
                </button>
              </div>
              
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
                  <option value="llama3.2:3b">llama3.2:3b (Lowest Resource)</option>
                  <option value="qwen3:4b">qwen3:4b</option>
                  <option value="qwen3:8b">qwen3:8b</option>
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

