import React, { useState } from 'react'
import { submitReport } from '../services/reportService'
import './ReportModal.css'

const REASONS = [
  'Sexual or explicit content',
  'Hateful or abusive content',
  'Violence or dangerous acts',
  'Spam or misleading',
  'Other',
]

/**
 * Reusable content-report dialog.
 *
 * @param {{resourceType:'story'|'scenario'|'image', resourceId:string, title?:string, onClose:()=>void}} props
 */
function ReportModal({ resourceType, resourceId, title, onClose }) {
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError('')
    const fullReason = details.trim() ? `${reason}: ${details.trim()}` : reason
    try {
      const res = await submitReport(resourceType, resourceId, fullReason)
      if (res.success) {
        setDone(true)
        setTimeout(onClose, 1400)
      } else {
        setError(res.message || 'Could not submit report')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="report-overlay" onClick={onClose} role="presentation">
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="report-done">
            <div className="report-check">✓</div>
            <h3>Report submitted</h3>
            <p>Thanks — our team will review this {resourceType}.</p>
          </div>
        ) : (
          <>
            <div className="report-head">
              <h3>Report {resourceType}</h3>
              <button className="report-x" onClick={onClose} aria-label="Close">×</button>
            </div>
            {title && <p className="report-target">“{title}”</p>}
            {error && <div className="report-error">{error}</div>}

            <label className="report-label">Why are you reporting this?</label>
            <div className="report-reasons">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`report-reason ${reason === r ? 'active' : ''}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <label className="report-label">Additional details (optional)</label>
            <textarea
              className="report-textarea"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Anything a moderator should know…"
            />

            <div className="report-actions">
              <button type="button" className="report-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="button" className="report-btn danger" onClick={submit} disabled={busy}>
                {busy ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportModal
