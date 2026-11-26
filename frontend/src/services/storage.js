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

// Publish one change only after every related local write has succeeded.
export function writeJsonBatch(entries) {
  const previous = entries.map(([key]) => [key, localStorage.getItem(key)])
  try {
    for (const [key, value] of entries) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  } catch {
    for (const [key, value] of previous) {
      if (value === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, value)
      }
    }
    throw new Error('Unable to save account changes. Browser storage is unavailable.')
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}
