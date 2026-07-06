import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

const LINKEDIN_URL = 'https://www.linkedin.com/company/decipher-engine-ai/posts/?feedView=all'

const Icons = {
  spark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v4M12 17v4M5 12H1M23 12h-4M6.3 6.3 3.9 3.9M20.1 20.1l-2.4-2.4M17.7 6.3l2.4-2.4M3.9 20.1l2.4-2.4" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  ),
  branch: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4v5a4 4 0 0 0 4 4h8" />
      <path d="M6 20v-5a4 4 0 0 1 4-4h8" />
      <circle cx="6" cy="4" r="2" />
      <circle cx="6" cy="20" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  ),
  compass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m15.2 8.8-2 5.4-5.4 2 2-5.4 5.4-2Z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3V5.5Z" />
      <path d="M4 5.5V22" />
      <path d="M8 7h7M8 11h8" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m21 15-4.5-4.5L6 20" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7-11-7Z" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
}

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 4.126 0 2.063 2.063 0 0 1-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const storyBeats = [
  {
    number: '01',
    title: 'Set the spark',
    text: 'Give Decipher a mood, a character, or a strange problem to begin with.',
  },
  {
    number: '02',
    title: 'Enter the world',
    text: 'The engine opens with a scene, a conflict, and a reason to make your first move.',
  },
  {
    number: '03',
    title: 'Change the fate',
    text: 'Every action becomes the next thread, so the adventure grows around your choices.',
  },
]

const features = [
  {
    kicker: 'World builder',
    title: 'Create a setting with rules, factions, threats, and secrets.',
    text: 'Give the AI enough structure to improvise without losing the soul of the world you imagined.',
    icon: Icons.compass,
  },
  {
    kicker: 'Story creator',
    title: 'Write by playing, not staring at a blank page.',
    text: 'Your next line can be dialogue, action, direction, or a choice. The engine answers in story.',
    icon: Icons.branch,
  },
  {
    kicker: 'Image studio',
    title: 'Turn scenes into visual references.',
    text: 'Generate character, location, and atmosphere art that matches the adventure you are building.',
    icon: Icons.image,
  },
  {
    kicker: 'Library',
    title: 'Return to your favorite adventures.',
    text: 'Continue stories and scenarios instead of losing the thread when a session ends.',
    icon: Icons.book,
  },
]

const worlds = [
  {
    title: 'The Glass Kingdom',
    genre: 'Fantasy',
    image: '/fantasy-art-style.png',
    text: 'A royal court where every oath becomes visible in the air.',
  },
  {
    title: 'Neon Afterlight',
    genre: 'Sci-fi',
    image: '/storytelling_hero_background_modern 2.png',
    text: 'A city-sized engine predicts crimes before people dream them.',
  },
  {
    title: 'The Quiet Case',
    genre: 'Mystery',
    image: '/realistic-art-style-52592d.png',
    text: 'A missing author leaves behind a book that changes every night.',
  },
  {
    title: 'Starlit Letters',
    genre: 'Romance',
    image: '/anime-art-style.png',
    text: 'Two strangers trade messages through a broken constellation.',
  },
]

function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('.dz-landing .reveal')

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('in'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}

