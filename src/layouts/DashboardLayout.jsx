import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar/Sidebar'
import './DashboardLayout.css'

/**
 * DashboardLayout — shell for all authenticated dashboard pages.
 *
 * Structure:
 *   ┌──────────────────────────────────────┐
 *   │  Sidebar  │  Top bar  +  Page content│
 *   └──────────────────────────────────────┘
 *
 * On mobile the sidebar is hidden behind a hamburger toggle in the top bar.
 */
function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const openSidebar  = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="dashboard-layout">

      {/* Sidebar — gets extra class on mobile when open */}
      <div className={`dashboard-layout__sidebar-wrapper ${sidebarOpen ? 'dashboard-layout__sidebar-wrapper--open' : ''}`}>
        <Sidebar />
      </div>

      {/* Overlay — closes sidebar when tapping outside on mobile */}
      {sidebarOpen && (
        <div
          className="dashboard-layout__overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Right-hand column: top bar + page content */}
      <div className="dashboard-layout__content">

        {/* Mobile-only top bar with hamburger */}
        <header className="dashboard-layout__topbar">
          <button
            className="dashboard-layout__menu-btn"
            onClick={openSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <span className="dashboard-layout__topbar-title">FaceTrace</span>
          {/* Right-side close button shown when sidebar is open */}
          {sidebarOpen && (
            <button
              className="dashboard-layout__menu-btn"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            >
              <X size={22} />
            </button>
          )}
        </header>

        {/* Page content rendered by nested routes */}
        <main className="dashboard-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
