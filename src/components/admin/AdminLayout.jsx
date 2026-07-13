import React from 'react'
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './admin.css'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin' },
  { key: 'users', label: 'Users', path: '/admin/users' },
  { key: 'reports', label: 'Reports', path: '/admin/reports' },
  { key: 'activity', label: 'Activity', path: '/admin/activity' },
  { key: 'audit', label: 'Audit Log', path: '/admin/audit' },
]

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // Non-admins never reach the panel; bounce silently to the app.
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/home" replace />

  const isActive = (path) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>Decipher</span>
          <span className="admin-badge">Admin</span>
        </div>
        <nav className="admin-nav">
          {NAV.map((item) => (
            <button
              key={item.key}
              className={`admin-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="admin-back-link" onClick={() => navigate('/home')}>
          ← Back to app
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
