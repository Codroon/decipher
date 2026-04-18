import { useState } from 'react'
import './Sidebar.css'

function Sidebar({ isOpen, onClose, onNavigate }) {
  const [activeItem, setActiveItem] = useState('dashboard')

  const handleNavigation = (itemId) => {
    setActiveItem(itemId)
    if (itemId === 'story-creator') {
      onNavigate('story-creator')
    } else if (itemId === 'dashboard') {
      onNavigate('home')
    } else if (itemId === 'image-studio') {
      onNavigate('image-studio')
    } else if (itemId === 'scenario-creator') {
      onNavigate('scenario-creator')
    } else if (itemId === 'library') {
      onNavigate('library')
    } else if (itemId === 'settings') {
      onNavigate('settings')
    }
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      onClose()
    }
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '/Dashboard.png'
    },
    {
      id: 'story-creator',
      label: 'Story Creator',
      icon: '/StoryCreator.png'
    },
    {
      id: 'scenario-creator',
      label: 'Scenario Builder',
      icon: '/script-icon.png'
    },
    {
      id: 'library',
      label: 'My Library',
      icon: '/imagestudio.png',
      svgIcon: true
    },
    {
      id: 'image-studio',
      label: 'Image Studio',
      icon: '/imagestudio.png'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '/setting.png'
    }
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-content">
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
              onClick={() => handleNavigation(item.id)}
            >
              <span className="sidebar-icon">
                {item.id === 'library' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                ) : (
                  <img src={item.icon} alt={item.label} />
                )}
              </span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
    </>
  )
}

export default Sidebar

