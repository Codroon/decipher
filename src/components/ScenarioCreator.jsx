import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './ScenarioCreator.css'
import * as scenarioService from '../services/scenarioService'
import * as libraryService from '../services/libraryService'
import { initializeStoryFromScenario } from '../services/storyService'
import ReportModal from './ReportModal'

const I = {
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  paw: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="10" r="2" />
      <circle cx="10" cy="6" r="2" />
      <circle cx="14" cy="6" r="2" />
      <circle cx="18" cy="10" r="2" />
      <path d="M9 14c-2 1.5-3 3-3 4.5A2.5 2.5 0 0 0 8.5 21c1 0 1.8-.5 3.5-.5s2.5.5 3.5.5A2.5 2.5 0 0 0 18 18.5c0-1.5-1-3-3-4.5a3.5 3.5 0 0 0-6 0z" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  bulb: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  chev: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  lib: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  arr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
}

const SECTIONS = [
  { id: 'basic', label: 'Basics', icon: I.info },
  { id: 'story', label: 'Story Setup', icon: I.doc },
  { id: 'characters', label: 'Characters', icon: I.user, entity: true, type: 'character' },
  { id: 'locations', label: 'Locations', icon: I.pin, entity: true, type: 'location' },
  { id: 'creatures', label: 'Creatures', icon: I.paw, entity: true, type: 'creature' },
]

const ENTITY_ICONS = { character: I.user, location: I.pin, creature: I.paw }
const ENTITY_EMOJI = { character: '👤', location: '🌍', creature: '🐉' }

const ENTITY_DESC = {
  characters: 'The cast that inhabits your world.',
  locations: 'The places your story can unfold.',
  creatures: 'The beasts and companions players may meet.',
}

const VIS_LABELS = { private: 'Private', unlisted: 'Unlisted', published: 'Published' }
const RATING_LABELS = { unrated: 'Unrated', everyone: 'Everyone', teen: 'Teen', mature: 'Mature' }

