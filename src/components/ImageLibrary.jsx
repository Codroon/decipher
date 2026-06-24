import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { imageLibraryStore } from '../utils/imageLibraryStore'
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

const STORE0 = imageLibraryStore.load()

function ImageLibrary() {
  const [images, setImages] = useState(STORE0.images)
  const [folders, setFolders] = useState(STORE0.folders)
  const [view, setView] = useState('all')
  const [styleFilter, setStyleFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState(new Set())
  const [lb, setLb] = useState(null)
  const [newCol, setNewCol] = useState(false)
  const [colName, setColName] = useState('')
  const [newParent, setNewParent] = useState(null)
  const [moveFor, setMoveFor] = useState(null)
  const [del, setDel] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    imageLibraryStore.save({ folders, images })
  }, [folders, images])

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

  const toggleFav = (id) => setImages((ims) => ims.map((i) => (i.id === id ? { ...i, fav: !i.fav } : i)))
  const toggleSel = (id) =>
    setSel((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const createCol = () => {
    if (!colName.trim()) return
    const id = `uc${Date.now().toString(36)}`
    setFolders((fs) => [...fs, { id, name: colName.trim(), parentId: newParent }])
    note(newParent ? 'Subfolder created' : 'Collection created')
    setColName('')
    setNewCol(false)
    setView(id)
  }

  const doAddTo = (folderId) => {
    const ids = moveFor.ids
    setImages((ims) => ims.map((i) => (ids.includes(i.id) ? { ...i, col: folderId } : i)))
    note(ids.length > 1 ? `Moved ${ids.length} images` : 'Moved to folder')
    setMoveFor(null)
    setSel(new Set())
  }

  const doDelete = () => {
    const ids = del.ids
    setImages((ims) => ims.filter((i) => !ids.includes(i.id)))
    note(ids.length > 1 ? `Deleted ${ids.length} images` : 'Image deleted')
    setDel(null)
    setSel(new Set())
    if (lb !== null) setLb(null)
  }

  const grouped = DATES.map((d) => ({ date: d, items: filtered.filter((i) => i.date === d) })).filter(
    (g) => g.items.length
  )
  const flat = grouped.flatMap((g) => g.items)
  const lbImg = lb !== null ? flat[lb] : null

  const goView = (v) => {
    setView(v)
    setSel(new Set())
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
                <div className="lib-tree">
                  {childFolders(top.id).map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      className={`lib-fold ${view === sub.id ? 'active' : ''}`}
                      onClick={() => goView(sub.id)}
                    >
                      {M.folder}
                      <span>{sub.name}</span>
                      <span className="ct">{colCount(sub.id)}</span>
                    </button>
                  ))}
                </div>
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
            {curFolder && !curFolder.parentId && (
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
                          <img src={im.img} alt={im.prompt} />
                          <div className="ilib-ov" />
                          {im.fav && <span className="ilib-favdot">{M.star}</span>}
                          <div className="ilib-top" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={`ilib-fav ${im.fav ? 'on' : ''}`}
                              title="Favorite"
                              onClick={() => toggleFav(im.id)}
                            >
                              {M.star}
                            </button>
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
              <button type="button" className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={() => setMoveFor({ ids: [...sel] })}>
                {M.move} Add to…
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
              <img src={lbImg.img} alt={lbImg.prompt} />
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
                  <span className="v">#{(lbImg.id.charCodeAt(2) * 7919) % 100000}</span>
                </div>
              </div>
              <div className="il-reuse">
                <button type="button" className="il-usebtn" onClick={() => note('Set as scenario cover')}>
                  {M.cover} Use as scenario cover
                </button>
                <button type="button" className="il-usebtn" onClick={() => note('Set as character portrait')}>
                  {M.user} Set as character portrait
                </button>
                <button type="button" className="il-usebtn" onClick={() => setMoveFor({ ids: [lbImg.id] })}>
                  {M.folder} Add to folder…
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
                Add {moveFor.ids.length > 1 ? `${moveFor.ids.length} images` : 'image'} to…
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

      {toast && (
        <div className="toast">
          {M.check} {toast}
        </div>
      )}
    </div>
  )
}

export default ImageLibrary
