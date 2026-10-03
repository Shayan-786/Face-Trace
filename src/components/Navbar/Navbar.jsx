import { Link, NavLink } from 'react-router-dom'
import { ScanFace, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './Navbar.css'

/**
 * Navbar — shown on all public-facing pages (Home, Login, Register).
 * Collapses into a hamburger menu on smaller screens.
 */
function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const closeMenu  = () => setMenuOpen(false)

  return (
    <header className="navbar">
      <div className="navbar__inner container">

        {/* Brand / Logo */}
        <Link to="/" className="navbar__brand" onClick={closeMenu}>
          <ScanFace size={28} className="navbar__logo-icon" />
          <span className="navbar__logo-text">Face<span className="navbar__logo-accent">Trace</span></span>
        </Link>

        {/* Desktop navigation links */}
        <nav className="navbar__links" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? 'navbar__link navbar__link--active' : 'navbar__link'}
          >
            Home
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) => isActive ? 'navbar__link navbar__link--active' : 'navbar__link'}
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) => isActive ? 'navbar__link navbar__link--active' : 'navbar__link'}
          >
            Register
          </NavLink>
        </nav>

        {/* Hamburger toggle (mobile) */}
        <button
          className="navbar__hamburger"
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="navbar__mobile-menu" aria-label="Mobile navigation">
          <NavLink to="/"         end onClick={closeMenu} className="navbar__mobile-link">Home</NavLink>
          <NavLink to="/login"        onClick={closeMenu} className="navbar__mobile-link">Login</NavLink>
          <NavLink to="/register"     onClick={closeMenu} className="navbar__mobile-link">Register</NavLink>
        </nav>
      )}
    </header>
  )
}

export default Navbar
