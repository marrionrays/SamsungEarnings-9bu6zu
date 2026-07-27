import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, Wallet, Users, User } from 'lucide-react'

const TABS = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/products', icon: ShoppingBag, label: 'Products' },
  { path: '/recharge', icon: Wallet, label: 'Recharge' },
  { path: '/team', icon: Users, label: 'Team' },
  { path: '/mine', icon: User, label: 'Mine' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-samsung-card border-t border-samsung-border">
      <div className="flex">
        {TABS.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${active ? 'text-samsung-accent' : 'text-samsung-muted hover:text-gray-300'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && <div className="absolute bottom-0 w-8 h-0.5 bg-samsung-accent rounded-full" style={{ bottom: 0 }} />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
