import { useState } from 'react'
import './ImageStudio.css'

function ImageStudio() {
  const [activeTab, setActiveTab] = useState('creatures')
  const [selectedStyle, setSelectedStyle] = useState('fantasy')
  const [selectedSize, setSelectedSize] = useState('square')
  const [prompt, setPrompt] = useState('')

  const tabs = [
    { id: 'creatures', label: 'creatures', icon: '/spaghetti-monster-icon.png' },
    { id: 'character', label: 'Character', icon: '/user-icon.png' },
    { id: 'location', label: 'Location', icon: '/location-icon.png' },
    { id: 'references', label: 'References', icon: '/references-icon.png' },
    { id: 'library', label: 'Library', icon: '/library-icon.png' }
  ]

  const artStyles = [
    { id: 'fantasy', label: 'Fantasy', image: '/fantasy-art-style.png' },
    { id: 'realistic', label: 'Realistic', image: '/realistic-art-style-52592d.png' },
    { id: 'anime', label: 'Anime', image: '/anime-art-style.png' },
    { id: 'cartoon', label: 'Cartoon', image: '/cartoon-art-style.png' }
  ]

  const imageSizes = [
    { id: 'square', label: 'Square', dimensions: '1024*1024', aspectRatio: '1:1', bg: '/size-square-bg.svg' },
    { id: 'landscape', label: 'Landscape', dimensions: '1536*1024', aspectRatio: '3:2', bg: '/size-landscape-bg.svg' },
    { id: 'portrait', label: 'Portrait', dimensions: '1024*1536', aspectRatio: '2:3', bg: '/size-portrait-bg.svg' }
  ]

  const recentImages = [
    {
      id: 1,
      image: '/recent-image-1-52dd4f.png',
      title: 'Mystical forest with glowing...',
      style: 'fantasy',
      time: 'just now'
    },
    {
      id: 2,
      image: '/recent-image-2.png',
      title: 'Cyberpunk city at night...',
      style: 'realistic',
      time: 'just now'
    },
    {
      id: 3,
      image: '/recent-image-3.png',
      title: 'Ancient dragon with crystal...',
      style: 'fantasy',
      time: 'just now'
    }
  ]

  return (
    <div className="image-studio">
      {/* Header Section */}
      <div className="image-studio-header">
        <div className="header-content">
          <button className="back-button" onClick={() => window.history.back()}>
            <img src="/up-arrow-icon.png" alt="Back" style={{transform: 'rotate(90deg)'}} />
          </button>
          
          <div className="story-title-section">
            <h1 className="story-title">Image Studio</h1>
            <p className="story-subtitle">Create and manage visual assets</p>
          </div>

          <button className="generate-button">
            <img src="/download-icon.png" alt="Generate" />
            <span>generate</span>
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

      {/* Main Content Area */}
      <div className="image-studio-content">
        {/* Left Side - Image Generation */}
        <div className="generation-panel">
          <div className="generation-card">
            <h2 className="section-title">Image Generation</h2>

            {/* Prompt Section */}
            <div className="prompt-section">
              <label>Prompt</label>
              <div className="prompt-input-wrapper">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='describe the image you want to create... e.g.., "A Mystical forest with glowing mushrooms and ancient ruins"'
                  rows="5"
                />
              </div>
              <p className="prompt-hint">Be descriptive for better results</p>
              <button className="enhance-prompt-btn">
                <img src="/enhance-icon.png" alt="Enhance" />
                <span>Enhance Prompt</span>
              </button>
            </div>

            {/* Art Style and Image Size */}
            <div className="generation-controls">
              {/* Art Style */}
              <div className="control-section">
                <label>Art Style</label>
                <div className="art-styles-grid">
                  {artStyles.map((style) => (
                    <button
                      key={style.id}
                      className={`art-style-card ${selectedStyle === style.id ? 'selected' : ''}`}
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      <img src={style.image} alt={style.label} />
                      <span>{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Size */}
              <div className="control-section">
                <label>Image Size</label>
                <div className="image-sizes-grid">
                  {imageSizes.map((size) => (
                    <button
                      key={size.id}
                      className={`image-size-card ${selectedSize === size.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size.id)}
                      style={{backgroundImage: `url(${size.bg})`}}
                    >
                      <div 
                        className="size-preview" 
                        style={{
                          aspectRatio: size.aspectRatio,
                          width: size.id === 'square' ? '50px' : 
                                 size.id === 'landscape' ? '70px' : '50px',
                          height: size.id === 'portrait' ? '70px' : '50px'
                        }}
                      />
                      <div className="size-info">
                        <span className="size-label">{size.label}</span>
                        <span className="size-dimensions">{size.dimensions}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button className="generate-image-btn">
              <img src="/generate-icon.png" alt="Generate" />
              <span>generate Image</span>
            </button>
          </div>
        </div>

        {/* Right Side - Recent Images */}
        <div className="recent-images-panel">
          <div className="recent-images-card">
            <div className="card-header">
              <img src="/chatbot-icon.png" alt="Recent" />
              <h3>Recent Images</h3>
            </div>

            <div className="recent-images-grid">
              {recentImages.map((image) => (
                <div key={image.id} className="recent-image-card">
                  <img src={image.image} alt={image.title} className="recent-image-preview" />
                  <div className="recent-image-info">
                    <h4>{image.title}</h4>
                    <div className="image-meta">
                      <span className="image-style">{image.style}</span>
                      <span className="image-time">{image.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="view-all-btn">View all images</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageStudio

