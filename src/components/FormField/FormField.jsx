import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

function FormField({ id, label, error, type = 'text', ...props }) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="auth-form__group">
      <label
        htmlFor={id}
        className="auth-form__label"
      >
        {label}
      </label>
      <div
        className={`auth-form__input-wrap ${error ? 'auth-form__input-wrap--error' : ''}`}
      >
        <input
          {...props}
          id={id}
          type={isPassword && visible ? 'text' : type}
          className="auth-form__input"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-form__toggle-pw"
            onClick={() => setVisible((value) => !value)}
            aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="auth-form__error"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField
