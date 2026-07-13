import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import * as storyService from '../services/storyService'
import * as scenarioService from '../services/scenarioService'
import * as publicService from '../services/publicService'
import ReportModal from './ReportModal'

const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 5-2 6-1.5 1.5-2 3-2 4a4 4 0 0 0 8 0c0-1.2-.5-2.3-1-3 2 1 3 3 3 5a6 6 0 0 1-12 0c0-4 3-6 4-8 1-1.6 2-2.8 2-4z"/></svg>
)

const PlaySectionIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
)

const MapSectionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>
)

const BookSectionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
)

const PlayIcon = PlaySectionIcon

function SectionHead({ icon, title, sub, link }) {
  return (
    <div className="section-header zone-head">
      <div>
        <h2 className="section-title zone-title">
          <span className="section-icon">{icon}</span>
          {title}
        </h2>
        {sub && <p className="zone-sub">{sub}</p>}
      </div>
      {link && <a href="#" className="view-all zone-link">{link}</a>}
    </div>
  )
}

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
  const [userStories, setUserStories] = useState([])
  const [userScenarios, setUserScenarios] = useState([])
  const [loadingStories, setLoadingStories] = useState(true)
  const [loadingScenarios, setLoadingScenarios] = useState(true)

  // Community (public) discovery
  const [publicStories, setPublicStories] = useState([])
  const [publicScenarios, setPublicScenarios] = useState([])
  const [loadingPublicStories, setLoadingPublicStories] = useState(true)
  const [loadingPublicScenarios, setLoadingPublicScenarios] = useState(true)

  // Content-report dialog: { resourceType, resourceId, title } | null
  const [report, setReport] = useState(null)

  // Decorative fallback covers (public content has no cover image of its own yet)
  const storyImages = [
    "/Frame 18588.png",
    "/image 7 (1).png",
    "/image 7.png",
    "/image 9.png"
  ]
  const coverFor = (id = '', i = 0) => {
    const key = String(id)
    let sum = i
    for (let c = 0; c < key.length; c++) sum += key.charCodeAt(c)
    return storyImages[sum % storyImages.length]
  }

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

    const fetchPublicStories = async () => {
      setLoadingPublicStories(true)
      const result = await publicService.listPublicStories({ limit: 8 })
      if (result.success) setPublicStories(result.stories || [])
      else console.error('Failed to fetch public stories:', result.error)
      setLoadingPublicStories(false)
    }

    const fetchPublicScenarios = async () => {
      setLoadingPublicScenarios(true)
      const result = await publicService.listPublicScenarios({ limit: 8 })
      if (result.success) setPublicScenarios(result.scenarios || [])
      else console.error('Failed to fetch public scenarios:', result.error)
      setLoadingPublicScenarios(false)
    }

    fetchUserStories()
    fetchUserScenarios()
    fetchPublicStories()
    fetchPublicScenarios()
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

  const openPublicStory = (id) => navigate(`/discover/story/${id}`)
  const openPublicScenario = (id) => navigate(`/discover/scenario/${id}`)

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
      <div className="home-hero">
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
      <section className="stories-section zone">
        <SectionHead
          icon={<PlaySectionIcon />}
          title="Previously Played Stories"
          sub="Jump back into your adventures"
        />
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
      <section className="stories-section zone">
        <SectionHead
          icon={<MapSectionIcon />}
          title="My Scenarios"
          sub="Pre-built worlds, ready to play instantly"
        />
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

      {/* Explore Shared Scenarios — public, playable worlds from the community */}
      <section className="stories-section explore-section zone">
        <SectionHead
          icon={<MapSectionIcon />}
          title="Explore Shared Scenarios"
          sub="Community-built worlds you can play instantly"
        />
        {loadingPublicScenarios ? (
          <div className="loading-stories">
            <div className="loading-spinner"></div>
            <p>Loading shared scenarios...</p>
          </div>
        ) : publicScenarios.length > 0 ? (
          <div className="stories-grid">
            {publicScenarios.map((s, i) => (
              <div key={s._id} className="story-card shared-card" onClick={() => openPublicScenario(s._id)}>
                <div className="card-overlay"></div>
                <div className="card-content">
                  <img src={coverFor(s._id, i)} alt={s.title} className="story-image" />
                  <button
                    className="report-flag"
                    title="Report this scenario"
                    onClick={(e) => { e.stopPropagation(); setReport({ resourceType: 'scenario', resourceId: s._id, title: s.title }) }}
                  >⚑</button>
                  <div className="story-info">
                    <h3>{s.title || 'Untitled Scenario'}</h3>
                    <p>{s.description || 'Explore this scenario...'}</p>
                    <button className="play-btn">Play Scenario</button>
                  </div>
                  <div className="story-meta">
                    <div className="story-author">
                      <div className="author-avatar"></div>
                      <span>By {s.author?.name || 'Unknown'}</span>
                    </div>
                    {s.tags?.[0] && <span className="story-genre">{s.tags[0]}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-stories">
            <p>No shared scenarios yet. Publish one to see it here!</p>
          </div>
        )}
      </section>

      {/* Explore Shared Stories — public, read-only stories from the community */}
      <section className="stories-section explore-section zone">
        <SectionHead
          icon={<BookSectionIcon />}
          title="Explore Shared Stories"
          sub="Stories shared by the community"
        />
        {loadingPublicStories ? (
          <div className="loading-stories">
            <div className="loading-spinner"></div>
            <p>Loading shared stories...</p>
          </div>
        ) : publicStories.length > 0 ? (
          <div className="stories-grid">
            {publicStories.map((story, i) => (
              <div key={story._id} className="story-card shared-card" onClick={() => openPublicStory(story._id)}>
                <div className="card-overlay"></div>
                <div className="card-content">
                  <img src={coverFor(story._id, i)} alt={story.title} className="story-image" />
                  <button
                    className="report-flag"
                    title="Report this story"
                    onClick={(e) => { e.stopPropagation(); setReport({ resourceType: 'story', resourceId: story._id, title: story.title }) }}
                  >⚑</button>
                  <div className="story-info">
                    <h3>{story.title || 'Untitled Story'}</h3>
                    <p>{story.excerpt ? `${story.excerpt}…` : 'Read this shared story...'}</p>
                    <button className="play-btn">Read Story</button>
                  </div>
                  <div className="story-meta">
                    <div className="story-author">
                      <div className="author-avatar"></div>
                      <span>By {story.author?.name || 'Unknown'}</span>
                    </div>
                    {story.storyStats?.readingTime ? (
                      <span className="story-genre">{story.storyStats.readingTime} min</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-stories">
            <p>No shared stories yet. Publish one to see it here!</p>
          </div>
        )}
      </section>

      {report && (
        <ReportModal
          resourceType={report.resourceType}
          resourceId={report.resourceId}
          title={report.title}
          onClose={() => setReport(null)}
        />
      )}
    </div>
  )
}

export default Home

