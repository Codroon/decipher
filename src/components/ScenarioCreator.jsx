import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './ScenarioCreator.css'
import * as scenarioService from '../services/scenarioService'

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
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
            <img src="/up-arrow-icon.png" alt="Back" style={{transform: 'rotate(90deg)'}} />
          </button>
          
          <div className="title-section">
            <h1 className="page-title">{isEditMode ? 'Edit Scenario' : 'Create New Scenario'}</h1>
            <p className="page-subtitle">{isEditMode ? 'Update your scenario details' : 'Design your world, characters, and story foundation'}</p>
          </div>

          <button 
            className="create-button" 
            onClick={handleSaveScenario}
            disabled={isLoading || isLoadingScenario}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <span className="create-icon">{isEditMode ? '💾' : '✨'}</span>
                <span>{isEditMode ? 'Update Scenario' : 'Create Scenario'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="message-banner error-banner">
          <span className="message-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {success && (
        <div className="message-banner success-banner">
          <svg className="message-icon" width="20" height="20" viewBox="0 0 24 24" fill="gold">
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
                <span className="section-icon">📋</span>
                <h2>Basic Information</h2>
              </div>
              <span className={`expand-icon ${activeSection === 'basic' ? 'expanded' : ''}`}>▼</span>
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
                    <select 
                      value={visibility} 
                      onChange={(e) => setVisibility(e.target.value)}
                      className="form-select"
                    >
                      <option value="private">🔒 Private</option>
                      <option value="unlisted">🔗 Unlisted</option>
                      <option value="published">🌍 Published</option>
                    </select>
                  </div>
                  
                  <div className="form-group half">
                    <label>Content Rating</label>
                    <select 
                      value={contentRating} 
                      onChange={(e) => setContentRating(e.target.value)}
                      className="form-select"
                    >
                      <option value="unrated">⚪ Unrated</option>
                      <option value="everyone">🟢 Everyone</option>
                      <option value="teen">🟡 Teen</option>
                      <option value="mature">🔴 Mature</option>
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
                          <button onClick={() => handleRemoveTag(tag)}>×</button>
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
                      <button className="add-tag-btn" onClick={handleAddTag}>+</button>
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
                <span className="section-icon">📖</span>
                <h2>Story Setup</h2>
              </div>
              <span className={`expand-icon ${activeSection === 'story' ? 'expanded' : ''}`}>▼</span>
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
                <span className="section-icon">👥</span>
                <h2>Characters</h2>
                <span className="count-badge">{characters.length}</span>
              </div>
              <span className={`expand-icon ${activeSection === 'characters' ? 'expanded' : ''}`}>▼</span>
            </div>
            
            {activeSection === 'characters' && (
              <div className="section-content">
                <div className="entity-grid">
                  {characters.map((char, index) => (
                    <div key={index} className="entity-card">
                      <div className="entity-avatar">👤</div>
                      <div className="entity-info">
                        <h4>{char.name}</h4>
                        <p>{char.description || 'No description'}</p>
                      </div>
                      <div className="entity-actions">
                        <button className="edit-btn" onClick={() => openModal('character', index)}>✏️</button>
                        <button className="delete-btn" onClick={() => handleDeleteEntity('character', index)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  <button className="add-entity-btn" onClick={() => openModal('character')}>
                    <span className="add-icon">+</span>
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
                <span className="section-icon">🗺️</span>
                <h2>Locations</h2>
                <span className="count-badge">{locations.length}</span>
              </div>
              <span className={`expand-icon ${activeSection === 'locations' ? 'expanded' : ''}`}>▼</span>
            </div>
            
            {activeSection === 'locations' && (
              <div className="section-content">
                <div className="entity-grid">
                  {locations.map((loc, index) => (
                    <div key={index} className="entity-card location-card">
                      <div className="entity-avatar">📍</div>
                      <div className="entity-info">
                        <h4>{loc.name}</h4>
                        <p>{loc.description || 'No description'}</p>
                      </div>
                      <div className="entity-actions">
                        <button className="edit-btn" onClick={() => openModal('location', index)}>✏️</button>
                        <button className="delete-btn" onClick={() => handleDeleteEntity('location', index)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  <button className="add-entity-btn" onClick={() => openModal('location')}>
                    <span className="add-icon">+</span>
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
                <span className="section-icon">🐉</span>
                <h2>Creatures</h2>
                <span className="count-badge">{creatures.length}</span>
              </div>
              <span className={`expand-icon ${activeSection === 'creatures' ? 'expanded' : ''}`}>▼</span>
            </div>
            
            {activeSection === 'creatures' && (
              <div className="section-content">
                <div className="entity-grid">
                  {creatures.map((creature, index) => (
                    <div key={index} className="entity-card creature-card">
                      <div className="entity-avatar">🦎</div>
                      <div className="entity-info">
                        <h4>{creature.name}</h4>
                        <p>{creature.description || 'No description'}</p>
                      </div>
                      <div className="entity-actions">
                        <button className="edit-btn" onClick={() => openModal('creature', index)}>✏️</button>
                        <button className="delete-btn" onClick={() => handleDeleteEntity('creature', index)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  <button className="add-entity-btn" onClick={() => openModal('creature')}>
                    <span className="add-icon">+</span>
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
              <span className="preview-icon">👁️</span>
              <h3>Scenario Preview</h3>
            </div>
            
            <div className="preview-content">
              <div className="preview-title">
                {title || 'Untitled Scenario'}
              </div>
              
              <div className="preview-meta">
                <span className="meta-item">
                  {visibility === 'private' ? '🔒' : visibility === 'unlisted' ? '🔗' : '🌍'}
                  {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                </span>
                <span className="meta-item">
                  {contentRating === 'everyone' ? '🟢' : contentRating === 'teen' ? '🟡' : contentRating === 'mature' ? '🔴' : '⚪'}
                  {contentRating.charAt(0).toUpperCase() + contentRating.slice(1)}
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
                  <span className="stat-icon">👥</span>
                  <span className="stat-value">{characters.length}</span>
                  <span className="stat-label">Characters</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🗺️</span>
                  <span className="stat-value">{locations.length}</span>
                  <span className="stat-label">Locations</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🐉</span>
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

          {/* Quick Tips */}
          <div className="tips-card">
            <div className="tips-header">
              <span className="tips-icon">💡</span>
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
              <button className="close-modal" onClick={closeModal}>×</button>
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

