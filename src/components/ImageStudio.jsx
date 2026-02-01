import { useState, useEffect } from 'react'
import { apiPost, apiGet, API_ENDPOINTS, BASE_URL } from '../services/server'
import './ImageStudio.css'

function ImageStudio() {
  const [activeTab, setActiveTab] = useState('creatures')
  const [selectedStyle, setSelectedStyle] = useState('fantasy')
  const [selectedSize, setSelectedSize] = useState('square')
  const [selectedModel, setSelectedModel] = useState('dreamshaper')
  const [prompt, setPrompt] = useState('')
  const [recentImages, setRecentImages] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null) // State for modal

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const data = await apiGet(API_ENDPOINTS.IMAGES.GET_ALL, true)
      if (Array.isArray(data)) {
        setRecentImages(data)
      }
    } catch (error) {
      console.error("Failed to fetch images:", error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt) return

    setIsGenerating(true)
    setGeneratedImage(null)

    try {
      // Determine dimensions based on selected size
      let width = 1024, height = 1024
      if (selectedSize === 'landscape') { width = 1536; height = 1024 }
      if (selectedSize === 'portrait') { width = 1024; height = 1536 }

      const payload = {
        prompt,
        artStyle: selectedStyle,
        model: selectedModel,
        width,
        height
      }

      const response = await apiPost(API_ENDPOINTS.IMAGES.GENERATE, payload, true)

      if (response && response.image) {
        setGeneratedImage(response.image)
        // Add to recent images immediately
        setRecentImages(prev => [response.image, ...prev])
      }
    } catch (error) {
      console.error("Failed to generate image:", error)
      alert("Failed to generate image. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper to open modal
  const openPreview = (imgUrl) => {
    setPreviewImage(imgUrl)
    document.body.style.overflow = 'hidden' // Prevent background scrolling
  }

  // Helper to close modal
  const closePreview = () => {
    setPreviewImage(null)
    document.body.style.overflow = 'auto'
  }

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

  const models = [
    { id: 'pony', label: 'Pony Diffusion', icon: '🐴' },
    { id: 'juggernaut', label: 'Juggernaut XL', icon: '⚡' },
    { id: 'dreamshaper', label: 'DreamShaper Lightning', icon: '✨' }
  ]

  // Helper to format time relative
  const formatTime = (dateString) => {
    if (!dateString) return 'unknown date'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'just now'

    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return date.toLocaleDateString()
  }

  // Fallback image handler
  const handleImageError = (e) => {
    e.target.style.display = 'none'; // Hide broken image or replace src
    // e.target.src = '/placeholder.png'; // If we had a placeholder
  }

  return (
    <div className="image-studio">
      {/* Header Section */}
      <div className="image-studio-header">
        <div className="header-content">
          <button className="back-button" onClick={() => window.history.back()}>
            <img src="/up-arrow-icon.png" alt="Back" style={{ transform: 'rotate(90deg)' }} />
          </button>

          <div className="story-title-section">
            <h1 className="story-title">Image Studio</h1>
            <p className="story-subtitle">Create and manage visual assets</p>
          </div>

          <button className="generate-button" onClick={handleGenerate} disabled={isGenerating}>
            <img src="/download-icon.png" alt="Generate" />
            <span>{isGenerating ? 'Generating...' : 'generate'}</span>
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

              {/* Model */}
              <div className="control-section">
                <label>Model</label>
                <div className="models-grid">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      className={`model-card ${selectedModel === model.id ? 'selected' : ''}`}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      <span className="model-icon">{model.icon}</span>
                      <span className="model-label">{model.label}</span>
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
                      style={{ backgroundImage: `url(${size.bg})` }}
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

              {/* Generated Result Display */}
              {generatedImage && (
                <div className="control-section" style={{ marginTop: '20px' }}>
                  <label>Generated Result</label>
                  <div className="generated-image-preview" onClick={() => openPreview(`${BASE_URL}${generatedImage.image}`)} style={{ cursor: 'pointer' }}>
                    <img
                      src={`${BASE_URL}${generatedImage.image}`}
                      alt="Generated Result"
                      className="generated-result-img"
                      onError={handleImageError}
                    />
                    <div className="zoom-hint">Click to enlarge</div>
                  </div>
                </div>
              )}

            </div>

            {/* Generate Button */}
            <button className="generate-image-btn" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <div className="loader" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #FFF',
                  borderBottomColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              ) : (
                <img src="/generate-icon.png" alt="Generate" />
              )}
              <span>{isGenerating ? 'Generating...' : 'generate Image'}</span>
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
              {recentImages.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '12px' }}>No images yet</p>
              ) : (
                recentImages.map((image) => (
                  <div key={image._id} className="recent-image-card" onClick={() => openPreview(`${BASE_URL}${image.image}`)}>
                    <img
                      src={`${BASE_URL}${image.image}`}
                      alt={image.prompt}
                      className="recent-image-preview"
                      onError={handleImageError}
                    />
                    <div className="recent-image-info">
                      <h4 title={image.prompt}>{image.prompt}</h4>
                      <div className="image-meta">
                        <span className="image-style">{image.artStyle}</span>
                        <span className="image-time">{formatTime(image.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {recentImages.length > 0 && (
              <button className="view-all-btn">View all images</button>
            )}

          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {previewImage && (
        <div className="image-viewer-overlay" onClick={closePreview}>
          <button className="close-viewer-btn" onClick={closePreview}>&times;</button>
          <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Full Preview" onError={handleImageError} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ImageStudio
