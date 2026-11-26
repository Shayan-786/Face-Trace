import { useRef, useState } from 'react'
import CredentialForm from './CredentialForm'
import Card from '../../components/Card/Card'
import FormField from '../../components/FormField/FormField'
import Button from '../../components/Button/Button'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useProfilePhoto } from '../../hooks/useProfilePhoto'
import { updateProfile, saveProfilePhoto, removeProfilePhoto } from '../../services/auth'
import './Profile.css'

const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'
const PHOTO_MAX_BYTES = 1 * 1024 * 1024 // 1 MB

function Profile() {
  const user = useCurrentUser()
  const photo = useProfilePhoto(user?.id)
  const photoInputRef = useRef(null)

  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoError, setPhotoError] = useState('')

  const [username, setUsername] = useState(user?.username || '')
  const [usernameError, setUsernameError] = useState('')
  const [usernameSaved, setUsernameSaved] = useState(false)

  if (user?.role === 'admin') {
    return (
      <div className="page-stack account-page">
        <h1>Administrator account</h1>
        <Card title="Fixed local account">
          <p>{user.email}</p>
          <p className="muted">
            This administrator account uses the fixed credentials configured for the
            frontend prototype. The profile is not editable.
          </p>
        </Card>
      </div>
    )
  }

  // ── Photo handlers ────────────────────────────────────────
  function handlePhotoSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoError('')

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setPhotoError('Only JPEG, PNG, and WebP images are accepted.')
      event.target.value = ''
      return
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setPhotoError('Image must be 1 MB or smaller.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function handlePhotoSave() {
    if (!photoPreview) return
    try {
      saveProfilePhoto(photoPreview)
      setPhotoPreview(null)
      setPhotoError('')
    } catch (failure) {
      setPhotoError(failure.message)
    }
  }

  function handlePhotoRemove() {
    try {
      removeProfilePhoto()
      setPhotoPreview(null)
      setPhotoError('')
    } catch (failure) {
      setPhotoError(failure.message)
    }
  }

  // ── Username handler ──────────────────────────────────────
  function handleUsernameSubmit(event) {
    event.preventDefault()
    setUsernameSaved(false)
    try {
      updateProfile(username)
      setUsernameError('')
      setUsernameSaved(true)
    } catch (failure) {
      setUsernameError(failure.message)
    }
  }

  // Current display: preview takes priority over saved photo
  const displayPhoto = photoPreview || photo

  const initials = user?.username
    ? user.username
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : '?'

  return (
    <div className="page-stack account-page">
      <h1>Manage Profile</h1>

      {/* ── Photo ── */}
      <Card title="Profile Photo">
        <div className="profile-photo-section">
          <div className="profile-photo-preview">
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt="Profile photo preview"
                className="profile-photo-img"
              />
            ) : (
              <span className="profile-photo-initials" aria-hidden="true">
                {initials}
              </span>
            )}
          </div>
          <div className="profile-photo-controls">
            {photoPreview ? (
              <>
                <p className="profile-photo-hint">Preview — not saved yet.</p>
                <div className="action-row">
                  <Button onClick={handlePhotoSave}>Save Photo</Button>
                  <Button variant="ghost" onClick={() => { setPhotoPreview(null); setPhotoError('') }}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="action-row">
                <Button variant="secondary" onClick={() => photoInputRef.current?.click()}>
                  Upload Photo
                </Button>
                {photo && (
                  <Button variant="ghost" onClick={handlePhotoRemove}>
                    Remove Photo
                  </Button>
                )}
              </div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept={PHOTO_ACCEPT}
              onChange={handlePhotoSelect}
              className="profile-photo-input"
              aria-label="Upload profile photo"
            />
            {photoError && (
              <p className="profile-photo-error" role="alert">{photoError}</p>
            )}
            <p className="muted profile-photo-hint">
              JPEG, PNG, or WebP · Max 1 MB · Stored locally in this browser.
            </p>
          </div>
        </div>
      </Card>

      {/* ── Username ── */}
      <Card title="Change Username">
        <form className="auth-form" onSubmit={handleUsernameSubmit} noValidate>
          <FormField
            id="profile-name"
            label="Username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value)
              setUsernameSaved(false)
              setUsernameError('')
            }}
            maxLength={30}
            error={usernameError}
            required
          />
          <p className="muted">Email: {user?.email}</p>
          <Button type="submit">Save username</Button>
          {usernameSaved && <p role="status">Username updated.</p>}
        </form>
      </Card>

      {/* ── Email ── */}
      <Card title="Change Email">
        <CredentialForm key="email" mode="email" email={user?.email || ''} />
      </Card>

      {/* ── Password ── */}
      <Card title="Change Password">
        <CredentialForm key="password" mode="password" email={user?.email || ''} />
      </Card>

      <p className="notice">
        Your account is local to this browser. Password recovery and cross-device accounts
        require the backend.
      </p>
    </div>
  )
}

export default Profile
