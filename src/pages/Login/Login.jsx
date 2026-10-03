import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ScanFace, AlertCircle } from 'lucide-react'
import Button from '../../components/Button/Button'
import './Login.css'

/**
 * Login page — frontend-only for now.
 * Form state and basic validation are wired up and ready for
 * Flask API integration (src/services/api.js → loginUser()).
 */
function Login() {
  const navigate = useNavigate()

  // Form field state
  const [formData, setFormData] = useState({ email: '', password: '' })

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors]             = useState({})
  const [isLoading, setIsLoading]       = useState(false)

  // ── Field change handler ───────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear the field error as the user types
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  // ── Client-side validation ────────────────────────────────
  function validate() {
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.'
    }
    return newErrors
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
    try {
      /*
       * TODO (Phase Flask integration):
       *   const data = await loginUser({ email: formData.email, password: formData.password })
       *   store JWT token, redirect to /dashboard
       */
      console.info('Login submitted — Flask API not yet connected.', formData.email)

      // Temporary demo: simulate a short delay then go to dashboard
      await new Promise((r) => setTimeout(r, 800))
      navigate('/dashboard')
    } catch (err) {
      setErrors({ form: err.message || 'Login failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand mark */}
        <div className="auth-card__brand">
          <ScanFace size={32} className="auth-card__brand-icon" />
          <span className="auth-card__brand-text">FaceTrace</span>
        </div>

        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to your account to continue.</p>

        {/* Form-level error (e.g. wrong credentials from API) */}
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
              {/* Placeholder — forgot password page not yet built */}
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
