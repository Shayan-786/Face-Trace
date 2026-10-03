import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ScanFace, AlertCircle, Info } from 'lucide-react'
import Button from '../../components/Button/Button'
import { login } from '../../services/auth'
import './Login.css'

/**
 * Login page.
 *
 * Auth is currently handled by src/services/auth.js (temp frontend-only).
 * When Flask integration begins, auth.login() will be replaced by
 * a real API call — this component needs no changes at that point.
 *
 * Demo credentials (shown in the hint banner):
 *   Email:    demo@facetrace.com
 *   Password: FaceTrace123
 */
function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()

  // Where to go after login — fall back to /dashboard
  const from = location.state?.from?.pathname || '/dashboard'

  const [formData, setFormData]       = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors]           = useState({})
  const [isLoading, setIsLoading]     = useState(false)

  // ── Field change ──────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    // Also clear form-level error when user starts typing
    if (errors.form) setErrors((prev) => ({ ...prev, form: '' }))
  }

  // ── Validation ────────────────────────────────────────────
  function validate() {
    const e = {}
    if (!formData.email.trim()) {
      e.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = 'Please enter a valid email address.'
    }
    if (!formData.password) {
      e.password = 'Password is required.'
    }
    return e
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Simulate a brief network delay for a realistic feel
      await new Promise((r) => setTimeout(r, 500))

      /*
       * auth.login() is the single auth call.
       * Replace this with a real API call when Flask is ready:
       *   const data = await loginUser({ email, password })   // api.js
       *   auth.setAuthenticated()
       */
      const result = login(formData.email, formData.password)

      if (!result.success) {
        setErrors({ form: result.error })
        return
      }

      // Redirect back to the page the user was trying to visit
      navigate(from, { replace: true })
    } catch (err) {
      setErrors({ form: err.message || 'Login failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand */}
        <div className="auth-card__brand">
          <ScanFace size={32} className="auth-card__brand-icon" />
          <span className="auth-card__brand-text">FaceTrace</span>
        </div>

        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to your account to continue.</p>

        {/* Demo credentials hint — remove when Flask auth is live */}
        <div className="auth-card__demo-hint" role="note">
          <Info size={14} />
          <span>
            Demo credentials:&nbsp;
            <strong>demo@facetrace.com</strong>&nbsp;/&nbsp;
            <strong>FaceTrace123</strong>
          </span>
        </div>

        {/* Form-level error */}
        {errors.form && (
          <div className="auth-card__form-error" role="alert">
            <AlertCircle size={16} />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">

          {/* Email */}
          <div className="auth-form__group">
            <label htmlFor="login-email" className="auth-form__label">
              Email address
            </label>
            <div className={`auth-form__input-wrap ${errors.email ? 'auth-form__input-wrap--error' : ''}`}>
              <Mail size={16} className="auth-form__input-icon" />
              <input
                id="login-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="auth-form__input"
                autoComplete="email"
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="login-email-error" className="auth-form__error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="auth-form__group">
            <div className="auth-form__label-row">
              <label htmlFor="login-password" className="auth-form__label">
                Password
              </label>
              <span className="auth-form__forgot">Forgot password?</span>
            </div>
            <div className={`auth-form__input-wrap ${errors.password ? 'auth-form__input-wrap--error' : ''}`}>
              <Lock size={16} className="auth-form__input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="auth-form__input"
                autoComplete="current-password"
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                className="auth-form__toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p id="login-password-error" className="auth-form__error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <Button type="submit" fullWidth disabled={isLoading} size="lg">
            {isLoading ? 'Signing in…' : 'Sign In'}
          </Button>

        </form>

        <p className="auth-card__switch">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-card__switch-link">
            Create one
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login
