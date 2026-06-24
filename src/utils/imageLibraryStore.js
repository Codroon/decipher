const KEY = 'decipher_image_library'

const DEFAULT_FOLDERS = [
  { id: 'creatures', name: 'Creatures', parentId: null },
  { id: 'creatures_dragons', name: 'Dragons', parentId: 'creatures' },
  { id: 'creatures_beasts', name: 'Beasts & Familiars', parentId: 'creatures' },
  { id: 'chars', name: 'Character Concepts', parentId: null },
  { id: 'chars_heroes', name: 'Heroes', parentId: 'chars' },
  { id: 'chars_villains', name: 'Villains', parentId: 'chars' },
  { id: 'locs', name: 'Locations', parentId: null },
  { id: 'sunken', name: 'The Sunken Court', parentId: null },
]

const DEFAULT_IMAGES = [
  { id: 'im1', img: '/fantasy-art-style.png', prompt: 'An ancient book opening into a glowing world of mountains and starlight', style: 'Fantasy', model: 'DreamShaper', dims: '1536×1024', date: 'Today', fav: true, col: 'sunken' },
  { id: 'im2', img: '/recent-image-3.png', prompt: 'A crystalline dragon coiled around glowing gemstones in a deep cavern', style: 'Fantasy', model: 'Juggernaut XL', dims: '1024×1024', date: 'Today', fav: false, col: 'creatures_dragons' },
  { id: 'im3', img: '/anime-art-style.png', prompt: 'Two characters share a quiet moment in a sunlit café', style: 'Anime', model: 'Pony Diffusion', dims: '1536×1024', date: 'Today', fav: false, col: 'chars_heroes' },
  { id: 'im4', img: '/Group 7.png', prompt: 'A golden castle hidden deep in an enchanted glade', style: 'Fantasy', model: 'DreamShaper', dims: '1024×1024', date: 'Today', fav: true, col: 'locs' },
  { id: 'im5', img: '/realistic-art-style-52592d.png', prompt: 'Two figures running across a moonlit field at dusk, cinematic', style: 'Realistic', model: 'Juggernaut XL', dims: '1536×1024', date: 'This week', fav: false, col: null },
  { id: 'im6', img: '/ai_storytelling_platform_balanced 1.png', prompt: 'A lone swordsman standing in a luminous blue forest', style: 'Fantasy', model: 'DreamShaper', dims: '1024×1536', date: 'This week', fav: false, col: 'chars_heroes' },
  { id: 'im7', img: '/recent-image-1-52dd4f.png', prompt: 'A glowing path winding between giant rune-carved trees', style: 'Fantasy', model: 'DreamShaper', dims: '1536×1024', date: 'This week', fav: true, col: 'sunken' },
  { id: 'im8', img: '/cartoon-art-style.png', prompt: 'A cheerful animal duo beneath bright autumn leaves', style: 'Cartoon', model: 'Pony Diffusion', dims: '1536×1024', date: 'This week', fav: false, col: 'creatures_beasts' },
  { id: 'im9', img: '/image 9.png', prompt: 'Silhouettes against an enormous moon over a sleeping city', style: 'Realistic', model: 'Juggernaut XL', dims: '1536×1024', date: 'Earlier', fav: false, col: 'locs' },
  { id: 'im10', img: '/ai_storytelling_platform_balanced 5.png', prompt: 'An adventurer steps into a glowing enchanted forest', style: 'Fantasy', model: 'DreamShaper', dims: '1024×1536', date: 'Earlier', fav: false, col: 'creatures' },
  { id: 'im11', img: '/recent-image-3.png', prompt: 'A scaled wyrm of living dusk uncurling from the dark', style: 'Fantasy', model: 'Juggernaut XL', dims: '1024×1024', date: 'Earlier', fav: false, col: 'creatures_dragons' },
  { id: 'im12', img: '/image 9.png', prompt: 'A masked collector wreathed in shadow and candlelight', style: 'Realistic', model: 'DreamShaper', dims: '1024×1536', date: 'Earlier', fav: false, col: 'chars_villains' },
]

function clone(o) {
  return JSON.parse(JSON.stringify(o))
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { folders: clone(DEFAULT_FOLDERS), images: clone(DEFAULT_IMAGES) }
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.folders) || !Array.isArray(data.images)) throw new Error('invalid')
    return data
  } catch {
    return { folders: clone(DEFAULT_FOLDERS), images: clone(DEFAULT_IMAGES) }
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ folders: state.folders, images: state.images }))
  } catch {
    /* ignore quota errors */
  }
}

function children(folders, parentId) {
  return folders.filter((f) => f.parentId === (parentId || null))
}

function descendantIds(folders, id) {
  const ids = [id]
  folders.forEach((f) => {
    if (f.parentId === id) ids.push(f.id)
  })
  return ids
}

function flatten(folders) {
  const out = []
  children(folders, null).forEach((top) => {
    out.push({ id: top.id, name: top.name, depth: 0 })
    children(folders, top.id).forEach((sub) => {
      out.push({ id: sub.id, name: sub.name, depth: 1 })
    })
  })
  return out
}

function folderName(folders, id) {
  const f = folders.find((x) => x.id === id)
  return f ? f.name : null
}

export const imageLibraryStore = {
  KEY,
  DEFAULT_FOLDERS,
  DEFAULT_IMAGES,
  load,
  save,
  children,
  descendantIds,
  flatten,
  folderName,
}
