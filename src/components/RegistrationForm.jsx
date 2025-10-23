import React, { useState, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './LoginForm.css'

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

  // Password strength validation function
  const checkPasswordStrength = (password) => {
    const feedback = []
    let score = 0

    // Length check
    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('At least 8 characters')
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('One lowercase letter')
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('One uppercase letter')
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1
    } else {
      feedback.push('One number')
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1
    } else {
      feedback.push('One special character')
    }

    return { score, feedback }
  }

  // Check password match
  const checkPasswordMatch = (password, confirmPassword) => {
    return password === confirmPassword && confirmPassword.length > 0
  }

  // Handle password change
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordStrength(checkPasswordStrength(newPassword))
    setPasswordMatch(checkPasswordMatch(newPassword, confirmPassword))
  }

  // Handle confirm password change
  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value
    setConfirmPassword(newConfirmPassword)
    setPasswordMatch(checkPasswordMatch(password, newConfirmPassword))
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (isSubmitting.current) {
      return
    }
    
    // Validate password strength
    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please ensure it meets the requirements.')
      return
    }

    // Validate password match
    if (!passwordMatch) {
      setError('Passwords do not match.')
      return
    }
    
    isSubmitting.current = true
    setError('')
    setIsLoading(true)

    // Save email before clearing
    const submittedEmail = email

    try {
      const result = await register(name, submittedEmail, password, confirmPassword)
      
      if (result.success) {
        // Registration successful, show verification popup
        const displayEmail = result.email || submittedEmail
        
        // Set popup state immediately - use functional updates to ensure latest state
        setUserEmail(displayEmail)
        setShowVerificationPopup(true)
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError('An error occurred during registration')
    } finally {
      setIsLoading(false)
      isSubmitting.current = false
    }
  }, [email, name, password, confirmPassword, register])

  const closePopup = () => {
    setShowVerificationPopup(false)
    // Clear form when closing popup
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    navigate('/login')
  }

  return (
    <>
      {/* Verification Popup Modal - Render at top level */}
      {showVerificationPopup && (
        <div className="popup-overlay" onClick={(e) => {
          // Close popup if clicking on overlay (not the modal itself)
          if (e.target.className === 'popup-overlay') {
            closePopup()
          }
        }}>
          <div className="popup-modal verification-popup">
            <div className="popup-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#925ED5">
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
      
      <div className="signup-container">
        <div className="signup-card">
          <div className="form-header">
            <h1>SIGN UP</h1>
            <p>Sign up to begin your AI storytelling journey.</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-fields">
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email</label>
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

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={password}
                  onChange={handlePasswordChange}
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
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className={`strength-fill strength-${passwordStrength.score}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="strength-text">
                    <span className={`strength-label strength-${passwordStrength.score}`}>
                      {passwordStrength.score === 0 && 'Very Weak'}
                      {passwordStrength.score === 1 && 'Weak'}
                      {passwordStrength.score === 2 && 'Fair'}
                      {passwordStrength.score === 3 && 'Good'}
                      {passwordStrength.score === 4 && 'Strong'}
                      {passwordStrength.score === 5 && 'Very Strong'}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="strength-requirements">
                      <p>Password must contain:</p>
                      <ul>
                        {passwordStrength.feedback.map((req, index) => (
                          <li key={index} className="requirement-item">
                            <span className="requirement-icon">✗</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm your Password" 
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {showConfirmPassword ? (
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
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="password-match">
                  <span className={`match-indicator ${passwordMatch ? 'match-success' : 'match-error'}`}>
                    {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </span>
                </div>
              )}
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
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>

          <div className="signin-link">
            <span>Already have an account? </span>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign In →</a>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

export default RegistrationForm
