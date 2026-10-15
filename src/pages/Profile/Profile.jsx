import { Link, useSearchParams } from 'react-router-dom'
import CredentialForm from './CredentialForm'
import { useState } from 'react'
import Card from '../../components/Card/Card'
import FormField from '../../components/FormField/FormField'
import Button from '../../components/Button/Button'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { updateProfile } from '../../services/auth'

function Profile() {
  const user = useCurrentUser()
  const [params] = useSearchParams()
  const mode = ['email', 'password'].includes(params.get('edit'))
    ? params.get('edit')
    : 'username'
  const [username, setUsername] = useState(user?.username || '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  if (user?.role === 'admin') {
    return (
      <div className="page-stack account-page">
        <h1>Administrator account</h1>
        <Card title="Fixed local account">
          <p>{user.email}</p>
          <p className="muted">
            This administrator account uses the fixed credentials configured for the
            frontend.
          </p>
        </Card>
      </div>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSaved(false)
    try {
      updateProfile(username)
      setError('')
      setSaved(true)
    } catch (failure) {
      setError(failure.message)
    }
  }

  return (
    <div className="page-stack account-page">
      <h1>Your account</h1>
      <nav
        className="action-row"
        aria-label="Account settings"
      >
        <Link
          to="/profile?edit=username"
          aria-current={mode === 'username' ? 'page' : undefined}
        >
          Username
        </Link>
        <Link
          to="/profile?edit=email"
          aria-current={mode === 'email' ? 'page' : undefined}
        >
          Email
        </Link>
        <Link
          to="/profile?edit=password"
          aria-current={mode === 'password' ? 'page' : undefined}
        >
          Password
        </Link>
      </nav>
      <Card title={mode === 'username' ? 'Change username' : 'Change ' + mode}>
        {mode !== 'username' ? (
          <CredentialForm
            key={mode}
            mode={mode}
            email={user?.email || ''}
          />
        ) : (
          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <FormField
              id="profile-name"
              label="Username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setSaved(false)
                setError('')
              }}
              maxLength={30}
              error={error}
              required
            />
            <p className="muted">Email: {user?.email}</p>
            <Button type="submit">Save changes</Button>
            {saved && <p role="status">Profile updated.</p>}
          </form>
        )}
      </Card>
      <p className="notice">
        Your account is local to this browser. Password recovery and cross-device accounts
        require the backend.
      </p>
    </div>
  )
}

export default Profile
