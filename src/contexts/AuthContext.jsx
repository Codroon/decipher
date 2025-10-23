import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// API Base URL - Update this to match your backend URL
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://decipher-backend-92mi.onrender.com'}/api/auth`

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    
    if (savedUser && savedToken && savedUser !== 'undefined' && savedToken !== 'undefined') {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
        // Optionally verify token with backend
        verifyToken(savedToken)
      } catch (error) {
        console.error('Error parsing saved user:', error)
        // Clear invalid data
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  // Verify token with backend
  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data.user)
          localStorage.setItem('user', JSON.stringify(data.data.user))
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          setUser(null)
        }
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        setUser(null)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Register new user
  const register = async (name, email, password, confirmPassword) => {
    // Don't set isLoading here - let the component handle its own loading state
    // This prevents unwanted re-renders that can reset component state
    
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        // Don't store user data or token - user needs to verify email first
        return { 
          success: true, 
          message: data.message,
          requiresVerification: data.requiresVerification,
          email: data.email
        }
      } else {
        return { success: false, error: data.message }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Login user
  const login = async (email, password, rememberMe = false) => {
    // Don't set isLoading here - let the component handle its own loading state
    // Setting isLoading causes App.jsx useEffect to trigger and remount components
    
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe
        })
      })

      const data = await response.json()

      if (data.success) {
        // Store user data and token
        setUser(data.data.user)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('token', data.data.token)
        
        return { success: true, user: data.data.user }
      } else {
        return { 
          success: false, 
          error: data.message,
          requiresVerification: data.requiresVerification,
          email: data.email
        }
      }
    } catch (error) {
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to server. Please check if the backend is running and the URL is correct.' 
        }
      }
      
      return { 
        success: false, 
        error: `Network error: ${error.message}. Please check your connection and try again.` 
      }
    }
  }

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          email,
          otp
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update user data and token
        setUser(data.data.user)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('token', data.data.token)
        
        setIsLoading(false)
        return { success: true, user: data.data.user, message: data.message }
      } else {
        setIsLoading(false)
        return { success: false, error: data.message }
      }
    } catch (error) {
      setIsLoading(false)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Resend verification OTP
  const resendVerification = async (email) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      setIsLoading(false)
      
      return { success: data.success, message: data.message }
    } catch (error) {
      setIsLoading(false)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Forgot password
  const forgotPassword = async (email) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      setIsLoading(false)
      
      return { success: data.success, message: data.message }
    } catch (error) {
      setIsLoading(false)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Reset password
  const resetPassword = async (token, password, confirmPassword) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        // Store user data and token
        setUser(data.data.user)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('token', data.data.token)
        
        setIsLoading(false)
        return { success: true, user: data.data.user, message: data.message }
      } else {
        setIsLoading(false)
        return { success: false, error: data.message }
      }
    } catch (error) {
      setIsLoading(false)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Logout user
  const logout = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage regardless of API call result
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    register,
    login,
    verifyOTP,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
