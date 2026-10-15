import { useRef, useState } from 'react'
import FormField from '../../components/FormField/FormField'
import Button from '../../components/Button/Button'
import { changeAccountCredentials } from '../../services/auth'
import {
  validateAccountEmail,
  validatePassword,
  passwordRequirements,
} from '../../services/validation'
import { useMounted } from '../../hooks/useMounted'

export default function CredentialForm({ mode, email }) {
  const [form, setForm] = useState({
    email,
    password: '',
    confirm: '',
    currentPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const mounted = useMounted()
  function change(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setErrors({})
    setSaved(false)
  }
  async function submit(event) {
    event.preventDefault()
    if (pending.current) return
    const next = {}
    if (!form.currentPassword) next.currentPassword = 'Enter your current password.'
    if (mode === 'email') {
      const error = validateAccountEmail(form.email)
      if (error) next.email = error
    } else {
      const error = validatePassword(form.password)
      if (error) next.password = error
      if (form.password !== form.confirm) next.confirm = 'Passwords must match.'
    }
    setErrors(next)
    setSaved(false)
    if (Object.keys(next).length) {
      event.currentTarget.elements.namedItem(Object.keys(next)[0])?.focus()
      return
    }
    pending.current = true
    setBusy(true)
    try {
      await changeAccountCredentials({
        currentPassword: form.currentPassword,
        [mode]: form[mode],
      })
      if (mounted.current) {
        setForm((previous) => ({
          ...previous,
          currentPassword: '',
          password: '',
          confirm: '',
        }))
        setSaved(true)
      }
    } catch (error) {
      if (mounted.current) setErrors({ form: error.message })
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }
  return (
    <form
      className="auth-form"
      onSubmit={submit}
      noValidate
      aria-busy={busy}
    >
      <FormField
        id="current-password"
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={form.currentPassword}
        onChange={change}
        error={errors.currentPassword}
        required
        maxLength={128}
      />
      {mode === 'email' ? (
        <FormField
          id="new-email"
          name="email"
          label="New email address"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={change}
          error={errors.email}
          required
          maxLength={254}
        />
      ) : (
        <>
          <FormField
            id="new-password"
            name="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={change}
            error={errors.password}
            aria-describedby="new-password-rules"
            required
            maxLength={128}
          />
          <ul
            id="new-password-rules"
            className="password-requirements"
          >
            {passwordRequirements(form.password).map((rule) => (
              <li
                key={rule.label}
                className={rule.met ? 'requirement-met' : ''}
              >
                {rule.met ? '✓' : '○'} {rule.label}
              </li>
            ))}
          </ul>
          <FormField
            id="confirm-new-password"
            name="confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={change}
            error={errors.confirm}
            required
            maxLength={128}
          />
        </>
      )}
      {errors.form && (
        <p
          className="auth-form__error"
          role="alert"
        >
          {errors.form}
        </p>
      )}
      <Button
        type="submit"
        disabled={busy}
      >
        {busy ? 'Saving…' : `Change ${mode}`}
      </Button>
      {saved && (
        <p role="status">
          {mode === 'email'
            ? 'Email updated. Use your new email next time you sign in.'
            : 'Password updated. Use your new password next time you sign in.'}
        </p>
      )}
    </form>
  )
}
