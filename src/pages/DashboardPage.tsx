import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatUGX, formatDateTime } from '@/lib/utils'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import { UserPackage } from '@/types'
import { ArrowDownLeft, ArrowUpRight, ShoppingBag, Users, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const [activePackages, setActivePackages] = useState<UserPackage[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (profile) {
      loadActivePackages()
      loadActivity()
      processDailyIncome()
    }
  }, [profile])

  const loadActivePackages = async () => {
    const { data } = await supabase
      .from('user_packages')
      .select('*, package:packages(*)')
      .eq('user_id', profile!.id)
      .eq('status', 'active')
    setActivePackages(data || [])
  }

  const loadActivity = async () => {
    const [withdrawals, recharges, income] = await Promise.all([
      supabase.from('withdrawal_requests').select('*').eq('user_id', profile!.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('recharge_requests').select('*').eq('user_id', profile!.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('daily_income_log').select('*').eq('user_id', profile!.id).order('created_at', { ascending: false }).limit(3),
    ])
    const combined = [
      ...(withdrawals.data || []).map(w => ({ ...w, _type: 'withdrawal' })),
      ...(recharges.data || []).map(r => ({ ...r, _type: 'recharge' })),
      ...(income.data || []).map(i => ({ ...i, _type: 'income' })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
    setRecentActivity(combined)
  }

  const processDailyIncome = async () => {
    if (!profile || processing) return
    setProcessing(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: pkgs } = await supabase
        .from('user_packages')
        .select('*, package:packages(*)')
        .eq('user_id', profile.id)
        .eq('status', 'active')
      if (!pkgs || pkgs.length === 0) { setProcessing(false); return }

      let totalAdded = 0
      for (const pkg of pkgs) {
        // Check if income already credited today
        const { data: existingLog } = await supabase
          .from('daily_income_log')
          .select('id')
          .eq('user_package_id', pkg.id)
          .eq('income_date', today)
          .single()
        if (existingLog) continue

        // Check if package is still valid
        if (pkg.expiry_date && new Date(pkg.expiry_date) < new Date()) {
          await supabase.from('user_packages').update({ status: 'expired' }).eq('id', pkg.id)
          continue
        }

        const dailyAmount = pkg.package?.daily_income || 0
        // Log income
        await supabase.from('daily_income_log').insert({
          user_package_id: pkg.id,
          user_id: profile.id,
          amount: dailyAmount,
          income_date: today,
        })
        // Update package
        await supabase.from('user_packages').update({
          last_income_date: new Date().toISOString(),
          total_earned: (pkg.total_earned || 0) + dailyAmount,
        }).eq('id', pkg.id)
        totalAdded += dailyAmount
      }

      if (totalAdded > 0) {
        await supabase.from('user_profiles').update({
          wallet_balance: (profile.wallet_balance || 0) + totalAdded,
          total_earnings: (profile.total_earnings || 0) + totalAdded,
          daily_earnings: (profile.daily_earnings || 0) + totalAdded,
        }).eq('id', profile.id)
        await supabase.from('notifications').insert({
          user_id: profile.id,
          title: '💰 Daily Income Credited!',
          message: `${formatUGX(totalAdded)} has been added to your balance.`,
          type: 'success',
        })
        await refreshProfile()
        toast.success(`+${formatUGX(totalAdded)} daily income credited!`)
        loadActivity()
      }
    } catch (err) {
      console.error('Daily income error:', err)
    }
    setProcessing(false)
  }

  const QUICK_ACTIONS = [
    { icon: ArrowDownLeft, label: 'Recharge', path: '/recharge', color: 'text-green-400', bg: 'bg-green-400/10' },
    { icon: ArrowUpRight, label: 'Withdraw', path: '/withdraw', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { icon: ShoppingBag, label: 'Products', path: '/products', color: 'text-samsung-accent', bg: 'bg-samsung-accent/10' },
    { icon: Users, label: 'My Team', path: '/team', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ]

  return (
    <div className="min-h-screen bg-samsung-dark page-with-nav">
      <AppHeader />

      <div className="px-5 py-4 animate-fade-in">
        {/* Balance Card */}
        <div className="relative bg-samsung-gradient rounded-2xl p-5 mb-5 overflow-hidden card-shine border border-samsung-blue/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full translate-y-8 -translate-x-8" />
          <p className="text-blue-200 text-sm mb-1 relative z-10">Hello, {profile?.username} 👋</p>
          <p className="text-xs text-blue-300 mb-3 relative z-10">Wallet Balance</p>
          <p className="text-3xl font-extrabold mb-4 relative z-10">
            {formatUGX(profile?.wallet_balance || 0)}
          </p>
          <div className="grid grid-cols-3 gap-3 relative z-10">
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-xs text-blue-200 mb-0.5">Total Earned</p>
              <p className="text-xs font-bold">{formatUGX(profile?.total_earnings || 0)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-xs text-blue-200 mb-0.5">Referrals</p>
              <p className="text-xs font-bold">{formatUGX(profile?.referral_earnings || 0)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-xs text-blue-200 mb-0.5">Withdrawn</p>
              <p className="text-xs font-bold">{formatUGX(profile?.total_withdrawn || 0)}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {QUICK_ACTIONS.map(({ icon: Icon, label, path, color, bg }) => (
            <button key={path} onClick={() => navigate(path)}
              className="flex flex-col items-center gap-2 bg-samsung-card border border-samsung-border rounded-xl p-3 hover:border-samsung-blue/50 transition-all">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Active Packages */}
        {activePackages.length > 0 && (
          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">Active Packages</h2>
              <button onClick={() => navigate('/my-products')} className="text-samsung-accent text-xs">View All</button>
            </div>
            <div className="space-y-3">
              {activePackages.slice(0, 2).map(pkg => {
                const expiry = pkg.expiry_date ? new Date(pkg.expiry_date) : null
                const daysLeft = expiry ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000)) : 0
                return (
                  <div key={pkg.id} className="bg-samsung-card border border-samsung-border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">{pkg.package?.name}</p>
                        <p className="text-samsung-muted text-xs">{pkg.package?.group_name}</p>
                      </div>
                      <span className="status-badge badge-active">Active</span>
                    </div>
                    <div className="flex justify-between text-xs text-samsung-muted mt-2">
                      <span>+{formatUGX(pkg.package?.daily_income || 0)}/day</span>
                      <span>{daysLeft} days left</span>
                    </div>
                    <div className="mt-2 bg-samsung-dark rounded-full h-1.5">
                      <div className="bg-samsung-accent rounded-full h-1.5"
                        style={{ width: `${Math.min(100, (1 - daysLeft / (pkg.package?.duration_days || 1)) * 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No packages CTA */}
        {activePackages.length === 0 && (
          <div className="bg-samsung-card border border-dashed border-samsung-border rounded-xl p-6 text-center mb-5">
            <p className="text-3xl mb-2">📦</p>
            <p className="font-semibold mb-1">No Active Packages</p>
            <p className="text-samsung-muted text-xs mb-4">Recharge and buy a package to start earning daily!</p>
            <button onClick={() => navigate('/products')} className="btn-primary py-2.5 text-sm">
              Browse Packages
            </button>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">Recent Activity</h2>
            <button onClick={loadActivity} className="text-samsung-muted">
              <RefreshCw size={14} />
            </button>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-samsung-muted text-sm text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <div key={i} className="bg-samsung-card border border-samsung-border rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg
                      ${item._type === 'income' ? 'bg-green-400/10' : item._type === 'recharge' ? 'bg-blue-400/10' : 'bg-orange-400/10'}`}>
                      {item._type === 'income' ? '💰' : item._type === 'recharge' ? '⬇️' : '⬆️'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {item._type === 'income' ? 'Daily Income' : item._type === 'recharge' ? 'Recharge' : 'Withdrawal'}
                      </p>
                      <p className="text-xs text-samsung-muted">{formatDateTime(item.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${item._type === 'withdrawal' ? 'text-orange-400' : 'text-green-400'}`}>
                      {item._type === 'withdrawal' ? '-' : '+'}{formatUGX(item.amount || item.net_amount || 0)}
                    </p>
                    <span className={`status-badge text-[10px] ${
                      item.status === 'approved' || !item.status ? 'badge-approved' :
                      item.status === 'pending' ? 'badge-pending' : 'badge-rejected'
                    }`}>{item.status || 'credited'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
