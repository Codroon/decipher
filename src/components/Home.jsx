import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'
import * as storyService from '../services/storyService'
import * as scenarioService from '../services/scenarioService'
import * as publicService from '../services/publicService'
import ReportModal from './ReportModal'
import ConfirmDialog from './ConfirmDialog'

const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 5-2 6-1.5 1.5-2 3-2 4a4 4 0 0 0 8 0c0-1.2-.5-2.3-1-3 2 1 3 3 3 5a6 6 0 0 1-12 0c0-4 3-6 4-8 1-1.6 2-2.8 2-4z"/></svg>
)

const PlaySectionIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
)

const PlayIcon = PlaySectionIcon

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18l6-6-6-6" />
  </svg>
)

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

const FlagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 21V4h9l-1 3h6l-1.5 5L18 17H5" />
  </svg>
)

/* ============================================================
   Shelf — a horizontally scrolling row.

   The native scrollbar is hidden; the only affordances are the two
   glass buttons pinned to the left and right edges of the track. Each
   button is removed from the tab order and hidden outright when there
   is nothing to scroll to in its direction, so a shelf that fits never
   shows dead controls. Scrolling moves a whole viewport of cards at a
   time and snaps, so a row never rests mid-card.
   ============================================================ */
function Shelf({ title, sub, meta, children, label = 'items' }) {
  const trackRef = useRef(null)
  const [edges, setEdges] = useState({ prev: false, next: false })

  const measure = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({ prev: el.scrollLeft > 8, next: el.scrollLeft < max - 8 })
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      ro?.disconnect()
    }
  }, [children, measure])

  // Move by whole cards, as many as currently fit — a page at a time.
  const page = (dir) => {
    const el = trackRef.current
    if (!el) return
    const card = el.firstElementChild
    const stride = card
      ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 20)
      : el.clientWidth * 0.8
    const perView = Math.max(1, Math.floor(el.clientWidth / stride))
    el.scrollBy({ left: dir * stride * perView, behavior: 'smooth' })
  }

  return (
    <section className="shelf">
      <header className="shelf-head">
        <div className="shelf-heading">
          <div className="shelf-titles">
            <h2 className="shelf-title">{title}</h2>
            {sub && <p className="shelf-sub">{sub}</p>}
          </div>
        </div>
        {meta && <span className="shelf-meta">{meta}</span>}
      </header>

      <div className={`shelf-viewport${edges.prev ? ' is-prev' : ''}${edges.next ? ' is-next' : ''}`}>
        <button
          type="button"
          className="shelf-nav shelf-nav-prev"
          onClick={() => page(-1)}
          aria-label={`Scroll ${label} left`}
          tabIndex={edges.prev ? 0 : -1}
          aria-hidden={!edges.prev}
        >
          <ChevronLeftIcon />
        </button>

        <div className="shelf-track" ref={trackRef}>
          {children}
        </div>

        <button
          type="button"
          className="shelf-nav shelf-nav-next"
          onClick={() => page(1)}
          aria-label={`Scroll ${label} right`}
          tabIndex={edges.next ? 0 : -1}
          aria-hidden={!edges.next}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </section>
  )
}

/* Cards carry nested buttons (delete, report), so they can't be a <button>
   themselves. role + key handling gives them the same behaviour. */
const activate = (fn) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    fn()
  }
}

/* ============================================================
   StoryPlate — a story is something you read, so it takes the
   shape of a book cover: portrait, title over the art, a gradient
   spine down the binding edge, and a line of its own prose that
   surfaces on hover.
   ============================================================ */
function StoryPlate({ cover, kicker, title, meta, excerpt, action, byline, onOpen, tools }) {
  return (
    <article
      className="plate"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={activate(onOpen)}
      aria-label={title}
    >
      <span className="plate-spine" aria-hidden="true" />
      <div className="plate-art">
        <img src={cover} alt="" loading="lazy" />
        <span className="plate-wash" aria-hidden="true" />
        <span className="plate-scrim" aria-hidden="true" />
      </div>

      {kicker && <span className="plate-kicker">{kicker}</span>}
      {tools && <div className="card-tools" onClick={(e) => e.stopPropagation()}>{tools}</div>}

      <div className="plate-body">
        <h3 className="plate-title">{title}</h3>
        {meta?.length > 0 && (
          <p className="plate-meta">
            {meta.map((bit, i) => (
              <span key={i}>{bit}</span>
            ))}
          </p>
        )}
        <div className="plate-reveal">
          {excerpt && <p className="plate-excerpt">{excerpt}</p>}
          {byline && <span className="plate-byline">{byline}</span>}
          <span className="plate-action">{action}</span>
        </div>
      </div>
    </article>
  )
}

