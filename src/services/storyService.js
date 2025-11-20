// Story Service
// This file contains all story-related API calls

import { API_ENDPOINTS, getHeaders } from './server'

/**
 * Create a new story
 * @param {string} setting - The story setting/world
 * @param {string} character - The character type/role
 * @param {string} characterName - The character's name
 * @returns {Promise<Object>} Story creation result
 */
export const createStory = async (setting, character, characterName) => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.CREATE, {
      method: 'POST',
      headers: getHeaders(true), // Include auth token
      body: JSON.stringify({
        setting,
        character,
        characterName
      })
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        story: data.story
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to create story'
      }
    }
  } catch (error) {
    console.error('Create Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Get all stories for the current user
 * @returns {Promise<Object>} User's stories
 */
export const getAllStories = async () => {
  try {
    console.log('Fetching stories from:', API_ENDPOINTS.STORY.GET_ALL)
    const token = localStorage.getItem('token')
    console.log('Token available:', !!token)
    
    const response = await fetch(API_ENDPOINTS.STORY.GET_ALL, {
      method: 'GET',
      headers: getHeaders(true)
    })

    console.log('Stories response status:', response.status)
    const data = await response.json()
    console.log('Stories response data:', data)

    if (response.ok) {
      return {
        success: true,
        stories: data.stories,
        count: data.count
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to fetch stories'
      }
    }
  } catch (error) {
    console.error('Get Stories Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Get a specific story by ID
 * @param {string} storyId - The story ID
 * @returns {Promise<Object>} Story data
 */
export const getStoryById = async (storyId) => {
  try {
    console.log('Fetching story:', storyId)
    const token = localStorage.getItem('token')
    console.log('Token available:', !!token)
    
    const response = await fetch(API_ENDPOINTS.STORY.GET_BY_ID(storyId), {
      method: 'GET',
      headers: getHeaders(true)
    })

    console.log('Story response status:', response.status)
    const data = await response.json()
    console.log('Story response data:', data)

    if (response.ok) {
      return {
        success: true,
        story: data.story
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to fetch story'
      }
    }
  } catch (error) {
    console.error('Get Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Update a story
 * @param {string} storyId - The story ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Update result
 */
export const updateStory = async (storyId, updateData) => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.UPDATE(storyId), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updateData)
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        story: data.story
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to update story'
      }
    }
  } catch (error) {
    console.error('Update Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Delete a story
 * @param {string} storyId - The story ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteStory = async (storyId) => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.DELETE(storyId), {
      method: 'DELETE',
      headers: getHeaders(true)
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to delete story'
      }
    }
  } catch (error) {
    console.error('Delete Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Regenerate last chunk of story
 * @param {string} storyId - The story ID
 * @param {string} model - The model to use (e.g., 'qwen3:8b')
 * @returns {Promise<Object>} Regeneration result
 */
export const regenerateLastChunk = async (storyId, model = 'qwen3:8b') => {
  try {
    const url = `${API_ENDPOINTS.STORY.REGENERATE(storyId)}?model=${encodeURIComponent(model)}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true)
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        story: data.story
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to regenerate story chunk'
      }
    }
  } catch (error) {
    console.error('Regenerate Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Continue the story
 * @param {string} storyId - The story ID
 * @param {string} model - The model to use (e.g., 'qwen3:8b')
 * @returns {Promise<Object>} Continue result
 */
export const continueStory = async (storyId, model = 'qwen3:8b') => {
  try {
    const response = await fetch(API_ENDPOINTS.STORY.CONTINUE(storyId), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ model })
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        story: data.story
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to continue story'
      }
    }
  } catch (error) {
    console.error('Continue Story Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Edit last paragraph of story
 * @param {string} storyId - The story ID
 * @param {string} minorEditInstruction - Instruction for editing
 * @param {string} model - The model to use (e.g., 'qwen3:8b')
 * @returns {Promise<Object>} Edit result
 */
export const editLastParagraph = async (storyId, minorEditInstruction, model = 'qwen3:8b') => {
  try {
    const url = API_ENDPOINTS.STORY.EDIT(storyId)
    const payload = { minorEditInstruction, model }
    console.log('Edit URL:', url)
    console.log('Edit payload:', payload)
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    })

    console.log('Edit response status:', response.status)
    console.log('Edit response headers:', response.headers)

    // Check if response is ok before parsing
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edit Story Error Response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        return {
          success: false,
          error: `Server error: ${response.status} ${response.statusText}`
        }
      }
      return {
        success: false,
        error: errorData.message || errorData.error || 'Failed to edit story'
      }
    }

    // Parse JSON response
    let data
    let responseText = ''
    try {
      responseText = await response.text()
      if (!responseText) {
        return {
          success: false,
          error: 'Server returned empty response'
        }
      }
      
      // Check if response is HTML (ngrok warning page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('Received HTML instead of JSON (possibly ngrok warning):', responseText.substring(0, 200))
        return {
          success: false,
          error: 'Received HTML response. Please check ngrok configuration or try again.'
        }
      }
      
      data = JSON.parse(responseText)
      console.log('Edit success data:', data)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Response text:', responseText?.substring(0, 200))
      return {
        success: false,
        error: 'Invalid JSON response from server'
      }
    }

    return {
      success: true,
      message: data.message,
      revisedChunk: data.revisedChunk,
      story: data.story
    }
  } catch (error) {
    console.error('Edit Story Network Error:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    // Check for CORS error
    if (error.message.includes('CORS') || error.message.includes('preflight')) {
      return {
        success: false,
        error: 'CORS Error: Backend server needs to allow PATCH method in CORS configuration. Please contact backend developer.'
      }
    }
    
    return {
      success: false,
      error: `Network error: ${error.message}. Please check your connection and try again.`
    }
  }
}

/**
 * Edit a specific chunk manually
 * @param {string} storyId - The story ID
 * @param {number} chunkIndex - The index of the chunk to edit
 * @param {string} newContent - The new content for the chunk
 * @returns {Promise<Object>} Edit chunk result
 */
export const editChunk = async (storyId, chunkIndex, newContent) => {
  try {
    const url = API_ENDPOINTS.STORY.EDIT_CHUNK(storyId)
    console.log('Edit Chunk URL:', url)
    console.log('Edit Chunk payload:', { chunkIndex, newContent })
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ chunkIndex, newContent })
    })

    console.log('Edit Chunk response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edit Chunk Error Response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        return {
          success: false,
          error: `Server error: ${response.status} ${response.statusText}`
        }
      }
      return {
        success: false,
        error: errorData.message || errorData.error || 'Failed to edit chunk'
      }
    }

    let responseText = ''
    let data
    try {
      responseText = await response.text()
      if (!responseText) {
        return {
          success: false,
          error: 'Server returned empty response'
        }
      }
      
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('Received HTML instead of JSON:', responseText.substring(0, 200))
        return {
          success: false,
          error: 'Received HTML response. Please check ngrok configuration or try again.'
        }
      }
      
      data = JSON.parse(responseText)
      console.log('Edit Chunk success data:', data)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      return {
        success: false,
        error: 'Invalid JSON response from server'
      }
    }

    return {
      success: true,
      message: data.message,
      story: data.story
    }
  } catch (error) {
    console.error('Edit Chunk Network Error:', error)
    
    // Check for CORS error
    if (error.message.includes('CORS') || error.message.includes('preflight')) {
      return {
        success: false,
        error: 'CORS Error: Backend server needs to allow PATCH method in CORS configuration. Please contact backend developer.'
      }
    }
    
    return {
      success: false,
      error: `Network error: ${error.message}. Please check your connection and try again.`
    }
  }
}

