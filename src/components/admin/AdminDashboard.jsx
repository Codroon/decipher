import React, { useEffect, useState } from 'react'
import * as adminService from '../../services/adminService'

function StatCard({ label, value, sub }) {
  return (
    <div className="admin-stat-card">
      <div className="label">{label}</div>
      <div className="value">{value ?? '—'}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await adminService.getStats()
        if (!alive) return
        if (res.success) setStats(res.data)
        else setError(res.message || 'Failed to load stats')
      } catch {
        if (alive) setError('Network error loading stats')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  if (loading) return <div className="admin-loading">Loading dashboard…</div>

  // Build a continuous 30-day series so the chart always reads as a real
  // timeline, with zero-signup days shown as faint bars instead of collapsing
  // to one or two giant blocks.
  const trendMap = (stats?.signupsTrend || []).reduce((acc, d) => { acc[d._id] = d.count; return acc }, {})
  const days = []
  for (let i = 29; i >= 0; i--) {
    const dt = new Date()
    dt.setDate(dt.getDate() - i)
    const key = dt.toISOString().slice(0, 10)
    days.push({ key, count: trendMap[key] || 0, label: dt })
  }
  const maxTrend = Math.max(1, ...days.map((d) => d.count))
  const totalSignups = days.reduce((s, d) => s + d.count, 0)
  const fmtDay = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>An overview of accounts and activity. Aggregates only — no private content.</p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {stats && (
        <>
          <div className="admin-stat-grid">
            <StatCard label="Total users" value={stats.users.total} sub={`${stats.users.new30d} new in 30d`} />
            <StatCard label="Active" value={stats.users.active} />
            <StatCard label="Suspended" value={stats.users.suspended} />
            <StatCard label="Banned" value={stats.users.banned} />
            <StatCard label="Admins" value={stats.users.admins} />
            <StatCard label="Verified" value={stats.users.verified} sub={`of ${stats.users.total}`} />
            <StatCard label="Stories" value={stats.content.stories} />
            <StatCard label="Scenarios" value={stats.content.scenarios} />
            <StatCard label="Images" value={stats.content.images} />
            <StatCard label="Open reports" value={stats.reports.open} />
          </div>

          <div className="admin-chart-card">
            <h3>New signups — last 30 days <span style={{ color: 'var(--hp-text-muted)', fontWeight: 400 }}>· {totalSignups} total</span></h3>
            <div className="admin-bars">
              {days.map((d) => (
                <div
                  key={d.key}
                  className={`bar ${d.count === 0 ? 'empty' : ''}`}
                  style={{ height: `${(d.count / maxTrend) * 100}%` }}
                  title={`${fmtDay(d.label)}: ${d.count} signup${d.count === 1 ? '' : 's'}`}
                />
              ))}
            </div>
            <div className="admin-chart-axis">
              <span>{fmtDay(days[0].label)}</span>
              <span>{fmtDay(days[Math.floor(days.length / 2)].label)}</span>
              <span>{fmtDay(days[days.length - 1].label)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
