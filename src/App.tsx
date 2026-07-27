import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import ProductsPage from '@/pages/ProductsPage'
import MyProductsPage from '@/pages/MyProductsPage'
import WithdrawPage from '@/pages/WithdrawPage'
import RechargePage from '@/pages/RechargePage'
import MyTeamPage from '@/pages/MyTeamPage'
import MinePage from '@/pages/MinePage'
import WalletPage from '@/pages/WalletPage'
import NotificationsPage from '@/pages/NotificationsPage'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminPackagesPage from '@/pages/admin/AdminPackagesPage'
import AdminWithdrawalsPage from '@/pages/admin/AdminWithdrawalsPage'
import AdminRechargesPage from '@/pages/admin/AdminRechargesPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminGiftCodesPage from '@/pages/admin/AdminGiftCodesPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-samsung-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-samsung-muted text-sm">Loading...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-samsung-dark flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user || !profile?.is_admin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, profile } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/my-products" element={<ProtectedRoute><MyProductsPage /></ProtectedRoute>} />
      <Route path="/recharge" element={<ProtectedRoute><RechargePage /></ProtectedRoute>} />
      <Route path="/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><MyTeamPage /></ProtectedRoute>} />
      <Route path="/mine" element={<ProtectedRoute><MinePage /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="packages" element={<AdminPackagesPage />} />
        <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
        <Route path="recharges" element={<AdminRechargesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="gift-codes" element={<AdminGiftCodesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#141826',
              color: '#ffffff',
              border: '1px solid #1E2540',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
