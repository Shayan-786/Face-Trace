import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'

// ── Placeholder pages (replaced in Phase 3 / 4 / 5) ──────────────
function ComingSoon({ label }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '40vh',
      gap: '0.75rem',
      color: '#8b949e',
    }}>
      <h2 style={{ color: '#e6edf3', fontSize: '1.25rem' }}>{label}</h2>
      <p style={{ fontSize: '0.875rem' }}>This page will be implemented in an upcoming phase.</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public routes — Navbar visible ── */}
        <Route element={<PublicLayout />}>
          <Route path="/"         element={<ComingSoon label="Home" />} />
          <Route path="/login"    element={<ComingSoon label="Login" />} />
          <Route path="/register" element={<ComingSoon label="Register" />} />
        </Route>

        {/* ── Dashboard routes — Sidebar visible ── */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<ComingSoon label="Dashboard" />} />
          <Route path="/analyze"   element={<ComingSoon label="Analyze Video" />} />
          <Route path="/history"   element={<ComingSoon label="History" />} />
        </Route>

        {/* ── 404 — uses public layout so Navbar is present ── */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<ComingSoon label="404 — Page Not Found" />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App
