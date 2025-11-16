// Authentication Service
// This file contains all authentication-related API calls

import { API_ENDPOINTS, getHeaders } from './server'

/**
 * Register a new user
 * @param {string} name - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Promise<Object>} Registration result
 */
export const registerUser = async (name, email, password, confirmPassword) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({
        name,
        email,
        password,
        confirmPassword
      })
    })

    const data = await response.json()

    if (data.success) {
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
    console.error('Registration Error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Login user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {boolean} rememberMe - Remember user session
 * @returns {Promise<Object>} Login result with user data and token
 */
export const loginUser = async (email, password, rememberMe = false) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({
        email,
        password,
        rememberMe
      })
    })

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        user: data.data.user,
        token: data.data.token
      }
    } else {
      return {
        success: false,
        error: data.message,
        requiresVerification: data.requiresVerification,
        email: data.email
      }
    }
  } catch (error) {
    console.error('Login Error:', error)
    
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

/**
 * Verify OTP for email verification
 * @param {string} email - User's email
 * @param {string} otp - One-time password
 * @returns {Promise<Object>} Verification result
 */
export const verifyOTP = async (email, otp) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({
        email,
        otp
      })
    })

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        user: data.data.user,
        token: data.data.token,
        message: data.message
      }
    } else {
      return { success: false, error: data.message }
    }
  } catch (error) {
    console.error('OTP Verification Error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Resend verification OTP
 * @param {string} email - User's email
 * @returns {Promise<Object>} Resend result
 */
export const resendVerificationOTP = async (email) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email })
    })

    const data = await response.json()
    return { success: data.success, message: data.message }
  } catch (error) {
    console.error('Resend Verification Error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Initiate forgot password process
 * @param {string} email - User's email
 * @returns {Promise<Object>} Forgot password result
 */
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email })
    })

    const data = await response.json()
    return { success: data.success, message: data.message }
  } catch (error) {
    console.error('Forgot Password Error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Reset password with token
 * @param {string} token - Reset password token
 * @param {string} password - New password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Promise<Object>} Reset password result
 */
export const resetPassword = async (token, password, confirmPassword) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({
        token,
        password,
        confirmPassword
      })
    })

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        user: data.data.user,
        token: data.data.token,
        message: data.message
      }
    } else {
      return { success: false, error: data.message }
    }
  } catch (error) {
    console.error('Reset Password Error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Verify user token and get profile
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Profile verification result
 */
export const verifyToken = async (token) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    const data = await response.json()

    if (response.ok && data.success) {
      return {
        success: true,
        user: data.data.user
      }
    } else {
      return { success: false, error: data.message || 'Token verification failed' }
    }
  } catch (error) {
    console.error('Token Verification Error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Logout user
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Logout result
 */
export const logoutUser = async (token) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Logout Error:', error)
    // Return success anyway since we'll clear local storage
    return { success: true }
  }
}

