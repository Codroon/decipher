import { useState, useEffect, useCallback } from 'react'
import './Library.css'
import * as libraryService from '../services/libraryService'
import { BASE_URL, getHeaders } from '../services/server'
import SecureImage from './SecureImage'
import { imageLibraryStore } from '../utils/imageLibraryStore'

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
  // Image picker (attach an image from the Image Library to an entity)
  const [imgPicker, setImgPicker] = useState(null) // { type, entity }
  const [pickerImages, setPickerImages] = useState([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [attaching, setAttaching] = useState(false)

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
    // `image` holds a full display URL for the preview; `imageId` is what we send.
    setFormData({ name: '', description: '', imageId: null, image: null })
    setFormError('')
    setModal({ mode: 'create', type: cat })
  }

  const openEdit = (entity) => {
    setFormData({
      name: entity.name,
      description: entity.description || '',
      imageId: entity.imageId || null,
      image: entity.image ? `${BASE_URL}${entity.image}` : null,
    })
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
          imageId: formData.imageId || null,
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

  // Open the picker and lazily load the user's image library. `mode` is either
  // 'attach' (immediately PATCH an existing entity) or 'select' (feed the choice
  // back into the create/edit form).
  const openImagePicker = async ({ mode, entity } = { mode: 'select' }) => {
    setImgPicker({ mode, type: cat, entity })
    setPickerLoading(true)
    try {
      const { images } = await imageLibraryStore.fetchImages({ limit: 200 })
      setPickerImages(images)
    } catch {
      setPickerImages([])
    } finally {
      setPickerLoading(false)
    }
  }

  // A cell was clicked (or "remove" chosen → img=null). Route by picker mode.
  const handlePickImage = async (img) => {
    if (!imgPicker) return
    if (imgPicker.mode === 'select') {
      // Feed the selection into the open create/edit form (no API call yet).
      setFormData((p) => ({ ...p, imageId: img ? img.id : null, image: img ? img.img : null }))
      setImgPicker(null)
      return
    }
    // 'attach' mode — PATCH the existing entity immediately.
    const { entity, type } = imgPicker
    setAttaching(true)
    try {
      const res = await fetch(`${BASE_URL}${ENDPOINTS[type]}/${entity._id}/image`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ imageId: img ? img.id : null }),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchEntities(type)
      setImgPicker(null)
      showToast(img ? 'Image attached' : 'Image removed')
    } catch {
      showToast('Could not update image. Try again.')
    } finally {
      setAttaching(false)
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
                      <div className={`libc-cover ${entity.image ? 'has-img' : ''}`}>
                        {entity.image ? (
                          <SecureImage
                            src={`${BASE_URL}${entity.image}`}
                            alt={entity.name}
                            className="libc-cover-img"
                          />
                        ) : (
                          catObj.icon
                        )}
                        <span className="libc-badge">{catObj.singular}</span>
                      </div>
                      <div className="libc-body">
                        <h3>{entity.name}</h3>
                        <p>{entity.description?.trim() || 'No description'}</p>
                      </div>
                      <div className="libc-acts">
                        <button type="button" className="libc-act" onClick={() => openImagePicker({ mode: 'attach', entity })}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                          {entity.image ? 'Change' : 'Image'}
                        </button>
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
            <div className="lm-fg">
              <label>Image <span className="lm-optional">(from your Image Library)</span></label>
              <div className="lm-image-row">
                <div className="lm-image-preview">
                  {formData.image ? (
                    <SecureImage src={formData.image} alt="Selected" className="lm-image-thumb" />
                  ) : (
                    <span className="lm-image-empty">No image</span>
                  )}
                </div>
                <div className="lm-image-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openImagePicker({ mode: 'select' })} disabled={saving}>
                    {formData.image ? 'Change image' : 'Select image'}
                  </button>
                  {formData.image && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setFormData((p) => ({ ...p, imageId: null, image: null }))}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
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

      {imgPicker && (
        <div className="lm-ov" onClick={() => setImgPicker(null)} role="presentation">
          <div className="lm lm-imgpick" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="lm-imgpick-head">
              <div>
                <h2>Select image</h2>
                <p className="lm-imgpick-sub">
                  Pick from your Image Library
                  {imgPicker.mode === 'attach' && imgPicker.entity ? ` for “${imgPicker.entity.name}”` : ''}
                </p>
              </div>
              <button type="button" className="x" onClick={() => setImgPicker(null)}>×</button>
            </div>

            {(imgPicker.mode === 'attach' ? imgPicker.entity?.image : formData.imageId) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm imgpick-remove"
                onClick={() => handlePickImage(null)}
                disabled={attaching}
              >
                {I.trash} Remove current image
              </button>
            )}

            {pickerLoading ? (
              <div className="lib-loading"><div className="spin" /><span>Loading your images…</span></div>
            ) : pickerImages.length === 0 ? (
              <div className="imgpick-empty">
                No images in your library yet. Generate some in Image Studio first.
              </div>
            ) : (
              <div className="imgpick-grid">
                {pickerImages.map((img) => {
                  const currentId = imgPicker.mode === 'attach' ? imgPicker.entity?.imageId : formData.imageId
                  return (
                  <button
                    key={img.id}
                    type="button"
                    className={`imgpick-cell ${currentId === img.id ? 'sel' : ''}`}
                    onClick={() => handlePickImage(img)}
                    disabled={attaching}
                    title={img.prompt}
                  >
                    <SecureImage src={img.img} alt={img.prompt} className="imgpick-thumb" />
                  </button>
                  )
                })}
              </div>
            )}
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
