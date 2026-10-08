import { Link, NavLink, useLocation } from 'react-router-dom'
import { ScanFace, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import './Navbar.css'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef(null)
  const menuRef = useRef(null)
  const location = useLocation()
  const user = useCurrentUser()
  const links = user
    ? [
        { to: '/', label: 'Home' },
        {
          to: user.role === 'admin' ? '/admin' : '/dashboard',
          label: user.role === 'admin' ? 'Admin panel' : 'Dashboard',
        },
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/login', label: 'Login' },
        { to: '/signup', label: 'Sign up' },
      ]

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    menuRef.current?.querySelector('a')?.focus()
    const desktop = window.matchMedia('(min-width: 769px)')

    function closeOnDesktop(event) {
      if (event.matches) {
        setMenuOpen(false)
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }

    desktop.addEventListener('change', closeOnDesktop)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      desktop.removeEventListener('change', closeOnDesktop)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link
          to="/"
          className="navbar__brand"
          onClick={() => setMenuOpen(false)}
        >
          <ScanFace
            size={28}
            className="navbar__logo-icon"
            aria-hidden="true"
          />
          <span className="navbar__logo-text">
            Face<span className="navbar__logo-accent">Trace</span>
          </span>
        </Link>
        <nav
          className="navbar__links"
          aria-label="Main navigation"
        >
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <ThemeToggle />
        <button
          ref={toggleRef}
          type="button"
          className="navbar__hamburger"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="public-mobile-menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {menuOpen && (
        <nav
          ref={menuRef}
          id="public-mobile-menu"
          className="navbar__mobile-menu"
          aria-label="Mobile navigation"
        >
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setMenuOpen(false)}
              className="navbar__mobile-link"
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

export default Navbar
