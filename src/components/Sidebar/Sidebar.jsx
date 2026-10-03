import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ScanFace,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { logout } from '../../services/auth'
import './Sidebar.css'

/**
 * Sidebar — dashboard navigation panel.
 */

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/analyze',   icon: ScanFace,        label: 'Analyze Video' },
  { to: '/history',   icon: Clock,           label: 'History' },
]

function Sidebar() {
  const navigate   = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  // ── Logout handler ────────────────────────────────────────
  function handleLogout() {
    logout()               // clears localStorage flag via auth.js
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>

      {/* Brand */}
      <div className="sidebar__brand">
        <ScanFace size={24} className="sidebar__brand-icon" />
        {!collapsed && <span className="sidebar__brand-text">FaceTrace</span>}
      </div>

      {/* Navigation links */}
      <nav className="sidebar__nav" aria-label="Dashboard navigation">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={20} className="sidebar__link-icon" />
            {!collapsed && <span className="sidebar__link-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer: logout + collapse toggle */}
      <div className="sidebar__footer">
        <button
          className="sidebar__logout"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} className="sidebar__link-icon" />
          {!collapsed && <span className="sidebar__link-label">Logout</span>}
        </button>

        <button
          className="sidebar__collapse-btn"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
