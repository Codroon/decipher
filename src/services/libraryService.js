import { BASE_URL } from './server';

export const saveEntityToLibrary = async (type, name, description) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { success: false, error: 'User is not authenticated' };
  }

  // Type can be 'character', 'location', or 'creature'
  let endpoint = '';
  if (type === 'character') endpoint = `${BASE_URL}/api/characters`;
  else if (type === 'location') endpoint = `${BASE_URL}/api/locations`;
  else if (type === 'creature') endpoint = `${BASE_URL}/api/creatures`;
  else return { success: false, error: 'Invalid entity type' };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, description })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to save to library');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getLibraryEntities = async (type) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { success: false, error: 'User is not authenticated' };
  }

  // Type can be 'character', 'location', or 'creature'
  let endpoint = '';
  if (type === 'character') endpoint = `${BASE_URL}/api/characters`;
  else if (type === 'location') endpoint = `${BASE_URL}/api/locations`;
  else if (type === 'creature') endpoint = `${BASE_URL}/api/creatures`;
  else return { success: false, error: 'Invalid entity type' };

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch library entities');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
