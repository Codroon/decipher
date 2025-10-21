import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './LoginForm.css'

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
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-card login-card">
        <div className="form-header">
          <h1>FORGOT PASSWORD</h1>
          <p>Enter your email to receive a password reset link</p>
        </div>

        {success && (
          <div className="success-message" style={{ 
            background: '#d4edda', 
            color: '#155724', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-fields">
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#999', fontSize: '14px' }}>
                Remember your password?
              </p>
              <button 
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent',
                  border: '1px solid #7738CB',
                  color: '#7738CB',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                Back to Login
              </button>
            </div>
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

export default ForgotPasswordForm

