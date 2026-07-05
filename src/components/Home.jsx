import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import * as storyService from '../services/storyService'
import * as scenarioService from '../services/scenarioService'

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

/* ─── Intersection observer reveal with directional support ─── */
function useReveal(deps) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = document.querySelectorAll('.home-page .reveal:not(.in)')
    if (!('IntersectionObserver' in window) || reduced) {
      els.forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' })
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/* ─── Scroll progress bar ─── */
function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const el = document.scrollingElement || document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? (el.scrollTop / total) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return progress
}

/* ─── Hero parallax ─── */
function useParallax(ref, speed = 0.35) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !ref.current) return
    let raf
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (!ref.current) return
        const y = window.scrollY * speed
        ref.current.style.transform = `translateY(${y}px)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [ref, speed])
}

/* ─── 3D card tilt on mouse move ─── */
function useTilt(ref) {
  const onMove = useCallback((e) => {
    const card = ref.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = ((e.clientX - left) / width - 0.5) * 2   // -1 → +1
    const y = ((e.clientY - top) / height - 0.5) * -2
    card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${y * 8}deg) translateY(-8px) scale(1.02)`
    card.style.boxShadow = `${-x * 14}px ${-y * 14}px 48px rgba(119,56,203,0.38)`
  }, [ref])
  const onLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = ''
    ref.current.style.boxShadow = ''
  }, [ref])
  return { onMouseMove: onMove, onMouseLeave: onLeave }
}

/* ─── Tilt-enabled story card ─── */
function TiltCard({ className, style, onClick, children }) {
  const ref = useRef(null)
  const tilt = useTilt(ref)
  return (
    <div ref={ref} className={className} style={style} onClick={onClick} {...tilt}>
      {children}
    </div>
  )
}

/* ─── Section header with draw-in underline ─── */
function SectionHead({ icon, title, sub, link }) {
  return (
    <div className="section-header zone-head reveal reveal-up">
      <div>
        <h2 className="section-title zone-title">
          <span className="section-icon">{icon}</span>
          {title}
        </h2>
        <span className="title-underline" aria-hidden="true" />
        {sub && <p className="zone-sub">{sub}</p>}
      </div>
      {link && <a href="#" className="view-all zone-link">{link}</a>}
    </div>
  )
}

