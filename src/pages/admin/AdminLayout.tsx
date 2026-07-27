import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Package, ArrowDownLeft, ArrowUpRight,
  Users, Gift, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/recharges', icon: ArrowDownLeft, label: 'Recharges' },
  { path: '/admin/packages', icon: Package, label: 'Packages' },
  { path: '/admin/withdrawals', icon: ArrowUpRight, label: 'Withdrawals' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/gift-codes', icon: Gift, label: 'Gift Codes' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => {
    const active = location.pathname === path
    return (
      <button onClick={() => { navigate(path); setSidebarOpen(false) }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors ${
          active ? 'bg-samsung-blue text-white' : 'text-samsung-muted hover:bg-samsung-card hover:text-white'
        }`}>
        <Icon size={18} />
        <span className="font-medium text-sm">{label}</span>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-samsung-dark flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-samsung-card border-r border-samsung-border p-4">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="w-8 h-8 bg-samsung-blue rounded-lg flex items-center justify-center font-bold">S</div>
          <div>
            <p className="font-bold text-sm">Admin Panel</p>
            <p className="text-samsung-muted text-xs">Samsung Earnings</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => <NavItem key={item.path} {...item} />)}
        </nav>
        <div className="border-t border-samsung-border pt-3">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 px-4 py-2 text-samsung-muted hover:text-white w-full text-sm">
            ← Back to App
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-xl w-full text-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-samsung-card border-r border-samsung-border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-samsung-blue rounded-lg flex items-center justify-center font-bold">S</div>
                <p className="font-bold text-sm">Admin Panel</p>
              </div>
              <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
            </div>
            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map(item => <NavItem key={item.path} {...item} />)}
            </nav>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-red-400 text-sm">
              <LogOut size={16} /> Logout
            </button>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-samsung-border bg-samsung-card">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-samsung-muted hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-bold">Samsung Earnings – Admin</span>
        </header>
        <main className="flex-1 overflow-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
