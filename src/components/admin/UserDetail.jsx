import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as adminService from '../../services/adminService'

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—')

function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await adminService.getUser(id)
      if (res.success) setPayload(res.data)
      else setError(res.message || 'Failed to load user')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const act = async (fn) => {
    setBusy(true); setError('')
    try {
      const res = await fn()
      if (res.success) await load()
      else setError(res.message || 'Action failed')
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  const doSuspend = () => {
    const reason = window.prompt('Reason for suspension?')
    if (reason == null || !reason.trim()) return
    const until = window.prompt('Suspend until (YYYY-MM-DD, blank = indefinite)?') || undefined
    act(() => adminService.suspendUser(id, reason.trim(), until))
  }
  const doBan = () => {
    const reason = window.prompt('Reason for permanent ban?')
    if (reason == null || !reason.trim()) return
    act(() => adminService.banUser(id, reason.trim()))
  }
  const doRole = (role) => {
    if (!window.confirm(`Change role to "${role}"?`)) return
    act(() => adminService.setUserRole(id, role))
  }

  if (loading) return <div className="admin-loading">Loading user…</div>
  if (error && !payload) return <div className="admin-error">{error}</div>
  if (!payload) return null

  const { user, resourceCounts, recentActions } = payload

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <button className="admin-back-link" style={{ padding: 0, marginBottom: 8 }} onClick={() => navigate('/admin/users')}>← All users</button>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <div className="admin-row-actions">
          {user.role !== 'admin' && user.status === 'active' && (
            <>
              <button className="admin-btn warn" onClick={doSuspend} disabled={busy}>Suspend</button>
              <button className="admin-btn danger" onClick={doBan} disabled={busy}>Ban</button>
            </>
          )}
          {user.status !== 'active' && (
            <button className="admin-btn primary" onClick={() => act(() => adminService.reactivateUser(id))} disabled={busy}>Reactivate</button>
          )}
          {user.role === 'user'
            ? <button className="admin-btn" onClick={() => doRole('admin')} disabled={busy}>Make admin</button>
            : <button className="admin-btn" onClick={() => doRole('user')} disabled={busy}>Revoke admin</button>}
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-detail-grid">
        <div className="admin-card">
          <h3>Account</h3>
          <div className="admin-kv"><span className="k">Status</span><span className={`badge ${user.status}`}>{user.status}</span></div>
          <div className="admin-kv"><span className="k">Role</span><span className={`badge role-${user.role}`}>{user.role}</span></div>
          <div className="admin-kv"><span className="k">Email verified</span><span>{user.isEmailVerified ? 'Yes' : 'No'}</span></div>
          <div className="admin-kv"><span className="k">Joined</span><span>{fmt(user.createdAt)}</span></div>
          <div className="admin-kv"><span className="k">Last login</span><span>{fmt(user.lastLogin)}</span></div>
          {user.status !== 'active' && (
            <>
              <div className="admin-kv"><span className="k">Moderated by</span><span>{user.moderatedBy?.email || '—'}</span></div>
              <div className="admin-kv"><span className="k">Moderated at</span><span>{fmt(user.moderatedAt)}</span></div>
              {user.suspendedUntil && <div className="admin-kv"><span className="k">Suspended until</span><span>{fmt(user.suspendedUntil)}</span></div>}
              {user.moderationReason && (
                <div>
                  <div className="admin-kv" style={{ borderBottom: 'none' }}><span className="k">Reason</span></div>
                  <div className="admin-reason-box">{user.moderationReason}</div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="admin-card">
          <h3>Content (counts only)</h3>
          <div className="admin-count-grid">
            <div className="cell"><div className="n">{resourceCounts.stories}</div><div className="l">Stories</div></div>
            <div className="cell"><div className="n">{resourceCounts.scenarios}</div><div className="l">Scenarios</div></div>
            <div className="cell"><div className="n">{resourceCounts.images}</div><div className="l">Images</div></div>
            <div className="cell"><div className="n">{resourceCounts.folders}</div><div className="l">Folders</div></div>
          </div>
          <p style={{ color: 'var(--hp-text-muted)', fontSize: '0.82rem', marginTop: 'var(--hp-space-4)' }}>
            Content bodies are private and only viewable via a report.
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 'var(--hp-space-6)' }}>
        <h3>Moderation history</h3>
        {recentActions?.length ? (
          <table className="admin-table">
            <thead><tr><th>Action</th><th>By</th><th>When</th><th>Detail</th></tr></thead>
            <tbody>
              {recentActions.map((a) => (
                <tr key={a._id}>
                  <td><code>{a.action}</code></td>
                  <td>{a.actorEmail}</td>
                  <td>{fmt(a.createdAt)}</td>
                  <td>{a.meta?.reason || a.meta?.newRole || a.meta?.previousStatus || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-empty">No moderation actions recorded.</div>
        )}
      </div>
    </div>
  )
}

export default UserDetail
