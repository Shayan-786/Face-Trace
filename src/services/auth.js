import {
  validateUsername,
  validateAccountEmail,
  validatePassword,
  TERMS_VERSION,
} from './validation.js'
import { readJson, writeJson, writeJsonBatch } from './storage.js'

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

export async function register({ username, email, password, acceptedTerms }) {
  const normalizedEmail = email.trim().toLowerCase()
  const name = username.trim()
  if (normalizedEmail === ADMIN_EMAIL) {
    return { success: false, error: 'This email is reserved for the administrator.' }
  }

  for (const [field, error] of Object.entries({
    username: validateUsername(name),
    email: validateAccountEmail(normalizedEmail),
    password: validatePassword(password),
    acceptedTerms: acceptedTerms === true ? '' : 'Please accept the Terms & Conditions.',
  })) {
    if (error) {
      return { success: false, field, error }
    }
  }

  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
  const passwordHash = await derivePassword(password, salt)
  const users = getUsers()

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return {
      success: false,
      field: 'email',
      error: 'An account with this email already exists.',
    }
  }

  if (users.some((user) => user.username.toLowerCase() === name.toLowerCase())) {
    return { success: false, field: 'username', error: 'This username is already taken.' }
  }

  writeJson(USERS_KEY, [
    ...users,
    {
      id: crypto.randomUUID(),
      username: name,
      email: normalizedEmail,
      passwordHash,
      salt,
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date().toISOString(),
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
  const error = validateUsername(name)
  if (error) {
    throw new Error(error)
  }
  if (
    getUsers().some(
      (account) =>
        account.email !== user.email &&
        account.username.toLowerCase() === name.toLowerCase(),
    )
  ) {
    throw new Error('This username is already taken.')
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

export async function changeAccountCredentials({ currentPassword, email, password }) {
  const user = getCurrentUser()
  if (!user || user.role === 'admin') {
    throw new Error('Sign in with a regular account to change these details.')
  }
  const account = getUsers().find((entry) => entry.id === user.id)
  const valid =
    account?.passwordHash && Array.isArray(account.salt)
      ? (await derivePassword(currentPassword, account.salt)) === account.passwordHash
      : typeof account?.password === 'string' && currentPassword === account.password
  if (!valid) throw new Error('Current password is incorrect.')
  const changes = {}
  if (email !== undefined) {
    const error = validateAccountEmail(email)
    if (error) throw new Error(error)
    changes.email = email.trim().toLowerCase()
  }
  if (password !== undefined) {
    const error = validatePassword(password)
    if (error) throw new Error(error)
    if (password === currentPassword) throw new Error('Choose a different new password.')
    changes.salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    changes.passwordHash = await derivePassword(password, changes.salt)
  }
  const users = getUsers()
  const latest = users.find((entry) => entry.id === user.id)
  if (
    getCurrentUser()?.id !== user.id ||
    latest?.active === false ||
    latest?.passwordHash !== account.passwordHash ||
    latest?.email !== account.email
  ) {
    throw new Error('Your account changed. Sign in again before retrying.')
  }
  if (
    changes.email &&
    users.some(
      (entry) => entry.id !== user.id && entry.email.toLowerCase() === changes.email,
    )
  ) {
    throw new Error('An account with this email already exists.')
  }
  const updated = { ...latest, ...changes }
  if (changes.passwordHash) delete updated.password
  writeJsonBatch([
    [USERS_KEY, users.map((entry) => (entry.id === user.id ? updated : entry))],
    [SESSION_KEY, { email: updated.email }],
  ])
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

export function deleteUser(email) {
  requireAdmin()
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail === ADMIN_EMAIL) {
    throw new Error('The administrator account cannot be deleted.')
  }
  const users = getUsers()
  const user = users.find((account) => account.email.toLowerCase() === normalizedEmail)
  if (!user) {
    throw new Error('This account no longer exists.')
  }
  const records = readJson('ft_analysis_records', [])
  if (!Array.isArray(records)) {
    throw new Error('Saved records could not be read. Account deletion was cancelled.')
  }
  writeJsonBatch([
    [
      USERS_KEY,
      users.filter((account) => account.email.toLowerCase() !== normalizedEmail),
    ],
    ['ft_analysis_records', records.filter((record) => record?.ownerId !== user.id)],
  ])
}
