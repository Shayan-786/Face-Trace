import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ScanFace,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import Button from '../../components/Button/Button'
import { register } from '../../services/auth'
import '../Login/Login.css'
import './Register.css'

/**
 * Register page — temporary frontend-only registration.
 *
 * Saves new users to localStorage via auth.register().
 * Duplicate emails are rejected. Registered users can then sign in
 * on the Login page using the same credentials.
 *
 * TODO (Flask integration): auth.register() will call the real
 * POST /auth/register endpoint — no structural changes needed here.
 */
function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    email:    '',
    password: '',
    confirm:  '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [errors,       setErrors]       = useState({})
  const [isLoading,    setIsLoading]    = useState(false)
  const [registered,   setRegistered]   = useState(false)

  // ── Field change ──────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name])  setErrors((prev) => ({ ...prev, [name]: '' }))
    if (errors.form)   setErrors((prev) => ({ ...prev, form: '' }))
  }

  // ── Password strength ─────────────────────────────────────
  function getPasswordStrength(pw) {
    if (!pw) return null
    let score = 0
    if (pw.length >= 8)           score++
    if (/[A-Z]/.test(pw))         score++
    if (/[0-9]/.test(pw))         score++
    if (/[^A-Za-z0-9]/.test(pw))  score++
    if (score <= 1) return { label: 'Weak',   level: 1 }
    if (score === 2) return { label: 'Fair',   level: 2 }
    if (score === 3) return { label: 'Good',   level: 3 }
    return               { label: 'Strong', level: 4 }
  }

  const strength = getPasswordStrength(formData.password)

  // ── Validation ────────────────────────────────────────────
  function validate() {
    const e = {}
    if (!formData.username.trim()) {
      e.username = 'Username is required.'
    } else if (formData.username.trim().length < 3) {
      e.username = 'Username must be at least 3 characters.'
    }
    if (!formData.email.trim()) {
      e.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = 'Please enter a valid email address.'
    }
    if (!formData.password) {
      e.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      e.password = 'Password must be at least 8 characters.'
    }
    if (!formData.confirm) {
      e.confirm = 'Please confirm your password.'
    } else if (formData.confirm !== formData.password) {
      e.confirm = 'Passwords do not match.'
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
      // Simulate a brief processing delay
      await new Promise((r) => setTimeout(r, 500))

      const result = register({
        username: formData.username,
        email:    formData.email,
        password: formData.password,
      })

      if (!result.success) {
        // Duplicate email or other registration error
        setErrors({ form: result.error })
        return
      }

      // Show brief success state then redirect to login
      setRegistered(true)
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────────
  if (registered) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__brand">
            <ScanFace size={32} className="auth-card__brand-icon" />
            <span className="auth-card__brand-text">FaceTrace</span>
          </div>
          <div className="register__success">
            <CheckCircle2 size={44} className="register__success-icon" />
            <h2 className="register__success-title">Account created!</h2>
            <p className="register__success-body">
              Redirecting you to sign in&hellip;
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-card__brand">
          <ScanFace size={32} className="auth-card__brand-icon" />
          <span className="auth-card__brand-text">FaceTrace</span>
        </div>

        <h1 className="auth-card__title">Create an account</h1>
        <p className="auth-card__subtitle">
          Join Face Trace to start analysing videos for deepfake content.
        </p>

        {/* Form-level error (duplicate email, etc.) */}
        {errors.form && (
          <div className="auth-card__form-error" role="alert">
            <AlertCircle size={16} />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">

          {/* Username */}
          <div className="auth-form__group">
            <label htmlFor="reg-username" className="auth-form__label">
              Username
            </label>
            <div className={`auth-form__input-wrap ${errors.username ? 'auth-form__input-wrap--error' : ''}`}>
              <User size={16} className="auth-form__input-icon" />
              <input
                id="reg-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                className="auth-form__input"
                autoComplete="username"
                aria-describedby={errors.username ? 'reg-username-error' : undefined}
              />
            </div>
            {errors.username && (
              <p id="reg-username-error" className="auth-form__error" role="alert">
                {errors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="auth-form__group">
            <label htmlFor="reg-email" className="auth-form__label">
              Email address
            </label>
            <div className={`auth-form__input-wrap ${errors.email ? 'auth-form__input-wrap--error' : ''}`}>
              <Mail size={16} className="auth-form__input-icon" />
              <input
                id="reg-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="auth-form__input"
                autoComplete="email"
                aria-describedby={errors.email ? 'reg-email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="reg-email-error" className="auth-form__error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="auth-form__group">
            <label htmlFor="reg-password" className="auth-form__label">
              Password
            </label>
            <div className={`auth-form__input-wrap ${errors.password ? 'auth-form__input-wrap--error' : ''}`}>
              <Lock size={16} className="auth-form__input-icon" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                className="auth-form__input"
                autoComplete="new-password"
                aria-describedby={errors.password ? 'reg-password-error' : undefined}
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

            {strength && (
              <div className="register__strength">
                <div className="register__strength-bars">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`register__strength-bar register__strength-bar--${
                        n <= strength.level ? strength.label.toLowerCase() : 'empty'
                      }`}
                    />
                  ))}
                </div>
                <span className={`register__strength-label register__strength-label--${strength.label.toLowerCase()}`}>
                  {strength.label}
                </span>
              </div>
            )}

            {errors.password && (
              <p id="reg-password-error" className="auth-form__error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="auth-form__group">
            <label htmlFor="reg-confirm" className="auth-form__label">
              Confirm password
            </label>
            <div className={`auth-form__input-wrap ${errors.confirm ? 'auth-form__input-wrap--error' : ''}`}>
              <Lock size={16} className="auth-form__input-icon" />
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                name="confirm"
                value={formData.confirm}
                onChange={handleChange}
                placeholder="Repeat your password"
                className="auth-form__input"
                autoComplete="new-password"
                aria-describedby={errors.confirm ? 'reg-confirm-error' : undefined}
              />
              <button
                type="button"
                className="auth-form__toggle-pw"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {formData.confirm && formData.confirm === formData.password && (
                <CheckCircle2 size={16} className="register__match-icon" />
              )}
            </div>
            {errors.confirm && (
              <p id="reg-confirm-error" className="auth-form__error" role="alert">
                {errors.confirm}
              </p>
            )}
          </div>

          <Button type="submit" fullWidth disabled={isLoading} size="lg">
            {isLoading ? 'Creating account…' : 'Create Account'}
          </Button>

        </form>

        <p className="auth-card__switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__switch-link">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register
