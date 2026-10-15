import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import './ThemeToggle.css'

function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || 'light',
  )

  useEffect(() => {
    function synchronize(event) {
      if (event.key === 'ft_theme' || event.key === null) {
        const nextTheme = event.newValue === 'dark' ? 'dark' : 'light'
        document.documentElement.dataset.theme = nextTheme
        setTheme(nextTheme)
      }
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [])

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = nextTheme
    setTheme(nextTheme)
    try {
      localStorage.setItem('ft_theme', nextTheme)
    } catch {
      // The theme still changes if browser storage is unavailable.
    }
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-pressed={theme === 'dark'}
    >
      {theme === 'light' ? (
        <Moon
          size={20}
          aria-hidden="true"
        />
      ) : (
        <Sun
          size={20}
          aria-hidden="true"
        />
      )}
    </button>
  )
}

export default ThemeToggle
