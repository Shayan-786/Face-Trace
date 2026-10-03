import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import './PublicLayout.css'

/**
 * PublicLayout — wraps all public-facing pages (Home, Login, Register).
 * Renders the sticky Navbar at the top, then the page content via <Outlet />.
 */
function PublicLayout() {
  return (
    <div className="public-layout">
      <Navbar />
      <main className="public-layout__main">
        <Outlet />
      </main>
    </div>
  )
}

export default PublicLayout
