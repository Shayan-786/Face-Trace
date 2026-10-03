/**
 * auth.js — Temporary frontend-only authentication service
 *
 * PURPOSE:
 *   Self-contained auth layer for the FYP frontend evaluation.
 *   No passwords are hashed or sent anywhere. All data lives only
 *   in localStorage and is lost when the browser storage is cleared.
 *
 * STORAGE KEYS:
 *   ft_is_authenticated  — 'true' when a user is signed in
 *   ft_current_user      — JSON object { username, email } of the signed-in user
 *   ft_users             — JSON array of registered users { username, email, password }
 *
 *   NOTE: Storing plain-text passwords in localStorage is acceptable
 *   ONLY for this temporary frontend-only demo. It must be replaced
 *   by Flask + MySQL + password hashing before any real deployment.
 *
 * REPLACING WITH FLASK LATER:
 *   Each exported function has a TODO comment showing exactly what
 *   API call replaces it. Login.jsx, Register.jsx, Sidebar.jsx, and
 *   ProtectedRoute.jsx do not need structural changes.
 *
 * DEMO CREDENTIALS (always available, even if localStorage is cleared):
 *   Email:    demo@facetrace.com
 *   Password: FaceTrace123
 */

// ── Storage keys ──────────────────────────────────────────────
const AUTH_KEY         = 'ft_is_authenticated'
const CURRENT_USER_KEY = 'ft_current_user'
const USERS_KEY        = 'ft_users'

// ── Built-in demo account ─────────────────────────────────────
const DEMO_USER = {
  username: 'Demo User',
  email:    'demo@facetrace.com',
  password: 'FaceTrace123',   // stored only in memory — never written to localStorage
}

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

/** Read the registered-users array from localStorage. */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || []
  } catch {
    return []
  }
}

/** Persist the registered-users array to localStorage. */
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Register a new user.
 *
 * @param {{ username: string, email: string, password: string }} data
 * @returns {{ success: boolean, error?: string }}
 *
 * TODO (Flask integration): replace body with:
 *   const data = await registerUser({ username, email, password })  // api.js
 *   return { success: true }
 */
export function register({ username, email, password }) {
  const normEmail = email.trim().toLowerCase()

  // Reject attempt to register the demo account
  if (normEmail === DEMO_USER.email) {
    return { success: false, error: 'This email address is already registered.' }
  }

  const users = getUsers()

  // Duplicate email check
  const exists = users.some((u) => u.email.toLowerCase() === normEmail)
  if (exists) {
    return { success: false, error: 'An account with this email already exists.' }
  }

  // Save new user
  // WARNING: plain-text password — temporary evaluation only
  users.push({ username: username.trim(), email: normEmail, password })
  saveUsers(users)

  return { success: true }
}

/**
 * Attempt to log in with the provided credentials.
 *
 * Checks the built-in demo account first, then localStorage users.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, error?: string }}
 *
 * TODO (Flask integration): replace body with:
 *   const data = await loginUser({ email, password })   // api.js
 *   localStorage.setItem(AUTH_KEY, 'true')
 *   localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user))
 *   return { success: true }
 */
export function login(email, password) {
  const normEmail = email.trim().toLowerCase()

  // Check built-in demo account
  if (normEmail === DEMO_USER.email && password === DEMO_USER.password) {
    localStorage.setItem(AUTH_KEY, 'true')
    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify({ username: DEMO_USER.username, email: DEMO_USER.email })
    )
    return { success: true }
  }

  // Check locally registered users
  const users  = getUsers()
  const match  = users.find(
    (u) => u.email.toLowerCase() === normEmail && u.password === password
  )

  if (match) {
    localStorage.setItem(AUTH_KEY, 'true')
    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify({ username: match.username, email: match.email })
    )
    return { success: true }
  }

  return {
    success: false,
    error: 'Invalid email or password.',
  }
}

/**
 * Log out the current user.
 *
 * TODO (Flask integration): also POST /auth/logout and clear JWT.
 */
export function logout() {
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(CURRENT_USER_KEY)
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

/**
 * Get the currently signed-in user's profile.
 *
 * @returns {{ username: string, email: string } | null}
 */
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null
  } catch {
    return null
  }
}
