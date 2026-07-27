import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatUGX, formatDateTime, formatDate } from '@/lib/utils'
import { UserPackage } from '@/types'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<(UserPackage & { user?: any })[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPackages() }, [filter])

  const loadPackages = async () => {
    setLoading(true)
    let query = supabase
      .from('user_packages')
      .select('*, package:packages(*), user:user_id(id, username, email, phone, wallet_balance, referrer_id)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setPackages(data || [])
    setLoading(false)
  }

  const processReferralCommissions = async (pkg: any) => {
    const userId = pkg.user_id
    const amount = pkg.amount_paid

    // L1 referrer
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('referrer_id, wallet_balance, referral_earnings')
      .eq('id', userId)
      .single()

    if (!userProfile?.referrer_id) return

    // L1 - 30%
    const l1Commission = Math.round(amount * 0.30)
    const { data: l1 } = await supabase.from('user_profiles').select('wallet_balance, referral_earnings, referrer_id').eq('id', userProfile.referrer_id).single()
    if (l1) {
      await supabase.from('user_profiles').update({
        wallet_balance: (l1.wallet_balance || 0) + l1Commission,
        referral_earnings: (l1.referral_earnings || 0) + l1Commission,
        total_earnings: supabase.rpc ? undefined : undefined,
      }).eq('id', userProfile.referrer_id)
      await supabase.from('referral_commissions').insert({
        earner_id: userProfile.referrer_id,
        from_user_id: userId,
        user_package_id: pkg.id,
        level: 1,
        amount: l1Commission,
      })
      await supabase.from('notifications').insert({
        user_id: userProfile.referrer_id,
        title: '💰 Referral Commission!',
        message: `You earned ${formatUGX(l1Commission)} (30% L1 commission) from a team member's investment!`,
        type: 'success',
      })

      // L2 - 2%
      if (l1.referrer_id) {
        const l2Commission = Math.round(amount * 0.02)
        const { data: l2 } = await supabase.from('user_profiles').select('wallet_balance, referral_earnings, referrer_id').eq('id', l1.referrer_id).single()
        if (l2) {
          await supabase.from('user_profiles').update({
            wallet_balance: (l2.wallet_balance || 0) + l2Commission,
            referral_earnings: (l2.referral_earnings || 0) + l2Commission,
          }).eq('id', l1.referrer_id)
          await supabase.from('referral_commissions').insert({
            earner_id: l1.referrer_id, from_user_id: userId,
            user_package_id: pkg.id, level: 2, amount: l2Commission,
          })

          // L3 - 1%
          if (l2.referrer_id) {
            const l3Commission = Math.round(amount * 0.01)
            const { data: l3 } = await supabase.from('user_profiles').select('wallet_balance, referral_earnings').eq('id', l2.referrer_id).single()
            if (l3) {
              await supabase.from('user_profiles').update({
                wallet_balance: (l3.wallet_balance || 0) + l3Commission,
                referral_earnings: (l3.referral_earnings || 0) + l3Commission,
              }).eq('id', l2.referrer_id)
              await supabase.from('referral_commissions').insert({
                earner_id: l2.referrer_id, from_user_id: userId,
                user_package_id: pkg.id, level: 3, amount: l3Commission,
              })
            }
          }
        }
      }
    }
  }

  const approve = async (pkg: any) => {
    if (!confirm(`Approve ${pkg.package?.name} for ${pkg.user?.username}?`)) return

    const buyDate = new Date()
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (pkg.package?.duration_days || 60))

    const { error } = await supabase.from('user_packages').update({
      status: 'active',
      buy_date: buyDate.toISOString(),
      expiry_date: expiryDate.toISOString(),
      last_income_date: null,
    }).eq('id', pkg.id)

    if (error) { toast.error(error.message); return }

    // Process referral commissions
    await processReferralCommissions(pkg)

    await supabase.from('notifications').insert({
      user_id: pkg.user_id,
      title: '✅ Package Activated!',
      message: `Your ${pkg.package?.name} package is now active! You will earn ${formatUGX(pkg.package?.daily_income)} daily for ${pkg.package?.duration_days} days.`,
      type: 'success',
    })

    toast.success('Package approved & commissions processed!')
    loadPackages()
  }

  const reject = async (pkg: any) => {
    const note = prompt('Rejection reason:')

    // Refund balance
    const { data: user } = await supabase.from('user_profiles').select('wallet_balance').eq('id', pkg.user_id).single()
    if (user) {
      await supabase.from('user_profiles').update({
        wallet_balance: (user.wallet_balance || 0) + pkg.amount_paid,
      }).eq('id', pkg.user_id)
    }

    await supabase.from('user_packages').update({
      status: 'rejected',
    }).eq('id', pkg.id)

    await supabase.from('notifications').insert({
      user_id: pkg.user_id,
      title: '❌ Package Rejected',
      message: `Your ${pkg.package?.name} package was rejected. ${formatUGX(pkg.amount_paid)} has been refunded to your balance. Reason: ${note || 'Invalid payment'}`,
      type: 'error',
    })

    toast.success('Package rejected & balance refunded')
    loadPackages()
  }

  const deletePackage = async (id: string) => {
    if (!confirm('Delete this package permanently?')) return
    await supabase.from('user_packages').delete().eq('id', id)
    toast.success('Package deleted')
    loadPackages()
  }

  const extendPackage = async (pkg: any) => {
    const days = prompt('How many days to extend?')
    if (!days || isNaN(Number(days))) return
    const newExpiry = new Date(pkg.expiry_date || Date.now())
    newExpiry.setDate(newExpiry.getDate() + Number(days))
    await supabase.from('user_packages').update({ expiry_date: newExpiry.toISOString() }).eq('id', pkg.id)
    toast.success(`Extended by ${days} days`)
    loadPackages()
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold">User Packages</h1>
        <button onClick={loadPackages} className="text-samsung-muted hover:text-white p-2"><RefreshCw size={18} /></button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {['pending', 'active', 'expired', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              filter === f ? 'bg-samsung-blue text-white' : 'bg-samsung-card border border-samsung-border text-samsung-muted'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : packages.length === 0 ? (
        <div className="text-center py-10 text-samsung-muted">No {filter} packages</div>
      ) : (
        <div className="space-y-4">
          {packages.map(pkg => (
            <div key={pkg.id} className={`bg-samsung-card border rounded-2xl p-5 ${pkg.status === 'pending' ? 'border-yellow-500/30' : 'border-samsung-border'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-lg">{pkg.package?.name}</p>
                  <p className="text-samsung-muted text-sm">{pkg.user?.username} • {pkg.user?.email}</p>
                  <p className="text-samsung-muted text-xs">{pkg.user?.phone}</p>
                </div>
                <span className={`status-badge ${
                  pkg.status === 'active' ? 'badge-active' :
                  pkg.status === 'pending' ? 'badge-pending' :
                  pkg.status === 'expired' ? 'badge-expired' : 'badge-rejected'
                }`}>{pkg.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-samsung-dark rounded-xl p-3">
                  <p className="text-xs text-samsung-muted">Amount Paid</p>
                  <p className="font-bold text-samsung-accent">{formatUGX(pkg.amount_paid)}</p>
                </div>
                <div className="bg-samsung-dark rounded-xl p-3">
                  <p className="text-xs text-samsung-muted">Daily Income</p>
                  <p className="font-bold text-green-400">+{formatUGX(pkg.package?.daily_income || 0)}</p>
                </div>
              </div>

              {pkg.status === 'active' && pkg.expiry_date && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-samsung-dark rounded-xl p-3">
                    <p className="text-xs text-samsung-muted">Buy Date</p>
                    <p className="font-semibold text-xs">{pkg.buy_date ? formatDate(pkg.buy_date) : '-'}</p>
                  </div>
                  <div className="bg-samsung-dark rounded-xl p-3">
                    <p className="text-xs text-samsung-muted">Expiry</p>
                    <p className="font-semibold text-xs">{formatDate(pkg.expiry_date)}</p>
                  </div>
                </div>
              )}

              {pkg.payment_proof && (
                <div className="bg-samsung-dark/60 rounded-xl p-3 mb-4 border border-samsung-border">
                  <p className="text-xs text-samsung-muted mb-1">Payment Proof</p>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{pkg.payment_proof}</p>
                </div>
              )}

              <p className="text-samsung-muted text-xs mb-4">Submitted: {formatDateTime(pkg.created_at)}</p>

              <div className="flex gap-2 flex-wrap">
                {pkg.status === 'pending' && (
                  <>
                    <button onClick={() => reject(pkg)} className="btn-danger flex-1">❌ Reject</button>
                    <button onClick={() => approve(pkg)} className="btn-success flex-1">✅ Approve</button>
                  </>
                )}
                {pkg.status === 'active' && (
                  <button onClick={() => extendPackage(pkg)}
                    className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600/30">
                    ⏰ Extend
                  </button>
                )}
                <button onClick={() => deletePackage(pkg.id)} className="btn-danger">
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
