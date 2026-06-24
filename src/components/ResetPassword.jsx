import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthNav, EyeIcon, EyeOff } from './AuthShared'
import './Auth.css'

function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!token) {
      setError('Invalid reset token')
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPassword(token, password, confirmPassword)
      if (result.success) {
        setSuccess('Password reset successfully! Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setError(result.error)
      }
    } catch {
      setError('An error occurred. Please try again.')
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
        <div className="auth-card auth-card-wide">
          <div className="auth-form-header">
            <h1>RESET PASSWORD</h1>
            <p>Enter your new password below</p>
          </div>

          {success && <div className="auth-msg success">{success}</div>}
          {error && <div className="auth-msg error">{error}</div>}

          {token ? (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-form-fields">
                <div className="auth-field-group">
                  <label>New Password</label>
                  <div className="auth-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <div className="auth-field-group">
                  <label>Confirm New Password</label>
                  <div className="auth-field">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? EyeOff : EyeIcon}
                    </button>
                  </div>
                </div>
              </div>

              <div className="auth-form-footer">
                <button type="submit" className="btn btn-primary btn-lg auth-submit-full" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>

                <div className="auth-back-block">
                  <p>Remember your password?</p>
                  <button type="button" className="auth-secondary-btn" onClick={() => navigate('/login')}>
                    Back to Login
                  </button>
                </div>
              </div>

              <div className="auth-switch-link">
                <span>Don't have an account? </span>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup') }}>Sign up →</a>
              </div>
            </form>
          ) : (
            <>
              <p className="auth-status-text pending">No valid reset token found. Please request a new password reset.</p>
              <button type="button" className="btn btn-primary btn-lg auth-submit-full" onClick={() => navigate('/forgot-password')}>
                Request New Reset Link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
