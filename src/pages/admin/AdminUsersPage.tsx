import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatUGX, formatDate } from '@/lib/utils'
import { UserProfile, TeamMember } from '@/types'
import { toast } from 'sonner'
import { RefreshCw, Search, ChevronDown } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [teamData, setTeamData] = useState<{ l1: TeamMember[], l2: TeamMember[], l3: TeamMember[] }>({ l1: [], l2: [], l3: [] })

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const loadUserTeam = async (userId: string) => {
    const { data: l1Data } = await supabase.from('user_profiles').select('id, username, email, phone, created_at, total_earnings, wallet_balance, referral_code, referrer_id').eq('referrer_id', userId)
    const l1 = (l1Data || []).map(m => ({ ...m, level: 1 })) as TeamMember[]

    let l2: TeamMember[] = []
    let l3: TeamMember[] = []
    if (l1.length > 0) {
      const { data: l2Data } = await supabase.from('user_profiles').select('id, username, email, phone, created_at, total_earnings, wallet_balance, referral_code, referrer_id').in('referrer_id', l1.map(m => m.id))
      l2 = (l2Data || []).map(m => ({ ...m, level: 2 })) as TeamMember[]
      if (l2.length > 0) {
        const { data: l3Data } = await supabase.from('user_profiles').select('id, username, email, phone, created_at, total_earnings, wallet_balance, referral_code, referrer_id').in('referrer_id', l2.map(m => m.id))
        l3 = (l3Data || []).map(m => ({ ...m, level: 3 })) as TeamMember[]
      }
    }
    setTeamData({ l1, l2, l3 })
  }

  const toggleAdmin = async (user: UserProfile) => {
    if (!confirm(`${user.is_admin ? 'Remove' : 'Grant'} admin access for ${user.username}?`)) return
    await supabase.from('user_profiles').update({ is_admin: !user.is_admin }).eq('id', user.id)
    toast.success('Admin status updated')
    loadUsers()
  }

  const adjustBalance = async (user: UserProfile) => {
    const amtStr = prompt(`Adjust balance for ${user.username}\nCurrent: ${formatUGX(user.wallet_balance)}\n\nEnter amount (use negative to deduct):`)
    if (!amtStr) return
    const amt = Number(amtStr)
    if (isNaN(amt)) { toast.error('Invalid amount'); return }
    const newBalance = (user.wallet_balance || 0) + amt
    if (newBalance < 0) { toast.error('Balance cannot be negative'); return }
    await supabase.from('user_profiles').update({ wallet_balance: newBalance }).eq('id', user.id)
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: amt > 0 ? '💰 Balance Added' : '💸 Balance Adjusted',
      message: `Admin ${amt > 0 ? 'added' : 'deducted'} ${formatUGX(Math.abs(amt))} from your balance. New balance: ${formatUGX(newBalance)}`,
      type: 'info',
    })
    toast.success('Balance updated')
    loadUsers()
  }

  const filtered = users.filter(u =>
    search === '' ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.referral_code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold">Users ({users.length})</h1>
        <button onClick={loadUsers} className="text-samsung-muted hover:text-white p-2"><RefreshCw size={18} /></button>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-samsung-muted" />
        <input className="samsung-input pl-9" placeholder="Search by name, email, phone, referral code..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <div key={user.id} className="bg-samsung-card border border-samsung-border rounded-2xl overflow-hidden">
              <button onClick={() => {
                if (selectedUser?.id === user.id) { setSelectedUser(null) } else {
                  setSelectedUser(user)
                  loadUserTeam(user.id)
                }
              }} className="w-full p-4 flex items-center justify-between text-left hover:bg-samsung-dark/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-samsung-blue/20 rounded-full flex items-center justify-center font-bold text-samsung-accent">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{user.username}</p>
                      {user.is_admin && <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                    </div>
                    <p className="text-samsung-muted text-xs">{user.phone || user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-samsung-accent font-bold text-sm">{formatUGX(user.wallet_balance || 0)}</p>
                    <p className="text-samsung-muted text-xs">{formatDate(user.created_at)}</p>
                  </div>
                  <ChevronDown size={16} className={`text-samsung-muted transition-transform ${selectedUser?.id === user.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {selectedUser?.id === user.id && (
                <div className="border-t border-samsung-border p-4 bg-samsung-dark/30 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-samsung-dark rounded-xl p-3">
                      <p className="text-xs text-samsung-muted">Referral Code</p>
                      <p className="font-mono font-bold text-samsung-gold">{user.referral_code}</p>
                    </div>
                    <div className="bg-samsung-dark rounded-xl p-3">
                      <p className="text-xs text-samsung-muted">Total Earnings</p>
                      <p className="font-bold text-green-400">{formatUGX(user.total_earnings || 0)}</p>
                    </div>
                    <div className="bg-samsung-dark rounded-xl p-3">
                      <p className="text-xs text-samsung-muted">Referral Earnings</p>
                      <p className="font-bold text-purple-400">{formatUGX(user.referral_earnings || 0)}</p>
                    </div>
                    <div className="bg-samsung-dark rounded-xl p-3">
                      <p className="text-xs text-samsung-muted">Total Withdrawn</p>
                      <p className="font-bold text-orange-400">{formatUGX(user.total_withdrawn || 0)}</p>
                    </div>
                  </div>

                  {/* Team view */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-2">Team Structure</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'L1', count: teamData.l1.length, color: 'text-samsung-gold' },
                        { label: 'L2', count: teamData.l2.length, color: 'text-samsung-accent' },
                        { label: 'L3', count: teamData.l3.length, color: 'text-purple-400' },
                      ].map(({ label, count, color }) => (
                        <div key={label} className="bg-samsung-dark rounded-xl p-2 text-center">
                          <p className={`font-bold ${color}`}>{count}</p>
                          <p className="text-xs text-samsung-muted">{label}</p>
                        </div>
                      ))}
                    </div>
                    {[...teamData.l1, ...teamData.l2, ...teamData.l3].length > 0 && (
                      <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                        {teamData.l1.map(m => <p key={m.id} className="text-xs text-samsung-muted">L1 • {m.username} ({m.phone || m.email})</p>)}
                        {teamData.l2.map(m => <p key={m.id} className="text-xs text-samsung-muted">L2 • {m.username} ({m.phone || m.email})</p>)}
                        {teamData.l3.map(m => <p key={m.id} className="text-xs text-samsung-muted">L3 • {m.username} ({m.phone || m.email})</p>)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => adjustBalance(user)}
                      className="bg-samsung-blue/20 border border-samsung-blue/30 text-samsung-accent text-xs px-3 py-2 rounded-lg hover:bg-samsung-blue/30">
                      💰 Adjust Balance
                    </button>
                    <button onClick={() => toggleAdmin(user)}
                      className={`text-xs px-3 py-2 rounded-lg border ${user.is_admin ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-samsung-card border-samsung-border text-samsung-muted'}`}>
                      {user.is_admin ? '🔒 Remove Admin' : '🔑 Make Admin'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
