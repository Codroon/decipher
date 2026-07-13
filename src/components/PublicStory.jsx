import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPublicStory } from '../services/publicService'
import ReportModal from './ReportModal'
import './Discover.css'

// Read-only view of a story another user has shared publicly.
function PublicStory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const res = await getPublicStory(id)
      if (!active) return
      if (res.success) setStory(res.story)
      else setError(res.error || 'Story not found')
      setLoading(false)
    })()
    return () => { active = false }
  }, [id])

  if (loading) return <div className="discover-page"><div className="discover-status">Loading story…</div></div>
  if (error) {
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

  const chunks = Array.isArray(story.MainStory) ? story.MainStory : []

  // Group passages into their real chapters, in order. Legacy stories (all
  // chapter 0, or a per-chunk storyChapters overlay) collapse to a single chapter.
  const rawChapters = Array.isArray(story.storyChapters) ? story.storyChapters : []
  const realChapters = rawChapters.filter((c) => typeof c.order === 'number')
  const chapters = (realChapters.length > 0
    ? [...realChapters].sort((a, b) => a.order - b.order)
    : [{ order: 0, title: '' }]
  ).map((ch) => ({
    ...ch,
    passages: chunks.filter((c) => (typeof c.chapter === 'number' ? c.chapter : 0) === ch.order),
  })).filter((ch) => ch.passages.length > 0)

  return (
    <div className="discover-page">
     <div className="discover-wrap">
      <div className="discover-topbar">
        <button className="discover-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="discover-spacer" />
        <button className="discover-report" onClick={() => setShowReport(true)} title="Report this story">
          ⚑ Report
        </button>
      </div>

      <header className="discover-header">
        <h1 className="discover-title">{story.title || 'Untitled Story'}</h1>
        <div className="discover-meta">
          <span className="discover-author">
            <span className="discover-avatar" />
            By {story.author?.name || 'Unknown'}
          </span>
          {story.storyStats?.readingTime ? <span>{story.storyStats.readingTime} min read</span> : null}
          {story.storyStats?.totalWords ? <span>{story.storyStats.totalWords.toLocaleString()} words</span> : null}
          {story.contentRating && story.contentRating !== 'unrated' && (
            <span className="discover-badge">{story.contentRating}</span>
          )}
        </div>
      </header>

      {chunks.length === 0 ? (
        <section className="discover-section">
          <div className="discover-prose"><p>This story has no content yet.</p></div>
        </section>
      ) : (
        chapters.map((ch, ci) => {
          const cleanTitle = ch.title && !/^chapter\s*\d+$/i.test(ch.title) ? ch.title : ''
          return (
            <section className="discover-section" key={ch.order ?? ci}>
              <h2>Chapter {(ch.order ?? ci) + 1}{cleanTitle ? `: ${cleanTitle}` : ''}</h2>
              <div className="discover-prose">
                {ch.passages.map((c, i) => <p key={c.index ?? i}>{c.content}</p>)}
              </div>
            </section>
          )
        })
      )}

     </div>

      {showReport && (
        <ReportModal
          resourceType="story"
          resourceId={id}
          title={story.title}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}

export default PublicStory
