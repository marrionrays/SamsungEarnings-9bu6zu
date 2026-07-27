import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatUGX } from '@/lib/utils'
import { Users, Package, ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalProducts: number
  activeProducts: number
  pendingPackages: number
  pendingRecharges: number
  pendingWithdrawals: number
  totalEarnings: number
  totalWithdrawn: number
  totalRecharged: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalProducts: 0, activeProducts: 0,
    pendingPackages: 0, pendingRecharges: 0, pendingWithdrawals: 0,
    totalEarnings: 0, totalWithdrawn: 0, totalRecharged: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentUsers, setRecentUsers] = useState<any[]>([])

  useEffect(() => {
    loadStats()
    loadRecentUsers()
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    const [users, pkgs, activePkgs, pendingPkgs, pendingRecharges, pendingWithdrawals, userSums, recharges] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_packages').select('*', { count: 'exact', head: true }),
      supabase.from('user_packages').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('user_packages').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('recharge_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('user_profiles').select('total_earnings, total_withdrawn'),
      supabase.from('recharge_requests').select('amount').eq('status', 'approved'),
    ])

    const totalEarnings = (userSums.data || []).reduce((s: number, u: any) => s + (u.total_earnings || 0), 0)
    const totalWithdrawn = (userSums.data || []).reduce((s: number, u: any) => s + (u.total_withdrawn || 0), 0)
    const totalRecharged = (recharges.data || []).reduce((s: number, r: any) => s + (r.amount || 0), 0)

    setStats({
      totalUsers: users.count || 0,
      totalProducts: pkgs.count || 0,
      activeProducts: activePkgs.count || 0,
      pendingPackages: pendingPkgs.count || 0,
      pendingRecharges: pendingRecharges.count || 0,
      pendingWithdrawals: pendingWithdrawals.count || 0,
      totalEarnings,
      totalWithdrawn,
      totalRecharged,
    })
    setLoading(false)
  }

  const loadRecentUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, username, email, phone, created_at, wallet_balance, referral_code')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentUsers(data || [])
  }

  const OVERVIEW = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-samsung-accent', bg: 'bg-samsung-accent/10' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-samsung-gold', bg: 'bg-samsung-gold/10' },
    { label: 'Active Packages', value: stats.activeProducts, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
  ]

  const PENDING = [
    { label: 'Pending Recharges', value: stats.pendingRecharges, color: 'text-blue-400', path: '/admin/recharges' },
    { label: 'Pending Packages', value: stats.pendingPackages, color: 'text-yellow-400', path: '/admin/packages' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, color: 'text-orange-400', path: '/admin/withdrawals' },
  ]

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-extrabold mb-6">Admin Dashboard</h1>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {OVERVIEW.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-samsung-card border border-samsung-border rounded-2xl p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className={`text-3xl font-extrabold ${color} mb-1`}>{value.toLocaleString()}</p>
            <p className="text-samsung-muted text-sm">{label}</p>
          </div>
        ))}
      </div>

      {/* Financial overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-samsung-card border border-samsung-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft size={16} className="text-green-400" />
            <p className="text-samsung-muted text-sm">Total Recharged</p>
          </div>
          <p className="text-xl font-bold text-green-400">{formatUGX(stats.totalRecharged)}</p>
        </div>
        <div className="bg-samsung-card border border-samsung-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-samsung-accent" />
            <p className="text-samsung-muted text-sm">Total Earnings</p>
          </div>
          <p className="text-xl font-bold text-samsung-accent">{formatUGX(stats.totalEarnings)}</p>
        </div>
        <div className="bg-samsung-card border border-samsung-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={16} className="text-orange-400" />
            <p className="text-samsung-muted text-sm">Total Withdrawn</p>
          </div>
          <p className="text-xl font-bold text-orange-400">{formatUGX(stats.totalWithdrawn)}</p>
        </div>
      </div>

      {/* Pending actions */}
      <div className="bg-samsung-card border border-samsung-border rounded-2xl p-5 mb-6">
        <h2 className="font-bold mb-4">Pending Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          {PENDING.map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
              <p className="text-samsung-muted text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
        {(stats.pendingPackages > 0 || stats.pendingRecharges > 0 || stats.pendingWithdrawals > 0) && (
          <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3">
            <p className="text-yellow-400 text-sm font-semibold">
              ⚠️ {stats.pendingRecharges + stats.pendingPackages + stats.pendingWithdrawals} items require your attention!
            </p>
          </div>
        )}
      </div>

      {/* Recent users */}
      <div className="bg-samsung-card border border-samsung-border rounded-2xl p-5">
        <h2 className="font-bold mb-4">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-samsung-border">
                <th className="text-left text-samsung-muted font-medium pb-3">User</th>
                <th className="text-left text-samsung-muted font-medium pb-3">Phone</th>
                <th className="text-left text-samsung-muted font-medium pb-3">Balance</th>
                <th className="text-left text-samsung-muted font-medium pb-3">Referral Code</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {recentUsers.map(u => (
                <tr key={u.id} className="border-b border-samsung-border/50">
                  <td className="py-3">
                    <div>
                      <p className="font-semibold">{u.username}</p>
                      <p className="text-samsung-muted text-xs">{u.email}</p>
                    </div>
                  </td>
                  <td className="py-3 text-samsung-muted">{u.phone || '-'}</td>
                  <td className="py-3 text-samsung-accent font-semibold">{formatUGX(u.wallet_balance || 0)}</td>
                  <td className="py-3">
                    <span className="bg-samsung-blue/20 text-samsung-accent px-2 py-0.5 rounded font-mono text-xs">{u.referral_code}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
