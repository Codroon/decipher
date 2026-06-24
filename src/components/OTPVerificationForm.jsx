import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthNav } from './AuthShared'
import './Auth.css'

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
    } catch {
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
        setCountdown(60)
      } else {
        setError(result.error)
      }
    } catch {
      setError('Failed to resend verification code')
    } finally {
      setResendLoading(false)
    }
  }

  const handleOTPChange = (e) => {
    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
  }

  return (
    <div className="dz-auth auth-app auth-bg-signin">
      <div className="auth-bg"></div>
      <div className="auth-veil"></div>

      <AuthNav mode="signin" navigate={navigate} />

      <div className="auth-stage">
        <div className="auth-card">
          <div className="auth-form-header">
            <h1>VERIFY EMAIL</h1>
            <p>Enter the 6-digit code sent to your email</p>
          </div>

          {message && <div className="auth-msg success">{message}</div>}
          {error && <div className="auth-msg error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-form-fields">
              <div className="auth-field-group">
                <label>Verification Code</label>
                <div className="auth-field">
                  <input
                    type="text"
                    className="auth-otp"
                    placeholder="Enter 6-digit code"
                    inputMode="numeric"
                    value={otp}
                    onChange={handleOTPChange}
                    maxLength={6}
                    required
                  />
                </div>
                {email && (
                  <p className="auth-note">Code sent to: <strong>{email}</strong></p>
                )}
              </div>
            </div>

            <div className="auth-form-footer">
              <button type="submit" className="btn btn-primary btn-lg auth-submit-full" disabled={isLoading || otp.length !== 6}>
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className="auth-secondary">
                <p>Didn't receive the code?</p>
                <button
                  type="button"
                  className="auth-secondary-btn"
                  onClick={handleResendOTP}
                  disabled={resendLoading || countdown > 0}
                >
                  {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </div>

            <div className="auth-switch-link">
              <span>Wrong email? </span>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup') }}>Go back →</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OTPVerificationForm
