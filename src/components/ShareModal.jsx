import React, { useState } from 'react'
import { setStoryVisibility } from '../services/storyService'
import { updateScenario } from '../services/scenarioService'
import './ReportModal.css'

const VIS_OPTIONS = [
  { value: 'private', label: 'Private', hint: 'Only you can see this.' },
  { value: 'unlisted', label: 'Unlisted', hint: 'Anyone with the link can view it — not listed publicly.' },
  { value: 'published', label: 'Public', hint: 'Listed in community discovery for everyone.' },
]

const RATINGS = [
  { value: 'unrated', label: 'Unrated' },
  { value: 'everyone', label: 'Everyone' },
  { value: 'teen', label: 'Teen' },
  { value: 'mature', label: 'Mature' },
]

/**
 * Owner-facing sharing dialog for a story or scenario.
 *
 * @param {{
 *   resourceType: 'story'|'scenario',
 *   resource: { _id:string, title?:string, visibility?:string, contentRating?:string },
 *   onClose: () => void,
 *   onUpdated?: (fields:{ visibility:string, contentRating:string }) => void
 * }} props
 */
function ShareModal({ resourceType, resource, onClose, onUpdated }) {
  const [visibility, setVisibility] = useState(resource?.visibility || 'private')
  const [contentRating, setContentRating] = useState(resource?.contentRating || 'unrated')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/discover/${resourceType}/${resource?._id}`
  const isPublic = visibility === 'published' || visibility === 'unlisted'

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      const res = resourceType === 'story'
        ? await setStoryVisibility(resource._id, visibility, contentRating)
        : await updateScenario(resource._id, { visibility, contentRating })
      if (res.success) {
        onUpdated?.({ visibility, contentRating })
        onClose()
      } else {
        setError(res.error || 'Could not update sharing settings')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('Could not copy link')
    }
  }

  return (
    <div className="report-overlay" onClick={onClose} role="presentation">
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-head">
          <h3>Share {resourceType}</h3>
          <button className="report-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        {resource?.title && <p className="report-target">“{resource.title}”</p>}
        {error && <div className="report-error">{error}</div>}

        <label className="report-label">Who can see this?</label>
        <div className="share-options">
          {VIS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`share-option ${visibility === o.value ? 'active' : ''}`}
              onClick={() => setVisibility(o.value)}
            >
              <span className="share-option-label">{o.label}</span>
              <span className="share-option-hint">{o.hint}</span>
            </button>
          ))}
        </div>

        {isPublic && (
          <>
            <label className="report-label">Content rating</label>
            <select className="share-select" value={contentRating} onChange={(e) => setContentRating(e.target.value)}>
              {RATINGS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            <label className="report-label">Shareable link</label>
            <div className="share-link-row">
              <input className="share-link-input" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
              <button type="button" className="report-btn ghost" onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
          </>
        )}

        <div className="report-actions">
          <button type="button" className="report-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="report-btn primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
