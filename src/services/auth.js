/**
 * auth.js — Temporary frontend-only authentication service
 *
 * PURPOSE:
 *   Provides a simple, self-contained auth layer for the first FYP
 *   frontend evaluation. No passwords are ever stored. A single flag
 *   in localStorage indicates whether the demo user is logged in.
 *
 * REPLACING WITH FLASK LATER:
 *   When Flask API integration begins, replace the body of each
 *   exported function with a real API call from api.js.
 *   The function signatures stay the same, so Login.jsx, Sidebar.jsx,
 *   and ProtectedRoute.jsx require zero changes.
 *
 * DEMO CREDENTIALS (frontend only — not a real account):
 *   Email:    demo@facetrace.com
 *   Password: FaceTrace123
 */

// ── Storage key ───────────────────────────────────────────────
// Only the flag "is logged in" is stored — never the password.
const AUTH_KEY = 'ft_is_authenticated'

// ── Demo credentials (hardcoded for evaluation only) ─────────
const DEMO_EMAIL    = 'demo@facetrace.com'
const DEMO_PASSWORD = 'FaceTrace123'

/**
 * Attempt to log in with the provided credentials.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, error?: string }}
 *
 * TODO (Flask integration): replace body with:
 *   const data = await loginUser({ email, password })   // from api.js
 *   localStorage.setItem(AUTH_KEY, 'true')
 *   return { success: true }
 */
export function login(email, password) {
  if (
    email.trim().toLowerCase() === DEMO_EMAIL &&
    password === DEMO_PASSWORD
  ) {
    localStorage.setItem(AUTH_KEY, 'true')
    return { success: true }
  }

  return {
    success: false,
    error: 'Invalid email or password. Please try the demo credentials.',
  }
}

/**
 * Log out the current user.
 * Clears the auth flag from localStorage.
 *
 * TODO (Flask integration): also call POST /auth/logout and clear JWT.
 */
export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

/**
 * Check whether a user is currently authenticated.
 *
 * @returns {boolean}
 *
 * TODO (Flask integration): validate JWT expiry here instead.
 */
export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'true'
}
