/**
 * API Configuration utility
 * Handles different API URLs for development and production
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const api = {
  baseURL: API_BASE_URL,
  
  // Helper method to create full API URLs
  url: (endpoint: string): string => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    return `${API_BASE_URL}/${cleanEndpoint}`
  },

  // Common headers
  getHeaders: (includeAuth: boolean = true) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (includeAuth) {
      const token = localStorage.getItem('token')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }
    
    return headers
  },

  // Helper for authenticated requests
  fetch: async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token')
    
    return fetch(api.url(endpoint), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })
  }
}

export default api 