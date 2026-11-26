import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'
import { useProfilePhoto } from '../../hooks/useProfilePhoto'

export default function ProfileMenu({ user, onOpen }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const root = useRef(null)
  const trigger = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const photo = useProfilePhoto(user?.id)

  useEffect(() => setOpen(false), [location.key])

  useEffect(() => {
    if (!open) return
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    function escape(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  function handleLogout() {
    try {
      logout()
      navigate('/', { replace: true })
    } catch (failure) {
      setError(failure.message)
    }
  }

  // Initials fallback
  const initials = user?.username
    ? user.username
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : '?'

  return (
    <div
      className="profile-menu"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="profile-menu__trigger"
        aria-label="Account options"
        aria-expanded={open}
        aria-controls="account-options"
        onClick={() => {
          if (!open) onOpen()
          setOpen(!open)
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={user?.username ?? 'Profile'}
            className="profile-menu__avatar"
          />
        ) : (
          <span className="profile-menu__initials" aria-hidden="true">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div id="account-options" className="profile-menu__panel">
          <div className="profile-menu__info">
            {photo ? (
              <img
                src={photo}
                alt={user?.username ?? 'Profile'}
                className="profile-menu__avatar profile-menu__avatar--lg"
              />
            ) : (
              <span className="profile-menu__initials profile-menu__initials--lg" aria-hidden="true">
                {initials}
              </span>
            )}
            <div>
              <strong>{user.username}</strong>
              <span className="muted">{user.email}</span>
            </div>
          </div>
          <hr className="profile-menu__divider" />
          <Link to="/profile">Manage Profile</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </div>
  )
}
