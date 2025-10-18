import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Home from './components/Home'
import Sidebar from './components/Sidebar'
import StoryCreator from './components/StoryCreator'
import ImageStudio from './components/ImageStudio'
import Settings from './components/Settings'
import LoginForm from './components/LoginForm'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  // Get current page from URL
  const currentPage = location.pathname.substring(1) || 'home'

  // Close dropdown when clicking outside
  const handleClickOutside = (e) => {
    if (showProfileDropdown && !e.target.closest('.user-profile')) {
      setShowProfileDropdown(false)
    }
  }

  // Add event listener for clicking outside
  useEffect(() => {
    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showProfileDropdown])

  const handleNavigation = (page) => {
    navigate(`/${page}`)
    setShowProfileDropdown(false)
  }

  // Redirect to login if not authenticated and trying to access protected routes
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !['/login', '/signup'].includes(location.pathname)) {
      navigate('/login')
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-left">
            <div 
              className={`hamburger-menu ${sidebarOpen ? 'open' : ''}`}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div 
              className="logo-container" 
              onClick={() => navigate('/home')}
              style={{ cursor: 'pointer' }}
            >
              <svg className="logo-icon" width="17" height="17" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            </div>
          </div>
          
                  <div className="search-bar">
                    <img src="./search-icon.png" alt="Search" className="search-icon" />
                    <input type="text" placeholder="Search stories, authors, or genres..." />
                  </div>

          {/* Show login/signup buttons only on login and signup pages */}
          {(currentPage === 'login' || currentPage === 'signup') && (
            <div className="nav-buttons">
                      <button 
                        className={`login-btn ${currentPage === 'login' ? 'active' : ''}`}
                        onClick={() => navigate('/login')}
                      >
                        Login
                      </button>
                      <button 
                        className={`signup-btn ${currentPage === 'signup' ? 'active' : ''}`}
                        onClick={() => navigate('/signup')}
                      >
                        SignUp
                      </button>
            </div>
          )}
          
          {/* Show user profile when logged in */}
          {isAuthenticated && (
            <div className="user-profile">
              <div 
                className="profile-avatar"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <img src={user?.avatar || "./author-avatar-7942f7.png"} alt="Profile" />
              </div>
              
              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <div className="user-avatar-small">
                        <img src={user?.avatar || "./author-avatar-7942f7.png"} alt="Profile" />
                      </div>
                      <div className="user-details">
                        <h4 className="user-name">{user?.name || 'Admin User'}</h4>
                        <p className="user-email">{user?.email || 'admin@decipher.com'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={() => handleNavigation('settings')}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      <span>Settings</span>
                    </button>
                    
                    <button className="dropdown-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>Profile</span>
                    </button>
                    
                  
              
                    
                    <button 
                      className="dropdown-item logout-item"
                      onClick={() => {
                        logout()
                        setShowProfileDropdown(false)
                        navigate('/login')
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigation}
      />

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/story-creator" element={<StoryCreator />} />
          <Route path="/image-studio" element={<ImageStudio />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/signup" element={
        <div className="signup-container">
          <div className="signup-card">
            <div className="form-header">
              <h1>SIGN UP</h1>
              <p>Sign up to begin your AI storytelling journey.</p>
            </div>

            <form className="signup-form">
              <div className="form-fields">
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <input type="text" placeholder="Enter your name" />
                  </div>
                </div>

                <div className="input-group">
                  <label>Email</label>
                  <div className="input-wrapper">
                    <input type="email" placeholder="Enter your email" />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password" 
                    />
                    <button 
                      type="button" 
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        {showPassword ? (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </>
                        ) : (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label>Confirm Password</label>
                  <div className="input-wrapper">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm your Password" 
                    />
                    <button 
                      type="button" 
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        {showConfirmPassword ? (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </>
                        ) : (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-footer">
                <div className="remember-forgot">
                  <label className="remember-me">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember Me</span>
                  </label>
                  <a href="#" className="forget-password">Forget Password</a>
                </div>

                <button type="submit" className="submit-btn">Sign Up</button>
              </div>

              <div className="signin-link">
                <span>Already have an account? </span>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign In →</a>
              </div>
            </form>
          </div>
        </div>
          } />
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