function Nav({ onSignup, onSignin, onBrand }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`} aria-label="Main navigation">
      <div className="hp-wrap nav-shell">
        <button className="brand-lockup" type="button" onClick={onBrand} aria-label="Decipher Engine home">
          <img src="/decipher-logo.png" alt="" />
          <span>Decipher Engine</span>
        </button>

        <div className="nav-links" aria-label="Landing sections">
          <a href="#showcase">How it works</a>
          <a href="#features">Tools</a>
          <a href="#worlds">Worlds</a>
        </div>

        <div className="nav-actions">
          <button className="hp-link-btn" type="button" onClick={onSignin}>Sign in</button>
          <button className="hp-btn hp-btn-primary hp-btn-sm" type="button" onClick={onSignup}>Start creating</button>
        </div>
      </div>
    </nav>
  )
}

function Hero({ onSignup }) {
  return (
    <header className="hero-section">
      <div className="hero-media" aria-hidden="true">
        <video
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/storytelling_hero_background_modern 2.png"
        >
          <source src="/VideoBg.mp4" type="video/mp4" />
        </video>
        <img className="hero-fallback-image" src="/storytelling_hero_background_modern 2.png" alt="" />
      </div>
      <div className="hero-atmosphere" aria-hidden="true">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
      </div>

      <div className="hp-wrap hero-content">
        <img className="hero-logo-mark" src="/decipher-logo.png" alt="" />
        <div className="hero-copy">
          <span className="hp-eyebrow">{Icons.spark} AI storytelling engine</span>
          <h1>Decipher Engine</h1>
          <p>
            A playable AI story engine where your choices become worlds,
            characters, and adventures that keep moving.
          </p>
          <div className="hero-actions">
            <button className="hp-btn hp-btn-primary hp-btn-lg" type="button" onClick={onSignup}>
              Start your adventure
            </button>
            <a className="hp-btn hp-btn-secondary hp-btn-lg" href="#showcase">
              See how it works
            </a>
          </div>
        </div>
      </div>
      <a className="scroll-cue" href="#showcase" aria-label="Scroll to learn how Decipher works">
        <span>Scroll</span>
        <i />
      </a>
    </header>
  )
}

function Showcase() {
  return (
    <section id="showcase" className="hp-section story-section">
      <div className="hp-wrap story-stage">
        <div className="story-art reveal">
          <img src="/ai_storytelling_platform_balanced 1.png" alt="" />
          <div className="story-art-shade" />
          <div className="story-art-caption">
            <span>Scene seed</span>
            <p>"A forgotten tower starts answering questions in your own voice."</p>
          </div>
        </div>

        <div className="story-copy reveal">
          <span className="hp-eyebrow">{Icons.spark} Story ignition</span>
          <h2>Write the first line. Watch the world wake up.</h2>
          <p>
            Decipher is built for the moment where a tiny idea becomes a place
            you can enter. No dashboards in the way. Just a prompt, a world, and
            the next choice waiting for you.
          </p>

          <div className="story-beats">
            {storyBeats.map((beat, index) => (
              <article className="story-beat" style={{ transitionDelay: `${index * 80}ms` }} key={beat.title}>
                <span>{beat.number}</span>
                <div>
                  <h3>{beat.title}</h3>
                  <p>{beat.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureMosaic() {
  return (
    <section id="features" className="hp-section feature-section">
      <div className="hp-wrap">
        <div className="section-copy centered reveal">
          <span className="hp-eyebrow">{Icons.compass} Creative suite</span>
          <h2>Build the adventure from every angle.</h2>
          <p>
            Stories, worlds, visuals, and saved sessions work together as one
            interactive creation space.
          </p>
        </div>

        <div className="feature-mosaic">
          {features.map((feature, index) => (
            <article
              className={`feature-tile reveal ${index === 0 ? 'feature-tile-large' : ''}`}
              style={{ transitionDelay: `${index * 80}ms` }}
              key={feature.title}
            >
              <div className="feature-icon">{feature.icon}</div>
              <span>{feature.kicker}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Worlds() {
  return (
    <section id="worlds" className="hp-section world-section">
      <div className="hp-wrap">
        <div className="world-head reveal">
          <div className="section-copy">
            <span className="hp-eyebrow">{Icons.book} Explore worlds</span>
            <h2>Choose a genre, then bend it.</h2>
          </div>
          <p>
            Start from familiar story shapes and let your choices make them personal.
            These are original sample worlds for the Decipher experience.
          </p>
        </div>

        <div className="world-grid">
          {worlds.map((world, index) => (
            <article className="world-card reveal" style={{ transitionDelay: `${index * 80}ms` }} key={world.title}>
              <img src={world.image} alt="" />
              <div className="world-overlay">
                <span>{world.genre}</span>
                <h3>{world.title}</h3>
                <p>{world.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA({ onSignup }) {
  return (
    <section className="final-cta-section">
      <div className="hp-wrap">
        <div className="final-cta-card reveal">
          <span className="hp-eyebrow">{Icons.spark} Begin</span>
          <h2>Your next world starts with one choice.</h2>
          <p>
            Create a character, open a door, ask the wrong question, or write a
            sentence the AI has to answer.
          </p>
          <div className="hero-actions">
            <button className="hp-btn hp-btn-primary hp-btn-lg" type="button" onClick={onSignup}>
              Create a story
              {Icons.arrow}
            </button>
            <a className="hp-btn hp-btn-secondary hp-btn-lg" href="#worlds">
              Browse worlds
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer({ onBrand }) {
  return (
    <footer className="landing-footer">
      <div className="hp-wrap footer-grid">
        <button className="brand-lockup footer-brand" type="button" onClick={onBrand}>
          <img src="/decipher-logo.png" alt="" />
          <span>Decipher Engine</span>
        </button>
        <p>An AI storytelling platform for playable worlds, adaptive stories, and creative exploration.</p>
        <div className="footer-links">
          <a href="#showcase">How it works</a>
          <a href="#features">Tools</a>
          <a href="#worlds">Worlds</a>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="Decipher Engine on LinkedIn">
            <LinkedInIcon />
          </a>
        </div>
      </div>
    </footer>
  )
}

function Landing() {
  const navigate = useNavigate()
  useReveal()

  const goSignup = () => navigate('/signup')
  const goSignin = () => navigate('/login')
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="dz-landing">
      <Nav onSignup={goSignup} onSignin={goSignin} onBrand={goTop} />
      <main>
        <Hero onSignup={goSignup} />
        <Showcase />
        <FeatureMosaic />
        <Worlds />
        <FinalCTA onSignup={goSignup} />
      </main>
      <Footer onBrand={goTop} />
    </div>
  )
}

export default Landing
