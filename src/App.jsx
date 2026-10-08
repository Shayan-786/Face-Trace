import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Analyze from './pages/Analyze/Analyze'
import History from './pages/History/History'
import Results from './pages/Results/Results'
import Profile from './pages/Profile/Profile'
import Admin from './pages/Admin/Admin'
import NotFound from './pages/NotFound/NotFound'

function App() {
  return (
    <BrowserRouter>
      <a
        className="skip-link"
        href="#main-content"
      >
        Skip to content
      </a>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={<Home />}
          />
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/signup"
            element={<Register />}
          />
          <Route
            path="/register"
            element={
              <Navigate
                to="/signup"
                replace
              />
            }
          />
          <Route
            path="*"
            element={<NotFound />}
          />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/analyze"
              element={<Analyze />}
            />
            <Route
              path="/history"
              element={<History />}
            />
            <Route
              path="/history/:analysisId"
              element={<Results />}
            />
            <Route
              path="/profile"
              element={<Profile />}
            />
          </Route>
        </Route>
        <Route element={<ProtectedRoute role="admin" />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/admin"
              element={<Admin />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
