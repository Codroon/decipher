import {
  API_ENDPOINTS,
  BASE_URL,
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
} from '../services/server'

// ---------------------------------------------------------------------------
// Pure helpers — operate on an already-fetched folder array so the component
// can filter / render the tree synchronously without re-hitting the API.
// ---------------------------------------------------------------------------

function children(folders, parentId) {
  return folders.filter((f) => f.parentId === (parentId || null))
}

// All folder ids in the subtree rooted at `id` (inclusive), any depth.
function descendantIds(folders, id) {
  const ids = [id]
  children(folders, id).forEach((child) => {
    descendantIds(folders, child.id).forEach((sub) => ids.push(sub))
  })
  return ids
}

// Flatten the tree into a depth-tagged list (top → sub → sub-sub, up to 3
// levels) in stable pre-order so indented pickers render correctly.
function flatten(folders, parentId = null, depth = 0) {
  const out = []
  children(folders, parentId).forEach((f) => {
    out.push({ id: f.id, name: f.name, depth })
    flatten(folders, f.id, depth + 1).forEach((sub) => out.push(sub))
  })
  return out
}

function folderName(folders, id) {
  const f = folders.find((x) => x.id === id)
  return f ? f.name : null
}

// ---------------------------------------------------------------------------
// Mapping helpers — translate backend documents into the shape the component
// already expects.
// ---------------------------------------------------------------------------

function imageUrl(image) {
  if (!image) return ''
  return image.startsWith('http') ? image : `${BASE_URL}${image}`
}

function capitalize(s) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Bucket a createdAt timestamp into the UI's date groups.
function dateBucket(createdAt) {
  if (!createdAt) return 'Earlier'
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return 'Earlier'
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (d >= startOfToday) return 'Today'
  const weekAgo = new Date(startOfToday)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (d >= weekAgo) return 'This week'
  return 'Earlier'
}

function mapImage(doc) {
  return {
    id: doc._id,
    img: imageUrl(doc.image),
    prompt: doc.prompt || '',
    style: capitalize(doc.artStyle),
    model: doc.model || '',
    dims: doc.width && doc.height ? `${doc.width}×${doc.height}` : '',
    date: dateBucket(doc.createdAt),
    fav: !!doc.favorite,
    col: doc.folderId || null,
    seed: doc.seed,
    createdAt: doc.createdAt,
  }
}

// ---------------------------------------------------------------------------
// Async API methods (all authenticated).
// ---------------------------------------------------------------------------

async function fetchFolders() {
  const res = await apiGet(API_ENDPOINTS.FOLDERS.GET_ALL, true)
  return Array.isArray(res?.folders) ? res.folders : []
}

async function createFolder(name, parentId = null) {
  const res = await apiPost(API_ENDPOINTS.FOLDERS.BASE, { name, parentId }, true)
  if (!res?.folder) throw new Error(res?.message || res?.error || 'Failed to create folder')
  return res.folder
}

async function renameFolder(id, name) {
  const res = await apiPatch(API_ENDPOINTS.FOLDERS.BY_ID(id), { name }, true)
  if (!res?.folder) throw new Error(res?.message || res?.error || 'Failed to rename folder')
  return res.folder
}

async function moveFolder(id, parentId) {
  const res = await apiPatch(API_ENDPOINTS.FOLDERS.BY_ID(id), { parentId }, true)
  if (!res?.folder) throw new Error(res?.message || res?.error || 'Failed to move folder')
  return res.folder
}

async function deleteFolder(id) {
  return apiDelete(API_ENDPOINTS.FOLDERS.BY_ID(id), true)
}

async function fetchImages({ folderId, favorite, search, sort, page, limit } = {}) {
  const params = new URLSearchParams()
  if (folderId !== undefined) params.set('folderId', folderId === null ? 'null' : folderId)
  if (favorite) params.set('favorite', 'true')
  if (search) params.set('search', search)
  if (sort) params.set('sort', sort)
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))
  const qs = params.toString()
  const url = qs ? `${API_ENDPOINTS.IMAGES.GET_ALL}?${qs}` : API_ENDPOINTS.IMAGES.GET_ALL
  const res = await apiGet(url, true)
  const docs = Array.isArray(res?.images) ? res.images : []
  return { images: docs.map(mapImage), total: res?.total ?? docs.length }
}

async function moveImage(id, folderId) {
  const res = await apiPatch(API_ENDPOINTS.IMAGES.BY_ID(id), { folderId }, true)
  if (!res?.image) throw new Error(res?.message || res?.error || 'Failed to move image')
  return mapImage(res.image)
}

async function toggleFavorite(id, favorite) {
  const res = await apiPatch(API_ENDPOINTS.IMAGES.BY_ID(id), { favorite }, true)
  if (!res?.image) throw new Error(res?.message || res?.error || 'Failed to update favorite')
  return mapImage(res.image)
}

async function deleteImage(id) {
  return apiDelete(API_ENDPOINTS.IMAGES.BY_ID(id), true)
}

// Duplicate an image into a folder (null = unfiled). Returns the new image.
async function copyImage(id, folderId = null) {
  const res = await apiPost(API_ENDPOINTS.IMAGES.COPY(id), { folderId }, true)
  if (!res?.image) throw new Error(res?.message || res?.error || 'Failed to copy image')
  return mapImage(res.image)
}

export const imageLibraryStore = {
  // pure helpers
  children,
  descendantIds,
  flatten,
  folderName,
  // async API
  fetchFolders,
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  fetchImages,
  moveImage,
  toggleFavorite,
  deleteImage,
  copyImage,
}
