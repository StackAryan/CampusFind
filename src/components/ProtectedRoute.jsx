import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { PageLoader } from './Loading'

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader label="Checking your session…" />
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    )
  }
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
