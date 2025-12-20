// Scenario Service
// This file contains all scenario-related API calls

import { API_ENDPOINTS, getHeaders } from './server'

/**
 * Create a new scenario
 * @param {Object} scenarioData - The scenario data
 * @returns {Promise<Object>} Scenario creation result
 */
export const createScenario = async (scenarioData) => {
  try {
    const response = await fetch(API_ENDPOINTS.SCENARIO.CREATE, {
      method: 'POST',
      headers: getHeaders(true), // Include auth token
      body: JSON.stringify(scenarioData)
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        scenario: data.scenario
      }
    } else {
      return {
        success: false,
        error: data.message || data.errors?.join(', ') || 'Failed to create scenario'
      }
    }
  } catch (error) {
    console.error('Create Scenario Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Get all scenarios for the current user
 * @returns {Promise<Object>} User's scenarios
 */
export const getAllScenarios = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.SCENARIO.GET_ALL, {
      method: 'GET',
      headers: getHeaders(true)
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        scenarios: data.scenarios,
        count: data.count
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to fetch scenarios'
      }
    }
  } catch (error) {
    console.error('Get Scenarios Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Get a specific scenario by ID
 * @param {string} scenarioId - The scenario ID
 * @returns {Promise<Object>} Scenario data
 */
export const getScenarioById = async (scenarioId) => {
  try {
    const response = await fetch(API_ENDPOINTS.SCENARIO.GET_BY_ID(scenarioId), {
      method: 'GET',
      headers: getHeaders(true)
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        scenario: data.scenario
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to fetch scenario'
      }
    }
  } catch (error) {
    console.error('Get Scenario Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Update a scenario
 * Uses PUT method for full update (both PATCH and PUT work on backend)
 * @param {string} scenarioId - The scenario ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Update result
 */
export const updateScenario = async (scenarioId, updateData) => {
  try {
    const response = await fetch(API_ENDPOINTS.SCENARIO.UPDATE(scenarioId), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updateData)
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        scenario: data.scenario
      }
    } else {
      return {
        success: false,
        error: data.message || data.errors?.join(', ') || 'Failed to update scenario'
      }
    }
  } catch (error) {
    console.error('Update Scenario Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Delete a scenario
 * @param {string} scenarioId - The scenario ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteScenario = async (scenarioId) => {
  try {
    const response = await fetch(API_ENDPOINTS.SCENARIO.DELETE(scenarioId), {
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
        error: data.message || 'Failed to delete scenario'
      }
    }
  } catch (error) {
    console.error('Delete Scenario Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

/**
 * Get all stories for a scenario
 * @param {string} scenarioId - The scenario ID
 * @returns {Promise<Object>} Stories result
 */
export const getScenarioStories = async (scenarioId) => {
  try {
    const response = await fetch(API_ENDPOINTS.SCENARIO.GET_STORIES(scenarioId), {
      method: 'GET',
      headers: getHeaders(true)
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        stories: data.stories || [],
        message: data.message
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to fetch scenario stories'
      }
    }
  } catch (error) {
    console.error('Get Scenario Stories Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.'
    }
  }
}

