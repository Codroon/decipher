import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPublicScenario } from '../services/publicService'
import { initializeStoryFromScenario } from '../services/storyService'
import ReportModal from './ReportModal'
import './Discover.css'

const Group = ({ title, items }) => {
  if (!Array.isArray(items) || items.length === 0) return null
  return (
    <section className="discover-section">
      <h2>{title}</h2>
      <div className="discover-entities">
        {items.map((it, i) => (
          <div className="discover-entity" key={i}>
            <h3>{it.name || 'Unnamed'}</h3>
            {it.description && <p>{it.description}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

// Public view of a shared scenario. Any signed-in user can launch their own
// story from it (the backend clones the scenario context on play).
function PublicScenario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scenario, setScenario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const res = await getPublicScenario(id)
      if (!active) return
      if (res.success) setScenario(res.scenario)
      else setError(res.error || 'Scenario not found')
      setLoading(false)
    })()
    return () => { active = false }
  }, [id])

  const play = async () => {
    // Playing writes a new story for the current user — require sign in first.
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    setPlaying(true)
    setError('')
    const result = await initializeStoryFromScenario(id)
    setPlaying(false)
    if (result.success && result.storyId) {
      navigate(`/story-creator/${result.storyId}`)
    } else {
      setError(result.error || 'Failed to start a story from this scenario')
    }
  }

  if (loading) return <div className="discover-page"><div className="discover-status">Loading scenario…</div></div>
  if (error && !scenario) {
    return (
      <div className="discover-page">
        <div className="discover-wrap">
          <div className="discover-topbar">
            <button className="discover-back" onClick={() => navigate(-1)}>← Back</button>
          </div>
          <div className="discover-status discover-error">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="discover-page">
     <div className="discover-wrap">
      <div className="discover-topbar">
        <button className="discover-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="discover-spacer" />
        <button className="discover-report" onClick={() => setShowReport(true)} title="Report this scenario">
          ⚑ Report
        </button>
      </div>

      <header className="discover-header">
        <h1 className="discover-title">{scenario.title || 'Untitled Scenario'}</h1>
        <div className="discover-meta">
          <span className="discover-author">
            <span className="discover-avatar" />
            By {scenario.author?.name || 'Unknown'}
          </span>
          {scenario.contentRating && scenario.contentRating !== 'unrated' && (
            <span className="discover-badge">{scenario.contentRating}</span>
          )}
        </div>
      </header>

      {scenario.description && <p className="discover-desc">{scenario.description}</p>}

      {Array.isArray(scenario.tags) && scenario.tags.length > 0 && (
        <div className="discover-tags">
          {scenario.tags.map((t) => <span className="discover-tag" key={t}>{t}</span>)}
        </div>
      )}

      <button className="discover-play" onClick={play} disabled={playing}>
        {playing ? 'Starting…' : '▶ Play this scenario'}
      </button>

      {error && <p className="discover-status discover-error" style={{ padding: '16px 0 0' }}>{error}</p>}

      {scenario.opening && (
        <section className="discover-section">
          <h2>Opening</h2>
          <div className="discover-opening">{scenario.opening}</div>
        </section>
      )}

      <Group title="Characters" items={scenario.characters} />
      <Group title="Locations" items={scenario.locations} />
      <Group title="Creatures" items={scenario.creatures} />
     </div>

      {showReport && (
        <ReportModal
          resourceType="scenario"
          resourceId={id}
          title={scenario.title}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}

export default PublicScenario
