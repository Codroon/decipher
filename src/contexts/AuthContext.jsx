import React, { createContext, useContext, useState, useEffect } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext()

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
      const result = await authService.verifyToken(token)
      
      if (result.success) {
        setUser(result.user)
        localStorage.setItem('user', JSON.stringify(result.user))
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
    
    return await authService.registerUser(name, email, password, confirmPassword)
  }

  // Login user
  const login = async (email, password, rememberMe = false) => {
    // Don't set isLoading here - let the component handle its own loading state
    // Setting isLoading causes App.jsx useEffect to trigger and remount components
    
    const result = await authService.loginUser(email, password, rememberMe)
    
    if (result.success) {
      // Store user data and token
      setUser(result.user)
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('token', result.token)
    }
    
    return result
  }

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    setIsLoading(true)
    
    const result = await authService.verifyOTP(email, otp)
    
    if (result.success) {
      // Update user data and token
      setUser(result.user)
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('token', result.token)
    }
    
    setIsLoading(false)
    return result
  }

  // Resend verification OTP
  const resendVerification = async (email) => {
    setIsLoading(true)
    
    const result = await authService.resendVerificationOTP(email)
    
    setIsLoading(false)
    return result
  }

  // Forgot password
  const forgotPassword = async (email) => {
    setIsLoading(true)
    
    const result = await authService.forgotPassword(email)
    
    setIsLoading(false)
    return result
  }

  // Reset password
  const resetPassword = async (token, password, confirmPassword) => {
    setIsLoading(true)
    
    const result = await authService.resetPassword(token, password, confirmPassword)
    
    if (result.success) {
      // Store user data and token
      setUser(result.user)
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('token', result.token)
    }
    
    setIsLoading(false)
    return result
  }

  // Logout user
  const logout = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await authService.logoutUser(token)
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
