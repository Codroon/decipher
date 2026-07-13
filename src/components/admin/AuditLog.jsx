import React, { useEffect, useState, useCallback } from 'react'
import * as adminService from '../../services/adminService'

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—')

function AuditLog() {
  const [data, setData] = useState({ logs: [], pagination: { page: 1, pages: 1, total: 0 } })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await adminService.listAuditLogs({ page, limit: 30 })
      if (res.success) setData(res.data)
      else setError(res.message || 'Failed to load audit log')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  const detail = (meta) => {
    if (!meta || typeof meta !== 'object') return '—'
    const parts = []
    if (meta.reason) parts.push(`reason: ${meta.reason}`)
    if (meta.newRole) parts.push(`→ ${meta.newRole}`)
    if (meta.previousStatus) parts.push(`from ${meta.previousStatus}`)
    if (meta.until) parts.push(`until ${fmt(meta.until)}`)
    if (meta.status) parts.push(`status: ${meta.status}`)
    return parts.join(' · ') || '—'
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Audit Log</h1>
          <p>{data.pagination.total} recorded admin actions. Every mutation is logged here.</p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>When</th><th>Action</th><th>Admin</th><th>Target</th><th>Detail</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="admin-loading">Loading…</div></td></tr>
            ) : data.logs.length === 0 ? (
              <tr><td colSpan={5}><div className="admin-empty">No actions logged yet.</div></td></tr>
            ) : (
              data.logs.map((l) => (
                <tr key={l._id}>
                  <td>{fmt(l.createdAt)}</td>
                  <td><code>{l.action}</code></td>
                  <td>{l.actorEmail}</td>
                  <td>{l.targetEmail || '—'}</td>
                  <td style={{ maxWidth: 280 }}>{detail(l.meta)}</td>
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
    </div>
  )
}

export default AuditLog
