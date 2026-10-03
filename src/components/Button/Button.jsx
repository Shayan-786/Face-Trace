import './Button.css'

/**
 * Button — reusable button component.
 *
 * Props:
 *   variant  — 'primary' | 'secondary' | 'danger' | 'ghost'  (default: 'primary')
 *   size     — 'sm' | 'md' | 'lg'                            (default: 'md')
 *   fullWidth — boolean                                       (default: false)
 *   disabled  — boolean
 *   onClick   — function
 *   type      — 'button' | 'submit' | 'reset'                (default: 'button')
 *   children  — button label / content
 */
function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
