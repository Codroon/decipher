import React, { useState } from 'react'
import './Settings.css'

function Settings() {
  const [selectedTheme, setSelectedTheme] = useState('dark')
  const [animations, setAnimations] = useState(true)
  const [particles, setParticles] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  const [language, setLanguage] = useState('English')
  const [timezone, setTimezone] = useState('UTC')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYY')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#D1D8FE')

  const themes = [
    { id: 'dark', label: 'Dark', preview: '#000000' },
    { id: 'light', label: 'Light', preview: '#EDEFF2' },
    { id: 'customize', label: 'Customize', preview: customColor }
  ]

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId)
    if (themeId === 'customize') {
      setShowColorPicker(true)
    } else {
      setShowColorPicker(false)
    }
  }

  const handleColorChange = (color) => {
    setCustomColor(color)
  }

  const closeColorPicker = () => {
    setShowColorPicker(false)
  }

  return (
    <div className="settings-page">
      {/* Header Section */}
      <div className="settings-header">
        <div className="header-content">
          <button className="back-button" onClick={() => window.history.back()}>
            <img src="./settings-back-arrow.png" alt="Back" style={{transform: 'rotate(0deg)'}} />
          </button>
          
          <div className="header-text">
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Customize your experience</p>
          </div>

          <div className="header-actions">
            <button className="reset-btn">
              <img src="./reset-icon.png" alt="Reset" />
              <span>Reset</span>
            </button>
            <button className="save-all-btn">
              <img src="./save-icon.png" alt="Save" />
              <span>Save All</span>
            </button>
          </div>
        </div>
      </div>

      {/* General Section Header */}
      <div className="general-section-header">
        <div className="general-content">
          <img src="./settings-icon.png" alt="General" className="general-icon" />
          <h2 className="general-title">General</h2>
        </div>
        <div className="general-divider"></div>
      </div>

      {/* Main Content */}
      <div className="settings-content">
        {/* Appearance Card */}
        <div className="settings-card appearance-card">
          <h3 className="card-title">Appearance</h3>
          
          {/* Theme Selection */}
          <div className="theme-section">
            <label className="section-label">Theme</label>
            <div className="theme-options">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-option ${selectedTheme === theme.id ? 'selected' : ''}`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div 
                    className="theme-preview" 
                    style={{ backgroundColor: theme.preview }}
                  ></div>
                  <span className="theme-label">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Options */}
          <div className="toggle-section">
            <div className="toggle-item">
              <div className="toggle-info">
                <h4 className="toggle-title">Animations</h4>
                <p className="toggle-description">Enable smooth transitions and effects</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="animations"
                  checked={animations}
                  onChange={(e) => setAnimations(e.target.checked)}
                />
                <label htmlFor="animations" className="toggle-label">
                  <img src="./toggle-on.png" alt="Toggle" className="toggle-icon" />
                </label>
              </div>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <h4 className="toggle-title">Particles</h4>
                <p className="toggle-description">Show floating particles in background</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="particles"
                  checked={particles}
                  onChange={(e) => setParticles(e.target.checked)}
                />
                <label htmlFor="particles" className="toggle-label">
                  <img src="./toggle-on.png" alt="Toggle" className="toggle-icon" />
                </label>
              </div>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <h4 className="toggle-title">Sound Effects</h4>
                <p className="toggle-description">Play audio feedback for interactions</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="sound-effects"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                />
                <label htmlFor="sound-effects" className="toggle-label">
                  <img src="./toggle-on.png" alt="Toggle" className="toggle-icon" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Language & Region Card */}
        <div className="settings-card language-card">
          <h3 className="card-title">Language & Region</h3>
          
          <div className="dropdown-section">
            <div className="dropdown-item">
              <label className="dropdown-label">Language</label>
              <div className="dropdown-field">
                <span className="dropdown-value">{language}</span>
                <img src="./dropdown-arrow.png" alt="Dropdown" className="dropdown-arrow" />
              </div>
            </div>

            <div className="dropdown-item">
              <label className="dropdown-label">Time zone</label>
              <div className="dropdown-field">
                <span className="dropdown-value">{timezone}</span>
                <img src="./dropdown-arrow.png" alt="Dropdown" className="dropdown-arrow" />
              </div>
            </div>

            <div className="dropdown-item">
              <label className="dropdown-label">Date Format</label>
              <div className="dropdown-field">
                <span className="dropdown-value">{dateFormat}</span>
                <img src="./dropdown-arrow.png" alt="Dropdown" className="dropdown-arrow" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Picker Popup */}
      {showColorPicker && (
        <div className="color-picker-overlay" onClick={closeColorPicker}>
          <div className="color-picker-popup" onClick={(e) => e.stopPropagation()}>
            <div className="color-picker-header">
              <h3 className="color-picker-title">Choose Custom Color</h3>
              <button className="close-color-picker" onClick={closeColorPicker}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="color-picker-content">
              <div className="color-preview-section">
                <div className="current-color-preview" style={{ backgroundColor: customColor }}></div>
                <span className="current-color-text">Current: {customColor}</span>
              </div>
              
              <div className="color-input-section">
                <label className="color-input-label">Hex Color Code:</label>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="color-input"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="color-text-input"
                  placeholder="#D1D8FE"
                />
              </div>
              
              <div className="preset-colors">
                <h4 className="preset-colors-title">Quick Colors:</h4>
                <div className="preset-colors-grid">
                  {[
                    '#D1D8FE', '#7738CB', '#4D70FF', '#FF6B6B', '#4ECDC4', 
                    '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
                    '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
                  ].map((color) => (
                    <button
                      key={color}
                      className="preset-color-btn"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                    ></button>
                  ))}
                </div>
              </div>
              
              <div className="color-picker-actions">
                <button className="cancel-color-btn" onClick={closeColorPicker}>
                  Cancel
                </button>
                <button className="apply-color-btn" onClick={closeColorPicker}>
                  Apply Color
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
