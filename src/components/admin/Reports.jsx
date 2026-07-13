import React, { useEffect, useState, useCallback } from 'react'
import * as adminService from '../../services/adminService'

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—')

// Renders the reported content body. This is the only place private content
// surfaces in the admin panel, and only because it was flagged.
function ContentViewer({ report, content, onClose, onTakedown }) {
  const c = content || {}
  const removed = c.moderationStatus === 'removed'
  // Stories store their body as an ordered array of chunks in `MainStory`.
  const storyBody = Array.isArray(c.MainStory)
    ? [...c.MainStory].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map((ch) => ch.content).filter(Boolean).join('\n\n')
    : ''

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 640, maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h3>Reported {report.resourceType}</h3>
        <p>Owner: {c.userId?.email || 'unknown'} · Reported: {report.reason}</p>

        <div className="admin-kv" style={{ marginTop: 4 }}>
          {report.resourceType !== 'image' && <span className="k">Visibility</span>}
          {report.resourceType !== 'image' && <span style={{ textTransform: 'capitalize' }}>{c.visibility || '—'}</span>}
        </div>
        {report.resourceType !== 'image' && (
          <div className="admin-kv"><span className="k">Rating</span><span style={{ textTransform: 'capitalize' }}>{c.contentRating || '—'}</span></div>
        )}
        <div className="admin-kv"><span className="k">Moderation</span><span style={{ textTransform: 'capitalize' }}>{c.moderationStatus || 'active'}</span></div>

        {report.resourceType === 'image' ? (
          <>
            <div className="admin-kv" style={{ marginTop: 8 }}><span className="k">Prompt</span></div>
            <div className="admin-reason-box">{c.prompt}</div>
            <div className="admin-kv" style={{ marginTop: 8 }}><span className="k">Model</span><span>{c.model}</span></div>
          </>
        ) : report.resourceType === 'scenario' ? (
          <>
            <div className="admin-kv" style={{ marginTop: 8 }}><span className="k">Title</span><span>{c.title || '—'}</span></div>
            <div className="admin-reason-box" style={{ marginTop: 8 }}>{c.description || c.opening || '(no text)'}</div>
          </>
        ) : (
          <>
            <div className="admin-kv" style={{ marginTop: 8 }}><span className="k">Title</span><span>{c.title || '—'}</span></div>
            <div className="admin-reason-box" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
              {storyBody || '(no text)'}
            </div>
          </>
        )}

        <div className="admin-modal-actions" style={{ marginTop: 16 }}>
          <button className="admin-btn" onClick={onClose}>Close</button>
          {!removed && (
            <button className="admin-btn danger" onClick={() => onTakedown(report)}>Take down content</button>
          )}
        </div>
      </div>
    </div>
  )
}

function Reports() {
  const [data, setData] = useState({ reports: [], pagination: { page: 1, pages: 1, total: 0 } })
  const [status, setStatus] = useState('open')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewer, setViewer] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await adminService.listReports({ status, page, limit: 20 })
      if (res.success) setData(res.data)
      else setError(res.message || 'Failed to load reports')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => { load() }, [load])

  const viewContent = async (report) => {
    const res = await adminService.getReportContent(report._id)
    if (res.success) setViewer({ report: res.data.report, content: res.data.content })
    else setError(res.message || 'Could not load content')
  }

  const resolve = async (report, newStatus) => {
    const note = newStatus === 'dismissed' ? (window.prompt('Note (optional)') || '') : (window.prompt('Resolution note (optional)') || '')
    const res = await adminService.updateReport(report._id, newStatus, note)
    if (res.success) load()
    else setError(res.message || 'Update failed')
  }

  const takedown = async (report) => {
    const label = report.resourceType
    if (!window.confirm(`Take down this ${label}? It will be forced private, hidden from public discovery, and the owner will not be able to re-publish it.`)) return
    const note = window.prompt('Reason / note (optional)') || ''
    const res = await adminService.takedownContent(report._id, note)
    if (res.success) {
      setViewer(null)
      load()
    } else {
      setError(res.message || 'Takedown failed')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Reports</h1>
          <p>Content flagged by users. Reviewing a report is the only way to open a private body.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <select className="admin-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Type</th><th>Reason</th><th>Owner</th><th>Reporter</th><th>Filed</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><div className="admin-loading">Loading…</div></td></tr>
            ) : data.reports.length === 0 ? (
              <tr><td colSpan={7}><div className="admin-empty">No reports.</div></td></tr>
            ) : (
              data.reports.map((r) => (
                <tr key={r._id}>
                  <td style={{ textTransform: 'capitalize' }}>{r.resourceType}</td>
                  <td style={{ maxWidth: 220 }}>{r.reason}</td>
                  <td>{r.resourceOwner?.email || '—'}</td>
                  <td>{r.reporter?.email || '—'}</td>
                  <td>{fmt(r.createdAt)}</td>
                  <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-btn" onClick={() => viewContent(r)}>View</button>
                      {r.status !== 'resolved' && r.status !== 'dismissed' && (
                        <>
                          <button className="admin-btn primary" onClick={() => resolve(r, 'resolved')}>Resolve</button>
                          <button className="admin-btn" onClick={() => resolve(r, 'dismissed')}>Dismiss</button>
                          <button className="admin-btn danger" onClick={() => takedown(r)}>Take down</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button className="admin-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>Page {data.pagination.page} of {data.pagination.pages}</span>
        <button className="admin-btn" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      {viewer && <ContentViewer report={viewer.report} content={viewer.content} onClose={() => setViewer(null)} onTakedown={takedown} />}
    </div>
  )
}

export default Reports
