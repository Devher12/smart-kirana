import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ProtectedRoute, OwnerRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Inventory from '@/pages/Inventory'
import POS from '@/pages/POS'
import Sales from '@/pages/Sales'
import Customers from '@/pages/Customers'
import Suppliers from '@/pages/Suppliers'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'

function RootRedirect() {
  const { user, token, loading } = useAuth()
  if (loading) return null
  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'owner' ? '/dashboard' : '/pos'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<OwnerRoute><Dashboard /></OwnerRoute>} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/reports" element={<OwnerRoute><Reports /></OwnerRoute>} />
            <Route path="/settings" element={<OwnerRoute><Settings /></OwnerRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
