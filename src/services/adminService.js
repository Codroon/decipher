// Admin Panel Service
// Thin wrappers over the shared API helpers, all hitting /api/admin/* with auth.
import { BASE_URL, apiGet, apiPost, apiPatch, apiDelete } from './server'

const ADMIN = `${BASE_URL}/api/admin`

const qs = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (!clean.length) return ''
  return '?' + new URLSearchParams(clean).toString()
}

// Dashboard
export const getStats = () => apiGet(`${ADMIN}/stats`, true)

// Users
export const listUsers = (params) => apiGet(`${ADMIN}/users${qs(params)}`, true)
export const getUser = (id) => apiGet(`${ADMIN}/users/${id}`, true)
export const suspendUser = (id, reason, until) =>
  apiPatch(`${ADMIN}/users/${id}/suspend`, { reason, until }, true)
export const banUser = (id, reason) => apiPatch(`${ADMIN}/users/${id}/ban`, { reason }, true)
export const reactivateUser = (id) => apiPatch(`${ADMIN}/users/${id}/reactivate`, {}, true)
export const setUserRole = (id, role) => apiPatch(`${ADMIN}/users/${id}/role`, { role }, true)

// Reports
export const listReports = (params) => apiGet(`${ADMIN}/reports${qs(params)}`, true)
export const getReportContent = (id) => apiGet(`${ADMIN}/reports/${id}/content`, true)
export const updateReport = (id, status, note) =>
  apiPatch(`${ADMIN}/reports/${id}`, { status, note }, true)
// Force the reported content offline (private + moderationStatus "removed") and
// resolve the report in one action.
export const takedownContent = (id, note) =>
  apiPost(`${ADMIN}/reports/${id}/takedown`, { note }, true)

// Audit log (admin moderation actions)
export const listAuditLogs = (params) => apiGet(`${ADMIN}/audit-logs${qs(params)}`, true)

// Activity / operation log (system-wide)
export const listActivity = (params) => apiGet(`${ADMIN}/activity${qs(params)}`, true)
export const getActivityStats = () => apiGet(`${ADMIN}/activity-stats`, true)
export const getActivityTrace = (requestId) => apiGet(`${ADMIN}/activity/${requestId}`, true)
export const clearActivity = (params) => apiDelete(`${ADMIN}/activity${qs(params)}`, true)
export const getUserActivity = (id, params) => apiGet(`${ADMIN}/users/${id}/activity${qs(params)}`, true)
