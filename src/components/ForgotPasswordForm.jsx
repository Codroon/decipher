import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { AuthNav } from './AuthShared'
import './Auth.css'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { forgotPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const result = await forgotPassword(email)
      if (result.success) {
        setSuccess(result.message)
        setEmail('')
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
        <div className="auth-card">
          <div className="auth-form-header">
            <h1>FORGOT PASSWORD</h1>
            <p>Enter your email to receive a password reset link</p>
          </div>

          {success && <div className="auth-msg success">{success}</div>}
          {error && <div className="auth-msg error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-form-fields">
              <div className="auth-field-group">
                <label>Email Address</label>
                <div className="auth-field">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="auth-form-footer">
              <button type="submit" className="btn btn-primary btn-lg auth-submit-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
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
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordForm
