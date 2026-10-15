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
  deleteUser,
  changeAccountCredentials,
} from '../src/services/auth.js'
import {
  validateUsername,
  validateEmail,
  validatePassword,
  TERMS_VERSION,
} from '../src/services/validation.js'
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
  removeItem: (key) => values.delete(key),
}
globalThis.window = new EventTarget()

test('credential changes verify the current password and preserve account history', async () => {
  values.clear()
  const account = {
    username: 'Settings User',
    email: 'settings@gmail.com',
    password: 'OriginalPassword1!',
    acceptedTerms: true,
  }
  assert.equal((await register({ ...account, email: 'abc@123.com' })).field, 'email')
  assert.equal(
    (await register({ ...account, email: 'abc@gmail.com.evil.com' })).field,
    'email',
  )
  await register(account)
  await login(account.email, account.password)
  const id = getCurrentUser().id
  const record = saveFileCheck(
    { name: 'retained.mp4', size: 10, type: 'video/mp4' },
    1,
    true,
  )
  await assert.rejects(
    changeAccountCredentials({ currentPassword: 'wrong', email: 'new@yahoo.com' }),
    /incorrect/,
  )
  await assert.rejects(
    changeAccountCredentials({ currentPassword: account.password, email: 'abc@123.com' }),
    /Gmail/,
  )
  await register({ ...account, username: 'Other Person', email: 'taken@outlook.com' })
  await assert.rejects(
    changeAccountCredentials({
      currentPassword: account.password,
      email: 'taken@outlook.com',
    }),
    /already exists/,
  )
  await changeAccountCredentials({
    currentPassword: account.password,
    email: 'NEW@yahoo.com',
  })
  assert.equal(getCurrentUser().email, 'new@yahoo.com')
  assert.equal(getCurrentUser().id, id)
  assert.equal(getAnalysisHistory()[0].id, record.id)
  await assert.rejects(
    changeAccountCredentials({ currentPassword: 'wrong', password: 'NewPassword2!' }),
    /incorrect/,
  )
  await assert.rejects(
    changeAccountCredentials({ currentPassword: account.password, password: 'weak' }),
    /requirements/,
  )
  await changeAccountCredentials({
    currentPassword: account.password,
    password: 'NewPassword2!',
  })
  logout()
  assert.equal((await login(account.email, account.password)).success, false)
  assert.equal((await login('new@yahoo.com', account.password)).success, false)
  assert.equal((await login('new@yahoo.com', 'NewPassword2!')).success, true)
  assert.equal(getAnalysisHistory()[0].id, record.id)
})

test('account validation accepts real-world email domains and rejects malformed fields', () => {
  for (const name of ['Shayan', 'Umer Ejaz']) assert.equal(validateUsername(name), '')
  for (const name of ['ab', 'Name123', 'Name_', 'Two  Spaces', 'a'.repeat(31)])
    assert.notEqual(validateUsername(name), '')
  for (const email of [
    'a@gmail.com',
    'name@yahoo.com',
    'user@university.edu.pk',
    'first.last+tag@outlook.com',
  ])
    assert.equal(validateEmail(email), '')
  for (const email of [
    'a@',
    'a@domain',
    'a..b@gmail.com',
    '.a@gmail.com',
    'a@-gmail.com',
    'a@domain..com',
    'a b@gmail.com',
  ])
    assert.notEqual(validateEmail(email), '')
  assert.equal(validatePassword('GoodPassword1!'), '')
  for (const password of [
    'short',
    'lowercase1!',
    'UPPERCASE1!',
    'NoNumber!',
    'NoSpecial1',
    'Aa1!' + 'x'.repeat(125),
  ])
    assert.notEqual(validatePassword(password), '')
})

test('signup enforces agreement and unique names; account deletion removes only its records', async () => {
  values.clear()
  const account = {
    username: 'First Person',
    email: 'first@gmail.com',
    password: 'GoodPassword1!',
    acceptedTerms: true,
  }
  assert.equal(
    (await register({ ...account, acceptedTerms: false })).field,
    'acceptedTerms',
  )
  assert.equal((await register({ ...account, password: 'weak' })).field, 'password')
  assert.equal((await register(account)).success, true)
  assert.equal(JSON.parse(values.get('ft_users'))[0].termsVersion, TERMS_VERSION)
  assert.equal(
    (await register({ ...account, email: 'second@yahoo.com', username: 'first person' }))
      .field,
    'username',
  )
  assert.equal(
    (await register({ ...account, username: 'Another', email: 'FIRST@gmail.com' })).field,
    'email',
  )
  await login(account.email, account.password)
  saveFileCheck({ name: 'first.mp4', size: 20, type: 'video/mp4' }, 2, true)
  assert.throws(() => deleteUser(account.email), /Administrator/)
  await register({ ...account, username: 'Second Person', email: 'second@yahoo.com' })
  await login('second@yahoo.com', account.password)
  assert.throws(() => updateProfile('First Person'), /already taken/)
  assert.throws(() => updateProfile('Name123'), /letters/)
  const retained = saveFileCheck(
    { name: 'second.mp4', size: 20, type: 'video/mp4' },
    2,
    true,
  )
  await login('admin@facetrace.local', 'FaceTraceAdmin!2026')
  assert.throws(() => deleteUser('admin@facetrace.local'), /cannot be deleted/)
  deleteUser(account.email)
  assert.deepEqual(
    getAdminRecords().map((record) => record.id),
    [retained.id],
  )
  assert.equal(getAdminUsers().length, 1)
  logout()
  assert.equal((await login(account.email, account.password)).success, false)
})

test('local accounts require registration and isolate saved records', async () => {
  values.clear()
  assert.equal((await login('demo@facetrace.com', 'demo123')).success, false)
  assert.equal(
    (
      await register({
        username: 'First',
        email: 'first@gmail.com',
        password: 'Test-only-password1!',
        acceptedTerms: true,
      })
    ).success,
    true,
  )
  assert.equal(JSON.parse(values.get('ft_users'))[0].password, undefined)
  assert.equal((await login('first@gmail.com', 'wrong')).success, false)
  assert.equal((await login('FIRST@gmail.com', 'Test-only-password1!')).success, true)
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
    email: 'second@gmail.com',
    password: 'Test-only-password1!',
    acceptedTerms: true,
  })
  await login('second@gmail.com', 'Test-only-password1!')
  deleteAnalysis(record.id)
  assert.equal(getAnalysisHistory().length, 0)
  await login('first@gmail.com', 'Test-only-password1!')
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
    email: 'owner@gmail.com',
    password: 'Local-test-password1!',
    acceptedTerms: true,
  })
  await login('owner@gmail.com', 'Local-test-password1!')
  assert.equal(getCurrentUser().role, 'user')
  const record = saveFileCheck(
    { name: 'owned.mp4', size: 20, type: 'video/mp4' },
    2,
    true,
  )
  assert.throws(() => getAdminUsers(), /Administrator/)
  assert.throws(() => getAdminRecords(), /Administrator/)
  assert.throws(() => setUserActive('owner@gmail.com', false), /Administrator/)
  assert.throws(() => deleteAdminRecord(record.id), /Administrator/)
  logout()
  assert.equal((await login('admin@facetrace.local', 'wrong')).success, false)
  assert.equal(
    (
      await register({
        username: 'Impostor',
        email: 'admin@facetrace.local',
        password: 'Local-test-password1!',
        acceptedTerms: true,
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
  setUserActive('owner@gmail.com', false)
  logout()
  assert.equal((await login('owner@gmail.com', 'Local-test-password1!')).success, false)
  await login('admin@facetrace.local', 'FaceTraceAdmin!2026')
  setUserActive('owner@gmail.com', true)
  deleteAdminRecord(record.id)
  logout()
  assert.equal((await login('owner@gmail.com', 'Local-test-password1!')).success, true)
  assert.equal(getAnalysisHistory().length, 0)
})
