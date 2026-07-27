import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Wallet } from '@/types'
import { ArrowLeft, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function WalletPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ network: 'MTN' as 'MTN' | 'Airtel', phone_number: '', full_name: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) loadWallets()
  }, [profile])

  const loadWallets = async () => {
    const { data } = await supabase.from('wallets').select('*').eq('user_id', profile!.id).order('is_default', { ascending: false })
    setWallets(data || [])
  }

  const handleAdd = async () => {
    const { phone_number, full_name, network } = form
    if (!phone_number || !full_name) { toast.error('Fill all fields'); return }
    if (!phone_number.match(/^0[0-9]{9}$/)) { toast.error('Phone must be 10 digits starting with 0'); return }
    // Network validation
    if (network === 'MTN' && !phone_number.match(/^(077|078|039)/)) {
      toast.warning('MTN numbers usually start with 077, 078, or 039')
    }
    if (network === 'Airtel' && !phone_number.match(/^(075|070|074)/)) {
      toast.warning('Airtel numbers usually start with 075, 070, or 074')
    }
    setLoading(true)
    const { error } = await supabase.from('wallets').insert({
      user_id: profile!.id,
      network,
      phone_number,
      full_name,
      is_default: wallets.length === 0,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Wallet added!')
      setShowAdd(false)
      setForm({ network: 'MTN', phone_number: '', full_name: '' })
      loadWallets()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this wallet?')) return
    await supabase.from('wallets').delete().eq('id', id)
    toast.success('Wallet removed')
    loadWallets()
  }

  const setDefault = async (id: string) => {
    await supabase.from('wallets').update({ is_default: false }).eq('user_id', profile!.id)
    await supabase.from('wallets').update({ is_default: true }).eq('id', id)
    toast.success('Default wallet updated')
    loadWallets()
  }

  return (
    <div className="min-h-screen bg-samsung-dark">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-samsung-border">
        <button onClick={() => navigate(-1)} className="text-samsung-muted hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">My Wallets</h1>
      </div>

      <div className="px-5 py-4">
        {wallets.length === 0 && !showAdd && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-samsung-muted mb-4">No wallets added yet</p>
            <p className="text-xs text-samsung-muted mb-6">Add your MTN or Airtel Mobile Money account to withdraw earnings</p>
          </div>
        )}

        {wallets.map(w => (
          <div key={w.id} className={`bg-samsung-card border rounded-xl p-4 mb-3 ${w.is_default ? 'border-samsung-blue' : 'border-samsung-border'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-bold ${w.network === 'MTN' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {w.network === 'MTN' ? '📱 MTN Money' : '📱 Airtel Money'}
                  </span>
                  {w.is_default && <span className="bg-samsung-blue text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">DEFAULT</span>}
                </div>
                <p className="font-semibold text-white">{w.full_name}</p>
                <p className="text-samsung-muted text-sm">{w.phone_number}</p>
              </div>
              <div className="flex gap-2">
                {!w.is_default && (
                  <button onClick={() => setDefault(w.id)} className="text-xs text-samsung-accent border border-samsung-accent/30 px-2 py-1 rounded-lg hover:bg-samsung-accent/10">
                    Set Default
                  </button>
                )}
                <button onClick={() => handleDelete(w.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {showAdd ? (
          <div className="bg-samsung-card border border-samsung-border rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-4">Add New Wallet</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Network</label>
              <div className="grid grid-cols-2 gap-2">
                {(['MTN', 'Airtel'] as const).map(n => (
                  <button key={n} onClick={() => setForm(f => ({ ...f, network: n }))}
                    className={`p-3 rounded-xl border font-semibold text-sm transition-all ${
                      form.network === n
                        ? n === 'MTN' ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-red-400 bg-red-400/10 text-red-400'
                        : 'border-samsung-border text-samsung-muted'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Full Name (as on M-Money)</label>
              <input className="samsung-input" placeholder="Your full name" value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input type="tel" className="samsung-input" placeholder="07XXXXXXXX" value={form.phone_number}
                onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAdd} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Saving...' : 'Save Wallet'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)}
            className="w-full border-2 border-dashed border-samsung-border rounded-xl p-4 text-samsung-muted text-sm hover:border-samsung-blue hover:text-white transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Add MTN / Airtel Wallet
          </button>
        )}
      </div>
    </div>
  )
}
