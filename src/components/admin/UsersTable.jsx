import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as adminService from '../../services/adminService'

// One modal drives every mutating action. `config` describes the action so the
// same component covers suspend (reason + optional date), ban (reason), and
// reactivate (confirm only).
function ActionModal({ config, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [until, setUntil] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (!config) return null
  const { user, type } = config
  const needsReason = type === 'suspend' || type === 'ban'

  const submit = async () => {
    if (needsReason && !reason.trim()) { setErr('A reason is required.'); return }
    setBusy(true); setErr('')
    try {
      let res
      if (type === 'suspend') res = await adminService.suspendUser(user._id, reason.trim(), until || undefined)
      else if (type === 'ban') res = await adminService.banUser(user._id, reason.trim())
      else if (type === 'reactivate') res = await adminService.reactivateUser(user._id)
      if (res.success) onDone()
      else setErr(res.message || 'Action failed')
    } catch {
      setErr('Network error')
    } finally {
      setBusy(false)
    }
  }

  const titles = {
    suspend: `Suspend ${user.name}?`,
    ban: `Ban ${user.name}?`,
    reactivate: `Reactivate ${user.name}?`,
  }
  const blurbs = {
    suspend: 'They will be signed out and blocked from logging in until the date below (or until you reactivate them). Their content is retained.',
    ban: 'Permanent lockout. They cannot log in again. Content is retained but inaccessible to them.',
    reactivate: 'Restore full access to this account.',
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{titles[type]}</h3>
        <p>{blurbs[type]}</p>
        {err && <div className="admin-error">{err}</div>}

        {needsReason && (
          <div className="admin-modal-field">
            <label>Reason {type === 'ban' ? '(shown in audit log)' : ''}</label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this action being taken?" />
          </div>
        )}
        {type === 'suspend' && (
          <div className="admin-modal-field">
            <label>Suspend until (optional — leave blank for indefinite)</label>
            <input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
          </div>
        )}

        <div className="admin-modal-actions">
          <button className="admin-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            className={`admin-btn ${type === 'ban' ? 'danger' : type === 'reactivate' ? 'primary' : 'warn'}`}
            onClick={submit}
            disabled={busy}
          >
            {busy ? 'Working…' : type === 'reactivate' ? 'Reactivate' : type === 'ban' ? 'Ban user' : 'Suspend'}
          </button>
        </div>
      </div>
    </div>
  )
}

function UsersTable() {
  const navigate = useNavigate()
  const [data, setData] = useState({ users: [], pagination: { page: 1, pages: 1, total: 0 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await adminService.listUsers({ search, status, role, page, limit: 20 })
      if (res.success) setData(res.data)
      else setError(res.message || 'Failed to load users')
    } catch {
      setError('Network error loading users')
    } finally {
      setLoading(false)
    }
  }, [search, status, role, page])

  // Debounce search; refetch on filter/page change.
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const onFilterChange = (setter) => (e) => { setter(e.target.value); setPage(1) }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Users</h1>
          <p>{data.pagination.total} accounts. Click a row for detail. Suspend is temporary; ban is permanent.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <select className="admin-select" value={status} onChange={onFilterChange(setStatus)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select className="admin-select" value={role} onChange={onFilterChange(setRole)}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th title="Stories">Stories</th>
              <th title="Scenarios">Scenarios</th>
              <th title="Images">Images</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="admin-loading">Loading…</div></td></tr>
            ) : data.users.length === 0 ? (
              <tr><td colSpan={8}><div className="admin-empty">No users match.</div></td></tr>
            ) : (
              data.users.map((u) => {
                const status = u.status || 'active'
                return (
                <tr key={u._id} className="clickable">
                  <td onClick={() => navigate(`/admin/users/${u._id}`)}>
                    <div className="admin-user-cell">
                      <img src={u.avatar || '/author-avatar-7942f7.png'} alt="" />
                      <div>
                        <div className="name">{u.name}</div>
                        <div className="email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td onClick={() => navigate(`/admin/users/${u._id}`)}>
                    <span className={`badge role-${u.role}`}>{u.role}</span>
                  </td>
                  <td onClick={() => navigate(`/admin/users/${u._id}`)}>
                    <span className={`badge ${status}`}>{status}</span>
                  </td>
                  <td onClick={() => navigate(`/admin/users/${u._id}`)} className="num">{u.counts?.stories ?? 0}</td>
                  <td onClick={() => navigate(`/admin/users/${u._id}`)} className="num">{u.counts?.scenarios ?? 0}</td>
                  <td onClick={() => navigate(`/admin/users/${u._id}`)} className="num">{u.counts?.images ?? 0}</td>
                  <td onClick={() => navigate(`/admin/users/${u._id}`)}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {u.role === 'admin' ? (
                        <span className="email" style={{ fontSize: '0.8rem' }}>protected</span>
                      ) : status === 'active' ? (
                        <>
                          <button className="admin-btn warn" onClick={() => setModal({ user: u, type: 'suspend' })}>Suspend</button>
                          <button className="admin-btn danger" onClick={() => setModal({ user: u, type: 'ban' })}>Ban</button>
                        </>
                      ) : (
                        <button className="admin-btn primary" onClick={() => setModal({ user: u, type: 'reactivate' })}>Reactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button className="admin-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>Page {data.pagination.page} of {data.pagination.pages}</span>
        <button className="admin-btn" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      <ActionModal config={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load() }} />
    </div>
  )
}

export default UsersTable