/* ============================================================
   WorldCard — a scenario is a place, not a narrative, so it gets a
   panoramic frame and reports what the world is made of.
   ============================================================ */
function WorldCard({ cover, title, description, counts, tags, overlay, action, onOpen, tools }) {
  return (
    <article
      className="world"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={activate(onOpen)}
      aria-label={title}
    >
      <div className="world-art">
        <img src={cover} alt="" loading="lazy" />
        <span className="world-wash" aria-hidden="true" />
        {/* Who made it, or who can see it — the art carries provenance so the
            footer is free for what the world is about. */}
        {overlay && <span className="world-overlay">{overlay}</span>}
        {tools && <div className="card-tools" onClick={(e) => e.stopPropagation()}>{tools}</div>}
      </div>

      <div className="world-body">
        <h3 className="world-title">{title}</h3>
        <p className="world-desc">{description}</p>

        {/* Only what the world actually contains — a "0 creatures" line is
            noise, and an empty world says so with a single line instead. */}
        {counts?.some((c) => c.value > 0) ? (
          <ul className="world-counts">
            {counts.filter((c) => c.value > 0).map((c) => (
              <li key={c.label}>
                <b>{c.value}</b> {c.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="world-counts world-counts-empty">Nothing added yet</p>
        )}

        <div className="world-foot">
          <span className="world-tags">
            {tags?.slice(0, 2).map((t) => (
              <span className="world-tag" key={t}>{t}</span>
            ))}
          </span>
          <span className="world-action">{action}</span>
        </div>
      </div>
    </article>
  )
}

/* Placeholder cards while a shelf loads — same footprint as the real
   thing so nothing reflows when the data lands. */
function Skeletons({ shape, n = 5 }) {
  return Array.from({ length: n }, (_, i) => (
    <div className={`skel skel-${shape}`} key={i} aria-hidden="true">
      <div className="skel-art" />
      <div className="skel-line" />
      <div className="skel-line short" />
    </div>
  ))
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

const SCOPES = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
  { id: 'community', label: 'Community' },
]

// Case-insensitive match across whichever fields a record actually has.
const matches = (query, ...fields) => {
  if (!query) return true
  const q = query.toLowerCase()
  return fields.some((f) => {
    if (!f) return false
    const text = Array.isArray(f) ? f.join(' ') : String(f)
    return text.toLowerCase().includes(q)
  })
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function useDebounced(value, delay = 300) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return settled
}

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

  // One search across every shelf. Your own content filters in the browser
  // (it's already loaded); community shelves re-query the API, which does the
  // matching server-side over the whole published catalogue rather than just
  // the page we happen to be holding.
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState('all')
  const searchTerm = useDebounced(query.trim(), 300)
  const searching = query.trim().length > 0

  // Content-report dialog: { resourceType, resourceId, title } | null
  const [report, setReport] = useState(null)

  // Pending destructive action: { title, name, details, note, run } | null
  const [pendingDelete, setPendingDelete] = useState(null)

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

  // Your own library — fetched once, filtered locally.
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

  // Community shelves — re-query whenever the debounced search term changes.
  useEffect(() => {
    let cancelled = false

    const fetchPublicStories = async () => {
      setLoadingPublicStories(true)
      const result = await publicService.listPublicStories({ limit: 16, q: searchTerm })
      if (cancelled) return
      if (result.success) setPublicStories(result.stories || [])
      else console.error('Failed to fetch public stories:', result.error)
      setLoadingPublicStories(false)
    }

    const fetchPublicScenarios = async () => {
      setLoadingPublicScenarios(true)
      const result = await publicService.listPublicScenarios({ limit: 16, q: searchTerm })
      if (cancelled) return
      if (result.success) setPublicScenarios(result.scenarios || [])
      else console.error('Failed to fetch public scenarios:', result.error)
      setLoadingPublicScenarios(false)
    }

    fetchPublicStories()
    fetchPublicScenarios()

    return () => { cancelled = true }
  }, [searchTerm])

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

  // Both deletes go through ConfirmDialog, which runs the request itself and
  // keeps the failure on screen instead of closing into an alert().
  const askDeleteStory = (e, story) => {
    e.stopPropagation()
    setPendingDelete({
      title: 'Delete this story?',
      name: storyTitle(story),
      details: [
        `${plural(story.passageCount || 0, 'passage')} of writing`,
        story.chapterCount > 0 ? plural(story.chapterCount, 'chapter') : null,
        'Any narration audio generated for it',
      ].filter(Boolean),
      run: async () => {
        const result = await storyService.deleteStory(story._id)
        if (result.success) setUserStories((prev) => prev.filter((s) => s._id !== story._id))
        return result
      },
    })
  }

  const askDeleteScenario = (e, scenario) => {
    e.stopPropagation()
    setPendingDelete({
      title: 'Delete this scenario?',
      name: scenario.title || 'Untitled Scenario',
      details: [
        plural(scenario.charactersCount || 0, 'character'),
        plural(scenario.locationsCount || 0, 'place'),
        plural(scenario.creaturesCount || 0, 'creature'),
      ],
      note: 'Stories already played from it are kept.',
      run: async () => {
        const result = await scenarioService.deleteScenario(scenario._id)
        if (result.success) setUserScenarios((prev) => prev.filter((s) => s._id !== scenario._id))
        return result
      },
    })
  }

  const handleEditScenario = (e, scenarioId) => {
    e.stopPropagation()
    navigate(`/scenario-creator/${scenarioId}`)
  }

  const openPublicStory = (id) => navigate(`/discover/story/${id}`)
  const openPublicScenario = (id) => navigate(`/discover/scenario/${id}`)

  const storyTitle = (s) =>
    s.title || (s.characterName ? `${s.characterName}'s Adventure` : 'Untitled Story')

  const visibleStories = useMemo(
    () => userStories.filter((s) => matches(searchTerm, storyTitle(s), s.setting, s.tone, s.currentChapterTitle)),
    [userStories, searchTerm]
  )

  const visibleScenarios = useMemo(
    () => userScenarios.filter((s) => matches(searchTerm, s.title, s.description, s.tags)),
    [userScenarios, searchTerm]
  )

  const showMine = scope !== 'community'
  const showCommunity = scope !== 'mine'

  const loading = loadingStories || loadingScenarios || loadingPublicStories || loadingPublicScenarios
  const totalHits =
    (showMine ? visibleStories.length + visibleScenarios.length : 0) +
    (showCommunity ? publicStories.length + publicScenarios.length : 0)
  const nothingFound = searching && !loading && totalHits === 0

  // A shelf with no results collapses to a single line while searching, so the
  // page stays scannable instead of stacking four empty boxes.
  const shelfMeta = (count, isLoading) => {
    if (isLoading) return 'Loading…'
    if (!searching) return count > 0 ? plural(count, 'title') : null
    return count > 0 ? `${plural(count, 'match', 'matches')}` : 'No matches'
  }

  const EmptyShelf = ({ children }) => <div className="shelf-empty">{children}</div>

  return (
    <div className={`home-page${showBanner ? ' has-banner' : ''}`}>
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
            <button className="close-banner" onClick={() => setShowBanner(false)} aria-label="Dismiss announcement">
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

      {/* One search across every shelf below */}
      <div className="library-bar">
        <div className="library-bar-inner">
          <div className="lib-search">
            <span className="lib-search-icon"><SearchIcon /></span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your stories, scenarios, and the community"
              aria-label="Search stories and scenarios"
            />
            {query && (
              <button type="button" className="lib-clear" onClick={() => setQuery('')} aria-label="Clear search">
                <CloseIcon />
              </button>
            )}
          </div>

          <div className="lib-scopes" role="group" aria-label="Filter shelves">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`lib-scope${scope === s.id ? ' is-active' : ''}`}
                onClick={() => setScope(s.id)}
                aria-pressed={scope === s.id}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="shelves">
        {/* Rejoin Your Adventures */}
        {showMine && (
          <Shelf
            title="Rejoin Your Adventures"
            sub="Pick up where you left off"
            meta={shelfMeta(visibleStories.length, loadingStories)}
            label="your adventures"
          >
            {loadingStories ? (
              <Skeletons shape="plate" />
            ) : visibleStories.length > 0 ? (
              visibleStories.map((story, i) => (
                <StoryPlate
                  key={story._id}
                  cover={coverFor(story._id, i)}
                  kicker={story.chapterCount > 0 ? `Chapter ${story.chapterCount}` : 'Just begun'}
                  title={storyTitle(story)}
                  meta={[story.tone, story.setting].filter(Boolean)}
                  excerpt={story.excerpt || story.currentChapterTitle}
                  action="Continue reading"
                  onOpen={() => handlePlayStory(story._id)}
                  tools={(
                    <button
                      type="button"
                      className="card-tool card-tool-danger"
                      title="Delete story"
                      aria-label={`Delete ${storyTitle(story)}`}
                      onClick={(e) => askDeleteStory(e, story)}
                    >
                      <TrashIcon />
                    </button>
                  )}
                />
              ))
            ) : searching ? (
              <EmptyShelf>Nothing here matches “{query}”.</EmptyShelf>
            ) : (
              <EmptyShelf>
                <p>Your first adventure starts with a blank page.</p>
                <button className="start-adventure-btn" onClick={() => navigate('/story-creator')}>
                  Create Story
                </button>
              </EmptyShelf>
            )}
          </Shelf>
        )}

        {/* My Scenarios */}
        {showMine && (
          <Shelf
            title="My Scenarios"
            sub="Worlds you've built, ready to play"
            meta={shelfMeta(visibleScenarios.length, loadingScenarios)}
            label="your scenarios"
          >
            {loadingScenarios ? (
              <Skeletons shape="world" n={4} />
            ) : visibleScenarios.length > 0 ? (
              visibleScenarios.map((scenario, i) => (
                <WorldCard
                  key={scenario._id}
                  cover={coverFor(scenario._id, i)}
                  title={scenario.title || 'Untitled Scenario'}
                  description={scenario.description || 'No description yet.'}
                  counts={[
                    { label: 'characters', value: scenario.charactersCount || 0 },
                    { label: 'places', value: scenario.locationsCount || 0 },
                    { label: 'creatures', value: scenario.creaturesCount || 0 },
                  ]}
                  tags={scenario.tags}
                  overlay={
                    scenario.visibility === 'published' ? 'Public'
                      : scenario.visibility === 'unlisted' ? 'Link only'
                        : 'Private'
                  }
                  action="Open"
                  onOpen={() => handleViewScenario(scenario._id)}
                  tools={(
                    <>
                      <button
                        type="button"
                        className="card-tool"
                        title="Edit scenario"
                        aria-label={`Edit ${scenario.title || 'scenario'}`}
                        onClick={(e) => handleEditScenario(e, scenario._id)}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="card-tool card-tool-danger"
                        title="Delete scenario"
                        aria-label={`Delete ${scenario.title || 'scenario'}`}
                        onClick={(e) => askDeleteScenario(e, scenario)}
                      >
                        <TrashIcon />
                      </button>
                    </>
                  )}
                />
              ))
            ) : searching ? (
              <EmptyShelf>Nothing here matches “{query}”.</EmptyShelf>
            ) : (
              <EmptyShelf>
                <p>Build a world once, then play it as many times as you like.</p>
                <button className="start-adventure-btn" onClick={() => navigate('/scenario-creator')}>
                  Create Scenario
                </button>
              </EmptyShelf>
            )}
          </Shelf>
        )}

        {/* Explore Shared Scenarios — public, playable worlds from the community */}
        {showCommunity && (
          <Shelf
            title="Explore Shared Scenarios"
            sub="Community worlds you can play right now"
            meta={shelfMeta(publicScenarios.length, loadingPublicScenarios)}
            label="shared scenarios"
          >
            {loadingPublicScenarios ? (
              <Skeletons shape="world" n={4} />
            ) : publicScenarios.length > 0 ? (
              publicScenarios.map((s, i) => (
                <WorldCard
                  key={s._id}
                  cover={coverFor(s._id, i)}
                  title={s.title || 'Untitled Scenario'}
                  description={s.description || 'No description yet.'}
                  counts={[
                    { label: 'characters', value: s.charactersCount || 0 },
                    { label: 'places', value: s.locationsCount || 0 },
                    { label: 'creatures', value: s.creaturesCount || 0 },
                  ]}
                  tags={s.tags}
                  overlay={<><i className="byline-dot" aria-hidden="true" />By {s.author?.name || 'Unknown'}</>}
                  action="Play"
                  onOpen={() => openPublicScenario(s._id)}
                  tools={(
                    <button
                      type="button"
                      className="card-tool card-tool-danger"
                      title="Report this scenario"
                      aria-label={`Report ${s.title || 'scenario'}`}
                      onClick={(e) => { e.stopPropagation(); setReport({ resourceType: 'scenario', resourceId: s._id, title: s.title }) }}
                    >
                      <FlagIcon />
                    </button>
                  )}
                />
              ))
            ) : searching ? (
              <EmptyShelf>No shared scenarios match “{query}”.</EmptyShelf>
            ) : (
              <EmptyShelf>Nobody has shared a scenario yet. Publish one and it lands here.</EmptyShelf>
            )}
          </Shelf>
        )}

        {/* Explore Shared Stories — public, read-only stories from the community */}
        {showCommunity && (
          <Shelf
            title="Explore Shared Stories"
            sub="Finished tales from other writers"
            meta={shelfMeta(publicStories.length, loadingPublicStories)}
            label="shared stories"
          >
            {loadingPublicStories ? (
              <Skeletons shape="plate" />
            ) : publicStories.length > 0 ? (
              publicStories.map((story, i) => (
                <StoryPlate
                  key={story._id}
                  cover={coverFor(story._id, i)}
                  kicker={story.storyStats?.readingTime ? `${story.storyStats.readingTime} min read` : null}
                  title={story.title || 'Untitled Story'}
                  meta={[story.tone, story.setting].filter(Boolean)}
                  excerpt={story.excerpt ? `${story.excerpt}…` : null}
                  action="Read story"
                  byline={`By ${story.author?.name || 'Unknown'}`}
                  onOpen={() => openPublicStory(story._id)}
                  tools={(
                    <button
                      type="button"
                      className="card-tool card-tool-danger"
                      title="Report this story"
                      aria-label={`Report ${story.title || 'story'}`}
                      onClick={(e) => { e.stopPropagation(); setReport({ resourceType: 'story', resourceId: story._id, title: story.title }) }}
                    >
                      <FlagIcon />
                    </button>
                  )}
                />
              ))
            ) : searching ? (
              <EmptyShelf>No shared stories match “{query}”.</EmptyShelf>
            ) : (
              <EmptyShelf>No shared stories yet. Publish one and it lands here.</EmptyShelf>
            )}
          </Shelf>
        )}

        {nothingFound && (
          <div className="lib-noresults">
            <p><strong>No results for “{query}”</strong></p>
            <p>Try a shorter search, or start something new.</p>
            <div className="lib-noresults-cta">
              <button className="btn btn-primary btn-md" onClick={() => navigate('/story-creator')}>New story</button>
              <button className="btn btn-ghost btn-md" onClick={() => setQuery('')}>Clear search</button>
            </div>
          </div>
        )}
      </div>

      {report && (
        <ReportModal
          resourceType={report.resourceType}
          resourceId={report.resourceId}
          title={report.title}
          onClose={() => setReport(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={pendingDelete.title}
          name={pendingDelete.name}
          details={pendingDelete.details}
          note={pendingDelete.note}
          confirmLabel="Delete"
          onConfirm={pendingDelete.run}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}

export default Home
