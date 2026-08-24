import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ role, children }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-text-muted">Loading...</span>
      </div>
    )
  }

  // Not signed in, or backend rejected the profile
  if (!profile) {
    return <Navigate to="/login" replace />
  }

  // Signed in, but wrong role for this section
  if (role && profile.role !== role) {
    return <Navigate to={`/${profile.role}`} replace />
  }

  return children
}

export default ProtectedRoute