/* ─── Floating background orb (pure CSS animation) ─── */
function Orb({ style }) {
  return <div className="bg-orb" style={style} aria-hidden="true" />
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
  const [currentPage, setCurrentPage] = useState(1)
  const [userStories, setUserStories] = useState([])
  const [userScenarios, setUserScenarios] = useState([])
  const [loadingStories, setLoadingStories] = useState(true)
  const [loadingScenarios, setLoadingScenarios] = useState(true)

  const heroParallaxRef = useRef(null)
  const progress = useScrollProgress()
  useParallax(heroParallaxRef, 0.28)

  const storyImages = [
    '/Frame 18588.png',
    '/image 7 (1).png',
    '/image 7.png',
    '/image 9.png',
  ]

  const exploreStories = [
    { id: 1, title: 'Beneath the Obsidian Moon', description: 'A dark romance unfolds in a world cloaked in eternal twilight', author: 'Sarah Chen', genre: 'Mystery', image: storyImages[3] },
    { id: 2, title: 'Whispers of the Crystal City', description: 'A thrilling detective story set in a dystopian future where', author: 'Sarah Chen', genre: 'Adventure', image: storyImages[1] },
    { id: 3, title: 'The Last Starship Captain', description: 'An epic space opera spanning galaxies, following the journey..', author: 'Sarah Chen', genre: 'Fantasy', image: storyImages[2] },
    { id: 4, title: 'Moonlit Enchantment', description: 'Journey into a magical realm filled with elves, dragons, and...', author: 'Sarah Chen', genre: 'Fantasy', image: storyImages[0] },
  ]

  useEffect(() => {
    const fetchUserStories = async () => {
      setLoadingStories(true)
      const result = await storyService.getAllStories()
      if (result.success) setUserStories(result.stories)
      setLoadingStories(false)
    }
    const fetchUserScenarios = async () => {
      setLoadingScenarios(true)
      const result = await scenarioService.getAllScenarios()
      if (result.success) setUserScenarios(result.scenarios)
      setLoadingScenarios(false)
    }
    fetchUserStories()
    fetchUserScenarios()
  }, [])

  useEffect(() => {
    if (featuredPaused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setTimeout(() => {
      setActiveFeatured((prev) => (prev + 1) % FEATURED.length)
    }, FEATURED_DURATION)
    return () => clearTimeout(id)
  }, [activeFeatured, featuredPaused])

  useReveal([loadingStories, loadingScenarios])

  const handlePlayStory = (id) => navigate(`/story-creator/${id}`)
  const handleViewScenario = (id) => navigate(`/scenario-creator/${id}`)

  /* direction helpers for alternating card entrances */
  const revealDir = (i) => (i % 2 === 0 ? 'reveal reveal-left' : 'reveal reveal-right')

  return (
    <div className="home-page">

      {/* ── Scroll progress bar ── */}
      <div className="scroll-progress" style={{ width: `${progress}%` }} />

      {/* ── Floating background orbs ── */}
      <Orb style={{ width: 480, height: 480, top: '12%', left: '55%', animationDelay: '0s', animationDuration: '14s' }} />
      <Orb style={{ width: 320, height: 320, top: '60%', left: '15%', animationDelay: '-5s', animationDuration: '18s' }} />
      <Orb style={{ width: 220, height: 220, top: '38%', left: '80%', animationDelay: '-9s', animationDuration: '11s' }} />

      {/* ── Notification Banner ── */}
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
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="hero-section">
        <div
          className="feat"
          onMouseEnter={() => setFeaturedPaused(true)}
          onMouseLeave={() => setFeaturedPaused(false)}
        >
          {/* parallax image layer */}
          <div className="feat-parallax-wrap" ref={heroParallaxRef}>
            {FEATURED.map((slide, index) => (
              <div className={`feat-slide ${index === activeFeatured ? 'show' : ''}`} key={index}>
                <img src={slide.image} alt={slide.title} />
                <div className="feat-grad" />
              </div>
            ))}
          </div>

          {/* cascading text body */}
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
                <i key={`${index}-${activeFeatured}`} style={{ animationDuration: `${FEATURED_DURATION}ms` }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Previously Played Stories ── */}
      <section className="stories-section zone">
        <SectionHead icon={<PlaySectionIcon />} title="Previously Played Stories" sub="Jump back into your adventures" />
        {loadingStories ? (
          <div className="loading-stories reveal reveal-up">
            <div className="loading-spinner" />
            <p>Loading your stories...</p>
          </div>
        ) : userStories.length > 0 ? (
          <div className="stories-grid">
            {userStories.map((story, index) => (
              <TiltCard
                key={story._id}
                className={`story-card ${revealDir(index)}`}
                style={{ transitionDelay: `${(index % 4) * 90}ms` }}
                onClick={() => handlePlayStory(story._id)}
              >
                <div className="card-content">
                  <img src={storyImages[Math.floor(Math.random() * storyImages.length)]} alt={story.title} className="story-image" />
                  <div className="story-info">
                    <h3>{story.title || (story.characterName ? story.characterName + "'s Adventure" : 'Untitled Story')}</h3>
                    <p>{story.setting || 'Continue your adventure...'}</p>
                    <button className="play-btn">Continue Story</button>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        ) : (
          <div className="empty-stories reveal reveal-up">
            <p>No stories yet. Start creating your first adventure!</p>
            <button className="start-adventure-btn" onClick={() => navigate('/story-creator')}>Create Story</button>
          </div>
        )}
      </section>

      {/* ── My Scenarios ── */}
      <section className="stories-section zone">
        <SectionHead icon={<MapSectionIcon />} title="My Scenarios" sub="Pre-built worlds, ready to play instantly" />
        {loadingScenarios ? (
          <div className="loading-stories reveal reveal-up">
            <div className="loading-spinner" />
            <p>Loading your scenarios...</p>
          </div>
        ) : userScenarios.length > 0 ? (
          <div className="stories-grid">
            {userScenarios.map((scenario, index) => (
              <TiltCard
                key={scenario._id}
                className={`story-card scenario-card ${revealDir(index)}`}
                style={{ transitionDelay: `${(index % 4) * 90}ms` }}
                onClick={() => handleViewScenario(scenario._id)}
              >
                <div className="card-content">
                  <img src={storyImages[Math.floor(Math.random() * storyImages.length)]} alt={scenario.title} className="story-image" />
                  <div className="story-info">
                    <h3>{scenario.title || 'Untitled Scenario'}</h3>
                    <p>{scenario.description || 'Explore this scenario...'}</p>
                    <button className="play-btn">View Scenario</button>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        ) : (
          <div className="empty-stories reveal reveal-up">
            <p>No scenarios yet. Create your first scenario!</p>
            <button className="start-adventure-btn" onClick={() => navigate('/scenario-creator')}>Create Scenario</button>
          </div>
        )}
      </section>

      {/* ── Explore Shared Stories ── */}
      <section className="stories-section explore-section zone">
        <SectionHead icon={<BookSectionIcon />} title="Explore Shared Stories" sub="Stories shared by the community" link="View All" />

        <div className="stories-grid">
          {exploreStories.map((story, index) => (
            <TiltCard
              key={story.id}
              className={`story-card shared-card ${revealDir(index)}`}
              style={{ transitionDelay: `${(index % 4) * 90}ms` }}
            >
              <div className="card-content">
                <img src={story.image} alt={story.title} className="story-image" />
                <div className="story-info">
                  <h3>{story.title}</h3>
                  <p>{story.description}</p>
                  <button className="play-btn">Play Now</button>
                </div>
                <div className="story-meta">
                  <div className="story-author">
                    <div className="author-avatar" />
                    <span>By {story.author}</span>
                  </div>
                  <span className="story-genre">{story.genre}</span>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

        <div className="stories-grid" style={{ marginTop: '70px' }}>
          {exploreStories.map((story, index) => (
            <TiltCard
              key={`second-${story.id}`}
              className={`story-card shared-card ${revealDir(index + 2)}`}
              style={{ transitionDelay: `${(index % 4) * 90}ms` }}
            >
              <div className="card-content">
                <img src={story.image} alt={story.title} className="story-image" />
                <div className="story-info">
                  <h3>{story.title}</h3>
                  <p>{story.description}</p>
                  <button className="play-btn">Play Now</button>
                </div>
                <div className="story-meta">
                  <div className="story-author">
                    <div className="author-avatar" />
                    <span>By {story.author}</span>
                  </div>
                  <span className="story-genre">{story.genre}</span>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

        <div className="pagination reveal reveal-up">
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
