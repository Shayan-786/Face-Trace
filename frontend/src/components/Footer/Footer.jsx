import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer container">
      <span>© {new Date().getFullYear()} Face Trace</span>
      <Link to="/terms">Terms & Conditions</Link>
    </footer>
  )
}
