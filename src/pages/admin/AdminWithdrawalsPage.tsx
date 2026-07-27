import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatUGX, formatDateTime } from '@/lib/utils'
import { WithdrawalRequest } from '@/types'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<(WithdrawalRequest & { user?: any })[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadWithdrawals() }, [filter])

  const loadWithdrawals = async () => {
    setLoading(true)
    let query = supabase
      .from('withdrawal_requests')
      .select('*, user:user_id(id, username, email, phone, wallet_balance)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setWithdrawals(data || [])
    setLoading(false)
  }

  const approve = async (w: any) => {
    if (!confirm(`Approve withdrawal of ${formatUGX(w.amount)} for ${w.user?.username}?\nNet to send: ${formatUGX(w.net_amount)}\nSend to: ${w.network} ${w.phone_number}`)) return

    // Deduct from user balance
    const currentBalance = w.user?.wallet_balance || 0
    if (currentBalance < w.amount) {
      toast.error('User balance insufficient. Balance: ' + formatUGX(currentBalance))
      return
    }

    const { error } = await supabase.from('user_profiles').update({
      wallet_balance: currentBalance - w.amount,
      total_withdrawn: (w.user?.total_withdrawn || 0) + w.amount,
    }).eq('id', w.user_id)

    if (error) { toast.error('Failed to update balance: ' + error.message); return }

    await supabase.from('withdrawal_requests').update({
      status: 'approved',
      updated_at: new Date().toISOString()
    }).eq('id', w.id)

    await supabase.from('notifications').insert({
      user_id: w.user_id,
      title: '✅ Withdrawal Approved!',
      message: `Your withdrawal of ${formatUGX(w.amount)} (net: ${formatUGX(w.net_amount)}) has been sent to ${w.network} ${w.phone_number}.`,
      type: 'success',
    })

    toast.success('Withdrawal approved! Balance deducted.')
    loadWithdrawals()
  }

  const reject = async (w: any) => {
    const note = prompt('Rejection reason (optional):')
    await supabase.from('withdrawal_requests').update({
      status: 'rejected',
      admin_note: note || 'Rejected by admin',
      updated_at: new Date().toISOString()
    }).eq('id', w.id)

    await supabase.from('notifications').insert({
      user_id: w.user_id,
      title: '❌ Withdrawal Rejected',
      message: `Your withdrawal of ${formatUGX(w.amount)} was rejected. Reason: ${note || 'Contact support.'}`,
      type: 'error',
    })

    toast.success('Withdrawal rejected. Balance NOT deducted.')
    loadWithdrawals()
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold">Withdrawals</h1>
        <button onClick={loadWithdrawals} className="text-samsung-muted hover:text-white p-2"><RefreshCw size={18} /></button>
      </div>

      <div className="flex gap-2 mb-5">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-samsung-blue text-white' : 'bg-samsung-card border border-samsung-border text-samsung-muted'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-10 text-samsung-muted">No {filter} withdrawals</div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map(w => (
            <div key={w.id} className={`bg-samsung-card border rounded-2xl p-5 ${w.status === 'pending' ? 'border-orange-500/30' : 'border-samsung-border'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-xl text-orange-400">{formatUGX(w.amount)}</p>
                  <p className="text-samsung-muted text-sm">{w.user?.username} ({w.user?.email})</p>
                  <p className="text-samsung-muted text-xs">{w.user?.phone}</p>
                </div>
                <span className={`status-badge ${w.status === 'approved' ? 'badge-approved' : w.status === 'pending' ? 'badge-pending' : 'badge-rejected'}`}>
                  {w.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-samsung-dark rounded-xl p-3">
                  <p className="text-xs text-samsung-muted">Tax (18%)</p>
                  <p className="font-semibold text-red-400 text-sm">-{formatUGX(w.tax_amount)}</p>
                </div>
                <div className="bg-samsung-dark rounded-xl p-3">
                  <p className="text-xs text-samsung-muted">Net to Send</p>
                  <p className="font-bold text-green-400 text-sm">{formatUGX(w.net_amount)}</p>
                </div>
              </div>

              {w.status === 'pending' && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4 mb-4">
                  <p className="text-xs text-orange-300 font-semibold mb-2">📱 Send money to:</p>
                  <p className="font-bold text-white">{w.network} – {w.phone_number}</p>
                  <p className="text-orange-400 font-bold text-lg mt-1">{formatUGX(w.net_amount)}</p>
                  <p className="text-xs text-samsung-muted mt-1">User balance: {formatUGX(w.user?.wallet_balance || 0)}</p>
                </div>
              )}

              <p className="text-samsung-muted text-xs mb-4">{formatDateTime(w.created_at)}</p>

              {w.status === 'pending' && (
                <div className="flex gap-3">
                  <button onClick={() => reject(w)} className="btn-danger flex-1">❌ Reject</button>
                  <button onClick={() => approve(w)} className="btn-success flex-1">✅ Sent & Approve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
