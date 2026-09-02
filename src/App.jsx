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
  const { isAuthenticated, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  // Rail state is the user's own choice, so it survives reloads.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === '1'
  )

  // Get current page from URL (handle routes with parameters)
  const currentPage = location.pathname.split('/')[1] || 'home'
  
  // Check if current page is an authentication page
  const isAuthPage = ['login', 'signup', 'verify-otp', 'forgot-password', 'reset-password', 'verify-email'].includes(currentPage)

  // Public marketing landing page lives at the root path
  const isLandingPage = location.pathname === '/'

  const handleNavigation = (page) => {
    navigate(`/${page}`)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      localStorage.setItem('sidebarCollapsed', prev ? '0' : '1')
      return !prev
    })
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
      {/* Sidebar - Hide on auth pages */}
      {!isAuthPage && (
        <Sidebar
          onNavigate={handleNavigation}
          currentPage={currentPage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <div className={`main-content ${isAuthPage ? 'auth-page' : sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-open'}`}>
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
