import { useState } from 'react'
import './StoryCreator.css'

function StoryCreator() {
  const [activeTab, setActiveTab] = useState('story')
  const [creativityLevel, setCreativityLevel] = useState(80)
  const [storyLength, setStoryLength] = useState('Medium (3-4 paragraphs)')
  const [tone, setTone] = useState('Mysterious')

  const tabs = [
    { id: 'story', label: 'Story', icon: './script-icon.png' },
    { id: 'character', label: 'Character', icon: './user-icon.png' },
    { id: 'world', label: 'World', icon: './worldwide-icon.png' },
    { id: 'creatures', label: 'creatures', icon: './spaghetti-monster-icon.png' }
  ]

  const actionButtons = [
    'Introduce Character',
    'Create Conflict',
    'Describe Scene',
    'Add Dialogue'
  ]

  const choices = [
    {
      title: 'Elara Bows Respectfully',
      description: 'Shows Deference To The Guardian And Request An Audience'
    },
    {
      title: 'Elara Speaks Confidently',
      description: 'Address The Guardian As An Equal And State Her Purpose'
    },
    {
      title: 'Elara Observes Silently',
      description: 'Wait For The Guardian To Speak First Time And Gather Information'
    },
    {
      title: 'Custom Action',
      description: 'Write Your Own Story Direction'
    }
  ]

  return (
    <div className="story-creator">
      {/* Header Section */}
      <div className="story-creator-header">
        <div className="header-content">
                  <button className="back-button" onClick={() => window.history.back()}>
                    <img src="./up-arrow-icon.png" alt="Back" style={{transform: 'rotate(90deg)'}} />
                  </button>
          
          <div className="story-title-section">
            <h1 className="story-title">The Crystal Kingdom</h1>
            <p className="story-subtitle">Fantasy Adventure</p>
          </div>

          <button className="save-button">
            <img src="./download-icon.png" alt="Save" />
            <span>Save</span>
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
              onClick={() => setActiveTab(tab.id)}
            >
              <img src={tab.icon} alt={tab.label} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons-row">
        {actionButtons.map((action, index) => (
          <button key={index} className="action-btn">
            {action}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="story-content-area">
        <div className="story-editor">
          <div className="chapter-header">
            <div className="chapter-info">
              <h2>Chapter 1: The Beginning</h2>
              <p className="last-updated">Last updated: Just now</p>
            </div>
            <div className="chapter-actions">
              <img src="./editor-action-icons.svg" alt="Editor Actions" className="editor-actions-svg" />
            </div>
          </div>

          <div className="story-text-area">
            <div className="story-text">
              The ancient crystals hummed with an otherworldly energy as Elara approached the floating islands. Each step she took on the crystalline bridge sent ripples of light through the translucent structure, creating a mesmerizing display of colors that danced across the surface. Behind her, the mainland of Eldora grew smaller, shrouded in the mystical mists that perpetually surrounded the kingdom. Ahead lay the Crystal Kingdom, a realm where magic flowed as freely as water and the laws of physics bent to the will of ancient sorcerers.
            </div>
            
            <div className="scrollbar-indicator">
              <img src="./scroll-indicator.svg" alt="Scroll" className="scroll-indicator-svg" />
            </div>
          </div>

          <div className="story-choices">
            {choices.map((choice, index) => (
              <button key={index} className="choice-card">
                <h3>{choice.title}</h3>
                <p>{choice.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="story-sidebar">
          {/* AI Assistant */}
          <div className="sidebar-card ai-assistant-card">
            <div className="card-header">
              <img src="./chatbot-icon.png" alt="AI" />
              <h3>AI Assistant</h3>
            </div>
            <div className="ai-input-area">
              <textarea 
                placeholder="Guide The AI With Your Creative Direction..."
                rows="3"
              ></textarea>
            </div>
            <div className="ai-buttons">
              <button className="send-btn">Send</button>
              <button className="clear-btn">Clear</button>
            </div>
          </div>

          {/* Story Controls */}
          <div className="sidebar-card story-controls-card">
            <div className="card-header">
              <img src="./settings-icon.png" alt="Controls" />
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
          </div>

          {/* Story Stats */}
          <div className="sidebar-card story-stats-card">
            <div className="card-header">
              <img src="./reading-book-icon.png" alt="Stats" />
              <h3>Story Stats</h3>
            </div>
            
            <div className="stats-list">
              <div className="stat-row">
                <span className="stat-label">Words:</span>
                <span className="stat-value">1</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Characters:</span>
                <span className="stat-value">2,113</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Paragraphs:</span>
                <span className="stat-value">1</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Reading Time:</span>
                <span className="stat-value">1 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoryCreator

