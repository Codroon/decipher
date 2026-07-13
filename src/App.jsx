import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Home from './components/Home'
import Sidebar from './components/Sidebar'
import StoryCreator from './components/StoryCreator'
import ScenarioCreator from './components/ScenarioCreator'
import ImageStudio from './components/ImageStudio'
import ImageLibrary from './components/ImageLibrary'
import Settings from './components/Settings'
import LoginForm from './components/LoginForm'
import RegistrationForm from './components/RegistrationForm'
import OTPVerificationForm from './components/OTPVerificationForm'
import ForgotPasswordForm from './components/ForgotPasswordForm'
import ResetPassword from './components/ResetPassword'
import VerifyEmail from './components/VerifyEmail'
import Profile from './components/Profile'
import Library from './components/Library'
import Landing from './components/Landing'
import PublicStory from './components/PublicStory'
import PublicScenario from './components/PublicScenario'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import UsersTable from './components/admin/UsersTable'
import UserDetail from './components/admin/UserDetail'
import Reports from './components/admin/Reports'
import AuditLog from './components/admin/AuditLog'
import Activity from './components/admin/Activity'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isAdmin, logout, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  // Get current page from URL (handle routes with parameters)
  const currentPage = location.pathname.split('/')[1] || 'home'
  
  // Check if current page is an authentication page
  const isAuthPage = ['login', 'signup', 'verify-otp', 'forgot-password', 'reset-password', 'verify-email'].includes(currentPage)

  // Public marketing landing page lives at the root path
  const isLandingPage = location.pathname === '/'

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
    const authPages = ['/login', '/signup', '/verify-otp', '/forgot-password', '/reset-password', '/verify-email']
    
    if (!isLoading) {
      // Check if current path is an auth page
      const isOnAuthPage = authPages.some(page => location.pathname.startsWith(page))

      // The landing page ('/') and community discovery pages are public — never
      // force a redirect away from them (shared links open without an account).
      const isOnPublicPage = isOnAuthPage || location.pathname === '/' || location.pathname.startsWith('/discover')

      // If not authenticated and trying to access protected route → redirect to login
      if (!isAuthenticated && !isOnPublicPage) {
        navigate('/login')
      }
      
      // If authenticated and trying to access auth pages → redirect to home
      if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
        navigate('/home')
      }
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

  // The marketing landing page renders standalone (its own nav/footer, no app shell)
  if (isLandingPage) {
    return <Landing />
  }

  // Community discovery pages render standalone so shared links work for anyone,
  // signed in or not (each has its own back button + report control).
  if (location.pathname.startsWith('/discover')) {
    return (
      <Routes>
        <Route path="/discover/story/:id" element={<PublicStory />} />
        <Route path="/discover/scenario/:id" element={<PublicScenario />} />
      </Routes>
    )
  }

  // The admin panel renders in its own standalone shell (AdminLayout gates on role)
  if (location.pathname.startsWith('/admin')) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersTable />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="activity" element={<Activity />} />
          <Route path="audit" element={<AuditLog />} />
        </Route>
      </Routes>
    )
  }

  // Sign in / Create account render standalone with their own branded nav + backdrop
  if (currentPage === 'login') {
    return <LoginForm />
  }
  if (currentPage === 'signup') {
    return <RegistrationForm />
  }
  if (currentPage === 'forgot-password') {
    return <ForgotPasswordForm />
  }
  if (currentPage === 'reset-password') {
    return <ResetPassword />
  }
  if (currentPage === 'verify-otp') {
    return <OTPVerificationForm />
  }
  if (currentPage === 'verify-email') {
    return <VerifyEmail />
  }

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className={`navbar ${isAuthPage ? 'auth-page' : sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="nav-content">
          <div className="nav-left">
            {/* Hide hamburger menu on auth pages */}
            {!isAuthPage && (
              <div 
                className={`hamburger-menu ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            {/* Logo lives in the rail on app pages; show it here only on auth pages */}
            {isAuthPage && (
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
            )}
          </div>
          
          {/* Hide search bar on authentication pages */}
          {!isAuthPage && (
            <>
              <div className="search-bar">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4-4" />
                </svg>
                <input type="text" placeholder="Search stories, authors, or genres..." />
              </div>

              <div className="nav-spacer"></div>

              <button
                type="button"
                className="btn btn-primary btn-sm nav-new-story"
                onClick={() => navigate('/story-creator')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New story
              </button>
            </>
          )}

          {/* Show login/signup buttons only on auth pages */}
          {isAuthPage && (
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
                <img src={user?.avatar || "/author-avatar-7942f7.png"} alt="Profile" />
              </div>
              
              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <div className="user-avatar-small">
                        <img src={user?.avatar || "/author-avatar-7942f7.png"} alt="Profile" />
                      </div>
                      <div className="user-details">
                        <h4 className="user-name">{user?.name || 'Admin User'}</h4>
                        <p className="user-email">{user?.email || 'admin@decipher.com'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={() => handleNavigation('profile')}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>Profile</span>
                    </button>
                    
                    <button className="dropdown-item" onClick={() => handleNavigation('settings')}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      <span>Settings</span>
                    </button>

                    {/* Admin panel entry — only rendered for admins */}
                    {isAdmin && (
                      <button className="dropdown-item" onClick={() => { setShowProfileDropdown(false); navigate('/admin') }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M12 2l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V6l7-4z"></path>
                        </svg>
                        <span>Admin Panel</span>
                      </button>
                    )}
                    
                  
              
                    
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

      {/* Sidebar - Hide on auth pages */}
      {!isAuthPage && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onNavigate={handleNavigation}
          currentPage={currentPage}
        />
      )}

      {/* Main Content */}
      <div className={`main-content ${isAuthPage ? 'auth-page' : sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/story-creator" element={<StoryCreator />} />
          <Route path="/story-creator/:storyId" element={<StoryCreator />} />
          <Route path="/scenario-creator" element={<ScenarioCreator />} />
          <Route path="/scenario-creator/:scenarioId" element={<ScenarioCreator />} />
          <Route path="/image-studio" element={<ImageStudio />} />
          <Route path="/image-library" element={<ImageLibrary />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/library" element={<Library />} />
          <Route path="/signup" element={<RegistrationForm />} />
          <Route path="/verify-otp" element={<OTPVerificationForm />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
