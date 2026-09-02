import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiGet, apiPost, API_ENDPOINTS, BASE_URL, getHeaders } from '../services/server'
import { imageLibraryStore } from '../utils/imageLibraryStore'
import SecureImage from './SecureImage'
import CreditPrompt from './CreditPrompt'
import { useBilling } from '../contexts/BillingContext'
import { formatCredits } from '../services/billingService'
import { describeBillingError } from '../utils/billingErrors'
import './ImageStudio.css'

const G = {
  spark: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9z" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  paw: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="10" r="2" />
      <circle cx="10" cy="6" r="2" />
      <circle cx="14" cy="6" r="2" />
      <circle cx="18" cy="10" r="2" />
      <path d="M9 14c-2 1.5-3 3-3 4.5A2.5 2.5 0 0 0 8.5 21c1 0 1.8-.5 3.5-.5s2.5.5 3.5.5A2.5 2.5 0 0 0 18 18.5c0-1.5-1-3-3-4.5a3.5 3.5 0 0 0-6 0z" />
    </svg>
  ),
  scene: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
      <circle cx="8" cy="9" r="1.4" />
    </svg>
  ),
  wand: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2M15 10V8M11 6H9M21 6h-2M18.5 3.5l-1 1M18.5 8.5l-1-1" />
      <path d="M3 21l12-12-2-2L1 19z" />
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
  expand: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  ),
  bookmark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
}

const STYLES = [
  { id: 'fantasy', label: 'Fantasy', img: '/fantasy-art-style.png' },
  { id: 'realistic', label: 'Realistic', img: '/realistic-art-style-52592d.png' },
  { id: 'anime', label: 'Anime', img: '/anime-art-style.png' },
  { id: 'cartoon', label: 'Cartoon', img: '/cartoon-art-style.png' },
]

/**
 * Presentation only — a blurb and a two-letter badge per engine.
 *
 * The engine *list*, its labels and its prices come from
 * GET /api/images/models, whose `credits` is derived from the same table the
 * biller charges from. This map is a lookup by id with a graceful fallback,
 * never a second copy of the catalogue: a second list is exactly how an engine
 * ends up priced wrong, or missing from the picker entirely.
 */
const MODEL_ART = {
  'flux-schnell': { desc: 'Fast · low cost', badge: 'S' },
  'flux-dev': { desc: 'Balanced quality', badge: 'D' },
  'flux-2-pro': { desc: 'Newest flagship', badge: 'F2' },
  'seedream-4': { desc: 'Cinematic · moody', badge: 'Sd' },
  'recraft-v3': { desc: 'Vector · graphic', badge: 'R' },
  'flux-pro-ultra': { desc: 'Premium · 2K', badge: 'U' },
  'nano-banana': { desc: 'Character consistency', badge: 'N' },
}

const artFor = (m) => ({
  desc: MODEL_ART[m.id]?.desc || '',
  badge: MODEL_ART[m.id]?.badge || (m.label || m.id).slice(0, 2).toUpperCase(),
})

/** How many images one button offers. Trimmed to the API's own ceiling. */
const COUNT_CHOICES = [1, 2, 4]

const RATIOS = [
  { id: 'square', label: 'Square', dims: '1024²', aspect: '1 / 1', w: 30, h: 30 },
  { id: 'landscape', label: 'Landscape', dims: '3:2', aspect: '3 / 2', w: 40, h: 27 },
  { id: 'portrait', label: 'Portrait', dims: '2:3', aspect: '2 / 3', w: 24, h: 36 },
]

const SUBJECTS = [
  { id: 'character', label: 'Character', icon: G.user, prefix: 'Character portrait:' },
  { id: 'location', label: 'Location', icon: G.pin, prefix: 'Location scene:' },
  { id: 'creature', label: 'Creature', icon: G.paw, prefix: 'Creature:' },
  { id: 'scene', label: 'Scene', icon: G.scene, prefix: 'Scene:' },
]

const SUBJECT_PREFIXES = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.prefix]))

const EXAMPLES = [
  'A mystical forest with glowing mushrooms and ancient ruins',
  'A lone knight on a cliff at dawn, cinematic',
  'Portrait of a clever rogue with a scarred grin',
  'A floating city above the clouds, golden hour',
]

function imageUrl(record) {
  if (!record?.image) return ''
  return record.image.startsWith('http') ? record.image : `${BASE_URL}${record.image}`
}

