import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!token) return <Navigate to="/login" replace />
  return children
}

export function OwnerRoute({ children }) {
  const { user } = useAuth()
  if (user?.role !== 'owner') return <Navigate to="/pos" replace />
  return children
}
