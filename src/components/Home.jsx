import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import * as storyService from '../services/storyService'

function Home() {
  const navigate = useNavigate()
  const [showBanner, setShowBanner] = useState(true)
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(2)
  const [currentPage, setCurrentPage] = useState(1)
  const [userStories, setUserStories] = useState([])
  const [loadingStories, setLoadingStories] = useState(true)

  // Sample story data for explore section
  const storyImages = [
    "/Frame 18588.png",
    "/image 7 (1).png",
    "/image 7.png",
    "/image 9.png"
  ]

  const exploreStories = [
    {
      id: 1,
      title: "Beneath the Obsidian Moon",
      description: "A dark romance unfolds in a world cloaked in eternal twilight",
      author: "Sarah Chen",
      genre: "Mystery",
      image: storyImages[3] // image 9.png
    },
    {
      id: 2,
      title: "Whispers of the Crystal City",
      description: "A thrilling detective story set in a dystopian future where",
      author: "Sarah Chen",
      genre: "Adventure",
      image: storyImages[1] // image 7 (1).png
    },
    {
      id: 3,
      title: "The Last Starship Captain",
      description: "An epic space opera spanning galaxies, following the journey..",
      author: "Sarah Chen",
      genre: "Fantasy",
      image: storyImages[2] // image 7.png
    },
    {
      id: 4,
      title: "Moonlit Enchantment",
      description: "Journey into a magical realm filled with elves, dragons, and...",
      author: "Sarah Chen",
      genre: "Fantasy",
      image: storyImages[0] // Frame 18588.png
    }
  ]
  
  // Fetch user's stories on component mount
  useEffect(() => {
    const fetchUserStories = async () => {
      setLoadingStories(true)
      const result = await storyService.getAllStories()
      if (result.success) {
        setUserStories(result.stories)
      } else {
        console.error('Failed to fetch stories:', result.error)
      }
      setLoadingStories(false)
    }
    
    fetchUserStories()
  }, [])

  const carouselImages = [
    "/ai_storytelling_platform_balanced 1.png",
    "/Group 7.png",
    "/ai_storytelling_platform_balanced 5.png",
    "/ai_storytelling_platform_balanced 1.png",
    "/Group 7.png"
  ]

  const handleCarouselPrev = () => {
    setCurrentCarouselIndex((prev) => (prev > 0 ? prev - 1 : carouselImages.length - 1))
  }

  const handleCarouselNext = () => {
    setCurrentCarouselIndex((prev) => (prev < carouselImages.length - 1 ? prev + 1 : 0))
  }
  
  const handlePlayStory = (storyId) => {
    navigate(`/story-creator/${storyId}`)
  }

  return (
    <div className="home-page">
      {/* Notification Banner */}
      {showBanner && (
        <div className="notification-banner">
          <div className="banner-content">
            <div className="banner-message">
              <svg className="star-icon" width="30" height="30" viewBox="0 0 24 24" fill="gold">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>New AI Models Available! Enhanced story generation and image creation tools now live.</span>
            </div>
            <button className="close-banner" onClick={() => setShowBanner(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Create, <span className="highlight-purple">Explore</span> And Live
            <br />
            Infinite Stories With <span className="highlight-purple">AI</span>
          </h1>
          <button className="start-adventure-btn">Start Adventure</button>
        </div>

        {/* Image Carousel */}
        <div className="image-carousel">
          <button className="carousel-arrow carousel-left" onClick={handleCarouselPrev}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <div className="carousel-track">
            {carouselImages.map((image, index) => {
              const position = index - currentCarouselIndex
              let className = 'carousel-item'
              
              if (position === 0) className += ' active'
              else if (position === -1) className += ' prev-1'
              else if (position === -2) className += ' prev'
              else if (position === 1) className += ' next-1'
              else if (position === 2) className += ' next'
              // Handle wrap-around
              else if (position === carouselImages.length - 1) className += ' prev'
              else if (position === carouselImages.length - 2) className += ' prev-1'
              else if (position === -(carouselImages.length - 1)) className += ' next'
              else if (position === -(carouselImages.length - 2)) className += ' next-1'
              else className += ' hidden'

              return (
                <div key={index} className={className}>
                  <img src={image} alt={`Story ${index + 1}`} />
                </div>
              )
            })}
          </div>

          <button className="carousel-arrow carousel-right" onClick={handleCarouselNext}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Previously Played Stories */}
      <section className="stories-section">
        <h2 className="section-title">Previously Played Stories</h2>
        {loadingStories ? (
          <div className="loading-stories">
            <div className="loading-spinner"></div>
            <p>Loading your stories...</p>
          </div>
        ) : userStories.length > 0 ? (
          <div className="stories-grid">
            {userStories.map((story) => (
              <div key={story._id} className="story-card" onClick={() => handlePlayStory(story._id)}>
                <div className="card-overlay"></div>
                <div className="card-content">
                  <img src={storyImages[Math.floor(Math.random() * storyImages.length)]} alt={story.title} className="story-image" />
                  <div className="story-info">
                    <h3>{story.title}</h3>
                    <p>{story.description || 'Continue your adventure...'}</p>
                    <button className="play-btn">Continue Story</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-stories">
            <p>No stories yet. Start creating your first adventure!</p>
            <button className="start-adventure-btn" onClick={() => navigate('/story-creator')}>
              Create Story
            </button>
          </div>
        )}
      </section>

      {/* Explore Shared Stories */}
      <section className="stories-section explore-section">
        <div className="section-header">
          <h2 className="section-title">Explore Shared Stories</h2>
          <a href="#" className="view-all">View All</a>
        </div>
        
        <div className="stories-grid">
          {exploreStories.map((story) => (
            <div key={story.id} className="story-card shared-card">
              <div className="card-overlay"></div>
              <div className="card-content">
                <img src={story.image} alt={story.title} className="story-image" />
                <div className="story-info">
                  <h3>{story.title}</h3>
                  <p>{story.description}</p>
                  <button className="play-btn">Play Now</button>
                </div>
                <div className="story-meta">
                  <div className="story-author">
                    <div className="author-avatar"></div>
                    <span>By {story.author}</span>
                  </div>
                  <span className="story-genre">{story.genre}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="stories-grid" style={{ marginTop: '70px' }}>
          {exploreStories.map((story) => (
            <div key={`second-${story.id}`} className="story-card shared-card">
              <div className="card-overlay"></div>
              <div className="card-content">
                <img src={story.image} alt={story.title} className="story-image" />
                <div className="story-info">
                  <h3>{story.title}</h3>
                  <p>{story.description}</p>
                  <button className="play-btn">Play Now</button>
                </div>
                <div className="story-meta">
                  <div className="story-author">
                    <div className="author-avatar"></div>
                    <span>By {story.author}</span>
                  </div>
                  <span className="story-genre">{story.genre}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination">
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={`page-dot ${currentPage === page ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home

