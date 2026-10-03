import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Pages will be added in subsequent phases.
// Placeholder components keep routing wired up without errors.
function ComingSoon({ label }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
      <h2>{label}</h2>
      <p>This page will be implemented in an upcoming phase.</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<ComingSoon label="Home" />} />
        <Route path="/login"     element={<ComingSoon label="Login" />} />
        <Route path="/register"  element={<ComingSoon label="Register" />} />
        <Route path="/dashboard" element={<ComingSoon label="Dashboard" />} />
        <Route path="/analyze"   element={<ComingSoon label="Analyze Video" />} />
        {/* Catch-all for unmatched routes */}
        <Route path="*"          element={<ComingSoon label="404 — Page Not Found" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
