import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

/* ---------------- Icon set ---------------- */
const I = {
  pen: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>,
  spark: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M5 12H1M23 12h-4M6.3 6.3L4 4M20 20l-2.3-2.3M17.7 6.3L20 4M4 20l2.3-2.3"/><circle cx="12" cy="12" r="3.2"/></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>,
  layers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  star: <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
}

const social = {
  x: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  ig: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>,
  dc: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.3.5a18 18 0 0 1 4.4 1.4 16.4 16.4 0 0 0-14.9 0A18 18 0 0 1 9 3.5L8.7 3a19.8 19.8 0 0 0-5 1.4C.7 9 .1 13.5.4 17.9a20 20 0 0 0 6 3l.5-.7a13 13 0 0 1-2-1l.5-.3a14 14 0 0 0 12 0l.5.3a13 13 0 0 1-2 1l.5.7a20 20 0 0 0 6-3c.4-5.1-.6-9.6-2.6-13.5zM8.4 15.3c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm7.2 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z"/></svg>,
}

const HERO_SUB = 'A text-based adventure you direct — brought to life by AI.'

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.dz-landing .reveal')
    if (!('IntersectionObserver' in window)) {
      els.forEach(e => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [])
}

function Nav({ onSignup, onBrand }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="wrap nav-inner">
        <div className="brand" onClick={onBrand}>
          <img className="brand-logo" src="/decipher-logo.png" alt="Decipher Engine" />
          <span className="brand-name">Decipher Engine</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#styles">Art Styles</a>
          <a href="#how">How it works</a>
          <a href="#explore">Explore</a>
        </div>
        <div className="nav-actions">
          <button className="btn btn-primary btn-md" onClick={onSignup}>Sign Up</button>
        </div>
      </div>
    </nav>
  )
}

function Hero({ sub, onSignup }) {
  return (
    <header className="hero">
      <div className="hero-bg">
        <img src="/fantasy-art-style.png" alt="A world unfolding from a glowing book" />
      </div>
      <div className="hero-veil"></div>
      <div className="wrap hero-c">
        <img className="hero-logo-mark" src="/decipher-logo.png" alt="" />
        <span className="eyebrow"><span className="dot"></span>AI Storytelling Engine</span>
        <h1 className="hero-wordmark" style={{ marginTop: 18 }}>
          Decipher <span className="eng grad-text">Engine</span>
        </h1>
        <p className="hero-tagline">{sub}</p>
        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" onClick={onSignup}>Start playing — free</button>
          <a className="btn btn-ghost btn-lg btn-play" href="#styles">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            See it in action
          </a>
        </div>
        <div className="hero-stats">
          <div className="stat"><div className="num"><span className="grad-text">120K+</span></div><div className="lbl">Stories created</div></div>
          <div className="stat"><div className="num"><span className="grad-text">4</span></div><div className="lbl">Art styles</div></div>
          <div className="stat"><div className="num"><span className="grad-text">∞</span></div><div className="lbl">Worlds to explore</div></div>
        </div>
      </div>
    </header>
  )
}

const FEATURES = [
  { ic: I.pen, t: 'AI Story Creator', d: 'Co-write branching narratives with an AI that remembers your characters, plot threads, and tone.' },
  { ic: I.image, t: 'Image Studio', d: 'Turn any scene into art in fantasy, anime, realistic or cartoon styles — generated in seconds.' },
  { ic: I.map, t: 'Scenario Builder', d: 'Design living worlds, locations and rules, then drop your heroes in to see what unfolds.' },
  { ic: I.chat, t: 'Living Characters', d: 'Every character has memory and motivation, so conversations feel improvised, never scripted.' },
]

