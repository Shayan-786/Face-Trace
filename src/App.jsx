import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicLayout    from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute  from './components/ProtectedRoute/ProtectedRoute'

// ── Public pages ──────────────────────────────────────────────
import Home     from './pages/Home/Home'
import Login    from './pages/Login/Login'
import Register from './pages/Register/Register'

// ── Protected dashboard pages ─────────────────────────────────
import Dashboard from './pages/Dashboard/Dashboard'
import Analyze   from './pages/Analyze/Analyze'
import History   from './pages/History/History'

// ── Placeholder for pages not yet built ───────────────────────
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

        {/* ── Public routes — no auth required ── */}
        <Route element={<PublicLayout />}>
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ── Protected routes ──────────────────────────────────
            ProtectedRoute checks auth first.
            If not authenticated → redirects to /login.
            If authenticated → renders DashboardLayout + nested page.
        ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analyze"   element={<Analyze />} />
            <Route path="/profile"   element={<ComingSoon label="Profile" />} />
            <Route path="/history"   element={<History />} />
          </Route>
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
