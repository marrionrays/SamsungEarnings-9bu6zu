import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatUGX, formatDateTime } from '@/lib/utils'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import { RechargeRequest } from '@/types'
import { Copy, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

const MTN_NUMBER = '0756406186'
const MTN_NAME = 'Kyosiimire Joan'
const AIRTEL_NUMBER = '0746085840'
const AIRTEL_NAME = 'Nabakooza Milly'

export default function RechargePage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const [network, setNetwork] = useState<'MTN' | 'Airtel'>('MTN')
  const [amount, setAmount] = useState('')
  const [senderPhone, setSenderPhone] = useState(profile?.phone || '')
  const [senderName, setSenderName] = useState(profile?.username || '')
  const [proof, setProof] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [history, setHistory] = useState<RechargeRequest[]>([])

  const targetPhone = network === 'MTN' ? MTN_NUMBER : AIRTEL_NUMBER
  const targetName = network === 'MTN' ? MTN_NAME : AIRTEL_NAME

  useEffect(() => {
    if (profile) {
      loadHistory()
      setSenderPhone(profile.phone || '')
      setSenderName(profile.username || '')
    }
  }, [profile])

  const loadHistory = async () => {
    const { data } = await supabase
      .from('recharge_requests')
      .select('*')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setHistory(data || [])
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  const validateForm = () => {
    const amt = Number(amount)
    if (!amount || isNaN(amt)) { toast.error('Enter a valid amount'); return false }
    if (amt < 15000) { toast.error('Minimum recharge is 15,000 UGX'); return false }
    if (amt > 2000000) { toast.error('Maximum recharge is 2,000,000 UGX'); return false }
    if (!senderPhone || !senderName) { toast.error('Enter sender phone and name'); return false }
    return true
  }

  const handleSubmit = async () => {
    if (!proof.trim()) { toast.error('Please paste the M-Money confirmation message'); return }
    setLoading(true)
    const { error } = await supabase.from('recharge_requests').insert({
      user_id: profile!.id,
      amount: Number(amount),
      network,
      sender_phone: senderPhone,
      sender_name: senderName,
      payment_proof: proof.trim(),
      status: 'pending',
    })
    if (error) {
      toast.error('Submission failed: ' + error.message)
    } else {
      await supabase.from('notifications').insert({
        user_id: profile!.id,
        title: '📥 Recharge Submitted',
        message: `Your recharge of ${formatUGX(Number(amount))} is pending admin approval.`,
        type: 'info',
      })
      toast.success('Recharge submitted! Awaiting admin approval.')
      setStep('form')
      setAmount('')
      setProof('')
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
        <h1 className="font-bold text-lg">Recharge Account</h1>
      </div>

      <div className="px-5 py-4 animate-fade-in">
        {step === 'form' ? (
          <>
            {/* Balance */}
            <div className="bg-samsung-card border border-samsung-border rounded-xl p-4 mb-5">
              <p className="text-samsung-muted text-xs">Current Balance</p>
              <p className="font-bold text-xl text-samsung-accent">{formatUGX(profile?.wallet_balance || 0)}</p>
            </div>

            {/* Network selection */}
            <div className="mb-5">
              <p className="text-sm font-medium mb-3">Select Network</p>
              <div className="grid grid-cols-2 gap-3">
                {(['MTN', 'Airtel'] as const).map(n => (
                  <button key={n} onClick={() => setNetwork(n)}
                    className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${
                      network === n
                        ? n === 'MTN' ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-red-400 bg-red-400/10 text-red-400'
                        : 'border-samsung-border bg-samsung-card text-samsung-muted'
                    }`}>
                    {n === 'MTN' ? '📱 MTN Money' : '📱 Airtel Money'}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount (Min: 15,000 UGX)</label>
              <input type="number" className="samsung-input" placeholder="e.g. 50000"
                value={amount} onChange={e => setAmount(e.target.value)} />
              <div className="flex gap-2 mt-2">
                {[15000, 50000, 100000, 300000].map(a => (
                  <button key={a} onClick={() => setAmount(String(a))}
                    className="flex-1 text-xs py-1.5 bg-samsung-card border border-samsung-border rounded-lg text-samsung-muted hover:text-white hover:border-samsung-blue transition-colors">
                    {a >= 1000 ? (a / 1000) + 'K' : a}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your Name</label>
              <input className="samsung-input" placeholder="Name on your mobile money account"
                value={senderName} onChange={e => setSenderName(e.target.value)} />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Your Phone Number</label>
              <input type="tel" className="samsung-input" placeholder="07XXXXXXXX"
                value={senderPhone} onChange={e => setSenderPhone(e.target.value)} />
            </div>

            <button onClick={() => validateForm() && setStep('confirm')} className="btn-primary">
              Next – View Payment Details
            </button>
          </>
        ) : (
          <>
            {/* Payment instructions */}
            <div className={`border rounded-2xl p-5 mb-5 ${network === 'MTN' ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
              <p className={`font-bold text-lg mb-1 ${network === 'MTN' ? 'text-yellow-400' : 'text-red-400'}`}>
                {network === 'MTN' ? '📱 MTN Mobile Money' : '📱 Airtel Money'}
              </p>
              <p className="text-sm text-samsung-muted mb-4">Send <strong className="text-white">{formatUGX(Number(amount))}</strong> to:</p>

              <div className="space-y-3">
                <div className="bg-black/30 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-samsung-muted">Phone Number</p>
                    <p className="font-bold text-white text-lg">{targetPhone}</p>
                  </div>
                  <button onClick={() => copy(targetPhone, 'Phone number')} className="p-2 bg-samsung-blue/20 rounded-lg">
                    <Copy size={16} className="text-samsung-accent" />
                  </button>
                </div>
                <div className="bg-black/30 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-samsung-muted">Account Name</p>
                    <p className="font-bold text-white">{targetName}</p>
                  </div>
                  <button onClick={() => copy(targetName, 'Name')} className="p-2 bg-samsung-blue/20 rounded-lg">
                    <Copy size={16} className="text-samsung-accent" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-samsung-card border border-samsung-border rounded-xl p-4 mb-4">
              <p className="text-xs text-yellow-400 mb-2">⚠️ Important Steps:</p>
              <ol className="text-xs text-samsung-muted space-y-1 list-decimal list-inside">
                <li>Send {formatUGX(Number(amount))} to {targetPhone} ({targetName})</li>
                <li>Copy the confirmation message you receive from {network}</li>
                <li>Paste it in the box below and submit</li>
              </ol>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">M-Money Confirmation Message *</label>
              <textarea className="samsung-input resize-none h-28"
                placeholder="Paste the confirmation SMS you received from MTN/Airtel after sending..."
                value={proof} onChange={e => setProof(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('form')} className="btn-secondary flex-1">← Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Submitting...' : 'Submit Recharge'}
              </button>
            </div>
          </>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold mb-3">Recharge History</h3>
            <div className="space-y-3">
              {history.map(r => (
                <div key={r.id} className="bg-samsung-card border border-samsung-border rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{r.network} • {formatDateTime(r.created_at)}</p>
                    <p className="text-samsung-muted text-xs">{r.sender_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">{formatUGX(r.amount)}</p>
                    <span className={`status-badge ${r.status === 'approved' ? 'badge-approved' : r.status === 'pending' ? 'badge-pending' : 'badge-rejected'}`}>
                      {r.status}
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
