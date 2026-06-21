import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import * as storyService from '../services/storyService'
import * as scenarioService from '../services/scenarioService'

const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 5-2 6-1.5 1.5-2 3-2 4a4 4 0 0 0 8 0c0-1.2-.5-2.3-1-3 2 1 3 3 3 5a6 6 0 0 1-12 0c0-4 3-6 4-8 1-1.6 2-2.8 2-4z"/></svg>
)

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
)

const FEATURED = [
  {
    image: '/fantasy-art-style.png',
    rank: 'Trending #1',
    title: 'Beneath the Obsidian Moon',
    tags: ['Dark Fantasy', 'Romance'],
    desc: 'A forbidden romance unfolds in a kingdom cloaked in eternal twilight. Your choices decide who survives the night.',
  },
  {
    image: '/recent-image-3.png',
    rank: 'Trending #2',
    title: 'The Crystalsong Wyrm',
    tags: ['High Fantasy', 'Adventure'],
    desc: 'Descend into the singing caverns where an ancient dragon guards a power that could remake the world — or end it.',
  },
  {
    image: '/Group 7.png',
    rank: 'Trending #3',
    title: 'Gates of Eldenvale',
    tags: ['Fantasy', 'Mystery'],
    desc: 'The golden city has stood for a thousand years. Tonight its gates open for you — and nothing is as it seems.',
  },
]

const FEATURED_DURATION = 6000

function Home() {
  const navigate = useNavigate()
  const [showBanner, setShowBanner] = useState(true)
  const [activeFeatured, setActiveFeatured] = useState(0)
  const [featuredPaused, setFeaturedPaused] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [userStories, setUserStories] = useState([])
  const [userScenarios, setUserScenarios] = useState([])
  const [loadingStories, setLoadingStories] = useState(true)
  const [loadingScenarios, setLoadingScenarios] = useState(true)

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
  
  // Fetch user's stories and scenarios on component mount
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
    
    const fetchUserScenarios = async () => {
      setLoadingScenarios(true)
      const result = await scenarioService.getAllScenarios()
      if (result.success) {
        setUserScenarios(result.scenarios)
      } else {
        console.error('Failed to fetch scenarios:', result.error)
      }
      setLoadingScenarios(false)
    }
    
    fetchUserStories()
    fetchUserScenarios()
  }, [])

  // Auto-advance the featured hero carousel (pauses on hover / reduced motion)
  useEffect(() => {
    if (featuredPaused) return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setTimeout(() => {
      setActiveFeatured((prev) => (prev + 1) % FEATURED.length)
    }, FEATURED_DURATION)
    return () => clearTimeout(id)
  }, [activeFeatured, featuredPaused])

  const handlePlayStory = (storyId) => {
    navigate(`/story-creator/${storyId}`)
  }

  const handleViewScenario = (scenarioId) => {
    navigate(`/scenario-creator/${scenarioId}`)
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

      {/* Hero Section — cinematic featured carousel */}
      <div className="hero-section">
        <div
          className="feat"
          onMouseEnter={() => setFeaturedPaused(true)}
          onMouseLeave={() => setFeaturedPaused(false)}
        >
          {FEATURED.map((slide, index) => (
            <div className={`feat-slide ${index === activeFeatured ? 'show' : ''}`} key={index}>
              <img src={slide.image} alt={slide.title} />
              <div className="feat-grad"></div>
            </div>
          ))}

          <div className="feat-body" key={activeFeatured}>
            <span className="feat-badge"><FlameIcon /> {FEATURED[activeFeatured].rank}</span>
            <div className="feat-meta">
              {FEATURED[activeFeatured].tags.map((tag) => (
                <span className="feat-tag" key={tag}>{tag}</span>
              ))}
            </div>
            <h1 className="feat-title">{FEATURED[activeFeatured].title}</h1>
            <p className="feat-desc">{FEATURED[activeFeatured].desc}</p>
            <div className="feat-cta">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/story-creator')}>
                <PlayIcon /> Start Adventure
              </button>
              <button className="btn btn-ghost btn-lg">Details</button>
            </div>
          </div>

          <div className="feat-dots">
            {FEATURED.map((_, index) => (
              <button
                className={`feat-dot ${index === activeFeatured ? 'active' : ''} ${featuredPaused ? 'paused' : ''}`}
                key={index}
                onClick={() => setActiveFeatured(index)}
                aria-label={`Slide ${index + 1}`}
              >
                <i key={`${index}-${activeFeatured}`} style={{ animationDuration: `${FEATURED_DURATION}ms` }}></i>
              </button>
            ))}
          </div>
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
                  <img src={storyImages[Math.floor(Math.random() * storyImages.length)]} alt={story.title || story.characterName + "'s Adventure"} className="story-image" />
                  <div className="story-info">
                    <h3>{story.title || (story.characterName ? story.characterName + "'s Adventure" : 'Untitled Story')}</h3>
                    <p>{story.setting || 'Continue your adventure...'}</p>
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

      {/* My Scenarios */}
      <section className="stories-section">
        <h2 className="section-title">My Scenarios</h2>
        {loadingScenarios ? (
          <div className="loading-stories">
            <div className="loading-spinner"></div>
            <p>Loading your scenarios...</p>
          </div>
        ) : userScenarios.length > 0 ? (
          <div className="stories-grid">
            {userScenarios.map((scenario) => (
              <div key={scenario._id} className="story-card scenario-card" onClick={() => handleViewScenario(scenario._id)}>
                <div className="card-overlay"></div>
                <div className="card-content">
                  <img src={storyImages[Math.floor(Math.random() * storyImages.length)]} alt={scenario.title} className="story-image" />
                  <div className="story-info">
                    <h3>{scenario.title || 'Untitled Scenario'}</h3>
                    <p>{scenario.description || 'Explore this scenario...'}</p>
                    <button className="play-btn">View Scenario</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-stories">
            <p>No scenarios yet. Create your first scenario!</p>
            <button className="start-adventure-btn" onClick={() => navigate('/scenario-creator')}>
              Create Scenario
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

