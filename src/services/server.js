// API Configuration for Frontend
// This file centralizes all backend API configuration

// Get API base URL from environment variable or use default
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// API endpoints organized by domain
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    BASE: `${BASE_URL}/api/auth`,
    REGISTER: `${BASE_URL}/api/auth/register`,
    LOGIN: `${BASE_URL}/api/auth/login`,
    LOGOUT: `${BASE_URL}/api/auth/logout`,
    VERIFY_OTP: `${BASE_URL}/api/auth/verify-otp`,
    RESEND_VERIFICATION: `${BASE_URL}/api/auth/resend-verification`,
    FORGOT_PASSWORD: `${BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/api/auth/reset-password`,
    PROFILE: `${BASE_URL}/api/auth/profile`,
  },
  // Story endpoints
  STORY: {
    BASE: `${BASE_URL}/api/story`,
    CREATE: `${BASE_URL}/api/story/create`,
    GET_ALL: `${BASE_URL}/api/story/`,
    GET_BY_ID: (id) => `${BASE_URL}/api/story/${id}`,
    UPDATE: (id) => `${BASE_URL}/api/story/${id}`,
    DELETE: (id) => `${BASE_URL}/api/story/${id}`,
    REGENERATE: (id) => `${BASE_URL}/api/story/regenerate/${id}`,
    CONTINUE: (id) => `${BASE_URL}/api/story/continue/${id}`,
    EDIT: (id) => `${BASE_URL}/api/story/edit/${id}`,
    EDIT_CHUNK: (id) => `${BASE_URL}/api/story/edit-chunk/${id}`,
  },
  // Add more endpoint categories as needed
  // IMAGES: {
  //   BASE: `${BASE_URL}/api/images`,
  //   GENERATE: `${BASE_URL}/api/images/generate`,
  //   ...
  // }
}

// Common headers for all requests
export const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }

  if (includeAuth) {
    const token = localStorage.getItem('token')
    console.log('token', token)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  return headers
}

// Helper function for GET requests
export const apiGet = async (url, includeAuth = false) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(includeAuth)
    })

    return await response.json()
  } catch (error) {
    console.error('API GET Error:', error)
    throw error
  }
}

// Helper function for POST requests
export const apiPost = async (url, data, includeAuth = false) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(includeAuth),
      body: JSON.stringify(data)
    })

    return await response.json()
  } catch (error) {
    console.error('API POST Error:', error)
    throw error
  }
}

// Helper function for PUT requests
export const apiPut = async (url, data, includeAuth = false) => {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(includeAuth),
      body: JSON.stringify(data)
    })

    return await response.json()
  } catch (error) {
    console.error('API PUT Error:', error)
    throw error
  }
}

// Helper function for DELETE requests
export const apiDelete = async (url, includeAuth = false) => {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(includeAuth)
    })

    return await response.json()
  } catch (error) {
    console.error('API DELETE Error:', error)
    throw error
  }
}

// Export base URL for direct use if needed
export { BASE_URL }

