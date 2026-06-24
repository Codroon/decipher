import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthNav } from './AuthShared'
import './Auth.css'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your email…')
  const hasVerifiedRef = useRef(false)

  useEffect(() => {
    const verifyEmail = async () => {
      if (hasVerifiedRef.current) return
      hasVerifiedRef.current = true

      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link. No token provided.')
        return
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://decipher-backend-92mi.onrender.com'}/api/auth/verify-email?token=${token}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage('Email verified successfully! Redirecting to login…')
          setTimeout(() => {
            navigate('/login', { state: { verified: true, message: 'Email verified! Please log in to continue.' } })
          }, 2000)
        } else {
          setStatus('error')
          setMessage(data.message || 'Email verification failed.')
        }
      } catch {
        setStatus('error')
        setMessage('An error occurred during verification. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  return (
    <div className="dz-auth auth-app auth-bg-signin">
      <div className="auth-bg"></div>
      <div className="auth-veil"></div>

      <AuthNav mode="signin" navigate={navigate} />

      <div className="auth-stage">
        <div className="auth-card auth-card-center">
          <div className={`auth-status-icon ${status === 'verifying' ? 'verifying' : status}`}>
            {status === 'verifying' && <div className="auth-spinner"></div>}
            {status === 'success' && (
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {status === 'error' && (
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
          </div>

          <h1 className="auth-title">
            {status === 'verifying' ? 'Verifying email' : status === 'success' ? 'Email verified!' : 'Verification failed'}
          </h1>

          <p className={`auth-status-text ${status === 'success' ? 'success' : status === 'error' ? 'error' : 'pending'}`}>
            {message}
          </p>

          {status === 'error' && (
            <button type="button" className="btn btn-primary btn-lg auth-submit" onClick={() => navigate('/login')}>
              Go to sign in
            </button>
          )}

          {status === 'success' && (
            <p className="auth-status-hint">Redirecting to sign in…</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
