import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import './LoginForm.css'

function OTPVerificationForm() {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
  const { verifyOTP, resendVerification } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const email = location.state?.email || ''
  const message = location.state?.message || ''

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code')
      setIsLoading(false)
      return
    }

    try {
      const result = await verifyOTP(email, otp)
      if (result.success) {
        navigate('/home')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An error occurred during verification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)
    setError('')
    
    try {
      const result = await resendVerification(email)
      if (result.success) {
        setCountdown(60) // 60 seconds countdown
        setError('')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to resend verification code')
    } finally {
      setResendLoading(false)
    }
  }

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
  }

  return (
    <div className="signup-container">
      <div className="signup-card login-card">
        <div className="form-header">
          <h1>VERIFY EMAIL</h1>
          <p>Enter the 6-digit code sent to your email</p>
        </div>

        {message && (
          <div className="success-message" style={{ 
            background: '#d4edda', 
            color: '#155724', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {message}
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
              <label>Verification Code</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Enter 6-digit code" 
                  value={otp}
                  onChange={handleOTPChange}
                  maxLength={6}
                  required
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '24px', 
                    letterSpacing: '8px',
                    fontWeight: 'bold'
                  }}
                />
              </div>
              <p style={{ 
                color: '#999', 
                fontSize: '14px', 
                textAlign: 'center', 
                marginTop: '10px' 
              }}>
                Code sent to: <strong>{email}</strong>
              </p>
            </div>
          </div>

          <div className="form-footer">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#999', fontSize: '14px', marginBottom: '10px' }}>
                Didn't receive the code?
              </p>
              <button 
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading || countdown > 0}
                style={{
                  background: 'transparent',
                  border: '1px solid #7738CB',
                  color: '#7738CB',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                  opacity: countdown > 0 ? 0.6 : 1
                }}
              >
                {resendLoading ? 'Sending...' : 
                 countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
          </div>

          <div className="signin-link">
            <span>Wrong email? </span>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Go back →</a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OTPVerificationForm



