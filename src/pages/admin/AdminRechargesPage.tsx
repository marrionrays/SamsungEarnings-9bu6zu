import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatUGX, formatDateTime } from '@/lib/utils'
import { RechargeRequest } from '@/types'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

export default function AdminRechargesPage() {
  const [recharges, setRecharges] = useState<(RechargeRequest & { user?: any })[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadRecharges() }, [filter])

  const loadRecharges = async () => {
    setLoading(true)
    let query = supabase
      .from('recharge_requests')
      .select('*, user:user_id(id, username, email, phone, wallet_balance)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setRecharges(data || [])
    setLoading(false)
  }

  const approve = async (r: any) => {
    if (!confirm(`Approve recharge of ${formatUGX(r.amount)} for ${r.user?.username}?`)) return

    // Add balance to user
    const { error: balErr } = await supabase.from('user_profiles').update({
      wallet_balance: (r.user?.wallet_balance || 0) + r.amount,
    }).eq('id', r.user_id)

    if (balErr) { toast.error('Balance update failed: ' + balErr.message); return }

    await supabase.from('recharge_requests').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', r.id)

    await supabase.from('notifications').insert({
      user_id: r.user_id,
      title: '✅ Recharge Approved!',
      message: `Your recharge of ${formatUGX(r.amount)} has been approved and added to your balance.`,
      type: 'success',
    })

    toast.success('Recharge approved!')
    loadRecharges()
  }

  const reject = async (r: any) => {
    const note = prompt('Rejection reason (optional):')
    await supabase.from('recharge_requests').update({
      status: 'rejected',
      admin_note: note || 'Rejected by admin',
      updated_at: new Date().toISOString()
    }).eq('id', r.id)

    await supabase.from('notifications').insert({
      user_id: r.user_id,
      title: '❌ Recharge Rejected',
      message: `Your recharge request of ${formatUGX(r.amount)} was rejected. Reason: ${note || 'Contact support'}`,
      type: 'error',
    })

    toast.success('Recharge rejected')
    loadRecharges()
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold">Recharge Requests</h1>
        <button onClick={loadRecharges} className="text-samsung-muted hover:text-white p-2">
          <RefreshCw size={18} />
        </button>
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
      ) : recharges.length === 0 ? (
        <div className="text-center py-10 text-samsung-muted">No {filter} recharges</div>
      ) : (
        <div className="space-y-4">
          {recharges.map(r => (
            <div key={r.id} className={`bg-samsung-card border rounded-2xl p-5 ${r.status === 'pending' ? 'border-yellow-500/30' : 'border-samsung-border'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-lg text-samsung-accent">{formatUGX(r.amount)}</p>
                  <p className="text-samsung-muted text-sm">{r.user?.username} ({r.user?.email})</p>
                  <p className="text-samsung-muted text-xs">{r.user?.phone}</p>
                </div>
                <span className={`status-badge ${r.status === 'approved' ? 'badge-approved' : r.status === 'pending' ? 'badge-pending' : 'badge-rejected'}`}>
                  {r.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-samsung-dark rounded-xl p-3">
                  <p className="text-xs text-samsung-muted">Network</p>
                  <p className="font-semibold text-sm">{r.network}</p>
                </div>
                <div className="bg-samsung-dark rounded-xl p-3">
                  <p className="text-xs text-samsung-muted">Sender Phone</p>
                  <p className="font-semibold text-sm">{r.sender_phone}</p>
                </div>
              </div>

              <div className="bg-samsung-dark rounded-xl p-3 mb-4">
                <p className="text-xs text-samsung-muted mb-1">Sender Name</p>
                <p className="font-semibold text-sm">{r.sender_name}</p>
              </div>

              {r.payment_proof && (
                <div className="bg-samsung-dark/60 rounded-xl p-3 mb-4 border border-samsung-border">
                  <p className="text-xs text-samsung-muted mb-1">Payment Proof</p>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{r.payment_proof}</p>
                </div>
              )}

              <p className="text-samsung-muted text-xs mb-4">{formatDateTime(r.created_at)}</p>
              <p className="text-xs text-samsung-muted mb-4">User current balance: <span className="text-white font-semibold">{formatUGX(r.user?.wallet_balance || 0)}</span></p>

              {r.status === 'pending' && (
                <div className="flex gap-3">
                  <button onClick={() => reject(r)} className="btn-danger flex-1">❌ Reject</button>
                  <button onClick={() => approve(r)} className="btn-success flex-1">✅ Approve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
