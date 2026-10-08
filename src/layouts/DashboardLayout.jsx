import { Outlet } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar/Sidebar'
import ThemeToggle from '../components/ThemeToggle/ThemeToggle'
import './DashboardLayout.css'

function DashboardLayout() {
  const dialogRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function closeSidebar() {
    dialogRef.current?.close()
    setSidebarOpen(false)
  }

  function openSidebar() {
    dialogRef.current?.showModal()
    setSidebarOpen(true)
  }

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 769px)')

    function handleResize(event) {
      if (event.matches) {
        dialogRef.current?.close()
        setSidebarOpen(false)
      }
    }

    desktop.addEventListener('change', handleResize)
    return () => desktop.removeEventListener('change', handleResize)
  }, [])

  useEffect(() => {
    if (!sidebarOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [sidebarOpen])

  return (
    <div className="dashboard-layout">
      <div className="dashboard-layout__sidebar-wrapper">
        <Sidebar />
      </div>
      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        className="mobile-navigation"
        aria-label="Main menu"
        onClose={() => setSidebarOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            const bounds = event.currentTarget.getBoundingClientRect()
            if (event.clientX > bounds.right || event.clientY > bounds.bottom) {
              closeSidebar()
            }
          }
        }}
      >
        <button
          type="button"
          className="mobile-navigation__close"
          onClick={closeSidebar}
          aria-label="Close menu"
          autoFocus
        >
          <X size={20} />
        </button>
        <Sidebar onNavigate={closeSidebar} />
      </dialog>
      <div className="dashboard-layout__content">
        <header className="dashboard-layout__topbar">
          <button
            type="button"
            className="dashboard-layout__menu-btn"
            onClick={openSidebar}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-navigation"
          >
            <Menu size={22} />
          </button>
          <span className="dashboard-layout__topbar-title">FaceTrace</span>
          <span className="dashboard-layout__workspace-label">Your workspace</span>
          <ThemeToggle />
        </header>
        <main
          id="main-content"
          className="dashboard-layout__main"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
