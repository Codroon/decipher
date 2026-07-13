// Content reporting service — lets a user flag a story/scenario/image, which
// feeds the admin moderation queue (/api/admin/reports).
import { BASE_URL, apiPost } from './server'

/**
 * @param {'story'|'scenario'|'image'} resourceType
 * @param {string} resourceId
 * @param {string} reason
 */
export const submitReport = (resourceType, resourceId, reason) =>
  apiPost(`${BASE_URL}/api/reports`, { resourceType, resourceId, reason }, true)
