import React, { useEffect, useState, useCallback } from 'react'
import * as adminService from '../../services/adminService'

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—')
const outcomeLabel = { success: 'success', client_error: 'client error', server_error: 'server error' }

// Full-record drawer: shows meta, the error (message + stack) and the request
// trace (every row sharing this requestId).
function DetailModal({ row, onClose }) {
  const [trace, setTrace] = useState(null)

  useEffect(() => {
    let alive = true
    if (row?.requestId) {
      adminService.getActivityTrace(row.requestId).then((res) => {
        if (alive && res.success) setTrace(res.data.logs)
      })
    }
    return () => { alive = false }
  }, [row])

  if (!row) return null
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 680, maxHeight: '84vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h3>{row.action || `${row.method} ${row.path}`}</h3>
        <p>{fmt(row.createdAt)} · <code>{row.requestId}</code></p>

        <div className="admin-kv"><span className="k">User</span><span>{row.userId?.email || row.userEmail || '—'}</span></div>
        <div className="admin-kv"><span className="k">Route</span><span>{row.method} {row.path}</span></div>
        <div className="admin-kv"><span className="k">Outcome</span><span className={`badge ${row.outcome}`}>{outcomeLabel[row.outcome] || row.outcome}</span></div>
        <div className="admin-kv"><span className="k">Status</span><span>{row.statusCode ?? '—'}</span></div>
        <div className="admin-kv"><span className="k">Duration</span><span>{row.durationMs != null ? `${row.durationMs} ms` : '—'}</span></div>
        <div className="admin-kv"><span className="k">IP</span><span>{row.ip || '—'}</span></div>

        {row.error?.message && (
          <>
            <div className="admin-kv" style={{ borderBottom: 'none', marginTop: 8 }}><span className="k">Error</span><span>{row.error.name}{row.error.code ? ` (${row.error.code})` : ''}</span></div>
            <div className="admin-reason-box" style={{ color: 'var(--hp-error)' }}>{row.error.message}</div>
            {row.error.stack && (
              <pre className="admin-reason-box" style={{ overflow: 'auto', maxHeight: 220, fontSize: '0.72rem' }}>{row.error.stack}</pre>
            )}
          </>
        )}

        {row.meta && Object.keys(row.meta).length > 0 && (
          <>
            <div className="admin-kv" style={{ borderBottom: 'none', marginTop: 8 }}><span className="k">Meta</span></div>
            <pre className="admin-reason-box" style={{ overflow: 'auto', fontSize: '0.75rem' }}>{JSON.stringify(row.meta, null, 2)}</pre>
          </>
        )}

        {trace && trace.length > 1 && (
          <>
            <div className="admin-kv" style={{ borderBottom: 'none', marginTop: 8 }}><span className="k">Request trace ({trace.length})</span></div>
            <table className="admin-table">
              <tbody>
                {trace.map((t) => (
                  <tr key={t._id}>
                    <td><code>{t.action || `${t.method} ${t.path}`}</code></td>
                    <td><span className={`badge ${t.outcome}`}>{t.statusCode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="admin-modal-actions" style={{ marginTop: 16 }}>
          <button className="admin-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function Activity() {
  const [data, setData] = useState({ logs: [], pagination: { page: 1, pages: 1, total: 0 } })
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState('')
  const [method, setMethod] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await adminService.listActivity({ outcome, method, action, page, limit: 30 })
      if (res.success) setData(res.data)
      else setError(res.message || 'Failed to load activity')
    } catch {
      setError('Network error loading activity')
    } finally {
      setLoading(false)
    }
  }, [outcome, method, action, page])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    adminService.getActivityStats().then((res) => { if (res.success) setStats(res.data) })
  }, [])

  const onFilter = (setter) => (e) => { setter(e.target.value); setPage(1) }

  const [clearing, setClearing] = useState(false)
  const handleClear = async () => {
    const activeFilters = { outcome, method, action }
    const hasFilter = outcome || method || action
    const params = hasFilter ? activeFilters : { all: 'true' }
    const msg = hasFilter
      ? 'Delete all activity rows matching the current filters? This cannot be undone.'
      : 'Delete the ENTIRE activity log? This cannot be undone.'
    if (!window.confirm(msg)) return
    setClearing(true)
    try {
      const res = await adminService.clearActivity(params)
      if (res.success) {
        setPage(1)
        await load()
        adminService.getActivityStats().then((r) => { if (r.success) setStats(r.data) })
      } else {
        setError(res.message || 'Failed to clear')
      }
    } catch {
      setError('Network error clearing activity')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Activity</h1>
          <p>System-wide operations and errors, keyed by user. Click a row for full detail and error trace.</p>
        </div>
      </div>

      {stats && (
        <div className="admin-stat-grid" style={{ marginBottom: 'var(--hp-space-6)' }}>
          <div className="admin-stat-card"><div className="label">Success (24h)</div><div className="value">{stats.byOutcome.success || 0}</div></div>
          <div className="admin-stat-card"><div className="label">Client errors (24h)</div><div className="value">{stats.byOutcome.client_error || 0}</div></div>
          <div className="admin-stat-card"><div className="label">Server errors (24h)</div><div className="value" style={{ color: (stats.serverErrors ? 'var(--hp-error)' : undefined) }}>{stats.serverErrors || 0}</div></div>
        </div>
      )}

      <div className="admin-toolbar">
        <input className="admin-input" placeholder="Filter by action e.g. image.generate…" value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} />
        <select className="admin-select" value={outcome} onChange={onFilter(setOutcome)}>
          <option value="">All outcomes</option>
          <option value="success">Success</option>
          <option value="client_error">Client error</option>
          <option value="server_error">Server error</option>
        </select>
        <select className="admin-select" value={method} onChange={onFilter(setMethod)}>
          <option value="">All methods</option>
          <option value="POST">POST</option>
          <option value="PATCH">PATCH</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="GET">GET</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="admin-btn danger" onClick={handleClear} disabled={clearing || loading}>
          {clearing ? 'Clearing…' : (outcome || method || action) ? 'Clear filtered' : 'Clear all'}
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action / Route</th>
              <th>User</th>
              <th>Outcome</th>
              <th>Status</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="admin-loading">Loading…</div></td></tr>
            ) : data.logs.length === 0 ? (
              <tr><td colSpan={6}><div className="admin-empty">No activity yet. Trigger an action (generate an image, log in) and it appears here.</div></td></tr>
            ) : (
              data.logs.map((l) => (
                <tr key={l._id} className="clickable" onClick={() => setDetail(l)}>
                  <td>{fmt(l.createdAt)}</td>
                  <td>
                    {l.action ? <code>{l.action}</code> : <span className="email">{l.method} {l.path}</span>}
                  </td>
                  <td>{l.userId?.email || l.userEmail || <span className="email">—</span>}</td>
                  <td><span className={`badge ${l.outcome}`}>{outcomeLabel[l.outcome] || l.outcome}</span></td>
                  <td className="num">{l.statusCode ?? '—'}</td>
                  <td className="num">{l.durationMs != null ? `${l.durationMs}ms` : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button className="admin-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>Page {data.pagination.page} of {data.pagination.pages} · {data.pagination.total} events</span>
        <button className="admin-btn" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      <DetailModal row={detail} onClose={() => setDetail(null)} />
    </div>
  )
}

export default Activity
