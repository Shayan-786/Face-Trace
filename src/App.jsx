import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicLayout    from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'

// ── Public pages (Phase 3) ────────────────────────────────────
import Home     from './pages/Home/Home'
import Login    from './pages/Login/Login'
import Register from './pages/Register/Register'

// ── Dashboard pages ───────────────────────────────────────────
import Dashboard from './pages/Dashboard/Dashboard'

// ── Placeholder for pages not yet built (Phase 5+) ───────────
function ComingSoon({ label }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '40vh',
      gap:            '0.75rem',
      color:          '#8b949e',
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
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ── Dashboard routes — Sidebar visible ── */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analyze"   element={<ComingSoon label="Analyze Video" />} />
          <Route path="/history"   element={<ComingSoon label="History" />} />
        </Route>

        {/* ── 404 ── */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<ComingSoon label="404 — Page Not Found" />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App
