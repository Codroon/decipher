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
      icon: './Dashboard.png'
    },
    {
      id: 'story-creator',
      label: 'Story Creator',
      icon: './StoryCreator.png'
    },
    {
      id: 'image-studio',
      label: 'Image Studio',
      icon: './imagestudio.png'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: './setting.png'
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
                <img src={item.icon} alt={item.label} />
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

