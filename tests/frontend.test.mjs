import test from 'node:test'
import assert from 'node:assert/strict'
import {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  getAdminUsers,
  setUserActive,
} from '../src/services/auth.js'
import {
  saveFileCheck,
  getAnalysisHistory,
  deleteAnalysis,
  getAdminRecords,
  deleteAdminRecord,
} from '../src/services/analysis.js'
import {
  validateVideo,
  verifyVideoHeader,
  MAX_FILE_BYTES,
} from '../src/services/media.js'

const values = new Map()
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
}
globalThis.window = new EventTarget()

test('local accounts require registration and isolate saved records', async () => {
  values.clear()
  assert.equal((await login('demo@facetrace.com', 'demo123')).success, false)
  assert.equal(
    (
      await register({
        username: 'First',
        email: 'first@example.test',
        password: 'test-only-password',
      })
    ).success,
    true,
  )
  assert.equal(JSON.parse(values.get('ft_users'))[0].password, undefined)
  assert.equal((await login('first@example.test', 'wrong')).success, false)
  assert.equal((await login('FIRST@example.test', 'test-only-password')).success, true)
  updateProfile('Updated Name')
  assert.equal(getCurrentUser().username, 'Updated Name')
  const record = saveFileCheck(
    { name: 'sample.mp4', size: 128, type: 'video/mp4' },
    4,
    true,
  )
  assert.equal(record.confidence, null)
  assert.equal(getAnalysisHistory().length, 1)
  logout()
  assert.equal(getAnalysisHistory().length, 0)
  await register({
    username: 'Second',
    email: 'second@example.test',
    password: 'test-only-password',
  })
  await login('second@example.test', 'test-only-password')
  deleteAnalysis(record.id)
  assert.equal(getAnalysisHistory().length, 0)
  await login('first@example.test', 'test-only-password')
  assert.equal(getAnalysisHistory().length, 1)
  deleteAnalysis(record.id)
  assert.equal(getAnalysisHistory().length, 0)
})

test('malformed browser storage does not crash the app', () => {
  values.set('ft_users', '{invalid')
  assert.equal(getCurrentUser(), null)
  assert.deepEqual(getAnalysisHistory(), [])
})

test('file validation rejects empty, oversized, renamed, and unsupported files', async () => {
  assert.match(validateVideo({ name: 'empty.mp4', size: 0, type: 'video/mp4' }), /empty/)
  assert.match(
    validateVideo({ name: 'large.mp4', size: MAX_FILE_BYTES + 1, type: 'video/mp4' }),
    /100 MB/,
  )
  assert.match(
    validateVideo({ name: 'text.txt', size: 10, type: 'text/plain' }),
    /Unsupported/,
  )
  assert.match(
    validateVideo({ name: 'wrong.mp4', size: 10, type: 'text/plain' }),
    /does not match/,
  )
  assert.equal(validateVideo({ name: 'clip.MKV', size: 10, type: '' }), '')
  await assert.rejects(
    verifyVideoHeader(new File(['not video'], 'fake.mp4')),
    /recognized video/,
  )
  await verifyVideoHeader(
    new File(
      [new Uint8Array([0, 0, 0, 16, 102, 116, 121, 112, 105, 115, 111, 109])],
      'clip.mp4',
    ),
  )
})

test('admin manages real local users and records; users cannot call admin operations', async () => {
  values.clear()
  await register({
    username: 'Owner',
    email: 'owner@example.test',
    password: 'local-test-password',
  })
  await login('owner@example.test', 'local-test-password')
  assert.equal(getCurrentUser().role, 'user')
  const record = saveFileCheck(
    { name: 'owned.mp4', size: 20, type: 'video/mp4' },
    2,
    true,
  )
  assert.throws(() => getAdminUsers(), /Administrator/)
  assert.throws(() => getAdminRecords(), /Administrator/)
  assert.throws(() => setUserActive('owner@example.test', false), /Administrator/)
  assert.throws(() => deleteAdminRecord(record.id), /Administrator/)
  logout()
  assert.equal((await login('admin@facetrace.local', 'wrong')).success, false)
  assert.equal(
    (
      await register({
        username: 'Impostor',
        email: 'admin@facetrace.local',
        password: 'local-test-password',
      })
    ).success,
    false,
  )
  assert.equal(
    (await login('admin@facetrace.local', 'FaceTraceAdmin!2026')).success,
    true,
  )
  assert.equal(getCurrentUser().role, 'admin')
  assert.equal(getAdminUsers().length, 1)
  assert.equal(getAdminUsers()[0].passwordHash, undefined)
  assert.equal(getAdminRecords()[0].id, record.id)
  const adminRecord = saveFileCheck(
    { name: 'admin-video.mp4', size: 30, type: 'video/mp4' },
    3,
    true,
  )
  assert.equal(getAnalysisHistory().length, 1)
  assert.equal(getAnalysisHistory()[0].id, adminRecord.id)
  assert.equal(getAdminRecords().length, 2)
  setUserActive('owner@example.test', false)
  logout()
  assert.equal((await login('owner@example.test', 'local-test-password')).success, false)
  await login('admin@facetrace.local', 'FaceTraceAdmin!2026')
  setUserActive('owner@example.test', true)
  deleteAdminRecord(record.id)
  logout()
  assert.equal((await login('owner@example.test', 'local-test-password')).success, true)
  assert.equal(getAnalysisHistory().length, 0)
})
