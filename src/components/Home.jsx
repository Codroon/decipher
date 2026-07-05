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

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/* ─────────────────────────────────────────────────────────────
   Single rAF-driven scroll subscription. Multiple features read
   from one throttled loop so we never stack scroll listeners.
───────────────────────────────────────────────────────────── */
function useRafScroll(onFrame) {
  useEffect(() => {
    let raf = 0
    let ticking = false
    const run = () => {
      onFrame(window.scrollY || window.pageYOffset || 0)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        raf = requestAnimationFrame(run)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    run()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [onFrame])
}

/* ─────────────────────────────────────────────────────────────
   Section reveal (blur-to-focus + rise). Adds `.revealed` when a
   section enters the viewport; children stagger via CSS.
───────────────────────────────────────────────────────────── */
function useSectionReveal(deps) {
  useEffect(() => {
    const sections = document.querySelectorAll('.home-page .scroll-section:not(.revealed)')
    if (!sections.length) return
    if (prefersReduced() || !('IntersectionObserver' in window)) {
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
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/* ─────────────────────────────────────────────────────────────
   Kinetic split-text. Words rise from a mask with blur removal.
   mode="auto"   → animates on mount (used in hero, re-keyed/slide)
   mode="scroll" → animates when an ancestor gets `.revealed`
───────────────────────────────────────────────────────────── */
function SplitText({ text, className = '', mode = 'scroll', tag: Tag = 'span' }) {
  const words = String(text).split(' ')
  return (
    <Tag className={`split split--${mode} ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <span className="w-outer" key={`${w}-${i}`} aria-hidden="true">
          <span className="w-inner" style={{ '--wi': i }}>{w}</span>
        </span>
      ))}
    </Tag>
  )
}

/* ─── 3-D tilt card (pointer-reactive) ─── */
function TiltCard({ className, style, onClick, children }) {
  const ref = useRef(null)

  const onMove = useCallback((e) => {
    const card = ref.current
    if (!card || prefersReduced()) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = ((e.clientX - left) / width - 0.5) * 2
    const y = ((e.clientY - top) / height - 0.5) * -2
    card.style.setProperty('--rx', `${y * 7}deg`)
    card.style.setProperty('--ry', `${x * 7}deg`)
    card.style.setProperty('--gx', `${((e.clientX - left) / width) * 100}%`)
    card.style.setProperty('--gy', `${((e.clientY - top) / height) * 100}%`)
    card.classList.add('tilting')
  }, [])

  const onLeave = useCallback(() => {
    const card = ref.current
    if (!card) return
    card.style.setProperty('--rx', '0deg')
    card.style.setProperty('--ry', '0deg')
    card.classList.remove('tilting')
  }, [])

  return (
    <div ref={ref} className={className} style={style} onClick={onClick}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}

/* ─── Section header with kinetic title + draw-in underline ─── */
function SectionHead({ icon, title, sub, link }) {
  return (
    <div className="section-header zone-head">
      <div className="section-head-inner">
        <h2 className="section-title zone-title">
          <span className="section-icon">{icon}</span>
          <SplitText text={title} mode="scroll" />
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

/* Right-rail section navigator */
const NAV_SECTIONS = [
  { id: 'hero', label: 'Featured' },
  { id: 'played', label: 'Your Stories' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'explore', label: 'Explore' },
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
  const [activeNav, setActiveNav] = useState('hero')

  const homeRef = useRef(null)
  const progressRef = useRef(null)
  const heroStageRef = useRef(null)
  const heroZoomRef = useRef(null)
  const heroBgRef = useRef(null)
  const spotRef = useRef(null)

  /* ── Unified scroll frame: progress bar, hero zoom-through, parallax ── */
  const onFrame = useCallback((y) => {
    const doc = document.documentElement
    const total = doc.scrollHeight - doc.clientHeight
    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${total > 0 ? clamp(y / total, 0, 1) : 0})`
    }

    if (prefersReduced()) return

    const stage = heroStageRef.current
    const zoom = heroZoomRef.current
    if (stage && zoom) {
      const dist = Math.max(stage.offsetHeight - window.innerHeight, 1)
      const p = clamp((y - stage.offsetTop) / dist, 0, 1)
      const scale = 1 + p * 0.22
      const fade = p < 0.35 ? 1 : clamp(1 - (p - 0.35) / 0.5, 0, 1)
      zoom.style.transform = `translateY(${p * -46}px) scale(${scale})`
      zoom.style.opacity = fade
      if (heroBgRef.current) {
        heroBgRef.current.style.transform = `translateY(${p * 70}px) scale(${1.06 + p * 0.06})`
      }
    }
  }, [])

  useRafScroll(onFrame)

  /* ── Cursor spotlight (ambient light following the pointer) ── */
  useEffect(() => {
    if (prefersReduced()) return
    const el = homeRef.current
    const spot = spotRef.current
    if (!el || !spot) return
    let raf = 0
    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 3
    let cx = tx
    let cy = ty
    const onMove = (e) => { tx = e.clientX; ty = e.clientY }
    const loop = () => {
      cx += (tx - cx) * 0.12
      cy += (ty - cy) * 0.12
      spot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(loop)
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [])

  /* ── Data ── */
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

  /* ── Featured carousel autoplay ── */
  useEffect(() => {
    if (featuredPaused || prefersReduced()) return
    const id = setTimeout(() => setActiveFeatured((p) => (p + 1) % FEATURED.length), FEATURED_DURATION)
    return () => clearTimeout(id)
  }, [activeFeatured, featuredPaused])

  useSectionReveal([loadingStories, loadingScenarios])

  /* ── Active section tracking for the dot navigator ── */
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const ids = NAV_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean)
    if (!ids.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveNav(entry.target.id)
        })
      },
      // Thin detection line at viewport middle → whichever section
      // crosses the centre becomes active (robust for tall sections).
      { threshold: 0, rootMargin: '-45% 0px -45% 0px' }
    )
    ids.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [loadingStories, loadingScenarios])

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    const navbar = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 72
    const top = el.getBoundingClientRect().top + window.scrollY - navbar - 8
    window.scrollTo({ top, behavior: prefersReduced() ? 'auto' : 'smooth' })
  }

  const feat = FEATURED[activeFeatured]

  return (
    <div className="home-page" ref={homeRef}>

      {/* Ambient cursor spotlight */}
      <div className="cursor-spot" ref={spotRef} aria-hidden="true" />

      {/* Scroll progress bar */}
      <div className="scroll-progress" ref={progressRef} aria-hidden="true" />

      {/* Ambient background orbs (parallax depth) */}
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />

      {/* Right-rail magnetic dot navigator */}
      <nav className="dot-nav" aria-label="Sections">
        {NAV_SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`dot-nav-item ${activeNav === s.id ? 'active' : ''}`}
            onClick={() => scrollToSection(s.id)}
            aria-label={s.label}
            aria-current={activeNav === s.id}
          >
            <span className="dot-nav-label">{s.label}</span>
            <span className="dot-nav-dot" />
          </button>
        ))}
      </nav>

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

      {/* ══ HERO — zoom-through pinned stage ══ */}
      <section id="hero" className="hero-stage" ref={heroStageRef}>
        <div className="hero-pin">
          <div className="hero-zoom" ref={heroZoomRef}>
            <div className="hero-section">
              <div
                className="feat"
                onMouseEnter={() => setFeaturedPaused(true)}
                onMouseLeave={() => setFeaturedPaused(false)}
              >
                <div className="feat-parallax-wrap" ref={heroBgRef}>
                  {FEATURED.map((slide, i) => (
                    <div className={`feat-slide ${i === activeFeatured ? 'show' : ''}`} key={i}>
                      <img src={slide.image} alt={slide.title} />
                      <div className="feat-grad" />
                    </div>
                  ))}
                </div>

                <div className="feat-body" key={activeFeatured}>
                  <span className="feat-badge"><FlameIcon /> {feat.rank}</span>
                  <div className="feat-meta">
                    {feat.tags.map((tag) => (
                      <span className="feat-tag" key={tag}>{tag}</span>
                    ))}
                  </div>
                  <h1 className="feat-title">
                    <SplitText text={feat.title} mode="auto" />
                  </h1>
                  <p className="feat-desc">{feat.desc}</p>
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

            <button className="scroll-hint" onClick={() => scrollToSection('played')} aria-label="Scroll down">
              <span>Scroll to explore</span>
              <span className="scroll-hint-mouse"><i /></span>
            </button>
          </div>
        </div>
      </section>

      {/* ══ SECTION 1: Previously Played Stories ══ */}
      <section id="played" className="stories-section scroll-section">
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

      {/* ══ SECTION 2: My Scenarios ══ */}
      <section id="scenarios" className="stories-section scroll-section">
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

      {/* ══ SECTION 3: Explore Shared Stories ══ */}
      <section id="explore" className="stories-section explore-section scroll-section">
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
