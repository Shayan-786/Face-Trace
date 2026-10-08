const CHANGE_EVENT = 'facetrace:storage'

export function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    throw new Error(
      'Browser storage is unavailable or full. Free some space and try again.',
    )
  }

  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeToStorage(callback) {
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)

  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}
