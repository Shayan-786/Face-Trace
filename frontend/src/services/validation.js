export const TERMS_VERSION = '2026-10-15'

export function validateAccountEmail(value) {
  const error = validateEmail(value)
  if (error) return error
  const domain = value.trim().toLowerCase().split('@')[1]
  return ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com'].includes(
    domain,
  )
    ? ''
    : 'Use a Gmail, Yahoo, Outlook, Hotmail, or Live email address (.com).'
}

export function validateUsername(value) {
  const name = value.trim()
  if (name.length < 3 || name.length > 30) {
    return 'Use 3–30 characters.'
  }
  return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)
    ? ''
    : 'Use letters only, with a single space between words if needed.'
}

export function validateEmail(value) {
  const email = value.trim()
  const parts = email.split('@')
  if (parts.length !== 2 || email.length > 254) {
    return 'Enter a valid email address, such as name@gmail.com.'
  }
  const [local, domain] = parts
  const labels = domain.split('.')
  const valid =
    local.length > 0 &&
    local.length <= 64 &&
    /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local) &&
    !local.startsWith('.') &&
    !local.endsWith('.') &&
    !local.includes('..') &&
    labels.length >= 2 &&
    labels.every(
      (label) =>
        label.length <= 63 && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label),
    ) &&
    /^[A-Za-z]{2,63}$/.test(labels.at(-1))
  return valid ? '' : 'Enter a valid email address, such as name@gmail.com.'
}

export function passwordRequirements(password) {
  return [
    { label: '8–128 characters', met: password.length >= 8 && password.length <= 128 },
    { label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a–z)', met: /[a-z]/.test(password) },
    { label: 'One number (0–9)', met: /[0-9]/.test(password) },
    {
      label: 'One special character (for example !, @ or #)',
      met: /[^A-Za-z0-9\s]/.test(password),
    },
  ]
}

export function validatePassword(password) {
  return passwordRequirements(password).every((rule) => rule.met)
    ? ''
    : 'Meet all the password requirements below.'
}
