import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ScanFace,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import './Sidebar.css'

/**
 * Sidebar — navigation panel shown inside the dashboard layout.
 * Can be collapsed to icon-only mode on desktop.
 * On mobile it slides in as an overlay.
 */

// Navigation items — add more here as new dashboard pages are built
const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/analyze',   icon: ScanFace,        label: 'Analyze Video' },
  { to: '/history',   icon: Clock,           label: 'History' },
]

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>

      {/* Brand mark inside sidebar */}
      <div className="sidebar__brand">
        <ScanFace size={24} className="sidebar__brand-icon" />
        {!collapsed && <span className="sidebar__brand-text">FaceTrace</span>}
      </div>

      {/* Main nav links */}
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

      {/* Bottom section: logout + collapse toggle */}
      <div className="sidebar__footer">
        {/* Logout — wired to real auth in a later phase */}
        <button
          className="sidebar__logout"
          onClick={() => console.warn('Logout: auth not yet connected.')}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} className="sidebar__link-icon" />
          {!collapsed && <span className="sidebar__link-label">Logout</span>}
        </button>

        {/* Collapse toggle (desktop only) */}
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
