// Public discovery service — browse stories & scenarios other users have shared.
// These endpoints are unauthenticated on the backend, but we still send the auth
// token when present so a signed-in user is recognised (harmless if absent).
import { API_ENDPOINTS, getHeaders } from './server'

const buildQuery = (params = {}) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  return q ? `?${q}` : ''
}

const getJson = async (url) => {
  const res = await fetch(url, { method: 'GET', headers: getHeaders(true) })
  const data = await res.json()
  return { ok: res.ok, data }
}

export const listPublicStories = async (params = {}) => {
  try {
    const { ok, data } = await getJson(`${API_ENDPOINTS.PUBLIC.STORIES}${buildQuery(params)}`)
    if (ok && data.success) return { success: true, ...data.data }
    return { success: false, error: data.message || 'Failed to load public stories' }
  } catch (error) {
    console.error('listPublicStories error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

export const getPublicStory = async (id) => {
  try {
    const { ok, data } = await getJson(API_ENDPOINTS.PUBLIC.STORY_BY_ID(id))
    if (ok && data.success) return { success: true, story: data.data.story }
    return { success: false, error: data.message || 'Story not found' }
  } catch (error) {
    console.error('getPublicStory error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

export const listPublicScenarios = async (params = {}) => {
  try {
    const { ok, data } = await getJson(`${API_ENDPOINTS.PUBLIC.SCENARIOS}${buildQuery(params)}`)
    if (ok && data.success) return { success: true, ...data.data }
    return { success: false, error: data.message || 'Failed to load public scenarios' }
  } catch (error) {
    console.error('listPublicScenarios error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

export const getPublicScenario = async (id) => {
  try {
    const { ok, data } = await getJson(API_ENDPOINTS.PUBLIC.SCENARIO_BY_ID(id))
    if (ok && data.success) return { success: true, scenario: data.data.scenario }
    return { success: false, error: data.message || 'Scenario not found' }
  } catch (error) {
    console.error('getPublicScenario error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}
