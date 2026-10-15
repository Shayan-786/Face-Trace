import {
  validateUsername,
  validateAccountEmail,
  validatePassword,
  passwordRequirements,
} from '../../services/validation'
import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ScanFace } from 'lucide-react'
import Button from '../../components/Button/Button'
import FormField from '../../components/FormField/FormField'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useMounted } from '../../hooks/useMounted'
import { register } from '../../services/auth'
import '../Login/Login.css'

function Register() {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const mounted = useMounted()
  const submitting = useRef(false)
  const formRef = useRef(null)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
    acceptedTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => ({ ...current, [name]: '', form: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting.current) {
      return
    }

    const nextErrors = {}
    for (const [field, error] of Object.entries({
      username: validateUsername(form.username),
      email: validateAccountEmail(form.email),
      password: validatePassword(form.password),
      acceptedTerms: form.acceptedTerms ? '' : 'Please accept the Terms & Conditions.',
    })) {
      if (error) {
        nextErrors[field] = error
      }
    }
    if (!form.confirm || form.confirm !== form.password) {
      nextErrors.confirm = 'Passwords must match.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      formRef.current.elements.namedItem(Object.keys(nextErrors)[0])?.focus()
      return
    }

    submitting.current = true
    setLoading(true)
    try {
      const result = await register(form)
      if (!mounted.current) {
        return
      }
      if (result.success) {
        navigate('/login', { replace: true, state: { registered: true } })
      } else {
        setErrors({ [result.field || 'form']: result.error })
        formRef.current.elements.namedItem(result.field)?.focus()
      }
    } catch (error) {
      if (mounted.current) {
        setErrors({ form: error.message || 'Unable to create your account.' })
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
        to="/dashboard"
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
        <h1 className="auth-card__title">Sign up</h1>
        <p className="auth-card__subtitle">
          Keep your file checks together in your workspace.
        </p>
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
            id="reg-username"
            label="Username"
            name="username"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            required
            maxLength={30}
          />
          <FormField
            id="reg-email"
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
            id="reg-password"
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            aria-describedby="password-requirements"
            required
            maxLength={128}
          />
          <ul
            id="password-requirements"
            className="password-requirements"
            aria-label="Password requirements"
          >
            {passwordRequirements(form.password).map((rule) => (
              <li
                key={rule.label}
                className={rule.met ? 'requirement-met' : ''}
              >
                <span aria-hidden="true">{rule.met ? '✓' : '○'}</span> {rule.label}
                <span className="sr-only">{rule.met ? ' — met' : ' — not met'}</span>
              </li>
            ))}
          </ul>
          <FormField
            id="reg-confirm"
            label="Confirm password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={handleChange}
            error={errors.confirm}
            required
            maxLength={128}
          />
          <div>
            <label className="terms-agreement">
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={form.acceptedTerms}
                onChange={handleChange}
                required
                aria-invalid={Boolean(errors.acceptedTerms)}
                aria-describedby={errors.acceptedTerms ? 'terms-error' : undefined}
              />
              <span>
                I agree to the{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms & Conditions (opens in a new tab)
                </Link>
                .
              </span>
            </label>
            {errors.acceptedTerms && (
              <p
                id="terms-error"
                className="auth-form__error"
              >
                {errors.acceptedTerms}
              </p>
            )}
          </div>
          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>
        <p className="auth-card__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-local-note">
          This preview stores accounts only in this browser. Use a password you do not use
          elsewhere.
        </p>
      </div>
    </div>
  )
}

export default Register
