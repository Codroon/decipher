import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import * as storyService from '../services/storyService'
import * as scenarioService from '../services/scenarioService'

/* ─── Icons ─── */
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

/* ─────────────────────────────────────────────────────────────
   Section-level scroll reveal
   Each <section> with class "scroll-section" starts invisible.
   The IntersectionObserver adds "revealed" once the section
   is 15% into the viewport, which triggers the CSS animation.
   Children (header, grid, cards) then stagger in via CSS delays.
───────────────────────────────────────────────────────────── */
function useSectionReveal(deps) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const sections = document.querySelectorAll('.home-page .scroll-section:not(.revealed)')
    if (!sections.length) return

    if (reduced) {
      sections.forEach((s) => s.classList.add('revealed'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            io.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px',
      }
    )

    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/* ─── Scroll progress bar ─── */
function useScrollProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const update = () => {
      const el = document.scrollingElement || document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setPct(total > 0 ? (el.scrollTop / total) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return pct
}

/* ─── Hero parallax ─── */
function useParallax(ref, speed = 0.28) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !ref.current) return
    let raf
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (ref.current) ref.current.style.transform = `translateY(${window.scrollY * speed}px)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [ref, speed])
}

/* ─── 3-D tilt card ─── */
function TiltCard({ className, style, onClick, children }) {
  const ref = useRef(null)

  const onMove = useCallback((e) => {
    const card = ref.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = ((e.clientX - left) / width - 0.5) * 2
    const y = ((e.clientY - top) / height - 0.5) * -2
    card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${y * 8}deg) translateY(-8px) scale(1.02)`
    card.style.boxShadow = `${-x * 14}px ${-y * 14}px 48px rgba(119,56,203,0.38)`
  }, [])

  const onLeave = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = ''
    ref.current.style.boxShadow = ''
  }, [])

  return (
    <div ref={ref} className={className} style={style} onClick={onClick}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}

/* ─── Section header ─── */
function SectionHead({ icon, title, sub, link }) {
  return (
    <div className="section-header zone-head">
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

  useEffect(() => {
    const fetchStories = async () => {
      setLoadingStories(true)
      const result = await storyService.getAllStories()
      if (result.success) setUserStories(result.stories)
      setLoadingStories(false)
    }
    const fetchScenarios = async () => {
      setLoadingScenarios(true)
      const result = await scenarioService.getAllScenarios()
      if (result.success) setUserScenarios(result.scenarios)
      setLoadingScenarios(false)
    }
    fetchStories()
    fetchScenarios()
  }, [])

  useEffect(() => {
    if (featuredPaused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setTimeout(() => setActiveFeatured((p) => (p + 1) % FEATURED.length), FEATURED_DURATION)
    return () => clearTimeout(id)
  }, [activeFeatured, featuredPaused])

  /* Re-run observer after dynamic content loads */
  useSectionReveal([loadingStories, loadingScenarios])

  return (
    <div className="home-page">

      {/* Scroll progress bar */}
      <div className="scroll-progress" style={{ width: `${progress}%` }} />

      {/* Ambient background orbs */}
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />

      {/* Notification Banner */}
      {showBanner && (
        <div className="notification-banner">
          <div className="banner-content">
            <div className="banner-message">
              <svg className="star-icon" width="20" height="20" viewBox="0 0 24 24" fill="gold">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>New AI Models Available! Enhanced story generation and image creation tools now live.</span>
            </div>
            <button className="close-banner" onClick={() => setShowBanner(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── HERO (always visible on load) ── */}
      <div className="hero-section">
        <div
          className="feat"
          onMouseEnter={() => setFeaturedPaused(true)}
          onMouseLeave={() => setFeaturedPaused(false)}
        >
          <div className="feat-parallax-wrap" ref={heroParallaxRef}>
            {FEATURED.map((slide, i) => (
              <div className={`feat-slide ${i === activeFeatured ? 'show' : ''}`} key={i}>
                <img src={slide.image} alt={slide.title} />
                <div className="feat-grad" />
              </div>
            ))}
          </div>

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
            {FEATURED.map((_, i) => (
              <button
                key={i}
                className={`feat-dot ${i === activeFeatured ? 'active' : ''} ${featuredPaused ? 'paused' : ''}`}
                onClick={() => setActiveFeatured(i)}
                aria-label={`Slide ${i + 1}`}
              >
                <i key={`${i}-${activeFeatured}`} style={{ animationDuration: `${FEATURED_DURATION}ms` }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Previously Played Stories ── */}
      <section className="stories-section scroll-section">
        <SectionHead icon={<PlaySectionIcon />} title="Previously Played Stories" sub="Jump back into your adventures" />

        {loadingStories ? (
          <div className="loading-stories">
            <div className="loading-spinner" />
            <p>Loading your stories...</p>
          </div>
        ) : userStories.length > 0 ? (
          <div className="stories-grid">
            {userStories.map((story, i) => (
              <TiltCard
                key={story._id}
                className="story-card card-item"
                style={{ '--card-i': i }}
                onClick={() => navigate(`/story-creator/${story._id}`)}
              >
                <div className="card-content">
                  <img src={storyImages[i % storyImages.length]} alt={story.title} className="story-image" />
                  <div className="story-info">
                    <h3>{story.title || (story.characterName ? `${story.characterName}'s Adventure` : 'Untitled Story')}</h3>
                    <p>{story.setting || 'Continue your adventure...'}</p>
                    <button className="play-btn">Continue Story</button>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        ) : (
          <div className="empty-stories card-item" style={{ '--card-i': 0 }}>
            <p>No stories yet. Start creating your first adventure!</p>
            <button className="start-adventure-btn" onClick={() => navigate('/story-creator')}>Create Story</button>
          </div>
        )}
      </section>

      {/* ── SECTION 2: My Scenarios ── */}
      <section className="stories-section scroll-section">
        <SectionHead icon={<MapSectionIcon />} title="My Scenarios" sub="Pre-built worlds, ready to play instantly" />

        {loadingScenarios ? (
          <div className="loading-stories">
            <div className="loading-spinner" />
            <p>Loading your scenarios...</p>
          </div>
        ) : userScenarios.length > 0 ? (
          <div className="stories-grid">
            {userScenarios.map((scenario, i) => (
              <TiltCard
                key={scenario._id}
                className="story-card scenario-card card-item"
                style={{ '--card-i': i }}
                onClick={() => navigate(`/scenario-creator/${scenario._id}`)}
              >
                <div className="card-content">
                  <img src={storyImages[i % storyImages.length]} alt={scenario.title} className="story-image" />
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
          <div className="empty-stories card-item" style={{ '--card-i': 0 }}>
            <p>No scenarios yet. Create your first scenario!</p>
            <button className="start-adventure-btn" onClick={() => navigate('/scenario-creator')}>Create Scenario</button>
          </div>
        )}
      </section>

      {/* ── SECTION 3: Explore Shared Stories ── */}
      <section className="stories-section explore-section scroll-section">
        <SectionHead icon={<BookSectionIcon />} title="Explore Shared Stories" sub="Stories shared by the community" link="View All" />

        <div className="stories-grid">
          {exploreStories.map((story, i) => (
            <TiltCard
              key={story.id}
              className="story-card shared-card card-item"
              style={{ '--card-i': i }}
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

        <div className="stories-grid" style={{ marginTop: 64 }}>
          {exploreStories.map((story, i) => (
            <TiltCard
              key={`b-${story.id}`}
              className="story-card shared-card card-item"
              style={{ '--card-i': i + 4 }}
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
