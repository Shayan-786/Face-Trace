import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCurrentUser } from '../../hooks/useCurrentUser'

function ProtectedRoute({ role }) {
  const location = useLocation()
  const user = useCurrentUser()

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  if (role && user.role !== role) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/dashboard'}
        replace
      />
    )
  }
  return <Outlet />
}

export default ProtectedRoute
