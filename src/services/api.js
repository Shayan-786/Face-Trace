/**
 * api.js — Face Trace API Service
 *
 * This file is the single point of contact between the React frontend
 * and the Flask backend. Currently a placeholder structure.
 *
 * When Flask integration begins, replace the placeholder functions with
 * real fetch/axios calls pointing to the Flask base URL.
 *
 * All API calls should go through this file — never hard-code backend
 * URLs directly inside React components.
 */

// Base URL for the Flask API — will be moved to .env later
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Helper: perform a JSON fetch request.
 * @param {string} endpoint - API path, e.g. '/analyze'
 * @param {RequestInit} options - fetch options
 * @returns {Promise<any>} - parsed JSON response
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultHeaders = {
    'Content-Type': 'application/json',
    // Authorization header will be added here once JWT is implemented:
    // 'Authorization': `Bearer ${getToken()}`
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// ─────────────────────────────────────────────
// Auth endpoints (placeholders — not yet live)
// ─────────────────────────────────────────────

/**
 * Register a new user.
 * @param {{ username: string, email: string, password: string }} data
 */
export async function registerUser(data) {
  // TODO: POST /auth/register
  console.warn('registerUser: Flask API not yet connected.')
  return Promise.resolve({ message: 'Registration placeholder' })
}

/**
 * Login an existing user.
 * @param {{ email: string, password: string }} data
 */
export async function loginUser(data) {
  // TODO: POST /auth/login
  console.warn('loginUser: Flask API not yet connected.')
  return Promise.resolve({ message: 'Login placeholder' })
}

/**
 * Logout the current user.
 */
export async function logoutUser() {
  // TODO: POST /auth/logout  or clear JWT locally
  console.warn('logoutUser: Flask API not yet connected.')
  return Promise.resolve()
}

// ─────────────────────────────────────────────
// Analysis endpoints (placeholders — not yet live)
// ─────────────────────────────────────────────

/**
 * Upload a video and request deepfake analysis.
 * @param {File} videoFile - the video File object from the upload UI
 * @param {Function} onProgress - optional upload progress callback
 */
export async function analyzeVideo(videoFile, onProgress) {
  // TODO: POST /analyze  (multipart/form-data)
  console.warn('analyzeVideo: Flask API not yet connected.')
  return Promise.resolve({ message: 'Analysis placeholder' })
}

/**
 * Fetch the analysis history for the logged-in user.
 */
export async function getAnalysisHistory() {
  // TODO: GET /history
  console.warn('getAnalysisHistory: Flask API not yet connected.')
  return Promise.resolve([])
}

/**
 * Fetch a single analysis result by ID.
 * @param {string|number} analysisId
 */
export async function getAnalysisResult(analysisId) {
  // TODO: GET /analysis/:id
  console.warn('getAnalysisResult: Flask API not yet connected.')
  return Promise.resolve(null)
}
