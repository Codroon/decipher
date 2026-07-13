import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { imageLibraryStore } from '../utils/imageLibraryStore'
import SecureImage from './SecureImage'
import ReportModal from './ReportModal'
import './ImageLibrary.css'

const M = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  folderPlus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M12 11v5M9.5 13.5h5" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  chev: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  left: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  right: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  cover: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  move: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
    </svg>
  ),
  imgIc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.6" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
}

const STYLES = ['Fantasy', 'Anime', 'Realistic', 'Cartoon']
const DATES = ['Today', 'This week', 'Earlier']

function ImageLibrary() {
  const [images, setImages] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('all')
  const [styleFilter, setStyleFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState(new Set())
  const [lb, setLb] = useState(null)
  const [reportImg, setReportImg] = useState(null)
  const [newCol, setNewCol] = useState(false)
  const [colName, setColName] = useState('')
  const [newParent, setNewParent] = useState(null)
  const [moveFor, setMoveFor] = useState(null)
  const [del, setDel] = useState(null)
  const [delFolder, setDelFolder] = useState(null)
  const [toast, setToast] = useState(null)
  const [clip, setClip] = useState([]) // images copied to the clipboard
  const keyRef = useRef({ copy: () => {}, paste: () => {} })

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  // Global Ctrl/⌘ + C / V for copy-paste of images between folders.
  // Bound once; always calls the latest closures via keyRef.
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      const tag = (t?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || t?.isContentEditable) return
      if (!(e.metaKey || e.ctrlKey)) return
      const k = e.key.toLowerCase()
      if (k === 'c') keyRef.current.copy(e)
      else if (k === 'v') keyRef.current.paste(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [fs, res] = await Promise.all([
        imageLibraryStore.fetchFolders(),
        imageLibraryStore.fetchImages({ limit: 500 }),
      ])
      setFolders(fs)
      setImages(res.images)
    } catch (e) {
      setError(e?.message || 'Failed to load your image library')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const note = (m) => setToast(m)

  const childFolders = (pid) => imageLibraryStore.children(folders, pid)
  const descIds = (id) => imageLibraryStore.descendantIds(folders, id)
  const inView = (im) => {
    if (view === 'all') return true
    if (view === 'fav') return im.fav
    return descIds(view).includes(im.col)
  }

  let filtered = images.filter(
    (im) =>
      inView(im) &&
      (styleFilter === 'All' || im.style === styleFilter) &&
      (!search || im.prompt.toLowerCase().includes(search.toLowerCase()))
  )
  if (sort === 'Oldest') filtered = [...filtered].reverse()

  const curFolder = folders.find((f) => f.id === view) || null
  const favCount = images.filter((i) => i.fav).length
  const colCount = (id) => images.filter((i) => descIds(id).includes(i.col)).length

  const crumbPath = (() => {
    if (view === 'all') return [{ label: 'All Images' }]
    if (view === 'fav') return [{ label: 'Favorites' }]
    if (!curFolder) return [{ label: 'Collection' }]
    if (curFolder.parentId) {
      const p = folders.find((x) => x.id === curFolder.parentId)
      return [
        { label: 'All Images', v: 'all' },
        { label: p ? p.name : '', v: p ? p.id : 'all' },
        { label: curFolder.name },
      ]
    }
    return [{ label: 'All Images', v: 'all' }, { label: curFolder.name }]
  })()

  // Optimistic favorite toggle with rollback on failure.
  const toggleFav = async (id) => {
    const target = images.find((i) => i.id === id)
    if (!target) return
    const next = !target.fav
    setImages((ims) => ims.map((i) => (i.id === id ? { ...i, fav: next } : i)))
    try {
      await imageLibraryStore.toggleFavorite(id, next)
    } catch {
      setImages((ims) => ims.map((i) => (i.id === id ? { ...i, fav: !next } : i)))
      note('Could not update favorite')
    }
  }

  const toggleSel = (id) =>
    setSel((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const createCol = async () => {
    if (!colName.trim()) return
    try {
      const folder = await imageLibraryStore.createFolder(colName.trim(), newParent)
      const fs = await imageLibraryStore.fetchFolders()
      setFolders(fs)
      note(newParent ? 'Subfolder created' : 'Collection created')
      setColName('')
      setNewCol(false)
      if (folder?.id) setView(folder.id)
    } catch (e) {
      note(e?.message || 'Could not create folder')
    }
  }

  // Handles the "Add to…" / "Copy to…" folder picker for both move and copy.
  const doAddTo = async (folderId) => {
    const { ids, mode } = moveFor
    setMoveFor(null)
    const label = folderId ? imageLibraryStore.folderName(folders, folderId) : 'Unsorted'

    if (mode === 'copy') {
      try {
        const created = await Promise.all(ids.map((id) => imageLibraryStore.copyImage(id, folderId)))
        setImages((ims) => [...created, ...ims])
        note(created.length > 1 ? `Copied ${created.length} images to ${label}` : `Copied to ${label}`)
      } catch (e) {
        note(e?.message || 'Could not copy images')
      }
      return
    }

    // Move (optimistic with rollback).
    const prev = images
    setImages((ims) => ims.map((i) => (ids.includes(i.id) ? { ...i, col: folderId } : i)))
    setSel(new Set())
    try {
      await Promise.all(ids.map((id) => imageLibraryStore.moveImage(id, folderId)))
      note(ids.length > 1 ? `Moved ${ids.length} images` : 'Moved to folder')
    } catch {
      setImages(prev)
      note('Could not move images')
    }
  }

  // Put images on the clipboard so they can be pasted into a folder.
  const copyToClip = (ids) => {
    const items = images.filter((i) => ids.includes(i.id))
    if (!items.length) return
    setClip(items)
    note(items.length > 1 ? `${items.length} images copied` : 'Image copied')
  }

  // Paste clipboard images as independent copies into a folder (null = unsorted).
  const pasteInto = async (folderId) => {
    if (!clip.length) return
    const label = folderId ? imageLibraryStore.folderName(folders, folderId) : 'All Images'
    try {
      const created = await Promise.all(clip.map((im) => imageLibraryStore.copyImage(im.id, folderId)))
      setImages((ims) => [...created, ...ims])
      note(created.length > 1 ? `Pasted ${created.length} images into ${label}` : `Pasted into ${label}`)
    } catch (e) {
      note(e?.message || 'Could not paste images')
    }
  }

  const doDelete = async () => {
    const ids = del.ids
    const prev = images
    setImages((ims) => ims.filter((i) => !ids.includes(i.id)))
    setDel(null)
    setSel(new Set())
    if (lb !== null) setLb(null)
    try {
      await Promise.all(ids.map((id) => imageLibraryStore.deleteImage(id)))
      note(ids.length > 1 ? `Deleted ${ids.length} images` : 'Image deleted')
    } catch {
      setImages(prev)
      note('Could not delete images')
    }
  }

  // Cascade delete: removes the folder subtree and every image inside it.
  const doDeleteFolder = async () => {
    const id = delFolder.id
    const affected = imageLibraryStore.descendantIds(folders, id)
    setDelFolder(null)
    try {
      await imageLibraryStore.deleteFolder(id)
      const [fs, res] = await Promise.all([
        imageLibraryStore.fetchFolders(),
        imageLibraryStore.fetchImages({ limit: 500 }),
      ])
      setFolders(fs)
      setImages(res.images)
      note('Folder deleted')
      if (affected.includes(view)) setView('all')
    } catch (e) {
      note(e?.message || 'Could not delete folder')
    }
  }

  const grouped = DATES.map((d) => ({ date: d, items: filtered.filter((i) => i.date === d) })).filter(
    (g) => g.items.length
  )
  const flat = grouped.flatMap((g) => g.items)
  const lbImg = lb !== null ? flat[lb] : null

  // Keep the keyboard shortcut handlers pointed at the current render's state.
  keyRef.current.copy = (e) => {
    if (window.getSelection && String(window.getSelection())) return // let text-copy through
    const ids = lbImg ? [lbImg.id] : [...sel]
    if (!ids.length) return
    e.preventDefault()
    copyToClip(ids)
  }
  keyRef.current.paste = (e) => {
    if (!clip.length) return
    e.preventDefault()
    pasteInto(curFolder ? curFolder.id : null)
  }

  const goView = (v) => {
    setView(v)
    setSel(new Set())
  }

  // Recursively render the folder subtree in the sidebar (depths 1 and 2).
  const renderSubtree = (parentId, depth) =>
    childFolders(parentId).map((f) => (
      <Fragment key={f.id}>
        <button
          type="button"
          className={`lib-fold ${view === f.id ? 'active' : ''}`}
          style={{ paddingLeft: 14 + depth * 16 }}
          onClick={() => goView(f.id)}
        >
          {M.folder}
          <span>{f.name}</span>
          <span className="ct">{colCount(f.id)}</span>
        </button>
        {renderSubtree(f.id, depth + 1)}
      </Fragment>
    ))

  if (loading) {
    return (
      <div className="image-library-page">
        <div className="lib-wrap">
          <div className="lib-main" style={{ display: 'grid', placeItems: 'center', minHeight: 320 }}>
            <div
              className="loader"
              style={{ width: 26, height: 26, border: '3px solid var(--ink-15, rgba(0,0,0,0.15))', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="image-library-page">
        <div className="lib-wrap">
          <div className="lib-main">
            <div className="lib-empty2">
              <div className="ei">{M.imgIc}</div>
              <h3>Couldn&apos;t load your library</h3>
              <p>{error}</p>
              <button type="button" className="btn btn-primary btn-md" style={{ gap: 7 }} onClick={loadAll}>
                {M.refresh} Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="image-library-page">
      <div className="lib-wrap">
        <div className="lib-side">
          <div className="lib-cap">Browse</div>
          <button type="button" className={`lib-cat ${view === 'all' ? 'active' : ''}`} onClick={() => goView('all')}>
            {M.grid}
            <span>All Images</span>
            <span className="ct">{images.length}</span>
          </button>
          <button type="button" className={`lib-cat ${view === 'fav' ? 'active' : ''}`} onClick={() => goView('fav')}>
            {M.star}
            <span>Favorites</span>
            <span className="ct">{favCount}</span>
          </button>
          <div className="lib-cap" style={{ marginTop: 8 }}>
            Collections
          </div>
          {childFolders(null).map((top) => (
            <Fragment key={top.id}>
              <button
                type="button"
                className={`lib-cat ${view === top.id ? 'active' : ''}`}
                onClick={() => goView(top.id)}
              >
                {M.folder}
                <span>{top.name}</span>
                <span className="ct">{colCount(top.id)}</span>
              </button>
              {childFolders(top.id).length > 0 && (
                <div className="lib-tree">{renderSubtree(top.id, 0)}</div>
              )}
            </Fragment>
          ))}
          <button
            type="button"
            className="lib-cat"
            onClick={() => {
              setNewParent(null)
              setColName('')
              setNewCol(true)
            }}
            style={{ color: 'var(--ink-55)' }}
          >
            {M.folderPlus}
            <span>New collection</span>
          </button>
        </div>

        <div className="lib-main">
          <div className="lib-bar">
            <div className="crumb">
              {crumbPath.map((c, i) => (
                <Fragment key={`${c.label}-${i}`}>
                  {i > 0 && <span className="sep">/</span>}
                  {c.v !== undefined ? (
                    <button type="button" onClick={() => goView(c.v)}>
                      {c.label}
                    </button>
                  ) : (
                    <span className="cur">{c.label}</span>
                  )}
                </Fragment>
              ))}
            </div>
            <div className="spacer" />
            {curFolder && curFolder.depth < 2 && (
              <button
                type="button"
                className="btn btn-ghost btn-md"
                style={{ gap: 7 }}
                onClick={() => {
                  setNewParent(view)
                  setColName('')
                  setNewCol(true)
                }}
              >
                {M.folderPlus} New subfolder
              </button>
            )}
            {curFolder && (
              <button
                type="button"
                className="btn btn-ghost btn-md"
                style={{ gap: 7 }}
                onClick={() => setDelFolder({ id: curFolder.id, name: curFolder.name })}
              >
                {M.trash} Delete folder
              </button>
            )}
            <div className="lib-search2">
              {M.search}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by prompt…"
              />
            </div>
          </div>

          <div className="ilib-filters">
            <button
              type="button"
              className={`ilib-chip ${styleFilter === 'All' ? 'on' : ''}`}
              onClick={() => setStyleFilter('All')}
            >
              All styles
            </button>
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                className={`ilib-chip ${styleFilter === s ? 'on' : ''}`}
                onClick={() => setStyleFilter(s)}
              >
                {s}
              </button>
            ))}
            <div className="ilib-div" />
            <button
              type="button"
              className={`ilib-chip ${view === 'fav' ? 'on' : ''}`}
              onClick={() => goView(view === 'fav' ? 'all' : 'fav')}
            >
              <span className="star">{M.star}</span> Favorites
            </button>
            <div className="ilib-sort">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option>Newest</option>
                <option>Oldest</option>
              </select>
              <span className="ch">{M.chev}</span>
            </div>
          </div>

          <div className="ilib-scroll">
            {curFolder && childFolders(view).length > 0 && (
              <>
                <div className="ilib-datehead">Folders</div>
                <div className="lib-grid" style={{ marginBottom: 22 }}>
                  {childFolders(view).map((f) => (
                    <div
                      key={f.id}
                      className="fold-tile"
                      onClick={() => goView(f.id)}
                      onKeyDown={(e) => e.key === 'Enter' && goView(f.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="fi">{M.folder}</div>
                      <div>
                        <h4>{f.name}</h4>
                        <div className="fc">
                          {colCount(f.id)} {colCount(f.id) === 1 ? 'image' : 'images'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {flat.length === 0 ? (
              (curFolder && childFolders(view).length > 0) ? null : (
                <div className="lib-empty2">
                  <div className="ei">{M.imgIc}</div>
                  <h3>{search || styleFilter !== 'All' ? 'No matches' : 'No images here yet'}</h3>
                  <p>
                    {search || styleFilter !== 'All'
                      ? 'Try a different filter or search.'
                      : "Generate art in the Image Studio and it'll collect here."}
                  </p>
                  <Link className="btn btn-primary btn-md" to="/image-studio" style={{ gap: 7, display: 'inline-flex' }}>
                    {M.plus} Open Image Studio
                  </Link>
                </div>
              )
            ) : (
              grouped.map((g) => (
                <div key={g.date}>
                  <div className="ilib-datehead">{g.date}</div>
                  <div className="ilib-masonry">
                    {g.items.map((im) => {
                      const idx = flat.indexOf(im)
                      return (
                        <div
                          key={im.id}
                          className={`ilib-cell ${sel.has(im.id) ? 'sel' : ''}`}
                          onClick={() => setLb(idx)}
                          onKeyDown={(e) => e.key === 'Enter' && setLb(idx)}
                          role="button"
                          tabIndex={0}
                        >
                          <SecureImage src={im.img} alt={im.prompt} />
                          <div className="ilib-ov" />
                          {im.fav && <span className="ilib-favdot">{M.star}</span>}
                          <div className="ilib-top" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <div className="ilib-actions">
                              <button
                                type="button"
                                className={`ilib-fav ${im.fav ? 'on' : ''}`}
                                title="Favorite"
                                onClick={() => toggleFav(im.id)}
                              >
                                {M.star}
                              </button>
                              <button
                                type="button"
                                className="ilib-fav"
                                title="Copy image"
                                onClick={() => copyToClip([im.id])}
                              >
                                {M.copy}
                              </button>
                            </div>
                            <button type="button" className="ilib-check" title="Select" onClick={() => toggleSel(im.id)}>
                              {M.check}
                            </button>
                          </div>
                          <div className="ilib-prompt">
                            <div className="s">{im.style}</div>
                            <div className="p">{im.prompt}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {sel.size > 0 && (
            <div className="bulk">
              <span className="n">
                <b>{sel.size}</b> selected
              </span>
              <button type="button" className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={() => setMoveFor({ ids: [...sel], mode: 'move' })}>
                {M.move} Add to…
              </button>
              <button type="button" className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={() => setMoveFor({ ids: [...sel], mode: 'copy' })}>
                {M.copy} Copy to…
              </button>
              <button type="button" className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={() => note('Download started')}>
                {M.download} Download
              </button>
              <button type="button" className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={() => setDel({ ids: [...sel] })}>
                {M.trash} Delete
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setSel(new Set())}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {lbImg && (
        <div className="il-lb" onClick={() => setLb(null)} onKeyDown={(e) => e.key === 'Escape' && setLb(null)} role="presentation">
          {lb > 0 && (
            <button
              type="button"
              className="il-lb-nav prev"
              onClick={(e) => {
                e.stopPropagation()
                setLb(lb - 1)
              }}
            >
              {M.left}
            </button>
          )}
          {lb < flat.length - 1 && (
            <button
              type="button"
              className="il-lb-nav next"
              onClick={(e) => {
                e.stopPropagation()
                setLb(lb + 1)
              }}
            >
              {M.right}
            </button>
          )}
          <div className="il-lb-card" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <button type="button" className="il-lb-close" onClick={() => setLb(null)}>
              {M.x}
            </button>
            <div className="il-lb-img">
              <SecureImage src={lbImg.img} alt={lbImg.prompt} />
            </div>
            <div className="il-lb-info">
              <span className="stylebadge">{lbImg.style} style</span>
              <div className="pr">{lbImg.prompt}</div>
              <div className="il-lb-meta">
                <div className="row">
                  <span className="k">Model</span>
                  <span className="v">{lbImg.model}</span>
                </div>
                <div className="row">
                  <span className="k">Dimensions</span>
                  <span className="v">{lbImg.dims}</span>
                </div>
                <div className="row">
                  <span className="k">Created</span>
                  <span className="v">{lbImg.date}</span>
                </div>
                <div className="row">
                  <span className="k">Seed</span>
                  <span className="v">{lbImg.seed != null ? `#${lbImg.seed}` : '—'}</span>
                </div>
              </div>
              <div className="il-reuse">
                <button type="button" className="il-usebtn" onClick={() => note('Set as scenario cover')}>
                  {M.cover} Use as scenario cover
                </button>
                <button type="button" className="il-usebtn" onClick={() => note('Set as character portrait')}>
                  {M.user} Set as character portrait
                </button>
                <button type="button" className="il-usebtn" onClick={() => setMoveFor({ ids: [lbImg.id], mode: 'move' })}>
                  {M.folder} Add to folder…
                </button>
                <button type="button" className="il-usebtn" onClick={() => setMoveFor({ ids: [lbImg.id], mode: 'copy' })}>
                  {M.copy} Copy to folder…
                </button>
                <button type="button" className="il-usebtn" onClick={() => note('Added to story')}>
                  {M.imgIc} Add to story
                </button>
                <div className="il-reuse-row">
                  <Link className="btn btn-ghost btn-md" to="/image-studio" style={{ gap: 7 }}>
                    {M.refresh} Recreate
                  </Link>
                  <button type="button" className="btn btn-ghost btn-md" style={{ gap: 7 }} onClick={() => note('Prompt copied')}>
                    {M.copy} Prompt
                  </button>
                  <button
                    type="button"
                    className="report-trigger"
                    onClick={() => setReportImg(lbImg)}
                    title="Report this image"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    Report
                  </button>
                </div>
                <button type="button" className="btn btn-primary btn-md" style={{ gap: 7 }} onClick={() => note('Download started')}>
                  {M.download} Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {newCol && (
        <div className="lm-ov" onClick={() => setNewCol(false)}>
          <div className="lm" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="lm-head">
              <h2>{newParent ? 'New subfolder' : 'New collection'}</h2>
              <button type="button" className="x" onClick={() => setNewCol(false)}>
                {M.x}
              </button>
            </div>
            <div className="lm-fg">
              <label htmlFor="col-name">
                {newParent
                  ? `Subfolder inside “${imageLibraryStore.folderName(folders, newParent)}”`
                  : 'Collection name'}
              </label>
              <input
                id="col-name"
                className="lm-input"
                autoFocus
                value={colName}
                onChange={(e) => setColName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCol()}
                placeholder={newParent ? 'e.g. Dragons' : 'e.g. Concept Art'}
              />
            </div>
            <div className="lm-foot">
              <button type="button" className="btn btn-ghost btn-md" onClick={() => setNewCol(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-md" onClick={createCol} disabled={!colName.trim()}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {moveFor && (
        <div className="lm-ov" onClick={() => setMoveFor(null)}>
          <div className="lm" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="lm-head">
              <h2>
                {moveFor.mode === 'copy' ? 'Copy' : 'Add'}{' '}
                {moveFor.ids.length > 1 ? `${moveFor.ids.length} images` : 'image'} to…
              </h2>
              <button type="button" className="x" onClick={() => setMoveFor(null)}>
                {M.x}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: '52vh', overflowY: 'auto' }}>
              <button type="button" className="il-usebtn" onClick={() => doAddTo(null)}>
                {M.folder} Unsorted (no folder)
              </button>
              {imageLibraryStore.flatten(folders).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="il-usebtn"
                  style={{ paddingLeft: 14 + f.depth * 22 }}
                  onClick={() => doAddTo(f.id)}
                >
                  {M.folder} {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {del && (
        <div className="lm-ov" onClick={() => setDel(null)}>
          <div className="lm" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="lm-head">
              <h2>Delete {del.ids.length > 1 ? `${del.ids.length} images` : 'image'}?</h2>
              <button type="button" className="x" onClick={() => setDel(null)}>
                {M.x}
              </button>
            </div>
            <p style={{ color: 'var(--ink-55)', fontSize: 14, marginBottom: 4 }}>This can&apos;t be undone.</p>
            <div className="lm-foot">
              <button type="button" className="btn btn-ghost btn-md" onClick={() => setDel(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-md"
                style={{ background: 'rgba(220,60,60,0.9)', color: '#fff' }}
                onClick={doDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {delFolder && (
        <div className="lm-ov" onClick={() => setDelFolder(null)}>
          <div className="lm" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="lm-head">
              <h2>Delete “{delFolder.name}”?</h2>
              <button type="button" className="x" onClick={() => setDelFolder(null)}>
                {M.x}
              </button>
            </div>
            <p style={{ color: 'var(--ink-55)', fontSize: 14, marginBottom: 4 }}>
              This permanently deletes the folder, every subfolder inside it, and all of their
              images. This can&apos;t be undone.
            </p>
            <div className="lm-foot">
              <button type="button" className="btn btn-ghost btn-md" onClick={() => setDelFolder(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-md"
                style={{ background: 'rgba(220,60,60,0.9)', color: '#fff' }}
                onClick={doDeleteFolder}
              >
                Delete everything
              </button>
            </div>
          </div>
        </div>
      )}

      {clip.length > 0 && (
        <div className="lib-clip">
          <div className="lib-clip-thumbs">
            {clip.slice(0, 3).map((c) => (
              <SecureImage key={c.id} src={c.img} alt="" />
            ))}
            {clip.length > 3 && <span className="more">+{clip.length - 3}</span>}
          </div>
          <div className="lib-clip-txt">
            <b>{clip.length} {clip.length > 1 ? 'images' : 'image'} copied</b>
            <span>
              Press ⌘/Ctrl + V to paste{curFolder ? ` into “${curFolder.name}”` : ''}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ gap: 6 }}
            onClick={() => pasteInto(curFolder ? curFolder.id : null)}
          >
            {M.copy} Paste here
          </button>
          <button type="button" className="lib-clip-x" title="Clear" onClick={() => setClip([])}>
            {M.x}
          </button>
        </div>
      )}

      {reportImg && (
        <ReportModal
          resourceType="image"
          resourceId={reportImg.id}
          title={reportImg.prompt}
          onClose={() => setReportImg(null)}
        />
      )}

      {toast && (
        <div className="toast">
          {M.check} {toast}
        </div>
      )}
    </div>
  )
}

export default ImageLibrary
