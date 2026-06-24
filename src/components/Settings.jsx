import { useState, useEffect, useRef } from 'react'
import './Settings.css'

const AVATAR = '/author-avatar-7942f7.png'

const S = {
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  chev: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 7l4 4 5-7 5 7 4-4v11H3z" />
    </svg>
  ),
  pen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  speaker: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4z" />
      <path d="M19 5a9 9 0 0 1 0 14M15.5 8.5a4 4 0 0 1 0 7" />
    </svg>
  ),
  wand: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2M15 10V8M11 6H9M21 6h-2" />
      <path d="M3 21l12-12 2 2L5 23z" />
      <path d="M14 8l2 2" />
    </svg>
  ),
  type: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7V5h16v2M9 19h6M12 5v14" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 5l12 7-12 7z" />
    </svg>
  ),
}

const SECTIONS = [
  { id: 'account', label: 'Account', icon: S.user },
  { id: 'plan', label: 'Plan & Usage', icon: S.crown },
  { id: 'story', label: 'Storyteller', icon: S.pen },
  { id: 'narration', label: 'Narration', icon: S.speaker },
  { id: 'images', label: 'Image Studio', icon: S.wand },
  { id: 'reading', label: 'Reading', icon: S.type },
  { id: 'notifications', label: 'Notifications', icon: S.bell },
  { id: 'privacy', label: 'Privacy & Data', icon: S.shield },
]

const FONTS = [
  { id: 'Spectral', label: 'Spectral', stack: "'Spectral', Georgia, serif" },
  { id: 'Lora', label: 'Lora', stack: "'Lora', Georgia, serif" },
  { id: 'EB Garamond', label: 'Garamond', stack: "'EB Garamond', Georgia, serif" },
  { id: 'Sora', label: 'Sora', stack: "'Sora', sans-serif" },
]

const STYLES = [
  { id: 'Fantasy', img: '/fantasy-art-style.png' },
  { id: 'Anime', img: '/anime-art-style.png' },
  { id: 'Realistic', img: '/realistic-art-style-52592d.png' },
  { id: 'Cartoon', img: '/cartoon-art-style.png' },
]

const VOICES = [
  { id: 'sable', name: 'Sable', desc: 'Warm narrator', pitch: 0.9, rate: 1 },
  { id: 'lumen', name: 'Lumen', desc: 'Bright & clear', pitch: 1.15, rate: 1.05 },
  { id: 'thorne', name: 'Thorne', desc: 'Deep & grave', pitch: 0.7, rate: 0.92 },
]

const PREVIEW_TEXT =
  'The lantern guttered as Aria stepped beneath the archway, and the old stones seemed to lean in to listen. Somewhere far below, water moved through the dark — patient, unhurried, certain of its way.'

const DEFAULTS = {
  name: 'Aria Vale',
  username: 'ariawrites',
  email: 'aria@decipher.app',
  tagline: 'Spinning worlds out of starlight and stubbornness.',
  model: 'Decipher 32B',
  creativity: 65,
  tone: 'Mysterious',
  length: 'Medium (3–4 paragraphs)',
  rating: 'Teen',
  autoContinue: false,
  rememberChars: true,
  narrate: false,
  voice: 'sable',
  rate: 100,
  imgStyle: 'Fantasy',
  imgModel: 'Decipher Vivid',
  ratio: 'Portrait',
  imgCount: 4,
  safeImg: true,
  font: 'Spectral',
  textSize: 18,
  lineH: 175,
  paper: 'dark',
  nDigest: true,
  nFeatures: true,
  nReplies: true,
  nMarketing: false,
  trainOptOut: false,
}

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('decipher_settings') || '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

function Toggle({ on, onClick }) {
  return <button type="button" className={`sw ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on} />
}

function Sel({ value, onChange, options }) {
  return (
    <div className="set-selwrap">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="ch">{S.chev}</span>
    </div>
  )
}

function Row({ title, desc, children }) {
  return (
    <div className="set-row">
      <div className="rt">
        <div className="rl">{title}</div>
        {desc && <div className="rd">{desc}</div>}
      </div>
      <div className="rc">{children}</div>
    </div>
  )
}

function SecHead({ icon, title, desc }) {
  return (
    <div className="set-sechead">
      <span className="ic">{icon}</span>
      <div>
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>
    </div>
  )
}

function Settings() {
  const [s, setS] = useState(loadSettings)
  const [active, setActive] = useState('account')
  const [confirmDel, setConfirmDel] = useState(false)
  const [toast, setToast] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const firstRun = useRef(true)
  const secRefs = useRef({})
  const contentRef = useRef(null)

  const set = (k, v) => setS((prev) => ({ ...prev, [k]: v }))

  const usesPanelScroll = () => {
    const root = contentRef.current
    return Boolean(root && window.innerWidth > 1080)
  }

  useEffect(() => {
    localStorage.setItem('decipher_settings', JSON.stringify(s))
    if (firstRun.current) {
      firstRun.current = false
      return undefined
    }
    setSavedFlash(true)
    const t = setTimeout(() => setSavedFlash(false), 1400)
    return () => clearTimeout(t)
  }, [s])

  useEffect(() => {
    const onScroll = () => {
      const root = contentRef.current
      const panel = usesPanelScroll()
      const scrollPos = panel ? root.scrollTop : window.scrollY
      const pad = panel ? 48 : 140

      let cur = SECTIONS[0].id
      for (const sec of SECTIONS) {
        const el = secRefs.current[sec.id]
        if (!el) continue
        const top = panel ? el.offsetTop : el.getBoundingClientRect().top + window.scrollY
        if (top <= scrollPos + pad) cur = sec.id
      }
      setActive(cur)
    }

    const root = contentRef.current
    onScroll()
    root?.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      root?.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const go = (id) => {
    const el = secRefs.current[id]
    const root = contentRef.current
    if (!el) return

    if (usesPanelScroll() && root) {
      root.scrollTo({ top: Math.max(0, el.offsetTop - 12), behavior: 'smooth' })
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - 88
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  const speak = (v) => {
    try {
      if (!window.speechSynthesis) {
        flash('Voice preview not supported here')
        return
      }
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance('In the hush before the storm, the story begins.')
      u.pitch = v.pitch
      u.rate = v.rate * (s.rate / 100)
      window.speechSynthesis.speak(u)
    } catch {
      flash('Voice preview unavailable')
    }
  }

  const reg = (id) => (el) => {
    if (el) secRefs.current[id] = el
  }

  const fontStack = (FONTS.find((f) => f.id === s.font) || FONTS[0]).stack

  return (
    <div className="settings-page">
      <div className="set-wrap">
        <div className="set-index">
          <div className="set-id-card">
            <img src={AVATAR} alt="" />
            <div>
              <div className="nm">{s.name}</div>
              <div className="pl">
                {S.crown} Casual plan
              </div>
            </div>
          </div>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              className={`set-navitem ${active === sec.id ? 'active' : ''}`}
              onClick={() => go(sec.id)}
            >
              {sec.icon}
              <span>{sec.label}</span>
            </button>
          ))}
          <div className={`set-saved ${savedFlash ? '' : 'idle'}`}>
            {savedFlash ? S.check : S.bolt}
            {savedFlash ? 'Saved' : 'Auto-saves as you go'}
          </div>
        </div>

        <div className="set-content" ref={contentRef}>
          <div className="set-content-inner">
          <div className="set-pagehead">
            <h1>Settings</h1>
            <p>Tune Decipher to the way you create. Everything here saves automatically.</p>
          </div>

          <section className="set-sec" id="account" ref={reg('account')}>
            <SecHead icon={S.user} title="Account" desc="Your author identity across Decipher." />
            <div className="set-card">
              <div className="set-row col">
                <div className="set-avatar">
                  <img src={AVATAR} alt="" />
                  <div className="av-info">
                    <div className="av-t">Profile photo</div>
                    <div className="av-d">PNG or JPG, at least 256×256px.</div>
                    <div className="row">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => flash('Upload coming soon')}>
                        Change
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => flash('Photo removed')}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="set-row col">
                <div className="set-grid2">
                  <div>
                    <label className="set-flabel" htmlFor="set-name">
                      Display name
                    </label>
                    <input id="set-name" className="set-input" value={s.name} onChange={(e) => set('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="set-flabel" htmlFor="set-username">
                      Username
                    </label>
                    <input
                      id="set-username"
                      className="set-input"
                      value={s.username}
                      onChange={(e) => set('username', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="set-row col">
                <div>
                  <label className="set-flabel" htmlFor="set-email">
                    Email
                  </label>
                  <input
                    id="set-email"
                    className="set-input"
                    type="email"
                    value={s.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </div>
              </div>
              <div className="set-row col">
                <div>
                  <label className="set-flabel" htmlFor="set-tagline">
                    Author tagline
                  </label>
                  <textarea
                    id="set-tagline"
                    className="set-input area"
                    value={s.tagline}
                    onChange={(e) => set('tagline', e.target.value)}
                    placeholder="A line that sums up your stories…"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="set-sec" id="plan" ref={reg('plan')}>
            <SecHead icon={S.crown} title="Plan & Usage" desc="Your subscription and what's left this cycle." />
            <div className="set-plan">
              <div>
                <div className="pt">
                  Casual <span className="badge">Current</span>
                </div>
                <div className="pd">1,500 priority actions &amp; 50 images each month · renews Jul 1.</div>
              </div>
              <button type="button" className="btn btn-primary btn-md" style={{ whiteSpace: 'nowrap' }} onClick={() => flash('Pricing coming soon')}>
                {S.crown} Upgrade plan
              </button>
            </div>
            <div className="set-card" style={{ marginTop: 16 }}>
              <div className="set-meters">
                <div className="set-meter">
                  <div className="mh">
                    <span className="k">Priority actions</span>
                    <span className="v">
                      <b>960</b> / 1,500 left
                    </span>
                  </div>
                  <div className="bar">
                    <i style={{ width: '36%' }} />
                  </div>
                </div>
                <div className="set-meter">
                  <div className="mh">
                    <span className="k">Image generations</span>
                    <span className="v">
                      <b>11</b> / 50 left
                    </span>
                  </div>
                  <div className="bar">
                    <i className="warn" style={{ width: '78%' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="set-card">
              <Row title="Payment method" desc="Visa ending in 4242 · expires 08/27">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => flash('Billing portal coming soon')}>
                  Manage
                </button>
              </Row>
              <Row title="Billing history" desc="Download past invoices and receipts.">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => flash('Preparing invoices…')}>
                  {S.download} Invoices
                </button>
              </Row>
            </div>
          </section>

          <section className="set-sec" id="story" ref={reg('story')}>
            <SecHead icon={S.pen} title="Storyteller defaults" desc="How new stories begin before you tweak them per-story." />
            <div className="set-card">
              <Row title="Default model" desc="The engine that drafts your prose.">
                <Sel value={s.model} onChange={(v) => set('model', v)} options={['Decipher 32B', 'Decipher 8B (faster)', 'Decipher Muse (literary)']} />
              </Row>
              <div className="set-row">
                <div className="rt">
                  <div className="rl">Creativity</div>
                  <div className="rd">Lower stays grounded; higher takes bigger swings.</div>
                </div>
                <div className="rc">
                  <div className="set-slider-row">
                    <input
                      className="set-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={s.creativity}
                      onChange={(e) => set('creativity', +e.target.value)}
                    />
                    <span className="set-slider-val">{s.creativity}</span>
                  </div>
                </div>
              </div>
              <Row title="Default tone" desc="The mood Decipher reaches for first.">
                <Sel value={s.tone} onChange={(v) => set('tone', v)} options={['Mysterious', 'Heroic', 'Romantic', 'Dark', 'Whimsical', 'Noir']} />
              </Row>
              <Row title="Response length">
                <Sel
                  value={s.length}
                  onChange={(v) => set('length', v)}
                  options={['Short (1–2 paragraphs)', 'Medium (3–4 paragraphs)', 'Long (5+ paragraphs)']}
                />
              </Row>
              <div className="set-row col">
                <div className="rt">
                  <div className="rl">Content rating</div>
                  <div className="rd">Sets the ceiling for themes and intensity in generated stories.</div>
                </div>
                <div className="set-rating">
                  {[
                    ['Everyone', 'All-ages'],
                    ['Teen', 'Mild themes'],
                    ['Mature', '18+ · intense'],
                  ].map(([rt, rd]) => (
                    <button
                      key={rt}
                      type="button"
                      className={`set-rate ${s.rating === rt ? 'on' : ''}`}
                      onClick={() => set('rating', rt)}
                    >
                      <div className="rt">{rt}</div>
                      <div className="rdsc">{rd}</div>
                    </button>
                  ))}
                </div>
              </div>
              <Row title="Auto-continue" desc="Keep the story flowing without pressing Continue each time.">
                <Toggle on={s.autoContinue} onClick={() => set('autoContinue', !s.autoContinue)} />
              </Row>
              <Row title="Remember characters" desc="Carry names, traits and relationships between sessions.">
                <Toggle on={s.rememberChars} onClick={() => set('rememberChars', !s.rememberChars)} />
              </Row>
            </div>
          </section>

          <section className="set-sec" id="narration" ref={reg('narration')}>
            <SecHead icon={S.speaker} title="Narration" desc="Decipher can read your story aloud. Tap play to hear a voice." />
            <div className="set-card">
              <div className="set-row col">
                <div className="rt">
                  <div className="rl">Narrator voice</div>
                </div>
                <div className="set-voices">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`set-voice ${s.voice === v.id ? 'on' : ''}`}
                      onClick={() => set('voice', v.id)}
                    >
                      <span
                        className="play"
                        onClick={(e) => {
                          e.stopPropagation()
                          speak(v)
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="button"
                        tabIndex={0}
                        aria-label={`Preview ${v.name}`}
                      >
                        {S.play}
                      </span>
                      <span>
                        <span className="vt">{v.name}</span>
                        <span className="vd">{v.desc}</span>
                      </span>
                      <span className="vdot" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="set-row">
                <div className="rt">
                  <div className="rl">Speaking rate</div>
                  <div className="rd">Slower for drama, faster to skim.</div>
                </div>
                <div className="rc">
                  <div className="set-slider-row">
                    <input
                      className="set-slider"
                      type="range"
                      min="50"
                      max="150"
                      value={s.rate}
                      onChange={(e) => set('rate', +e.target.value)}
                    />
                    <span className="set-slider-val">{(s.rate / 100).toFixed(2)}×</span>
                  </div>
                </div>
              </div>
              <Row title="Auto-narrate new passages" desc="Read each beat aloud as it's generated.">
                <Toggle on={s.narrate} onClick={() => set('narrate', !s.narrate)} />
              </Row>
            </div>
          </section>

          <section className="set-sec" id="images" ref={reg('images')}>
            <SecHead icon={S.wand} title="Image Studio defaults" desc="The starting point every time you open the studio." />
            <div className="set-card">
              <div className="set-row col">
                <div className="rt">
                  <div className="rl">Default art style</div>
                </div>
                <div className="set-tiles">
                  {STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`set-tile ${s.imgStyle === st.id ? 'on' : ''}`}
                      onClick={() => set('imgStyle', st.id)}
                    >
                      <img src={st.img} alt="" />
                      <span className="sh" />
                      <span className="nm">{st.id}</span>
                      <span className="ck">{S.check}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Row title="Default model">
                <Sel value={s.imgModel} onChange={(v) => set('imgModel', v)} options={['Decipher Vivid', 'Decipher Lite', 'Decipher Ultra']} />
              </Row>
              <div className="set-row">
                <div className="rt">
                  <div className="rl">Aspect ratio</div>
                </div>
                <div className="rc">
                  <div className="set-seg">
                    {['Square', 'Portrait', 'Landscape'].map((r) => (
                      <button key={r} type="button" className={s.ratio === r ? 'on' : ''} onClick={() => set('ratio', r)}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="set-row">
                <div className="rt">
                  <div className="rl">Images per generation</div>
                </div>
                <div className="rc">
                  <div className="set-seg">
                    {[1, 2, 4].map((n) => (
                      <button key={n} type="button" className={s.imgCount === n ? 'on' : ''} onClick={() => set('imgCount', n)}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Row title="Safe mode" desc="Filter out unsafe or explicit imagery.">
                <Toggle on={s.safeImg} onClick={() => set('safeImg', !s.safeImg)} />
              </Row>
            </div>
          </section>

          <section className="set-sec" id="reading" ref={reg('reading')}>
            <SecHead icon={S.type} title="Reading experience" desc="Shape how your stories look on the page. The preview is live." />
            <div className="set-card">
              <div className="set-read">
                <div className="set-read-ctrls">
                  <div>
                    <div className="cl">Story font</div>
                    <div className="set-fonts">
                      {FONTS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`set-font ${s.font === f.id ? 'on' : ''}`}
                          onClick={() => set('font', f.id)}
                          style={{ fontFamily: f.stack }}
                        >
                          <span className="fn">{f.label}</span>
                          <span className="fl">Aa</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="cl">
                      Text size <span className="vv">{s.textSize}px</span>
                    </div>
                    <input
                      className="set-slider"
                      type="range"
                      min="15"
                      max="24"
                      value={s.textSize}
                      onChange={(e) => set('textSize', +e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <div className="cl">
                      Line spacing <span className="vv">{(s.lineH / 100).toFixed(2)}</span>
                    </div>
                    <input
                      className="set-slider"
                      type="range"
                      min="140"
                      max="210"
                      value={s.lineH}
                      onChange={(e) => set('lineH', +e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <div className="cl">Paper</div>
                    <div className="set-seg" style={{ display: 'flex' }}>
                      {[
                        ['dark', 'Dark'],
                        ['sepia', 'Sepia'],
                        ['night', 'Night'],
                      ].map(([id, l]) => (
                        <button
                          key={id}
                          type="button"
                          className={s.paper === id ? 'on' : ''}
                          style={{ flex: 1 }}
                          onClick={() => set('paper', id)}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div
                  className={`set-read-preview pv-${s.paper}`}
                  style={{ fontFamily: fontStack, fontSize: `${s.textSize}px`, lineHeight: s.lineH / 100 }}
                >
                  <span className="pv-tag">Live preview</span>
                  <h4>Chapter One</h4>
                  <p>{PREVIEW_TEXT}</p>
                  <p>She had read about places like this, but reading was a poor rehearsal for the thing itself.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="set-sec" id="notifications" ref={reg('notifications')}>
            <SecHead icon={S.bell} title="Notifications" desc="What lands in your inbox." />
            <div className="set-card">
              <Row title="Weekly digest" desc="A recap of your stories and new community scenarios.">
                <Toggle on={s.nDigest} onClick={() => set('nDigest', !s.nDigest)} />
              </Row>
              <Row title="New features" desc="Hear when we ship something worth your time.">
                <Toggle on={s.nFeatures} onClick={() => set('nFeatures', !s.nFeatures)} />
              </Row>
              <Row title="Comments & replies" desc="When someone responds on a shared story.">
                <Toggle on={s.nReplies} onClick={() => set('nReplies', !s.nReplies)} />
              </Row>
              <Row title="Offers & promotions" desc="Occasional deals on plans and credits.">
                <Toggle on={s.nMarketing} onClick={() => set('nMarketing', !s.nMarketing)} />
              </Row>
            </div>
          </section>

          <section className="set-sec" id="privacy" ref={reg('privacy')}>
            <SecHead icon={S.shield} title="Privacy & Data" desc="Control your data and what trains the model." />
            <div className="set-card">
              <Row
                title="Improve the model with my stories"
                desc="Allow anonymized content to help train future models. Off keeps your work private."
              >
                <Toggle on={!s.trainOptOut} onClick={() => set('trainOptOut', !s.trainOptOut)} />
              </Row>
              <Row title="Export my data" desc="Download all your stories, characters and images.">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => flash("Export queued — we'll email a link")}>
                  {S.download} Export
                </button>
              </Row>
            </div>
            <div className="set-card set-danger" style={{ marginTop: 16 }}>
              <SecHead icon={S.warn} title="Danger zone" />
              <Row title="Delete account" desc="Permanently erase your account and everything in it. This cannot be undone.">
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDel(true)}>
                  Delete account
                </button>
              </Row>
            </div>
          </section>
          </div>
        </div>
      </div>

      {confirmDel && (
        <div className="set-modal-ov" onClick={() => setConfirmDel(false)}>
          <div className="set-modal" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="mi">{S.warn}</div>
            <h3>Delete your account?</h3>
            <p>
              Every story, character, scenario and image you&apos;ve made will be permanently removed. This action
              can&apos;t be reversed.
            </p>
            <div className="foot">
              <button type="button" className="btn btn-ghost btn-md" onClick={() => setConfirmDel(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-md"
                onClick={() => {
                  setConfirmDel(false)
                  flash('Account deletion is disabled in this demo')
                }}
              >
                Delete forever
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="set-toast">
          {S.check}
          {toast}
        </div>
      )}
    </div>
  )
}

export default Settings
