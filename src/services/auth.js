import { readJson, writeJson } from './storage.js'

// Local prototype only. Flask must authenticate requests and enforce permissions.
// Password derivation prevents storing new passwords as plaintext, but browser
// storage and client-side session checks are not a server security boundary.
const USERS_KEY = 'ft_users'
const SESSION_KEY = 'ft_session'
const ITERATIONS = 210000
// Temporary frontend credentials; these are visible in the client bundle.
const ADMIN_EMAIL = 'admin@facetrace.local'
const ADMIN_PASSWORD = 'FaceTraceAdmin!2026'

function getUsers() {
  const users = readJson(USERS_KEY, [])
  if (!Array.isArray(users)) {
    return []
  }

  return users.filter(
    (user) => typeof user?.email === 'string' && typeof user?.username === 'string',
  )
}

async function derivePassword(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Account creation requires HTTPS or localhost in a modern browser.')
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256,
  )

  return Array.from(new Uint8Array(bits), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export async function register({ username, email, password }) {
  const normalizedEmail = email.trim().toLowerCase()
  const name = username.trim()
  if (normalizedEmail === ADMIN_EMAIL) {
    return { success: false, error: 'This email is reserved for the administrator.' }
  }

  if (name.length < 3 || name.length > 50) {
    return { success: false, error: 'Username must contain between 3 and 50 characters.' }
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    normalizedEmail.length > 254
  ) {
    return { success: false, error: 'Please enter a valid email address.' }
  }
  if (password.length < 8 || password.length > 128) {
    return {
      success: false,
      error: 'Password must contain between 8 and 128 characters.',
    }
  }

  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
  const passwordHash = await derivePassword(password, salt)
  const users = getUsers()

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'An account with this email already exists.' }
  }

  writeJson(USERS_KEY, [
    ...users,
    {
      id: crypto.randomUUID(),
      username: name,
      email: normalizedEmail,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    },
  ])

  return { success: true }
}

export async function login(email, password) {
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail === ADMIN_EMAIL) {
    if (password !== ADMIN_PASSWORD) {
      return { success: false, error: 'Invalid email or password.' }
    }
    writeJson(SESSION_KEY, { email: ADMIN_EMAIL, role: 'admin' })
    return { success: true }
  }
  const match = getUsers().find((user) => user.email.toLowerCase() === normalizedEmail)
  let valid = false

  if (match?.passwordHash && Array.isArray(match.salt)) {
    valid = (await derivePassword(password, match.salt)) === match.passwordHash
  } else if (typeof match?.password === 'string') {
    // Preserve user-created accounts from the earlier prototype, migrating on login.
    valid = match.password === password
  }

  if (!valid) {
    return { success: false, error: 'Invalid email or password.' }
  }

  if (!match.passwordHash) {
    if (match.active === false) {
      return {
        success: false,
        error: 'This account is suspended. Contact the administrator.',
      }
    }
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    const passwordHash = await derivePassword(password, salt)
    const migrated = {
      id: match.id || crypto.randomUUID(),
      username: match.username,
      email: normalizedEmail,
      passwordHash,
      salt,
      createdAt: match.createdAt || new Date().toISOString(),
    }
    writeJson(
      USERS_KEY,
      getUsers().map((user) =>
        user.email.toLowerCase() === normalizedEmail ? migrated : user,
      ),
    )
  }

  if (match.active === false) {
    return {
      success: false,
      error: 'This account is suspended. Contact the administrator.',
    }
  }
  writeJson(SESSION_KEY, { email: normalizedEmail })
  return { success: true }
}

export function logout() {
  writeJson(SESSION_KEY, null)
}

export function getCurrentUser() {
  const session = readJson(SESSION_KEY, null)
  if (session?.email === ADMIN_EMAIL && session?.role === 'admin') {
    return {
      id: 'local-admin',
      username: 'Administrator',
      email: ADMIN_EMAIL,
      role: 'admin',
    }
  }
  const user = getUsers().find(
    (account) => account.email.toLowerCase() === session?.email,
  )

  if (!user || user.active === false || user.email.toLowerCase() === ADMIN_EMAIL) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    role: 'user',
  }
}

export function updateProfile(username) {
  const user = getCurrentUser()
  const name = username.trim()

  if (!user) {
    throw new Error('Please sign in again.')
  }
  if (user.role === 'admin') {
    throw new Error('The fixed administrator profile cannot be edited.')
  }
  if (name.length < 3 || name.length > 50) {
    throw new Error('Username must contain between 3 and 50 characters.')
  }

  writeJson(
    USERS_KEY,
    getUsers().map((account) =>
      account.id === user.id ? { ...account, username: name } : account,
    ),
  )
}

export function getUserSnapshot() {
  return JSON.stringify(getCurrentUser())
}

export function requireAdmin() {
  if (getCurrentUser()?.role !== 'admin') {
    throw new Error('Administrator access required.')
  }
}

export function getAdminUsers() {
  requireAdmin()
  return getUsers()
    .filter((user) => user.email.toLowerCase() !== ADMIN_EMAIL)
    .map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      active: user.active !== false,
    }))
}

export function setUserActive(email, active) {
  requireAdmin()
  if (email.toLowerCase() === ADMIN_EMAIL) {
    throw new Error('The administrator cannot be suspended.')
  }
  writeJson(
    USERS_KEY,
    getUsers().map((user) => (user.email === email ? { ...user, active } : user)),
  )
}
