import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Package } from '@/types'
import { formatUGX, getPhoneImage, getGroupColor } from '@/lib/utils'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import { toast } from 'sonner'
import { ShoppingCart, X } from 'lucide-react'

export default function ProductsPage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedGroup, setSelectedGroup] = useState('All')
  const [buyModal, setBuyModal] = useState<Package | null>(null)
  const [proof, setProof] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('packages').select('*').eq('is_active', true).order('price').then(({ data }) => {
      setPackages(data || [])
    })
  }, [])

  const groups = ['All', 'Group 1', 'Group 2', 'Group 3']
  const filtered = selectedGroup === 'All' ? packages : packages.filter(p => p.group_name === selectedGroup)

  const handleBuy = async () => {
    if (!buyModal || !profile) return
    if (!proof.trim()) { toast.error('Please paste your payment proof message'); return }
    if (profile.wallet_balance < buyModal.price) {
      toast.error(`Insufficient balance. You need ${formatUGX(buyModal.price)}. Please recharge first.`)
      return
    }
    setLoading(true)

    // Deduct from wallet balance immediately
    const { error: balanceError } = await supabase.from('user_profiles').update({
      wallet_balance: profile.wallet_balance - buyModal.price,
    }).eq('id', profile.id)

    if (balanceError) { toast.error('Failed to deduct balance'); setLoading(false); return }

    const { error } = await supabase.from('user_packages').insert({
      user_id: profile.id,
      package_id: buyModal.id,
      amount_paid: buyModal.price,
      payment_proof: proof.trim(),
      status: 'pending',
    })

    if (error) {
      // Restore balance on error
      await supabase.from('user_profiles').update({ wallet_balance: profile.wallet_balance }).eq('id', profile.id)
      toast.error('Purchase failed: ' + error.message)
    } else {
      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: '📦 Package Purchase Submitted',
        message: `Your ${buyModal.name} package is pending admin approval.`,
        type: 'info',
      })
      toast.success('Package purchased! Awaiting admin approval.')
      setBuyModal(null)
      setProof('')
      await refreshProfile()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-samsung-dark page-with-nav">
      <AppHeader title="Samsung Packages" />

      <div className="px-5 py-4 animate-fade-in">
        {/* Balance */}
        <div className="bg-samsung-card border border-samsung-border rounded-xl p-4 mb-4 flex justify-between items-center">
          <div>
            <p className="text-samsung-muted text-xs">Available Balance</p>
            <p className="font-bold text-lg text-samsung-accent">{formatUGX(profile?.wallet_balance || 0)}</p>
          </div>
          <button onClick={() => navigate('/recharge')}
            className="bg-samsung-blue text-white text-xs font-semibold px-3 py-2 rounded-lg">
            + Recharge
          </button>
        </div>

        {/* Group filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {groups.map(g => (
            <button key={g} onClick={() => setSelectedGroup(g)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedGroup === g ? 'bg-samsung-blue text-white' : 'bg-samsung-card border border-samsung-border text-samsung-muted'
              }`}>
              {g}
            </button>
          ))}
        </div>

        {/* Package grid */}
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(pkg => (
            <div key={pkg.id} className="bg-samsung-card border border-samsung-border rounded-2xl overflow-hidden card-shine hover:border-samsung-blue/50 transition-all">
              {/* Phone image */}
              <div className={`relative h-32 bg-gradient-to-br ${getGroupColor(pkg.group_name)} flex items-center justify-center`}>
                <img src={getPhoneImage(pkg.name)} alt={pkg.name}
                  className="h-full w-full object-cover opacity-40 absolute inset-0" />
                <div className="relative z-10 text-center">
                  <p className="text-2xl font-extrabold">{pkg.name}</p>
                  <span className="bg-black/30 text-white text-xs px-2 py-0.5 rounded-full">{pkg.group_name}</span>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-samsung-muted text-xs mb-1">Price</p>
                    <p className="font-bold text-sm text-white">{formatUGX(pkg.price)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-samsung-muted text-xs mb-1">Daily Earn</p>
                    <p className="font-bold text-sm text-green-400">+{formatUGX(pkg.daily_income)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-samsung-muted text-xs mb-1">Duration</p>
                    <p className="font-bold text-sm text-white">{pkg.duration_days} Days</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-samsung-dark/60 rounded-xl p-3 mb-4">
                  <div>
                    <p className="text-xs text-samsung-muted">Total Return</p>
                    <p className="font-bold text-samsung-gold">{formatUGX(pkg.daily_income * pkg.duration_days)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-samsung-muted">ROI</p>
                    <p className="font-bold text-green-400">{((pkg.daily_income * pkg.duration_days / pkg.price - 1) * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <button onClick={() => setBuyModal(pkg)}
                  className="btn-primary flex items-center justify-center gap-2 py-3">
                  <ShoppingCart size={16} />
                  Buy Now – {formatUGX(pkg.price)}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buy Modal */}
      {buyModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={() => setBuyModal(null)}>
          <div className="bg-samsung-card border-t border-samsung-border rounded-t-2xl p-5 w-full animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Confirm Purchase</h3>
              <button onClick={() => setBuyModal(null)}><X size={20} className="text-samsung-muted" /></button>
            </div>
            <div className="bg-samsung-dark rounded-xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-samsung-muted text-sm">Package</span>
                <span className="font-semibold text-sm">{buyModal.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-samsung-muted text-sm">Investment</span>
                <span className="font-semibold text-sm text-samsung-accent">{formatUGX(buyModal.price)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-samsung-muted text-sm">Daily Income</span>
                <span className="font-semibold text-sm text-green-400">+{formatUGX(buyModal.daily_income)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-samsung-muted text-sm">Duration</span>
                <span className="font-semibold text-sm">{buyModal.duration_days} Days</span>
              </div>
            </div>
            <p className="text-xs text-samsung-muted mb-2">Your recharge balance will be used for purchase.</p>
            <p className="text-xs text-samsung-muted mb-3">Balance: <span className="text-white font-semibold">{formatUGX(profile?.wallet_balance || 0)}</span></p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Payment Proof / Note</label>
              <textarea className="samsung-input resize-none h-20" placeholder="Paste your payment confirmation message here..."
                value={proof} onChange={e => setProof(e.target.value)} />
            </div>
            <button onClick={handleBuy} disabled={loading} className="btn-primary">
              {loading ? 'Processing...' : `Confirm – ${formatUGX(buyModal.price)}`}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
