import { useState, useEffect, useCallback } from 'react'
import './Library.css'
import * as libraryService from '../services/libraryService'
import { BASE_URL, getHeaders } from '../services/server'

const I = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
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
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
}

const CATS = [
  { id: 'character', label: 'Characters', icon: I.user, singular: 'Character' },
  { id: 'location', label: 'Locations', icon: I.pin, singular: 'Location' },
  { id: 'creature', label: 'Creatures', icon: I.paw, singular: 'Creature' },
]

const ENDPOINTS = {
  character: '/api/characters',
  location: '/api/locations',
  creature: '/api/creatures',
}

function Library() {
  const [cat, setCat] = useState('character')
  const [entities, setEntities] = useState({ character: [], location: [], creature: [] })
  const [loading, setLoading] = useState({ character: false, location: false, creature: false })
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const catObj = CATS.find((c) => c.id === cat) || CATS[0]

  const fetchEntities = useCallback(async (type) => {
    setLoading((prev) => ({ ...prev, [type]: true }))
    const res = await libraryService.getLibraryEntities(type)
    if (res.success) setEntities((prev) => ({ ...prev, [type]: res.data || [] }))
    setLoading((prev) => ({ ...prev, [type]: false }))
  }, [])

  useEffect(() => {
    CATS.forEach((c) => fetchEntities(c.id))
  }, [fetchEntities])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (msg) => setToast(msg)

  const openCreate = () => {
    setFormData({ name: '', description: '' })
    setFormError('')
    setModal({ mode: 'create', type: cat })
  }

  const openEdit = (entity) => {
    setFormData({ name: entity.name, description: entity.description || '' })
    setFormError('')
    setModal({ mode: 'edit', type: cat, data: entity })
  }

  const closeModal = () => setModal(null)

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError('Name is required.')
      return
    }
    setSaving(true)
    setFormError('')
    const isEdit = modal.mode === 'edit'
    const url = isEdit
      ? `${BASE_URL}${ENDPOINTS[modal.type]}/${modal.data._id}`
      : `${BASE_URL}${ENDPOINTS[modal.type]}`
    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to save')
      await fetchEntities(modal.type)
      closeModal()
      showToast(isEdit ? `${catObj.singular} updated` : `${catObj.singular} added to library`)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    const url = `${BASE_URL}${ENDPOINTS[deleteConfirm.type]}/${deleteConfirm.id}`
    try {
      const res = await fetch(url, { method: 'DELETE', headers: getHeaders(true) })
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

  const filtered = (entities[cat] || []).filter(
    (e) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase())
  )

  const totalAll = CATS.reduce((acc, c) => acc + (entities[c.id]?.length || 0), 0)

  return (
    <div className="my-library-page">
      <div className="lib-wrap">
        <aside className="lib-side">
          <div className="lib-cap">Categories</div>
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`lib-cat ${cat === c.id ? 'active' : ''}`}
              onClick={() => {
                setCat(c.id)
                setSearch('')
              }}
            >
              {c.icon}
              <span>{c.label}</span>
              <span className="ct">{entities[c.id]?.length || 0}</span>
            </button>
          ))}
        </aside>

        <div className="lib-main">
          <div className="lib-bar">
            <div>
              <div className="crumb">{catObj.label}</div>
              <div className="crumb-sub">
                {totalAll} saved {totalAll === 1 ? 'entry' : 'entries'} in your library
              </div>
            </div>
            <div className="spacer" />
            <div className="lib-search2">
              {I.search}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${catObj.label.toLowerCase()}…`}
              />
            </div>
            <button type="button" className="btn btn-primary btn-md" onClick={openCreate} style={{ gap: 7 }}>
              {I.plus} New {catObj.singular.toLowerCase()}
            </button>
          </div>

          <div className="lib-gridwrap">
            <div className="lib-grid">
              {loading[cat] ? (
                <div className="lib-loading">
                  <div className="spin" />
                  <span>Loading {catObj.label.toLowerCase()}…</span>
                </div>
              ) : filtered.length === 0 && !search ? (
                <div className="lib-empty2">
                  <div className="ei">{catObj.icon}</div>
                  <h3>No {catObj.label.toLowerCase()} yet</h3>
                  <p>
                    Save {catObj.label.toLowerCase()} from Story Creator or Scenario Builder, or create one here.
                  </p>
                  <button type="button" className="btn btn-primary btn-md" onClick={openCreate} style={{ gap: 7 }}>
                    {I.plus} New {catObj.singular.toLowerCase()}
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="lib-empty2">
                  <div className="ei">{catObj.icon}</div>
                  <h3>No matches</h3>
                  <p>Try a different search term.</p>
                </div>
              ) : (
                <>
                  {filtered.map((entity) => (
                    <div className="libc" key={entity._id}>
                      <div className="libc-cover">
                        {catObj.icon}
                        <span className="libc-badge">{catObj.singular}</span>
                      </div>
                      <div className="libc-body">
                        <h3>{entity.name}</h3>
                        <p>{entity.description?.trim() || 'No description'}</p>
                      </div>
                      <div className="libc-acts">
                        <button type="button" className="libc-act" onClick={() => openEdit(entity)}>
                          {I.edit} Edit
                        </button>
                        <button
                          type="button"
                          className="libc-act del"
                          onClick={() =>
                            setDeleteConfirm({ type: cat, id: entity._id, name: entity.name })
                          }
                        >
                          {I.trash} Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="libc-add" onClick={openCreate}>
                    <span className="c">{I.plus}</span>
                    New {catObj.singular.toLowerCase()}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <div className="lm-ov" onClick={closeModal} role="presentation">
          <div className="lm" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="lm-head">
              <h2>
                {modal.mode === 'create' ? `New ${catObj.singular}` : `Edit ${catObj.singular}`}
              </h2>
              <button type="button" className="x" onClick={closeModal}>
                {I.x}
              </button>
            </div>
            {formError && <div className="lm-err">{formError}</div>}
            <div className="lm-fg">
              <label>Name *</label>
              <input
                className="lm-input"
                autoFocus
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder={`Enter ${catObj.singular.toLowerCase()} name…`}
              />
            </div>
            <div className="lm-fg">
              <label>Description</label>
              <textarea
                className="lm-textarea"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder={`Describe this ${catObj.singular.toLowerCase()}…`}
              />
            </div>
            <div className="lm-foot">
              <button type="button" className="btn btn-ghost btn-md" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
              >
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="lm-ov" onClick={() => setDeleteConfirm(null)} role="presentation">
          <div className="lm" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="lm-head">
              <h2>Delete &ldquo;{deleteConfirm.name}&rdquo;?</h2>
              <button type="button" className="x" onClick={() => setDeleteConfirm(null)}>
                {I.x}
              </button>
            </div>
            <p style={{ color: 'var(--ink-55)', fontSize: 14, margin: '0 0 4px' }}>
              This will permanently remove this entry from your library.
            </p>
            <div className="lm-foot">
              <button type="button" className="btn btn-ghost btn-md" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn btn-md lm-del" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          {I.check} {toast}
        </div>
      )}
    </div>
  )
}

export default Library
