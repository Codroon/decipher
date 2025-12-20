import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './ScenarioCreator.css'
import * as scenarioService from '../services/scenarioService'
import { createStoryFromScenario } from '../services/storyService'

// Modern SVG Icon Components
const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 5 5 12 12 19"/>
  </svg>
)

const IconSave = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
)

const IconCreate = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

const IconStory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconMap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
)

const IconDragon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
)

const IconEye = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const IconLightbulb = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/>
    <line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
)

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const IconChevronDown = ({ expanded }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="chevron-icon"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const IconPlus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const IconLink = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

function ScenarioCreator() {
  const navigate = useNavigate()
  const { scenarioId } = useParams()
  const isEditMode = !!scenarioId
  
  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [contentRating, setContentRating] = useState('unrated')
  const [opening, setOpening] = useState('')
  const [aiInstructions, setAiInstructions] = useState('')
  const [authorNotes, setAuthorNotes] = useState('')
  
  // Characters, Locations, Creatures
  const [characters, setCharacters] = useState([])
  const [locations, setLocations] = useState([])
  const [creatures, setCreatures] = useState([])
  
  // Modal states
  const [activeModal, setActiveModal] = useState(null) // 'character', 'location', 'creature'
  const [modalData, setModalData] = useState({ name: '', description: '' })
  const [editIndex, setEditIndex] = useState(null)
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingScenario, setIsLoadingScenario] = useState(isEditMode)
  const [isCreatingStory, setIsCreatingStory] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Stories state
  const [scenarioStories, setScenarioStories] = useState([])
  const [loadingStories, setLoadingStories] = useState(false)
  
  // Active section for accordion
  const [activeSection, setActiveSection] = useState('basic')
  
  // Load scenario data if editing
  useEffect(() => {
    const loadScenario = async () => {
      if (scenarioId) {
        setIsLoadingScenario(true)
        const result = await scenarioService.getScenarioById(scenarioId)
        if (result.success) {
          const scenario = result.scenario
          setTitle(scenario.title || '')
          setDescription(scenario.description || '')
          setTags(scenario.tags || [])
          setVisibility(scenario.visibility || 'private')
          setContentRating(scenario.contentRating || 'unrated')
          setOpening(scenario.opening || '')
          setAiInstructions(scenario.AIInstructions || '')
          setAuthorNotes(scenario.authorNotes || '')
          setCharacters(scenario.characters || [])
          setLocations(scenario.locations || [])
          setCreatures(scenario.creatures || [])
        } else {
          setError(result.error || 'Failed to load scenario')
        }
        setIsLoadingScenario(false)
      }
    }
    
    loadScenario()
  }, [scenarioId])

  // Load stories for the scenario
  useEffect(() => {
    const loadStories = async () => {
      if (scenarioId) {
        setLoadingStories(true)
        const result = await scenarioService.getScenarioStories(scenarioId)
        if (result.success) {
          setScenarioStories(result.stories || [])
        }
        setLoadingStories(false)
      }
    }
    
    loadStories()
  }, [scenarioId])

  // Handle tag input
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Handle modal for adding/editing entities
  const openModal = (type, index = null) => {
    setActiveModal(type)
    setEditIndex(index)
    
    if (index !== null) {
      const list = type === 'character' ? characters : type === 'location' ? locations : creatures
      setModalData({ ...list[index] })
    } else {
      setModalData({ name: '', description: '' })
    }
  }

  const closeModal = () => {
    setActiveModal(null)
    setEditIndex(null)
    setModalData({ name: '', description: '' })
  }

  const handleSaveEntity = () => {
    if (!modalData.name.trim()) return
    
    const newEntity = { name: modalData.name.trim(), description: modalData.description.trim() }
    
    if (activeModal === 'character') {
      if (editIndex !== null) {
        const updated = [...characters]
        updated[editIndex] = newEntity
        setCharacters(updated)
      } else {
        setCharacters([...characters, newEntity])
      }
    } else if (activeModal === 'location') {
      if (editIndex !== null) {
        const updated = [...locations]
        updated[editIndex] = newEntity
        setLocations(updated)
      } else {
        setLocations([...locations, newEntity])
      }
    } else if (activeModal === 'creature') {
      if (editIndex !== null) {
        const updated = [...creatures]
        updated[editIndex] = newEntity
        setCreatures(updated)
      } else {
        setCreatures([...creatures, newEntity])
      }
    }
    
    closeModal()
  }

  const handleDeleteEntity = (type, index) => {
    if (type === 'character') {
      setCharacters(characters.filter((_, i) => i !== index))
    } else if (type === 'location') {
      setLocations(locations.filter((_, i) => i !== index))
    } else if (type === 'creature') {
      setCreatures(creatures.filter((_, i) => i !== index))
    }
  }

  // Handle form submission
  const handleSaveScenario = async () => {
    if (!title.trim()) {
      setError('Please enter a scenario title')
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    const scenarioData = {
      title: title.trim(),
      description: description.trim(),
      tags,
      visibility,
      contentRating,
      opening: opening.trim(),
      AIInstructions: aiInstructions.trim(),
      authorNotes: authorNotes.trim(),
      characters,
      locations,
      creatures
    }
    
    let result
    if (isEditMode) {
      // Update existing scenario
      result = await scenarioService.updateScenario(scenarioId, scenarioData)
    } else {
      result = await scenarioService.createScenario(scenarioData)
    }
    
    setIsLoading(false)
    
    if (result.success) {
      setSuccess(isEditMode ? 'Scenario updated successfully!' : 'Scenario created successfully!')
      // Navigate after success
      setTimeout(() => {
        navigate('/home')
      }, 2000)
    } else {
      setError(result.error)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    navigate(-1)
  }

  // Handle create story from scenario
  const handleCreateStory = async () => {
    if (!scenarioId) return
    
    setIsCreatingStory(true)
    setError('')
    setSuccess('')
    
    const result = await createStoryFromScenario(scenarioId)
    
    setIsCreatingStory(false)
    
    if (result.success) {
      setSuccess('Story created successfully! Redirecting...')
      // Navigate to the story creator page with the new story ID
      setTimeout(() => {
        if (result.story && result.story._id) {
          navigate(`/story-creator/${result.story._id}`)
        } else {
          navigate('/home')
        }
      }, 1500)
    } else {
      setError(result.error || 'Failed to create story from scenario')
    }
  }

  // Show loading state when fetching existing scenario
  if (isLoadingScenario) {
    return (
      <div className="scenario-creator">
        <div className="loading-scenario-container">
          <div className="loading-spinner-large"></div>
          <p>Loading scenario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="scenario-creator">
      {/* Header Section */}
      <div className="scenario-creator-header">
        <div className="header-content">
          <button className="back-button" onClick={handleBack}>
            <IconBack />
          </button>
          
          <div className="title-section">
            <h1 className="page-title">{isEditMode ? 'Edit Scenario' : 'Create New Scenario'}</h1>
            <p className="page-subtitle">{isEditMode ? 'Update your scenario details' : 'Design your world, characters, and story foundation'}</p>
          </div>

          <div className="header-actions">
            {isEditMode && (
              <button 
                className="create-story-button" 
                onClick={handleCreateStory}
                disabled={isCreatingStory || isLoading || isLoadingScenario}
              >
                {isCreatingStory ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>Creating Story...</span>
                  </>
                ) : (
                  <>
                    <IconStory />
                    <span>Create Story</span>
                  </>
                )}
              </button>
            )}
            <button 
              className="create-button" 
              onClick={handleSaveScenario}
              disabled={isLoading || isLoadingScenario || isCreatingStory}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  {isEditMode ? <IconSave /> : <IconCreate />}
                  <span>{isEditMode ? 'Update Scenario' : 'Create Scenario'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="message-banner error-banner">
          <IconWarning />
          <span>{error}</span>
          <button onClick={() => setError('')} className="message-close">
            <IconClose />
          </button>
        </div>
      )}
      
      {success && (
        <div className="message-banner success-banner">
          <svg className="message-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="scenario-content">
        {/* Left Panel - Form */}
        <div className="form-panel">
          {/* Basic Info Section */}
          <div className={`form-section ${activeSection === 'basic' ? 'active' : ''}`}>
            <div 
              className="section-header"
              onClick={() => setActiveSection(activeSection === 'basic' ? '' : 'basic')}
            >
              <div className="section-title-group">
                <div className="section-icon-wrapper">
                  <IconInfo />
                </div>
                <h2>Basic Information</h2>
              </div>
              <IconChevronDown expanded={activeSection === 'basic'} />
            </div>
            
            {activeSection === 'basic' && (
              <div className="section-content">
                <div className="form-group">
                  <label>Scenario Title *</label>
                  <input
                    type="text"
                    placeholder="Enter a captivating title for your scenario..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Describe your scenario's world, setting, and premise..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                    rows="4"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group half">
                    <label>Visibility</label>
                    <div className="select-wrapper">
                      <select 
                        value={visibility} 
                        onChange={(e) => setVisibility(e.target.value)}
                        className="form-select"
                      >
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="published">Published</option>
                      </select>
                      <div className="select-icon">
                        {visibility === 'private' ? <IconLock /> : visibility === 'unlisted' ? <IconLink /> : <IconGlobe />}
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group half">
                    <label>Content Rating</label>
                    <select 
                      value={contentRating} 
                      onChange={(e) => setContentRating(e.target.value)}
                      className="form-select"
                    >
                      <option value="unrated">Unrated</option>
                      <option value="everyone">Everyone</option>
                      <option value="teen">Teen</option>
                      <option value="mature">Mature</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Tags</label>
                  <div className="tags-input-container">
                    <div className="tags-list">
                      {tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="tag-remove">
                            <IconClose />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="tag-input-wrapper">
                      <input
                        type="text"
                        placeholder="Add tags (press Enter)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleTagKeyPress}
                        className="tag-input"
                      />
                      <button className="add-tag-btn" onClick={handleAddTag}>
                        <IconPlus />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Story Setup Section */}
          <div className={`form-section ${activeSection === 'story' ? 'active' : ''}`}>
            <div 
              className="section-header"
              onClick={() => setActiveSection(activeSection === 'story' ? '' : 'story')}
            >
              <div className="section-title-group">
                <div className="section-icon-wrapper">
                  <IconStory />
                </div>
                <h2>Story Setup</h2>
              </div>
              <IconChevronDown expanded={activeSection === 'story'} />
            </div>
            
            {activeSection === 'story' && (
              <div className="section-content">
                <div className="form-group">
                  <label>Opening Scene</label>
                  <textarea
                    placeholder="Write the opening scene that sets the stage for your story..."
                    value={opening}
                    onChange={(e) => setOpening(e.target.value)}
                    className="form-textarea large"
                    rows="6"
                  />
                </div>
                
                <div className="form-group">
                  <label>AI Instructions</label>
                  <textarea
                    placeholder="Guide the AI on tone, style, pacing, and themes to maintain throughout the story..."
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    className="form-textarea"
                    rows="4"
                  />
                </div>
                
                <div className="form-group">
                  <label>Author Notes</label>
                  <textarea
                    placeholder="Private notes for yourself about the scenario..."
                    value={authorNotes}
                    onChange={(e) => setAuthorNotes(e.target.value)}
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Characters Section */}
          <div className={`form-section ${activeSection === 'characters' ? 'active' : ''}`}>
            <div 
              className="section-header"
              onClick={() => setActiveSection(activeSection === 'characters' ? '' : 'characters')}
            >
              <div className="section-title-group">
                <div className="section-icon-wrapper">
                  <IconUsers />
                </div>
                <h2>Characters</h2>
                <span className="count-badge">{characters.length}</span>
              </div>
              <IconChevronDown expanded={activeSection === 'characters'} />
            </div>
            
            {activeSection === 'characters' && (
              <div className="section-content">
                <div className="entity-grid">
                  {characters.map((char, index) => (
                    <div key={index} className="entity-card">
                      <div className="entity-avatar">
                        <IconUsers />
                      </div>
                      <div className="entity-info">
                        <h4>{char.name}</h4>
                        <p>{char.description || 'No description'}</p>
                      </div>
                      <div className="entity-actions">
                        <button className="edit-btn" onClick={() => openModal('character', index)}>
                          <IconEdit />
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteEntity('character', index)}>
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="add-entity-btn" onClick={() => openModal('character')}>
                    <div className="add-icon">
                      <IconPlus />
                    </div>
                    <span>Add Character</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Locations Section */}
          <div className={`form-section ${activeSection === 'locations' ? 'active' : ''}`}>
            <div 
              className="section-header"
              onClick={() => setActiveSection(activeSection === 'locations' ? '' : 'locations')}
            >
              <div className="section-title-group">
                <div className="section-icon-wrapper">
                  <IconMap />
                </div>
                <h2>Locations</h2>
                <span className="count-badge">{locations.length}</span>
              </div>
              <IconChevronDown expanded={activeSection === 'locations'} />
            </div>
            
            {activeSection === 'locations' && (
              <div className="section-content">
                <div className="entity-grid">
                  {locations.map((loc, index) => (
                    <div key={index} className="entity-card location-card">
                      <div className="entity-avatar">
                        <IconMap />
                      </div>
                      <div className="entity-info">
                        <h4>{loc.name}</h4>
                        <p>{loc.description || 'No description'}</p>
                      </div>
                      <div className="entity-actions">
                        <button className="edit-btn" onClick={() => openModal('location', index)}>
                          <IconEdit />
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteEntity('location', index)}>
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="add-entity-btn" onClick={() => openModal('location')}>
                    <div className="add-icon">
                      <IconPlus />
                    </div>
                    <span>Add Location</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Creatures Section */}
          <div className={`form-section ${activeSection === 'creatures' ? 'active' : ''}`}>
            <div 
              className="section-header"
              onClick={() => setActiveSection(activeSection === 'creatures' ? '' : 'creatures')}
            >
              <div className="section-title-group">
                <div className="section-icon-wrapper">
                  <IconDragon />
                </div>
                <h2>Creatures</h2>
                <span className="count-badge">{creatures.length}</span>
              </div>
              <IconChevronDown expanded={activeSection === 'creatures'} />
            </div>
            
            {activeSection === 'creatures' && (
              <div className="section-content">
                <div className="entity-grid">
                  {creatures.map((creature, index) => (
                    <div key={index} className="entity-card creature-card">
                      <div className="entity-avatar">
                        <IconDragon />
                      </div>
                      <div className="entity-info">
                        <h4>{creature.name}</h4>
                        <p>{creature.description || 'No description'}</p>
                      </div>
                      <div className="entity-actions">
                        <button className="edit-btn" onClick={() => openModal('creature', index)}>
                          <IconEdit />
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteEntity('creature', index)}>
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="add-entity-btn" onClick={() => openModal('creature')}>
                    <div className="add-icon">
                      <IconPlus />
                    </div>
                    <span>Add Creature</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="preview-panel">
          <div className="preview-card">
            <div className="preview-header">
              <div className="preview-icon-wrapper">
                <IconEye />
              </div>
              <h3>Scenario Preview</h3>
            </div>
            
            <div className="preview-content">
              <div className="preview-title">
                {title || 'Untitled Scenario'}
              </div>
              
              <div className="preview-meta">
                <span className="meta-item">
                  {visibility === 'private' ? <IconLock /> : visibility === 'unlisted' ? <IconLink /> : <IconGlobe />}
                  <span>{visibility.charAt(0).toUpperCase() + visibility.slice(1)}</span>
                </span>
                <span className="meta-item">
                  <span className="rating-dot" data-rating={contentRating}></span>
                  <span>{contentRating.charAt(0).toUpperCase() + contentRating.slice(1)}</span>
                </span>
              </div>
              
              {tags.length > 0 && (
                <div className="preview-tags">
                  {tags.map((tag, i) => (
                    <span key={i} className="preview-tag">{tag}</span>
                  ))}
                </div>
              )}
              
              {description && (
                <div className="preview-description">
                  <p>{description}</p>
                </div>
              )}
              
              <div className="preview-stats">
                <div className="stat-item">
                  <div className="stat-icon-wrapper">
                    <IconUsers />
                  </div>
                  <span className="stat-value">{characters.length}</span>
                  <span className="stat-label">Characters</span>
                </div>
                <div className="stat-item">
                  <div className="stat-icon-wrapper">
                    <IconMap />
                  </div>
                  <span className="stat-value">{locations.length}</span>
                  <span className="stat-label">Locations</span>
                </div>
                <div className="stat-item">
                  <div className="stat-icon-wrapper">
                    <IconDragon />
                  </div>
                  <span className="stat-value">{creatures.length}</span>
                  <span className="stat-label">Creatures</span>
                </div>
              </div>
              
              {opening && (
                <div className="preview-opening">
                  <h4>Opening Scene</h4>
                  <p>{opening.substring(0, 200)}{opening.length > 200 ? '...' : ''}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stories from Scenario */}
          {isEditMode && (
            <div className="stories-card">
              <div className="stories-header">
                <div className="stories-icon-wrapper">
                  <IconStory />
                </div>
                <h3>Stories from This Scenario</h3>
                <span className="stories-count">{scenarioStories.length}</span>
              </div>
              
              {loadingStories ? (
                <div className="stories-loading">
                  <div className="loading-spinner-small"></div>
                  <span>Loading stories...</span>
                </div>
              ) : scenarioStories.length > 0 ? (
                <div className="stories-list">
                  {scenarioStories.map((story) => (
                    <div 
                      key={story._id} 
                      className="story-item"
                      onClick={() => navigate(`/story-creator/${story._id}`)}
                    >
                      <div className="story-item-content">
                        <h4>{story.title || (story.characterName ? `${story.characterName}'s Adventure` : 'Untitled Story')}</h4>
                        <p>{story.setting || 'No setting specified'}</p>
                        {story.storyStats && (
                          <div className="story-item-stats">
                            <span>{story.storyStats.totalWords || 0} words</span>
                            <span>•</span>
                            <span>{story.storyStats.paragraphs || 0} paragraphs</span>
                          </div>
                        )}
                      </div>
                      <div className="story-item-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stories-empty">
                  <p>No stories created from this scenario yet.</p>
                  <p className="stories-empty-hint">Click "Create Story" to start your first story!</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Tips */}
          <div className="tips-card">
            <div className="tips-header">
              <div className="tips-icon-wrapper">
                <IconLightbulb />
              </div>
              <h3>Quick Tips</h3>
            </div>
            <ul className="tips-list">
              <li>Add detailed character descriptions for better AI responses</li>
              <li>Set clear AI instructions to maintain story consistency</li>
              <li>Include unique locations to enrich your world</li>
              <li>Tags help categorize and discover your scenario</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Entity Modal */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="entity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editIndex !== null ? 'Edit' : 'Add'} {activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}
              </h2>
              <button className="close-modal" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  placeholder={`Enter ${activeModal} name...`}
                  value={modalData.name}
                  onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                  className="form-input"
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder={`Describe this ${activeModal}...`}
                  value={modalData.description}
                  onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                  className="form-textarea"
                  rows="4"
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModal}>Cancel</button>
              <button 
                className="save-btn" 
                onClick={handleSaveEntity}
                disabled={!modalData.name.trim()}
              >
                {editIndex !== null ? 'Update' : 'Add'} {activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScenarioCreator
