import { useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ScanFace } from 'lucide-react'
import Button from '../../components/Button/Button'
import FormField from '../../components/FormField/FormField'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useMounted } from '../../hooks/useMounted'
import { login, getCurrentUser } from '../../services/auth'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useCurrentUser()
  const mounted = useMounted()
  const submitting = useRef(false)
  const formRef = useRef(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const previous = location.state?.from
  const destination =
    previous?.pathname?.startsWith('/') && !previous.pathname.startsWith('//')
      ? `${previous.pathname}${previous.search || ''}${previous.hash || ''}`
      : '/dashboard'

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '', form: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting.current) {
      return
    }

    const nextErrors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!form.password) {
      nextErrors.password = 'Enter your password.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      formRef.current.elements.namedItem(Object.keys(nextErrors)[0])?.focus()
      return
    }

    submitting.current = true
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      if (!mounted.current) {
        return
      }
      if (result.success) {
        navigate(getCurrentUser()?.role === 'admin' ? '/admin' : destination, {
          replace: true,
        })
      } else {
        setErrors({ form: result.error })
      }
    } catch (error) {
      if (mounted.current) {
        setErrors({ form: error.message || 'Unable to sign in. Please try again.' })
      }
    } finally {
      submitting.current = false
      if (mounted.current) {
        setLoading(false)
      }
    }
  }

  if (user) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : destination}
        replace
      />
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <ScanFace
            size={32}
            aria-hidden="true"
          />
          <span className="auth-card__brand-text">FaceTrace</span>
        </div>
        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">
          Sign in with an account created on this browser.
        </p>
        {location.state?.registered && (
          <p
            className="notice"
            role="status"
          >
            Account created. You can now sign in.
          </p>
        )}
        {errors.form && (
          <p
            className="auth-card__form-error"
            role="alert"
          >
            {errors.form}
          </p>
        )}
        <form
          ref={formRef}
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={loading}
        >
          <FormField
            id="login-email"
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            required
            maxLength={254}
          />
          <FormField
            id="login-password"
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            required
            maxLength={128}
          />
          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
        <p className="auth-card__switch">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
        <p className="auth-local-note">
          Local frontend preview. Account recovery will be available when server
          authentication is connected.
        </p>
      </div>
    </div>
  )
}

export default Login