function EntitySection({ type, items, setItems, onAdd, onImport, icon }) {
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  return (
    <>
      <div className="ent-toolbar">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onAdd(type)} style={{ gap: 7 }}>
          {I.plus} Add {label}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onImport(type)} style={{ gap: 7 }}>
          {I.lib} Import from Library
        </button>
      </div>
      <div className="ent-grid">
        {items.map((it, index) => (
          <div className="ent-card" key={`${it.name}-${index}`}>
            <div className="ent-icon">{icon}</div>
            <div className="ent-body">
              <h4>{it.name}</h4>
              <p>{it.description || 'No description'}</p>
            </div>
            <div className="ent-actions">
              <button type="button" className="ent-mini" title="Edit" onClick={() => onAdd(type, index)}>
                {I.edit}
              </button>
              <button
                type="button"
                className="ent-mini del"
                title="Remove"
                onClick={() => setItems(items.filter((_, i) => i !== index))}
              >
                {I.trash}
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="ent-add" onClick={() => onAdd(type)}>
          {I.plus}
          <span>Add {label}</span>
        </button>
      </div>
    </>
  )
}

function ScenarioCreator() {
  const navigate = useNavigate()
  const { scenarioId } = useParams()
  const isEditMode = !!scenarioId

  const [showReport, setShowReport] = useState(false)
  const [section, setSection] = useState('basic')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [contentRating, setContentRating] = useState('unrated')
  const [opening, setOpening] = useState('')
  const [aiInstructions, setAiInstructions] = useState('')
  const [authorNotes, setAuthorNotes] = useState('')
  const [characters, setCharacters] = useState([])
  const [locations, setLocations] = useState([])
  const [creatures, setCreatures] = useState([])

  const [libraryCharacters, setLibraryCharacters] = useState([])
  const [libraryLocations, setLibraryLocations] = useState([])
  const [libraryCreatures, setLibraryCreatures] = useState([])

  const [activeModal, setActiveModal] = useState(null)
  const [modalData, setModalData] = useState({ name: '', description: '' })
  const [editIndex, setEditIndex] = useState(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingScenario, setIsLoadingScenario] = useState(isEditMode)
  const [isCreatingStory, setIsCreatingStory] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [scenarioStories, setScenarioStories] = useState([])
  const [loadingStories, setLoadingStories] = useState(false)

  const lists = {
    character: [characters, setCharacters],
    location: [locations, setLocations],
    creature: [creatures, setCreatures],
  }
  const libraries = {
    character: libraryCharacters,
    location: libraryLocations,
    creature: libraryCreatures,
  }
  const counts = { character: characters.length, location: locations.length, creature: creatures.length }

  useEffect(() => {
    const loadScenario = async () => {
      if (!scenarioId) return
      setIsLoadingScenario(true)
      const result = await scenarioService.getScenarioById(scenarioId)
      if (result.success) {
        const s = result.scenario
        setTitle(s.title || '')
        setDescription(s.description || '')
        setTags(s.tags || [])
        setVisibility(s.visibility || 'private')
        setContentRating(s.contentRating || 'unrated')
        setOpening(s.opening || '')
        setAiInstructions(s.AIInstructions || '')
        setAuthorNotes(s.authorNotes || '')
        setCharacters(s.characters || [])
        setLocations(s.locations || [])
        setCreatures(s.creatures || [])
      } else {
        setError(result.error || 'Failed to load scenario')
      }
      setIsLoadingScenario(false)
    }
    loadScenario()
  }, [scenarioId])

  useEffect(() => {
    const loadStories = async () => {
      if (!scenarioId) return
      setLoadingStories(true)
      const result = await scenarioService.getScenarioStories(scenarioId)
      if (result.success) setScenarioStories(result.stories || [])
      setLoadingStories(false)
    }
    loadStories()
  }, [scenarioId])

  useEffect(() => {
    const loadLibrary = async () => {
      const [c, l, cr] = await Promise.all([
        libraryService.getLibraryEntities('character'),
        libraryService.getLibraryEntities('location'),
        libraryService.getLibraryEntities('creature'),
      ])
      if (c.success) setLibraryCharacters(c.data || [])
      if (l.success) setLibraryLocations(l.data || [])
      if (cr.success) setLibraryCreatures(cr.data || [])
    }
    loadLibrary()
  }, [])

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  const openEntityModal = (type, index = null) => {
    setActiveModal(type)
    setEditIndex(index)
    if (index !== null) {
      const [items] = lists[type]
      setModalData({ name: items[index].name, description: items[index].description || '' })
    } else {
      setModalData({ name: '', description: '' })
    }
  }

  const closeModal = () => {
    setActiveModal(null)
    setEditIndex(null)
    setModalData({ name: '', description: '' })
  }

  const saveEntity = () => {
    if (!modalData.name.trim() || !activeModal || activeModal.startsWith('library-')) return
    const entity = { name: modalData.name.trim(), description: modalData.description.trim() }
    const [items, setItems] = lists[activeModal]
    if (editIndex !== null) {
      const updated = [...items]
      updated[editIndex] = entity
      setItems(updated)
    } else {
      setItems([...items, entity])
    }
    closeModal()
  }

  const importFromLibrary = (type, entity) => {
    const [items, setItems] = lists[type]
    if (items.some((e) => e.name === entity.name)) return
    setItems([...items, { name: entity.name, description: entity.description || '' }])
    setActiveModal(null)
  }

  const buildPayload = () => ({
    title: title.trim(),
    description: description.trim(),
    tags,
    visibility,
    contentRating,
    opening: opening.trim(),
    AIInstructions: aiInstructions.trim(),
    authorNotes: authorNotes.trim(),
    characters,
    locations,
    creatures,
  })

  const handleSaveScenario = async () => {
    if (!title.trim()) {
      setError('Please enter a scenario title')
      setSection('basic')
      return
    }
    setIsLoading(true)
    setError('')
    setSuccess('')
    const result = isEditMode
      ? await scenarioService.updateScenario(scenarioId, buildPayload())
      : await scenarioService.createScenario(buildPayload())
    setIsLoading(false)
    if (result.success) {
      setSuccess(isEditMode ? 'Scenario updated successfully!' : 'Scenario created successfully!')
      setTimeout(() => navigate('/home'), 2000)
    } else {
      setError(result.error)
    }
  }

  const handleCreateStory = async () => {
    if (!scenarioId) return
    setIsCreatingStory(true)
    setError('')
    setSuccess('')
    const result = await initializeStoryFromScenario(scenarioId)
    setIsCreatingStory(false)
    if (result.success) {
      setSuccess('Story initialized! Redirecting to character interview...')
      setTimeout(() => {
        navigate(result.storyId ? `/story-creator/${result.storyId}` : '/home')
      }, 1000)
    } else {
      setError(result.error || 'Failed to create story from scenario')
    }
  }

  const secMeta = SECTIONS.find((s) => s.id === section)

  if (isLoadingScenario) {
    return (
      <div className="scenario-builder-page">
        <div className="sb-loading">
          <div className="spin" />
          <p>Loading scenario…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="scenario-builder-page">
      <div className="sb-content">
        <div className="sb-head">
          <button type="button" className="sb-back" onClick={() => navigate(-1)} aria-label="Back">
            {I.back}
          </button>
          <div className="titles">
            <h1>{isEditMode ? 'Edit Scenario' : 'Create New Scenario'}</h1>
            <p>{isEditMode ? 'Update your scenario details' : 'Design your world, characters, and story foundation'}</p>
          </div>
          <div className="acts">
            {isEditMode && (
              <button
                type="button"
                className="report-trigger"
                onClick={() => setShowReport(true)}
                title="Report this scenario"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                Report
              </button>
            )}
            {isEditMode && (
              <button
                type="button"
                className="btn btn-ghost btn-md"
                onClick={handleCreateStory}
                disabled={isCreatingStory || isLoading}
                style={{ gap: 7 }}
              >
                {I.book} {isCreatingStory ? 'Creating…' : 'Create Story'}
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-md"
              onClick={handleSaveScenario}
              disabled={isLoading || isCreatingStory}
              style={{ gap: 7 }}
            >
              {I.check} {isLoading ? (isEditMode ? 'Updating…' : 'Creating…') : isEditMode ? 'Update Scenario' : 'Create Scenario'}
            </button>
          </div>
        </div>

        {showReport && scenarioId && (
          <ReportModal
            resourceType="scenario"
            resourceId={scenarioId}
            title={title}
            onClose={() => setShowReport(false)}
          />
        )}

        {error && (
          <div className="sb-banner err" style={{ marginTop: 16 }}>
            {I.warn}
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss">
              {I.x}
            </button>
          </div>
        )}
        {success && (
          <div className="sb-banner ok" style={{ marginTop: 16 }}>
            {I.check}
            <span>{success}</span>
          </div>
        )}

        <div className="sb-grid">
          <nav className="sb-nav">
            <div className="sb-navcap">Sections</div>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`sb-navitem ${section === s.id ? 'active' : ''}`}
                onClick={() => setSection(s.id)}
              >
                {s.icon}
                <span>{s.label}</span>
                {s.entity ? (
                  <span className="ct">{counts[s.type]}</span>
                ) : (s.id === 'basic' && title.trim()) || (s.id === 'story' && opening.trim()) ? (
                  <span className="done">{I.check}</span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="sb-form">
            {section === 'basic' && (
              <>
                <div className="sb-section-title">Basics</div>
                <div className="sb-section-desc">The essentials players see first.</div>
                <div className="fg">
                  <label>
                    Title <span className="req">*</span>
                  </label>
                  <input
                    className="sb-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="A captivating title for your scenario…"
                  />
                </div>
                <div className="fg">
                  <label>Description</label>
                  <textarea
                    className="sb-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the world, setting and premise…"
                    style={{ minHeight: 110 }}
                  />
                </div>
                <div className="fg-row">
                  <div className="fg">
                    <label>Visibility</label>
                    <div className="sb-selwrap">
                      <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="published">Published</option>
                      </select>
                      <span className="ch">{I.chev}</span>
                    </div>
                  </div>
                  <div className="fg">
                    <label>Content rating</label>
                    <div className="sb-selwrap">
                      <select value={contentRating} onChange={(e) => setContentRating(e.target.value)}>
                        <option value="unrated">Unrated</option>
                        <option value="everyone">Everyone</option>
                        <option value="teen">Teen</option>
                        <option value="mature">Mature</option>
                      </select>
                      <span className="ch">{I.chev}</span>
                    </div>
                  </div>
                </div>
                <div className="fg">
                  <label>Tags</label>
                  <div className="tagbox">
                    {tags.map((t) => (
                      <span className="tag" key={t}>
                        {t}
                        <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                          {I.x}
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                      placeholder="Add tag…"
                    />
                  </div>
                </div>
              </>
            )}

            {section === 'story' && (
              <>
                <div className="sb-section-title">Story Setup</div>
                <div className="sb-section-desc">How the adventure opens and how the AI should tell it.</div>
                <div className="fg">
                  <label>Opening scene</label>
                  <textarea
                    className="sb-textarea"
                    value={opening}
                    onChange={(e) => setOpening(e.target.value)}
                    placeholder="Write the opening scene that sets the stage…"
                    style={{ minHeight: 130 }}
                  />
                </div>
                <div className="fg">
                  <label>AI instructions</label>
                  <textarea
                    className="sb-textarea"
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    placeholder="Guide tone, style, pacing and themes…"
                    style={{ minHeight: 100 }}
                  />
                  <div className="sb-hint">These steer every generation in this scenario.</div>
                </div>
                <div className="fg">
                  <label>
                    Author notes <span style={{ color: 'var(--ink-40)', fontWeight: 400 }}>(private)</span>
                  </label>
                  <textarea
                    className="sb-textarea"
                    value={authorNotes}
                    onChange={(e) => setAuthorNotes(e.target.value)}
                    placeholder="Private notes only you can see…"
                  />
                </div>
              </>
            )}

            {secMeta?.entity && (
              <>
                <div className="sb-section-title">{secMeta.label}</div>
                <div className="sb-section-desc">{ENTITY_DESC[section]}</div>
                <EntitySection
                  type={secMeta.type}
                  items={lists[secMeta.type][0]}
                  setItems={lists[secMeta.type][1]}
                  icon={ENTITY_ICONS[secMeta.type]}
                  onAdd={openEntityModal}
                  onImport={(t) => setActiveModal(`library-${t}`)}
                />
              </>
            )}
          </div>

          <aside className="sb-preview">
            <div className="sb-prevcap">
              {I.eye} Live preview
            </div>
            <div className="scn-prev">
              <div className="scn-prev-banner">
                <span className="scn-prev-badge">{VIS_LABELS[visibility] || visibility}</span>
                <span className="scn-prev-badge">{RATING_LABELS[contentRating] || contentRating}</span>
              </div>
              <div className="scn-prev-body">
                <h3 className={title ? '' : 'ph'}>{title || 'Untitled scenario'}</h3>
                <p>{description || 'Your scenario description will appear here as you write it.'}</p>
                {tags.length > 0 && (
                  <div className="scn-prev-tags">
                    {tags.map((t) => (
                      <span className="scn-prev-tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="scn-counts">
              <div className="scn-count">
                <div className="n">
                  <span className="grad-text">{characters.length}</span>
                </div>
                <div className="l">Characters</div>
              </div>
              <div className="scn-count">
                <div className="n">
                  <span className="grad-text">{locations.length}</span>
                </div>
                <div className="l">Locations</div>
              </div>
              <div className="scn-count">
                <div className="n">
                  <span className="grad-text">{creatures.length}</span>
                </div>
                <div className="l">Creatures</div>
              </div>
            </div>
            {isEditMode && (
              <div className="stories-card">
                <div className="th">
                  {I.book} Stories
                  <span className="ct">{scenarioStories.length}</span>
                </div>
                {loadingStories ? (
                  <p className="stories-empty">Loading stories…</p>
                ) : scenarioStories.length > 0 ? (
                  scenarioStories.map((story) => (
                    <button
                      key={story._id}
                      type="button"
                      className="story-row"
                      onClick={() => navigate(`/story-creator/${story._id}`)}
                    >
                      <div>
                        <h4>{story.title || (story.characterName ? `${story.characterName}'s Adventure` : 'Untitled Story')}</h4>
                        <p>{story.setting || 'No setting specified'}</p>
                      </div>
                      <span className="arr">{I.arr}</span>
                    </button>
                  ))
                ) : (
                  <p className="stories-empty">No stories yet. Use Create Story to start one.</p>
                )}
              </div>
            )}
            <div className="tips-card">
              <div className="th">
                {I.bulb} Quick tips
              </div>
              <ul>
                <li>A vivid opening scene sets the tone for every playthrough.</li>
                <li>Use AI instructions to lock in tone and pacing.</li>
                <li>Reuse characters and locations from your Library.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {activeModal && !activeModal.startsWith('library-') && (
        <div className="sb-modal-ov" onClick={closeModal} role="presentation">
          <div className="sb-modal" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="sb-modal-head">
              <h2>
                {editIndex !== null ? 'Edit' : 'Add'} {activeModal}
              </h2>
              <button type="button" className="sb-modal-close" onClick={closeModal}>
                {I.x}
              </button>
            </div>
            <div className="fg">
              <label>
                Name <span className="req">*</span>
              </label>
              <input
                className="sb-input"
                autoFocus
                value={modalData.name}
                onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                placeholder={`Enter ${activeModal} name…`}
              />
            </div>
            <div className="fg">
              <label>Description</label>
              <textarea
                className="sb-textarea"
                value={modalData.description}
                onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                placeholder={`Describe this ${activeModal}…`}
              />
            </div>
            <div className="sb-modal-foot">
              <button type="button" className="btn btn-ghost btn-md" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-md" onClick={saveEntity} disabled={!modalData.name.trim()}>
                {editIndex !== null ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal?.startsWith('library-') && (() => {
        const libType = activeModal.replace('library-', '')
        const libItems = libraries[libType] || []
        const [currentItems] = lists[libType] || [[], () => {}]
        const available = libItems.filter((item) => !currentItems.some((ci) => ci.name === item.name))
        const typeLabel = libType.charAt(0).toUpperCase() + libType.slice(1)
        return (
          <div className="sb-modal-ov" onClick={closeModal} role="presentation">
            <div className="sb-modal wide" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <div className="sb-modal-head">
                <div>
                  <h2>Import {typeLabel} from Library</h2>
                  <p className="sb-modal-sub">
                    {available.length > 0
                      ? `${available.length} available to add`
                      : `All library ${typeLabel.toLowerCase()}s are already in this scenario`}
                  </p>
                </div>
                <button type="button" className="sb-modal-close" onClick={closeModal}>
                  {I.x}
                </button>
              </div>
              <div className="lib-grid">
                {available.length === 0 ? (
                  <div className="lib-empty">
                    No {typeLabel.toLowerCase()}s left to import. Save more from Story Creator or My Library first.
                  </div>
                ) : (
                  available.map((item) => (
                    <button
                      key={item._id || item.name}
                      type="button"
                      className="lib-card"
                      onClick={() => importFromLibrary(libType, item)}
                    >
                      <span className="lib-card-icon">{ENTITY_EMOJI[libType]}</span>
                      <div>
                        <h4>{item.name}</h4>
                        <p>{item.description || 'No description'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="sb-modal-foot">
                <button type="button" className="btn btn-ghost btn-md" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default ScenarioCreator