function Features() {
  return (
    <section id="features" className="section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow"><span className="dot"></span>The toolkit</span>
          <h2 className="section-title">Everything you need to<br/>tell a story worth living</h2>
          <p className="section-desc">A complete creative studio — writing, art, and world-building — woven together by one AI that understands your story.</p>
        </div>
        <div className="feat-grid">
          {FEATURES.map((f, i) => (
            <div className="feat-card reveal" style={{ transitionDelay: `${i * 80}ms` }} key={f.t}>
              <div className="feat-ic">{f.ic}</div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const STYLES = [
  { key: 'fantasy', name: 'Fantasy', sub: 'Epic, luminous, otherworldly', img: '/fantasy-art-style.png',
    head: 'Worlds that glow off the page', desc: 'Sweeping vistas, magic and myth — rendered with cinematic light for high-fantasy and adventure tales.' },
  { key: 'anime', name: 'Anime', sub: 'Warm, expressive, intimate', img: '/anime-art-style.png',
    head: 'Feeling in every frame', desc: 'Soft lighting and emotive characters — ideal for romance, slice-of-life and coming-of-age stories.' },
  { key: 'realistic', name: 'Realistic', sub: 'Cinematic, grounded, filmic', img: '/realistic-art-style-52592d.png',
    head: 'Like stills from a film', desc: 'Photoreal scenes with natural light and depth — for historical drama, mystery and literary fiction.' },
  { key: 'cartoon', name: 'Cartoon', sub: 'Bright, playful, animated', img: '/cartoon-art-style.png',
    head: 'Big, joyful, full of life', desc: 'Vivid characters and bold color — perfect for family adventures, comedy and all-ages worlds.' },
]

function ArtStyles() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const DUR = 4200

  useEffect(() => {
    if (paused) return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setTimeout(() => setActive((a) => (a + 1) % STYLES.length), DUR)
    return () => clearTimeout(id)
  }, [active, paused])

  const hold = () => setPaused(true)
  const release = () => setPaused(false)

  return (
    <section id="styles" className="section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow"><span className="dot"></span>Image Studio</span>
          <h2 className="section-title">One story. <span className="grad-text">Infinite styles.</span></h2>
          <p className="section-desc">Pick the look that fits your world. Decipher Engine renders every scene, character and location in the style you choose.</p>
        </div>
        <div className="styles-grid">
          <div className="style-tabs" onMouseEnter={hold} onMouseLeave={release}>
            {STYLES.map((s, i) => (
              <button className={`style-tab ${i === active ? 'active' : ''}`} key={s.key}
                onMouseEnter={() => setActive(i)} onClick={() => setActive(i)}>
                <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="st" style={{ display: 'block' }}>{s.name}</span>
                  <span className="sd">{s.sub}</span>
                </span>
                {i === active && !paused && (
                  <span className="tab-progress" key={active} style={{ animationDuration: `${DUR}ms` }}></span>
                )}
              </button>
            ))}
          </div>
          <div className="style-stage" onMouseEnter={hold} onMouseLeave={release}>
            {STYLES.map((s, i) => (
              <img key={s.key} src={s.img} alt={s.name} className={i === active ? 'show' : ''} />
            ))}
            <div className="cap">
              <span className="badge">{STYLES[active].name} style</span>
              <h4>{STYLES[active].head}</h4>
              <p>{STYLES[active].desc}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  { t: 'Imagine', d: 'Describe a world, a character, or just a feeling. A sentence is enough to begin.' },
  { t: 'Generate', d: 'Decipher Engine writes the scene, casts the characters and paints the art — all in your chosen style.' },
  { t: 'Live it', d: 'Make choices, talk to characters, and steer the story. Every playthrough is yours alone.' },
]

function HowItWorks() {
  return (
    <section id="how" className="section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow"><span className="dot"></span>How it works</span>
          <h2 className="section-title">From a spark to a saga<br/>in three steps</h2>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step reveal" style={{ transitionDelay: `${i * 90}ms` }} key={s.t}>
              <div className="n"><span className="grad-text">0{i + 1}</span></div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
              {i < STEPS.length - 1 && <div className="step-line"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const SHOW = [
  { img: '/fantasy-art-style.png', genre: 'Fantasy', t: 'Beneath the Obsidian Moon', d: 'A dark romance unfolds in a world cloaked in eternal twilight.', by: 'Sarah Chen' },
  { img: '/anime-art-style.png', genre: 'Romance', t: 'Coffee at the End of Time', d: "Two strangers keep meeting in a café that shouldn't exist.", by: 'Marcus Lee' },
  { img: '/realistic-art-style-52592d.png', genre: 'Mystery', t: 'The Long Way Home', d: 'A 19th-century escape that turns into something far stranger.', by: 'Ada Moreau' },
]

function Showcase() {
  return (
    <section id="explore" className="section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow"><span className="dot"></span>The community</span>
          <h2 className="section-title">Worlds dreamed up by storytellers</h2>
          <p className="section-desc">Explore, remix and play stories shared by the Decipher Engine community — or publish your own.</p>
        </div>
        <div className="show-grid">
          {SHOW.map((c, i) => (
            <div className="show-card reveal" style={{ transitionDelay: `${i * 80}ms` }} key={c.t}>
              <img src={c.img} alt={c.t} />
              <div className="ov">
                <span className="genre">{c.genre}</span>
                <h4>{c.t}</h4>
                <p>{c.d}</p>
                <div className="by">
                  <img className="av" src="/author-avatar-7942f7.png" alt={c.by} />
                  <span>By {c.by}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA({ onSignup }) {
  return (
    <section className="section" style={{ paddingBottom: 0 }}>
      <div className="wrap">
        <div className="cta reveal">
          <span className="eyebrow"><span className="dot"></span>Free to play</span>
          <h2 style={{ marginTop: 18 }}>Your next world is<br/>one prompt away</h2>
          <p>Plenty of options to grow with you. Start free, upgrade whenever you're ready.</p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onSignup}>Get started — free</button>
            <a className="btn btn-ghost btn-lg" href="#explore">Explore worlds</a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const cols = [
    { h: 'Product', l: ['Story Creator', 'Image Studio', 'Scenario Builder', 'Library'] },
    { h: 'Explore', l: ['Community worlds', 'Art styles', 'Pricing', 'Changelog'] },
    { h: 'Company', l: ['About', 'Blog', 'Careers', 'Contact'] },
  ]
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="brand">
              <img className="brand-logo" src="/decipher-logo.png" alt="Decipher Engine" />
              <span className="brand-name">Decipher Engine</span>
            </div>
            <p className="blurb">An AI storytelling engine for writing, art and living worlds. Create, explore and live infinite stories.</p>
          </div>
          {cols.map(c => (
            <div key={c.h}>
              <h5>{c.h}</h5>
              <ul>{c.l.map(x => <li key={x}><a href="#">{x}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 Decipher Engine. Crafted for storytellers.</span>
          <div className="socials">
            <a href="#" aria-label="X">{social.x}</a>
            <a href="#" aria-label="Instagram">{social.ig}</a>
            <a href="#" aria-label="Discord">{social.dc}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function Landing() {
  const navigate = useNavigate()
  useReveal()

  const goSignup = () => navigate('/signup')
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="dz-landing">
      <div className="starfield"></div>
      <Nav onSignup={goSignup} onBrand={goTop} />
      <Hero sub={HERO_SUB} onSignup={goSignup} />
      <Features />
      <ArtStyles />
      <HowItWorks />
      <Showcase />
      <CTA onSignup={goSignup} />
      <Footer />
    </div>
  )
}

export default Landing