function ImageStudio() {
  const { refresh: refreshBilling } = useBilling()
  const [prompt, setPrompt] = useState('')
  const [subject, setSubject] = useState(null)
  const [style, setStyle] = useState('fantasy')
  // Empty until the catalogue arrives — there is no engine to name before the
  // API says which ones exist, and no price to quote for one.
  const [model, setModel] = useState('')
  const [models, setModels] = useState([])
  const [maxPerRequest, setMaxPerRequest] = useState(null)
  const [ratio, setRatio] = useState('square')
  const [count, setCount] = useState(1)
  const [folders, setFolders] = useState([])
  const [folderId, setFolderId] = useState('') // '' = unsorted / no folder
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const [error, setError] = useState('')
  // The generate response, when it was refused for a billing reason.
  const [billingError, setBillingError] = useState(null)
  const [toast, setToast] = useState('')
  const canvasRef = useRef(null)

  const ratioObj = RATIOS.find((r) => r.id === ratio) || RATIOS[0]
  const styleObj = STYLES.find((s) => s.id === style) || STYLES[0]
  const modelObj = useMemo(() => models.find((m) => m.id === model) || null, [models, model])
  // Credits for one image on the selected engine, straight from the API. Null
  // while the catalogue is in flight — a "0 credits" during the fetch is a
  // price the reader would act on and then be charged past.
  const unitPrice = typeof modelObj?.credits === 'number' ? modelObj.credits : null
  const batchPrice = unitPrice != null ? unitPrice * count : null

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(t)
  }, [toast])

  /**
   * The engine catalogue, with the price the biller will actually charge.
   *
   * Fetched rather than kept in the client, because a price the picker owns is
   * a price that can drift from the one deducted (CREDIT-SYSTEM-DESIGN.md §7).
   * `maxPerRequest` comes back with it so the quantity control can bound itself
   * instead of discovering the ceiling as a 400.
   */
  useEffect(() => {
    let alive = true
    apiGet(API_ENDPOINTS.IMAGES.MODELS, true)
      .then((data) => {
        if (!alive || !Array.isArray(data?.models)) return
        setModels(data.models)
        if (typeof data.maxPerRequest === 'number') setMaxPerRequest(data.maxPerRequest)
        setModel((current) => current || data.models[0]?.id || '')
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // Never leave a selection sitting above a ceiling the API will reject.
  useEffect(() => {
    if (maxPerRequest != null && count > maxPerRequest) setCount(maxPerRequest)
  }, [maxPerRequest, count])

  // Load the user's folders so generations can optionally be filed into one.
  useEffect(() => {
    let alive = true
    imageLibraryStore
      .fetchFolders()
      .then((fs) => {
        if (alive) setFolders(fs)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const getDimensions = () => {
    if (ratio === 'landscape') return { width: 1536, height: 1024 }
    if (ratio === 'portrait') return { width: 1024, height: 1536 }
    return { width: 1024, height: 1024 }
  }

  const buildPrompt = () => {
    let text = prompt.trim()
    if (subject && SUBJECT_PREFIXES[subject]) {
      text = `${SUBJECT_PREFIXES[subject]} ${text}`
    }
    return text
  }

  const mapResult = (record, promptText) => ({
    id: record._id || `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    record,
    prompt: record.prompt || promptText,
    style: styleObj.label,
    aspect: ratioObj.aspect,
    src: imageUrl(record),
  })

  const generateOne = async (promptText) => {
    const { width, height } = getDimensions()
    const response = await apiPost(
      API_ENDPOINTS.IMAGES.GENERATE,
      {
        prompt: promptText,
        artStyle: style,
        model,
        width,
        height,
        ...(folderId ? { folderId } : {}),
      },
      true
    )

    if (response?.image) return response.image
    // apiPost hands back the parsed body whatever the status, so a refusal's
    // `code` and `details` are here — and they are the whole difference
    // between "something went wrong" and a price the reader can act on. Carry
    // them on the error rather than collapsing it to a message string.
    const failure = new Error(response?.message || response?.error || 'Generation failed')
    const refusal = {
      code: response?.code,
      details: response?.details,
      error: response?.message || response?.error,
    }
    if (describeBillingError(refusal)) failure.billing = refusal
    throw failure
  }

  const handleGenerate = async () => {
    const promptText = buildPrompt()
    if (!promptText || generating || !model) return

    setGenerating(true)
    setError('')
    setResults([])
    if (canvasRef.current) canvasRef.current.scrollTop = 0

    const out = []
    try {
      for (let i = 0; i < count; i += 1) {
        const record = await generateOne(promptText)
        out.push(mapResult(record, promptText))
        setResults([...out])
      }
    } catch (err) {
      console.error('Image generation failed:', err)
      if (out.length > 0) setResults(out)
      // A billing refusal gets the modal that names the price and the way
      // forward; anything else stays the inline error it always was.
      if (err.billing) {
        setBillingError(err.billing)
      } else if (out.length > 0) {
        setError(err.message || 'Some images failed to generate.')
      } else {
        setError(err.message || 'Failed to generate image. Please try again.')
      }
    } finally {
      setGenerating(false)
      // Images charge on the row being written, so the balance has moved by
      // the time this settles — however it settled.
      refreshBilling()
    }
  }

  const handleEnhance = () => {
    if (!prompt.trim()) return
    setPrompt((p) => {
      const trimmed = p.trim()
      if (trimmed.endsWith(', highly detailed, cinematic lighting')) return trimmed
      return `${trimmed}, highly detailed, cinematic lighting`
    })
    setToast('Prompt enhanced')
  }

  const handleDownload = async (result) => {
    try {
      const url = result.src
      const response = await fetch(url, { headers: getHeaders(true) })
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `decipher-${result.id}.png`
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      setToast('Download failed')
    }
  }

  const stageMeta = () => {
    if (generating) {
      return `Generating ${count} ${styleObj.label.toLowerCase()} image${count > 1 ? 's' : ''}…`
    }
    if (results.length) {
      return `${results.length} result${results.length > 1 ? 's' : ''} · ${styleObj.label}`
    }
    return 'Your generations will appear here'
  }

  return (
    <div className="image-studio-page">
      <div className="is-content">
        <div className="is-composer">
          <div className="is-comp-scroll">
            <div className="is-title">Image Studio</div>
            <div className="is-title-sub">Describe it, choose a style, and generate.</div>

            <div className="is-block">
              <div className="is-label">Prompt</div>
              <textarea
                className="is-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Describe the image you want to create… e.g. "A mystical forest with glowing mushrooms and ancient ruins"'
              />
              <button type="button" className="is-enhance" onClick={handleEnhance} disabled={!prompt.trim() || generating}>
                {G.wand} Enhance prompt
              </button>
            </div>

            <div className="is-block">
              <div className="is-label">
                Subject <span className="hint">optional</span>
              </div>
              <div className="is-chips">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`is-chip ${subject === s.id ? 'on' : ''}`}
                    onClick={() => setSubject(subject === s.id ? null : s.id)}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="is-block">
              <div className="is-label">Art style</div>
              <div className="is-styles">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`is-style ${style === s.id ? 'on' : ''}`}
                    onClick={() => setStyle(s.id)}
                  >
                    <img src={s.img} alt="" />
                    <span className="sh" />
                    <span className="ck">{G.check}</span>
                    <span className="nm">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="is-block">
              <div className="is-label">
                Model
                {unitPrice != null && (
                  <span className="hint">{formatCredits(unitPrice)} cr / image</span>
                )}
              </div>
              <div className="is-models">
                {models.map((m) => {
                  const art = artFor(m)
                  const credits = typeof m.credits === 'number' ? m.credits : null
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`is-model ${model === m.id ? 'on' : ''}`}
                      onClick={() => setModel(m.id)}
                    >
                      <span className="badge">{art.badge}</span>
                      <span className="is-model-txt">
                        <span className="mt">{m.label || m.id}</span>
                        {art.desc && <span className="md">{art.desc}</span>}
                      </span>
                      {/* Rendered only when the API supplied a number; an
                          engine with no price shows none rather than a zero. */}
                      {credits != null && (
                        <span className="is-model-cr">{formatCredits(credits)} cr</span>
                      )}
                      <span className="dot" />
                    </button>
                  )
                })}
                {models.length === 0 && <div className="is-models-empty">Loading engines…</div>}
              </div>
            </div>

            <div className="is-block">
              <div className="is-label">Aspect ratio</div>
              <div className="is-seg">
                {RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`is-ratio ${ratio === r.id ? 'on' : ''}`}
                    onClick={() => setRatio(r.id)}
                  >
                    <span className="shape" style={{ width: r.w, height: r.h }} />
                    <span className="rl">{r.label}</span>
                    <span className="rd">{r.dims}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="is-block">
              <div className="is-label">
                Images
                {maxPerRequest != null && <span className="hint">up to {maxPerRequest} per request</span>}
              </div>
              <div className="is-count">
                {COUNT_CHOICES.map((n) => {
                  // Bounded by the API's own ceiling, so the reader meets a
                  // disabled button rather than a 400 after the fact.
                  const over = maxPerRequest != null && n > maxPerRequest
                  return (
                    <button
                      key={n}
                      type="button"
                      className={count === n ? 'on' : ''}
                      onClick={() => setCount(n)}
                      disabled={over}
                      title={over ? `The most this API generates in one request is ${maxPerRequest}` : undefined}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="is-block">
              <div className="is-label">
                Save to folder <span className="hint">optional</span>
              </div>
              <div className="is-folder">
                {G.layers}
                <select value={folderId} onChange={(e) => setFolderId(e.target.value)}>
                  <option value="">Unsorted (no folder)</option>
                  {imageLibraryStore.flatten(folders).map((f) => (
                    <option key={f.id} value={f.id}>
                      {`${'— '.repeat(f.depth)}${f.name}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="is-comp-foot">
            <button
              type="button"
              className="btn btn-primary btn-md"
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating || !model}
              style={{ gap: 8 }}
            >
              {G.spark} {generating ? 'Generating…' : 'Generate'}
            </button>
            <div className="is-cost">
              {/* The total for what is actually about to be generated, on the
                  engine actually selected. Nothing at all until the catalogue
                  has answered — a placeholder price is worse than none. */}
              {G.bolt}
              {batchPrice != null && (
                <span>{formatCredits(batchPrice)} {batchPrice === 1 ? 'credit' : 'credits'} · </span>
              )}
              <span>{count} {count === 1 ? 'image' : 'images'}</span>
            </div>
            {error && <div className="is-gen-error">{error}</div>}
          </div>
        </div>

        <div className="is-stage">
          <div className="is-stage-head">
            <div>
              <h2>Canvas</h2>
              <div className="meta">{stageMeta()}</div>
            </div>
            <div className="right">
              <Link className="btn btn-ghost btn-sm" to="/image-library" style={{ gap: 7 }}>
                {G.layers} Library
              </Link>
              {results.length > 0 && !generating && (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleGenerate} style={{ gap: 7 }}>
                    {G.refresh} Regenerate
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="is-canvas" ref={canvasRef}>
            {generating && results.length === 0 ? (
              <div className={`is-results ${count === 1 ? 'single' : ''}`}>
                {Array.from({ length: count }).map((_, i) => (
                  <div key={i} className="is-skel" style={{ aspectRatio: ratioObj.aspect }}>
                    <div className="spin" />
                  </div>
                ))}
              </div>
            ) : results.length ? (
              <div className={`is-results ${results.length === 1 ? 'single' : ''}`}>
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="is-result"
                    style={{ aspectRatio: r.aspect }}
                    onClick={() => setLightbox(r)}
                    onKeyDown={(e) => e.key === 'Enter' && setLightbox(r)}
                    role="button"
                    tabIndex={0}
                  >
                    <SecureImage src={r.src} alt={r.prompt} />
                    <div className="ov" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <button type="button" className="ri-act" title="Regenerate" onClick={handleGenerate}>
                        {G.refresh}
                      </button>
                      <Link className="ri-act" title="Image Library" to="/image-library" onClick={(e) => e.stopPropagation()}>
                        {G.bookmark}
                      </Link>
                      <button type="button" className="ri-act" title="Download" onClick={() => handleDownload(r)}>
                        {G.download}
                      </button>
                      <button type="button" className="ri-act" title="Enlarge" onClick={() => setLightbox(r)}>
                        {G.expand}
                      </button>
                    </div>
                  </div>
                ))}
                {generating &&
                  Array.from({ length: Math.max(0, count - results.length) }).map((_, i) => (
                    <div key={`skel-${i}`} className="is-skel" style={{ aspectRatio: ratioObj.aspect }}>
                      <div className="spin" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="is-empty">
                <div className="orb">{G.spark}</div>
                <h3>Bring your story to life</h3>
                <p>Describe a character, place or moment and Decipher Engine will paint it in your chosen style.</p>
                <div className="is-examples">
                  {EXAMPLES.map((e) => (
                    <button key={e} type="button" className="is-example" onClick={() => setPrompt(e)}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <div className="is-lb" onClick={() => setLightbox(null)} role="presentation">
          <div className="is-lb-inner" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <button type="button" className="is-lb-close" onClick={() => setLightbox(null)}>
              {G.x}
            </button>
            <SecureImage src={lightbox.src} alt={lightbox.prompt} />
            <div className="is-lb-bar">
              <div className="meta">
                <div className="s">{lightbox.style} style</div>
                <div className="p">{lightbox.prompt}</div>
              </div>
              <div className="acts">
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleGenerate} style={{ gap: 7 }}>
                  {G.refresh} Variations
                </button>
                <Link className="btn btn-ghost btn-sm" to="/image-library" style={{ gap: 7 }}>
                  {G.bookmark} Library
                </Link>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => handleDownload(lightbox)} style={{ gap: 7 }}>
                  {G.download} Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="is-toast">{toast}</div>}

      <CreditPrompt error={billingError} onClose={() => setBillingError(null)} onRefreshBilling={refreshBilling} />
    </div>
  )
}

export default ImageStudio
