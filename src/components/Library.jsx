import { useState, useEffect, useCallback } from 'react'
import './Library.css'
import * as libraryService from '../services/libraryService'

// ── Icon Components ─────────────────────────────────────────────────────────

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconMap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
)

const IconDragon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
  </svg>
)

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconBookmark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

const IconEmpty = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

// ── Type Config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'character', label: 'Characters', icon: <IconUsers />, emoji: '👤', color: '#7738CB', accentColor: 'rgba(119,56,203,0.25)' },
  { id: 'location',  label: 'Locations',  icon: <IconMap />,   emoji: '🌍', color: '#2A8FA4', accentColor: 'rgba(42,143,164,0.25)' },
  { id: 'creature',  label: 'Creatures',  icon: <IconDragon />,emoji: '🐉', color: '#C0534E', accentColor: 'rgba(192,83,78,0.25)'  },
]

const ENDPOINTS = {
  character: '/api/characters',
  location:  '/api/locations',
  creature:  '/api/creatures',
}

// ── Library Component ────────────────────────────────────────────────────────

function Library() {
  const [activeTab, setActiveTab]       = useState('character')
  const [entities, setEntities]         = useState({ character: [], location: [], creature: [] })
  const [loading, setLoading]           = useState({ character: false, location: false, creature: false })
  const [search, setSearch]             = useState('')
  const [modal, setModal]               = useState(null)   // null | { mode:'create'|'edit', type, data }
  const [deleteConfirm, setDeleteConfirm] = useState(null) // null | { type, id, name }
  const [formData, setFormData]         = useState({ name: '', description: '' })
  const [formError, setFormError]       = useState('')
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [toastMsg, setToastMsg]         = useState(null)

  const tab = TABS.find(t => t.id === activeTab)

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchEntities = useCallback(async (type) => {
    setLoading(prev => ({ ...prev, [type]: true }))
    const res = await libraryService.getLibraryEntities(type)
    if (res.success) {
      setEntities(prev => ({ ...prev, [type]: res.data || [] }))
    }
    setLoading(prev => ({ ...prev, [type]: false }))
  }, [])

  useEffect(() => {
    TABS.forEach(t => fetchEntities(t.id))
  }, [fetchEntities])

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormData({ name: '', description: '' })
    setFormError('')
    setModal({ mode: 'create', type: activeTab })
  }

  const openEdit = (entity) => {
    setFormData({ name: entity.name, description: entity.description || '' })
    setFormError('')
    setModal({ mode: 'edit', type: activeTab, data: entity })
  }

  const closeModal = () => setModal(null)

  // ── Save (create / update) ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.name.trim()) { setFormError('Name is required.'); return }
    setSaving(true)
    setFormError('')

    const token = localStorage.getItem('token')
    const BASE_URL = (await import('../services/server')).BASE_URL
    const isEdit   = modal.mode === 'edit'
    const url      = isEdit
      ? `${BASE_URL}${ENDPOINTS[modal.type]}/${modal.data._id}`
      : `${BASE_URL}${ENDPOINTS[modal.type]}`

    try {
      const res = await fetch(url, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name: formData.name.trim(), description: formData.description.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to save')

      await fetchEntities(modal.type)
      closeModal()
      showToast(isEdit ? `${tab.label.slice(0,-1)} updated!` : `${tab.label.slice(0,-1)} added to library!`)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    const token = localStorage.getItem('token')
    const BASE_URL = (await import('../services/server')).BASE_URL
    const url = `${BASE_URL}${ENDPOINTS[deleteConfirm.type]}/${deleteConfirm.id}`
    try {
      const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Delete failed')
      await fetchEntities(deleteConfirm.type)
      showToast(`Deleted "${deleteConfirm.name}"`)
    } catch {
      showToast('Could not delete. Try again.')
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = (entities[activeTab] || []).filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  )

  const totalAll = TABS.reduce((acc, t) => acc + (entities[t.id]?.length || 0), 0)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="library-page">
      {/* Ambient glow background */}
      <div className="library-bg-orb orb-1" />
      <div className="library-bg-orb orb-2" />

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="library-header">
        <div className="library-header-inner">
          <div className="library-header-left">
            <div className="library-header-icon">
              <IconBookmark />
            </div>
            <div>
              <h1 className="library-title">My Library</h1>
              <p className="library-subtitle">
                {totalAll} saved {totalAll === 1 ? 'entity' : 'entities'} across characters, locations &amp; creatures
              </p>
            </div>
          </div>

          <button className="lib-add-btn" onClick={openCreate}>
            <IconPlus />
            <span>Add {tab.label.slice(0, -1)}</span>
          </button>
        </div>
      </div>

      {/* ── Tab + Search Bar ─────────────────────────────────────────── */}
      <div className="library-controls">
        <div className="lib-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`lib-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(t.id); setSearch('') }}
              style={activeTab === t.id ? { '--tab-color': t.color } : {}}
            >
              <span className="lib-tab-icon">{t.icon}</span>
              <span>{t.label}</span>
              <span className="lib-tab-count" style={activeTab === t.id ? { background: t.color } : {}}>
                {entities[t.id]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="lib-search">
          <IconSearch />
          <input
            type="text"
            placeholder={`Search ${tab.label.toLowerCase()}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="lib-search-clear" onClick={() => setSearch('')}>
              <IconClose />
            </button>
          )}
        </div>
      </div>

      {/* ── Entity Grid ──────────────────────────────────────────────── */}
      <div className="library-body">
        {loading[activeTab] ? (
          <div className="lib-loading">
            <div className="lib-spinner" style={{ borderTopColor: tab.color }} />
            <span>Loading {tab.label.toLowerCase()}…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="lib-empty">
            <div className="lib-empty-icon">{tab.emoji}</div>
            <h3>No {tab.label.toLowerCase()} {search ? 'match your search' : 'yet'}</h3>
            <p>
              {search
                ? 'Try different keywords or clear the search.'
                : `Save ${tab.label.toLowerCase()} from the Story Creator, or create one here.`}
            </p>
            {!search && (
              <button className="lib-empty-cta" onClick={openCreate}
                style={{ '--tab-color': tab.color }}>
                <IconPlus /> Create your first {tab.label.slice(0, -1).toLowerCase()}
              </button>
            )}
          </div>
        ) : (
          <div className="lib-grid">
            {filtered.map(entity => (
              <div
                key={entity._id}
                className="lib-card"
                style={{ '--card-accent': tab.accentColor, '--card-border': tab.color }}
              >
                <div className="lib-card-emoji">{tab.emoji}</div>

                <div className="lib-card-body">
                  <h3 className="lib-card-name">{entity.name}</h3>
                  <p className="lib-card-desc">
                    {entity.description?.trim()
                      ? entity.description
                      : <span className="lib-card-no-desc">No description</span>
                    }
                  </p>
                </div>

                <div className="lib-card-actions">
                  <button
                    className="lib-card-btn edit"
                    onClick={() => openEdit(entity)}
                    title="Edit"
                  >
                    <IconEdit />
                  </button>
                  <button
                    className="lib-card-btn delete"
                    onClick={() => setDeleteConfirm({ type: activeTab, id: entity._id, name: entity.name })}
                    title="Delete"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))}

            {/* Add-new ghost card */}
            <button
              className="lib-card lib-card-add"
              onClick={openCreate}
              style={{ '--card-border': tab.color }}
            >
              <div className="lib-card-add-inner">
                <div className="lib-card-add-circle" style={{ background: tab.accentColor }}>
                  <IconPlus />
                </div>
                <span>New {tab.label.slice(0, -1)}</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ───────────────────────────────────────── */}
      {modal && (
        <div className="lib-modal-overlay" onClick={closeModal}>
          <div className="lib-modal" onClick={e => e.stopPropagation()}>
            <div className="lib-modal-header" style={{ '--modal-color': tab.color }}>
              <div className="lib-modal-title-group">
                <span className="lib-modal-emoji">{tab.emoji}</span>
                <div>
                  <h2>{modal.mode === 'create' ? `New ${tab.label.slice(0,-1)}` : `Edit ${tab.label.slice(0,-1)}`}</h2>
                  <p className="lib-modal-sub">{tab.label}</p>
                </div>
              </div>
              <button className="lib-modal-close" onClick={closeModal}><IconClose /></button>
            </div>

            <div className="lib-modal-body">
              {formError && <div className="lib-modal-error">{formError}</div>}

              <div className="lib-form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder={`Enter ${tab.label.slice(0,-1).toLowerCase()} name…`}
                  autoFocus
                  className="lib-form-input"
                />
              </div>

              <div className="lib-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder={`Describe this ${tab.label.slice(0,-1).toLowerCase()}…`}
                  rows="5"
                  className="lib-form-input lib-form-textarea"
                />
              </div>
            </div>

            <div className="lib-modal-footer">
              <button className="lib-modal-cancel" onClick={closeModal} disabled={saving}>Cancel</button>
              <button
                className="lib-modal-save"
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
                style={{ '--modal-color': tab.color }}
              >
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Add to Library' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="lib-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="lib-modal lib-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="lib-modal-header lib-modal-danger-header">
              <h2>Delete "{deleteConfirm.name}"?</h2>
              <button className="lib-modal-close" onClick={() => setDeleteConfirm(null)}><IconClose /></button>
            </div>
            <div className="lib-modal-body">
              <p className="lib-delete-warning">
                This will permanently remove this entry from your library. This action cannot be undone.
              </p>
            </div>
            <div className="lib-modal-footer">
              <button className="lib-modal-cancel" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button className="lib-modal-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────── */}
      {toastMsg && (
        <div className="lib-toast">
          <span>✓</span> {toastMsg}
        </div>
      )}
    </div>
  )
}

export default Library
