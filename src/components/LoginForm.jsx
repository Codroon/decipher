import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthNav, EyeIcon, EyeOff } from './AuthShared'
import './Auth.css'

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

  useEffect(() => {
    if (location.state?.verified && location.state?.message) {
      setSuccess(location.state.message)
      window.history.replaceState({}, document.title)
    }
  }, [location])

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
        if (result.error) {
          setError(result.error)
        } else if (result.requiresVerification) {
          setError('Please check your email and click the verification link to activate your account. Then try logging in again.')
        } else {
          setError('Login failed. Please try again.')
        }
      }
    } catch (err) {
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
    <div className="dz-auth auth-app auth-bg-signin">
      <div className="auth-bg"></div>
      <div className="auth-veil"></div>

      <AuthNav mode="signin" navigate={navigate} />

      <div className="auth-stage">
        <div className="auth-card">
          <div className="auth-form-header">
            <h1>SIGN IN</h1>
            <p>Dive into your next AI-crafted adventure.</p>
          </div>

          {success && <div className="auth-msg success">✓ {success}</div>}
          {error && <div className="auth-msg error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-form-fields">
              <div className="auth-field-group">
                <label>Email</label>
                <div className="auth-field">
                  <input
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setSuccess('') }}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label>Password</label>
                <div className="auth-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setSuccess('') }}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? EyeOff : EyeIcon}
                  </button>
                </div>
              </div>
            </div>

            <div className="auth-form-footer">
              <div className="auth-remember-forgot">
                <label className="auth-remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember Me</span>
                </label>
                <a
                  href="#"
                  className="auth-forget-link"
                  onClick={(e) => { e.preventDefault(); navigate('/forgot-password') }}
                >
                  Forget Password
                </a>
              </div>

              <button type="submit" className="btn btn-primary btn-lg auth-submit-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>

            <div className="auth-switch-link">
              <span>Don't have an account? </span>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup') }}>Sign up →</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
