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
}

const SECTIONS = [
  { id: 'account', label: 'Account', icon: S.user },
  { id: 'plan', label: 'Plan & Usage', icon: S.crown },
]

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

  const reg = (id) => (el) => {
    if (el) secRefs.current[id] = el
  }

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

          <section className="set-sec">
            <div className="set-card set-danger">
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
