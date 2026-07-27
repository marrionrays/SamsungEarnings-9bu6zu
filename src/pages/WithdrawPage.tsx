import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatUGX, formatDateTime } from '@/lib/utils'
import { Wallet, WithdrawalRequest } from '@/types'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'

const TAX_RATE = 0.18

export default function WithdrawPage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<WithdrawalRequest[]>([])
  const [todayCount, setTodayCount] = useState(0)

  useEffect(() => {
    if (profile) {
      loadWallets()
      loadHistory()
    }
  }, [profile])

  const loadWallets = async () => {
    const { data } = await supabase.from('wallets').select('*').eq('user_id', profile!.id).order('is_default', { ascending: false })
    setWallets(data || [])
    if (data && data.length > 0) setSelectedWallet(data.find(w => w.is_default) || data[0])
  }

  const loadHistory = async () => {
    const { data } = await supabase.from('withdrawal_requests').select('*').eq('user_id', profile!.id).order('created_at', { ascending: false }).limit(10)
    setHistory(data || [])
    const today = new Date().toISOString().split('T')[0]
    const todayW = (data || []).filter(w => w.created_at.startsWith(today) && w.status !== 'rejected').length
    setTodayCount(todayW)
  }

  const amt = Number(amount)
  const tax = Math.round(amt * TAX_RATE)
  const net = amt - tax

  const handleWithdraw = async () => {
    if (!selectedWallet) { toast.error('Please add a wallet first'); return }
    if (!amount || isNaN(amt)) { toast.error('Enter a valid amount'); return }
    if (amt < 7000) { toast.error('Minimum withdrawal is 7,000 UGX'); return }
    if (amt > (profile?.wallet_balance || 0)) { toast.error('Insufficient balance'); return }
    if (todayCount >= 2) { toast.error('Maximum 2 withdrawals per day reached'); return }

    // Check if user has at least one active package
    const { data: activePkgs } = await supabase.from('user_packages').select('id').eq('user_id', profile!.id).eq('status', 'active').limit(1)
    if (!activePkgs || activePkgs.length === 0) {
      toast.error('You must have at least one active package to withdraw.')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: profile!.id,
      wallet_id: selectedWallet.id,
      amount: amt,
      tax_amount: tax,
      net_amount: net,
      network: selectedWallet.network,
      phone_number: selectedWallet.phone_number,
      status: 'pending',
    })

    if (error) {
      toast.error('Withdrawal failed: ' + error.message)
    } else {
      await supabase.from('notifications').insert({
        user_id: profile!.id,
        title: '💸 Withdrawal Requested',
        message: `Your withdrawal of ${formatUGX(amt)} (net: ${formatUGX(net)}) is pending admin approval.`,
        type: 'info',
      })
      toast.success('Withdrawal submitted! Admin will process it shortly.')
      setAmount('')
      loadHistory()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-samsung-dark page-with-nav">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-samsung-border">
        <button onClick={() => navigate(-1)} className="text-samsung-muted hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">Withdraw</h1>
      </div>

      <div className="px-5 py-4 animate-fade-in">
        {/* Balance */}
        <div className="bg-samsung-gradient rounded-2xl p-5 mb-5 border border-samsung-blue/30">
          <p className="text-blue-200 text-xs mb-1">Available Balance</p>
          <p className="text-3xl font-extrabold">{formatUGX(profile?.wallet_balance || 0)}</p>
          <p className="text-blue-200 text-xs mt-2">Withdrawals today: <strong className="text-white">{todayCount}/2</strong></p>
        </div>

        {/* Rules */}
        <div className="bg-samsung-card border border-samsung-border rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-samsung-muted mb-2">WITHDRAWAL RULES</p>
          <div className="space-y-1 text-xs text-samsung-muted">
            <p>• Minimum: <span className="text-white">7,000 UGX</span></p>
            <p>• Tax: <span className="text-white">18%</span> deducted from your amount</p>
            <p>• Daily limit: <span className="text-white">2 withdrawals</span></p>
            <p>• Processing time: <span className="text-white">Up to 24 hours</span></p>
          </div>
        </div>

        {/* Wallet selection */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium">Withdrawal Wallet</p>
            <button onClick={() => navigate('/wallet')} className="text-samsung-accent text-xs flex items-center gap-1">
              <Plus size={12} /> Add Wallet
            </button>
          </div>
          {wallets.length === 0 ? (
            <button onClick={() => navigate('/wallet')} className="w-full border-2 border-dashed border-samsung-border rounded-xl p-4 text-samsung-muted text-sm text-center hover:border-samsung-blue transition-colors">
              + Add MTN or Airtel Wallet
            </button>
          ) : (
            <div className="space-y-2">
              {wallets.map(w => (
                <button key={w.id} onClick={() => setSelectedWallet(w)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedWallet?.id === w.id ? 'border-samsung-blue bg-samsung-blue/10' : 'border-samsung-border bg-samsung-card'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm">{w.full_name}</p>
                      <p className="text-samsung-muted text-xs">{w.network} • {w.phone_number}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedWallet?.id === w.id ? 'border-samsung-blue bg-samsung-blue' : 'border-samsung-border'}`}>
                      {selectedWallet?.id === w.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Withdrawal Amount (UGX)</label>
          <input type="number" className="samsung-input text-xl" placeholder="Min: 7,000"
            value={amount} onChange={e => setAmount(e.target.value)} />
        </div>

        {/* Tax breakdown */}
        {amt > 0 && (
          <div className="bg-samsung-card border border-samsung-border rounded-xl p-4 mb-5">
            <div className="flex justify-between mb-2">
              <span className="text-samsung-muted text-sm">Withdrawal Amount</span>
              <span className="font-semibold">{formatUGX(amt)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-samsung-muted text-sm">Tax (18%)</span>
              <span className="font-semibold text-red-400">-{formatUGX(tax)}</span>
            </div>
            <div className="border-t border-samsung-border pt-2 flex justify-between">
              <span className="font-bold">You Receive</span>
              <span className="font-bold text-green-400 text-lg">{formatUGX(net)}</span>
            </div>
          </div>
        )}

        <button onClick={handleWithdraw} disabled={loading || wallets.length === 0} className="btn-primary">
          {loading ? 'Processing...' : `Withdraw ${amt > 0 ? formatUGX(amt) : ''}`}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold mb-3">Withdrawal History</h3>
            <div className="space-y-3">
              {history.map(w => (
                <div key={w.id} className="bg-samsung-card border border-samsung-border rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{w.network} • {w.phone_number}</p>
                    <p className="text-samsung-muted text-xs">{formatDateTime(w.created_at)}</p>
                    {w.admin_note && <p className="text-xs text-yellow-400 mt-1">{w.admin_note}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-400">-{formatUGX(w.amount)}</p>
                    <p className="text-xs text-green-400">Net: {formatUGX(w.net_amount)}</p>
                    <span className={`status-badge ${w.status === 'approved' ? 'badge-approved' : w.status === 'pending' ? 'badge-pending' : 'badge-rejected'}`}>
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
