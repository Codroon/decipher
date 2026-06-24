import './Sidebar.css'

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
  ),
  'story-creator': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
  ),
  'scenario-creator': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>
  ),
  library: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
  ),
  'image-studio': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg>
  ),
  'image-library': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>
  ),
}

const CREATE_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', route: 'home' },
  { id: 'story-creator', label: 'Story Creator', route: 'story-creator' },
  { id: 'scenario-creator', label: 'Scenario Builder', route: 'scenario-creator' },
  { id: 'library', label: 'My Library', route: 'library' },
]

const STUDIO_ITEMS = [
  { id: 'image-studio', label: 'Image Studio', route: 'image-studio' },
  { id: 'image-library', label: 'Image Library', route: 'image-library' },
  { id: 'settings', label: 'Settings', route: 'settings' },
]

const ROUTE_TO_ID = {
  '': 'dashboard',
  home: 'dashboard',
  'story-creator': 'story-creator',
  'scenario-creator': 'scenario-creator',
  library: 'library',
  'image-studio': 'image-studio',
  'image-library': 'image-library',
  settings: 'settings',
}

function Sidebar({ isOpen, onClose, onNavigate, currentPage }) {
  const activeId = ROUTE_TO_ID[currentPage] || ''

  const go = (route) => {
    onNavigate(route)
    if (window.innerWidth <= 768) {
      onClose()
    }
  }

  const renderItem = (item) => (
    <button
      key={item.id}
      className={`sidebar-item ${activeId === item.id ? 'active' : ''}`}
      onClick={() => go(item.route)}
    >
      <span className="sidebar-icon">{ICONS[item.id]}</span>
      <span className="sidebar-label">{item.label}</span>
    </button>
  )

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="rail-top" onClick={() => go('home')}>
          <img className="brand-logo" src="/decipher-logo.png" alt="Decipher Engine" />
          <span className="brand-name">Decipher Engine</span>
        </div>

        <nav className="sidebar-nav">
          <div className="rail-cap">Create</div>
          {CREATE_ITEMS.map(renderItem)}
          <div className="rail-cap">Studio</div>
          {STUDIO_ITEMS.map(renderItem)}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
