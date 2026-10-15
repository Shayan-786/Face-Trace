import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import './DashboardLayout.css'

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <main
        id="main-content"
        className="dashboard-layout__main"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default DashboardLayout
