import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './LoginForm.css'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...')
  const hasVerifiedRef = useRef(false) // Persist across re-renders

  useEffect(() => {
    const verifyEmail = async () => {
      // Check if we've already verified - use ref to persist across re-renders
      if (hasVerifiedRef.current) {
        return
      }
      
      // Mark as verified immediately to prevent duplicate calls
      hasVerifiedRef.current = true
      
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link. No token provided.')
        return
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://decipher-backend-92mi.onrender.com'}/api/auth/verify-email?token=${token}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })
        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage('Email verified successfully! Redirecting to login...')
          
          // Redirect to login page after 2 seconds
          setTimeout(() => {
            navigate('/login', { state: { verified: true, message: 'Email verified! Please log in to continue.' } })
          }, 2000)
        } else {
          setStatus('error')
          setMessage(data.message || 'Email verification failed.')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred during verification. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  return (
    <div className="signup-container">
      <div className="signup-card login-card" style={{ textAlign: 'center' }}>
        <div className="verification-icon" style={{ 
          margin: '0 auto 30px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: status === 'verifying' ? 'rgba(146, 94, 213, 0.1)' : 
                      status === 'success' ? 'rgba(76, 175, 80, 0.1)' : 
                      'rgba(244, 67, 54, 0.1)'
        }}>
          {status === 'verifying' && (
            <div className="loading-spinner" style={{ 
              width: '50px', 
              height: '50px',
              borderColor: 'rgba(146, 94, 213, 0.3)',
              borderTopColor: '#925ED5'
            }}></div>
          )}
          {status === 'success' && (
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )}
          {status === 'error' && (
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          )}
        </div>

        <h1 style={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '28px',
          fontWeight: '700',
          color: '#FFFFFF',
          marginBottom: '20px'
        }}>
          {status === 'verifying' ? 'Verifying Email' : 
           status === 'success' ? 'Email Verified!' : 
           'Verification Failed'}
        </h1>

        <p style={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          color: status === 'success' ? '#4CAF50' : 
                 status === 'error' ? '#F44336' : '#BEBEBE',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {status === 'error' && (
          <button 
            className="submit-btn"
            onClick={() => navigate('/login')}
            style={{ maxWidth: '300px', margin: '0 auto' }}
          >
            Go to Login
          </button>
        )}

        {status === 'success' && (
          <p style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#9B9B9B',
            marginTop: '20px'
          }}>
            Redirecting to login page...
          </p>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail

