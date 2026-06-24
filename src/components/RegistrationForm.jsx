import React, { useState, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { AuthNav, EyeIcon, EyeOff } from './AuthShared'
import './Auth.css'

function RegistrationForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showVerificationPopup, setShowVerificationPopup] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] })
  const [passwordMatch, setPasswordMatch] = useState(true)
  const isSubmitting = useRef(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const checkPasswordStrength = (password) => {
    const feedback = []
    let score = 0

    if (password.length >= 8) score += 1
    else feedback.push('At least 8 characters')

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('One lowercase letter')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('One uppercase letter')

    if (/\d/.test(password)) score += 1
    else feedback.push('One number')

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
    else feedback.push('One special character')

    return { score, feedback }
  }

  const checkPasswordMatch = (password, confirmPassword) => {
    return password === confirmPassword && confirmPassword.length > 0
  }

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordStrength(checkPasswordStrength(newPassword))
    setPasswordMatch(checkPasswordMatch(newPassword, confirmPassword))
  }

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value
    setConfirmPassword(newConfirmPassword)
    setPasswordMatch(checkPasswordMatch(password, newConfirmPassword))
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    if (isSubmitting.current) return

    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please ensure it meets the requirements.')
      return
    }

    if (!passwordMatch) {
      setError('Passwords do not match.')
      return
    }

    isSubmitting.current = true
    setError('')
    setIsLoading(true)

    const submittedEmail = email

    try {
      const result = await register(name, submittedEmail, password, confirmPassword)

      if (result.success) {
        setUserEmail(result.email || submittedEmail)
        setShowVerificationPopup(true)
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch {
      setError('An error occurred during registration')
    } finally {
      setIsLoading(false)
      isSubmitting.current = false
    }
  }, [email, name, password, confirmPassword, passwordMatch, passwordStrength.score, register])

  const closePopup = () => {
    setShowVerificationPopup(false)
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    navigate('/login')
  }

  const strengthLabel = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength.score] || ''

  return (
    <div className="dz-auth auth-app auth-bg-signup">
      <div className="auth-bg"></div>
      <div className="auth-veil"></div>

      <AuthNav mode="signup" navigate={navigate} />

      <div className="auth-stage">
        <div className="auth-card auth-card-wide">
          <div className="auth-form-header">
            <h1>SIGN UP</h1>
            <p>Sign up to begin your AI storytelling journey.</p>
          </div>

          {error && <div className="auth-msg error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-form-fields">
              <div className="auth-field-group">
                <label>Full Name</label>
                <div className="auth-field">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label>Email</label>
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

              <div className="auth-field-group">
                <label>Password</label>
                <div className="auth-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="new-password"
                    value={password}
                    onChange={handlePasswordChange}
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

                {password && (
                  <div className="auth-hint">
                    <div className="strength-bar">
                      <div
                        className={`strength-fill strength-${passwordStrength.score}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="strength-label">{strengthLabel}</span>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="auth-reqs">
                        <p>Password must contain:</p>
                        <ul>
                          {passwordStrength.feedback.map((req, index) => (
                            <li key={index}><span className="x">✗</span>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="auth-field-group">
                <label>Confirm Password</label>
                <div className="auth-field">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your Password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
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

                {confirmPassword && (
                  <div className={`auth-match ${passwordMatch ? 'ok' : 'no'}`}>
                    {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
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
                {isLoading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </div>

            <div className="auth-switch-link">
              <span>Already have an account? </span>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login') }}>Sign In →</a>
            </div>
          </form>
        </div>
      </div>

      {showVerificationPopup && (
        <div className="popup-overlay" onClick={(e) => {
          if (e.target.className === 'popup-overlay') closePopup()
        }}>
          <div className="popup-modal verification-popup">
            <div className="popup-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#925ED5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h2>Verify Your Email</h2>
            <p className="popup-message">
              We've sent a verification link to <strong>{userEmail}</strong>
            </p>
            <p className="popup-submessage">
              Please check your inbox and click the verification link to activate your account before logging in.
            </p>
            <button className="popup-btn" onClick={closePopup}>
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegistrationForm
