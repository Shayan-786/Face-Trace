import { Link } from 'react-router-dom'
import './Button.css'

function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  to,
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

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        {...rest}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
