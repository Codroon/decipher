import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import './LoginForm.css'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Check if user was redirected from email verification
  useEffect(() => {
    if (location.state?.verified && location.state?.message) {
      setSuccess(location.state.message)
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])
  
  const getErrorType = (errorMessage) => {
    if (errorMessage.includes('verification') || errorMessage.includes('verify')) {
      return 'verification-error'
    } else if (errorMessage.includes('password') || errorMessage.includes('credentials') || errorMessage.includes('invalid')) {
      return 'auth-error'
    } else if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('fetch')) {
      return 'network-error'
    } else if (errorMessage.includes('validation') || errorMessage.includes('required') || errorMessage.includes('format')) {
      return 'validation-error'
    }
    return ''
  }

  const clearError = () => {
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const result = await login(email, password, rememberMe)
      
      if (result.success) {
        navigate('/home')
      } else {
        // Display the error message from backend
        if (result.error) {
          setError(result.error)
        } else if (result.requiresVerification) {
          setError('Please check your email and click the verification link to activate your account. Then try logging in again.')
        } else {
          setError('Login failed. Please try again.')
        }
      }
    } catch (err) {
      // Handle network errors or other exceptions
      console.error('Login error:', err)
      if (err.message) {
        setError(err.message)
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('An error occurred during login. Please check your connection and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-card login-card">
        <div className="form-header">
          <h1>SIGN IN</h1>
          <p>Dive into your next AI-crafted adventure.</p>
        </div>

        {success && (
          <div className="success-message" style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid #4CAF50',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#4CAF50',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '500',
            fontSize: '14px',
            textAlign: 'center',
            wordWrap: 'break-word',
            lineHeight: '1.4'
          }}>
            ✓ {success}
          </div>
        )}

        {error && (
          <div className={`error-message ${getErrorType(error)}`}>
            {error}
          </div>
        )}

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-fields">
            <div className="input-group">
              <label>Email</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setSuccess('') // Clear success message when typing
                    // clearError() // Temporarily disabled for debugging
                  }}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setSuccess('') // Clear success message when typing
                    // clearError() // Temporarily disabled for debugging
                  }}
                  required
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
              <a href="#" className="forget-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}>Forget Password</a>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          <div className="signin-link">
            <span>Don't have an account? </span>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Sign up →</a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginForm
