import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserCircle } from 'lucide-react'
import { logout } from '../../services/auth'

export default function ProfileMenu({ user, onOpen }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const root = useRef(null)
  const trigger = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

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
        <UserCircle
          size={26}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id="account-options"
          className="profile-menu__panel"
        >
          <strong>{user.username}</strong>
          <span className="muted">{user.email}</span>
          {user.role === 'admin' ? (
            <Link to="/profile">Administrator profile</Link>
          ) : (
            <>
              <Link to="/profile?edit=username">Change username</Link>
              <Link to="/profile?edit=email">Change email</Link>
              <Link to="/profile?edit=password">Change password</Link>
            </>
          )}
          <button
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </div>
  )
}
