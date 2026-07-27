import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatUGX, formatDateTime } from '@/lib/utils'
import { GiftCode } from '@/types'
import { toast } from 'sonner'
import { Plus, Copy, RefreshCw } from 'lucide-react'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'SAM'
  for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

export default function AdminGiftCodesPage() {
  const { profile } = useAuth()
  const [codes, setCodes] = useState<GiftCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ amount: '', max_uses: '1000', minutes: '15' })
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadCodes() }, [])

  const loadCodes = async () => {
    setLoading(true)
    const { data } = await supabase.from('gift_codes').select('*').order('created_at', { ascending: false })
    setCodes(data || [])
    setLoading(false)
  }

  const createCode = async () => {
    if (!form.amount || isNaN(Number(form.amount))) { toast.error('Enter valid amount'); return }
    setCreating(true)
    const code = generateCode()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + Number(form.minutes))

    const { error } = await supabase.from('gift_codes').insert({
      code,
      amount: Number(form.amount),
      expires_at: expiresAt.toISOString(),
      max_uses: Number(form.max_uses),
      is_active: true,
      created_by: profile!.id,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Gift code ${code} created! Share it on Telegram now!`)
      setShowCreate(false)
      setForm({ amount: '', max_uses: '1000', minutes: '15' })
      loadCodes()
    }
    setCreating(false)
  }

  const deactivate = async (id: string) => {
    await supabase.from('gift_codes').update({ is_active: false }).eq('id', id)
    toast.success('Code deactivated')
    loadCodes()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied!')
  }

  const shareOnWhatsApp = (code: GiftCode) => {
    const text = `🎁 Samsung Earnings Gift Code!\n\nCode: ${code.code}\nAmount: ${formatUGX(code.amount)}\n\n⚠️ HURRY! Only valid for 15 minutes!\n\nRedeem in the app under Mine → Redeem Gift Code\n\nJoin Samsung Earnings: ${window.location.origin}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()
  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'EXPIRED'
    const mins = Math.floor(diff / 60000)
    const secs = Math.floor((diff % 60000) / 1000)
    return `${mins}m ${secs}s`
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold">Gift Codes</h1>
        <div className="flex gap-2">
          <button onClick={loadCodes} className="text-samsung-muted hover:text-white p-2"><RefreshCw size={18} /></button>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-samsung-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-samsung-blue-light">
            <Plus size={16} /> Create Code
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-samsung-card border border-samsung-border rounded-2xl p-5 mb-6">
          <h3 className="font-bold mb-4">Create Gift Code</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Amount (UGX)</label>
              <input type="number" className="samsung-input" placeholder="e.g. 5000"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Uses</label>
              <input type="number" className="samsung-input" value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Valid for (minutes)</label>
              <select className="samsung-input" value={form.minutes}
                onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
          </div>
          <div className="bg-samsung-dark/60 rounded-xl p-3 mb-4 text-xs text-samsung-muted">
            💡 Share the generated code on Telegram immediately. It expires after {form.minutes} minutes!
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={createCode} disabled={creating} className="btn-primary flex-1">
              {creating ? 'Creating...' : '🎁 Create & Share'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : codes.length === 0 ? (
        <div className="text-center py-10 text-samsung-muted">No gift codes yet. Create one above!</div>
      ) : (
        <div className="space-y-4">
          {codes.map(code => {
            const expired = isExpired(code.expires_at)
            return (
              <div key={code.id} className={`bg-samsung-card border rounded-2xl p-5 ${!code.is_active || expired ? 'opacity-60 border-samsung-border' : 'border-samsung-gold/30'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono font-extrabold text-samsung-gold text-xl tracking-widest">{code.code}</p>
                      <button onClick={() => copyCode(code.code)} className="text-samsung-muted hover:text-white">
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="text-samsung-muted text-xs">{formatDateTime(code.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">{formatUGX(code.amount)}</p>
                    <p className="text-xs text-samsung-muted mt-1">{code.current_uses}/{code.max_uses} used</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-samsung-dark rounded-xl p-3">
                    <p className="text-xs text-samsung-muted">Status</p>
                    <p className={`font-semibold text-sm ${!code.is_active || expired ? 'text-red-400' : 'text-green-400'}`}>
                      {!code.is_active ? 'DEACTIVATED' : expired ? 'EXPIRED' : 'ACTIVE'}
                    </p>
                  </div>
                  <div className="bg-samsung-dark rounded-xl p-3">
                    <p className="text-xs text-samsung-muted">Expires</p>
                    <p className={`font-semibold text-sm ${expired ? 'text-red-400' : 'text-yellow-400'}`}>
                      {expired ? 'EXPIRED' : timeLeft(code.expires_at)}
                    </p>
                  </div>
                </div>

                {code.is_active && !expired && (
                  <div className="flex gap-2">
                    <button onClick={() => shareOnWhatsApp(code)}
                      className="flex-1 bg-green-600/20 border border-green-500/30 text-green-400 text-xs py-2 rounded-lg font-semibold hover:bg-green-600/30">
                      📱 Share WhatsApp
                    </button>
                    <button onClick={() => deactivate(code.id)}
                      className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg hover:bg-red-500/30">
                      Deactivate
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
