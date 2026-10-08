import { getCurrentUser, requireAdmin } from './auth.js'
import { readJson, writeJson } from './storage.js'

const RECORDS_KEY = 'ft_analysis_records'

export function getAdminRecords() {
  requireAdmin()
  return getRecords().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function deleteAdminRecord(id) {
  requireAdmin()
  writeJson(
    RECORDS_KEY,
    getRecords().filter((record) => record.id !== id),
  )
}

function getRecords() {
  const records = readJson(RECORDS_KEY, [])
  return Array.isArray(records)
    ? records.filter(
        (record) =>
          typeof record?.id === 'string' &&
          typeof record?.ownerId === 'string' &&
          typeof record?.filename === 'string' &&
          typeof record?.createdAt === 'string',
      )
    : []
}

export function getAnalysisHistory() {
  const user = getCurrentUser()
  if (!user) {
    return []
  }
  return getRecords()
    .filter((record) => record.ownerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getAnalysisSnapshot() {
  return JSON.stringify(getAnalysisHistory())
}

export function saveFileCheck(file, duration, previewAvailable) {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('Please sign in before saving a file check.')
  }

  const record = {
    id: crypto.randomUUID(),
    ownerId: user.id,
    filename: file.name,
    size: file.size,
    type: file.type || file.name.split('.').pop().toUpperCase(),
    duration,
    previewAvailable,
    createdAt: new Date().toISOString(),
    status: 'not-analyzed',
    visual: null,
    audio: null,
    confidence: null,
  }

  writeJson(RECORDS_KEY, [...getRecords(), record])
  return record
}

export function deleteAnalysis(id) {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('Please sign in again.')
  }
  writeJson(
    RECORDS_KEY,
    getRecords().filter((record) => record.id !== id || record.ownerId !== user.id),
  )
}
