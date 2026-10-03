import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../services/auth'

/**
 * ProtectedRoute — guards routes that require authentication.
 *
 * Used as a layout-level route wrapper in App.jsx:
 *
 *   <Route element={<ProtectedRoute />}>
 *     <Route element={<DashboardLayout />}>
 *       <Route path="/dashboard" element={<Dashboard />} />
 *     </Route>
 *   </Route>
 *
 * If the user is not authenticated, they are redirected to /login.
 * The attempted URL is stored in location.state.from so Login can
 * redirect back after a successful login.
 *
 * TODO (Flask integration): isAuthenticated() will validate a JWT
 * instead of a localStorage flag — no changes needed in this file.
 */
function ProtectedRoute() {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Render nested routes via Outlet
  return <Outlet />
}

export default ProtectedRoute
