import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatUGX, formatDate } from '@/lib/utils'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import QRModal from '@/components/features/QRModal'
import { Users, Share2, QrCode, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  username: string
  email: string
  phone?: string
  created_at: string
  total_earnings: number
  wallet_balance: number
  level: number
}

export default function MyTeamPage() {
  const { profile } = useAuth()
  const [l1, setL1] = useState<TeamMember[]>([])
  const [l2, setL2] = useState<TeamMember[]>([])
  const [l3, setL3] = useState<TeamMember[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(true)

  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code || ''}`

  useEffect(() => {
    if (profile) loadTeam()
  }, [profile])

  const loadTeam = async () => {
    setLoading(true)
    // L1 - direct referrals
    const { data: l1Data } = await supabase
      .from('user_profiles')
      .select('id, username, email, phone, created_at, total_earnings, wallet_balance')
      .eq('referrer_id', profile!.id)
    const l1Members = (l1Data || []).map(m => ({ ...m, level: 1 }))
    setL1(l1Members)

    // L2
    if (l1Members.length > 0) {
      const l1Ids = l1Members.map(m => m.id)
      const { data: l2Data } = await supabase
        .from('user_profiles')
        .select('id, username, email, phone, created_at, total_earnings, wallet_balance')
        .in('referrer_id', l1Ids)
      const l2Members = (l2Data || []).map(m => ({ ...m, level: 2 }))
      setL2(l2Members)

      // L3
      if (l2Members.length > 0) {
        const l2Ids = l2Members.map(m => m.id)
        const { data: l3Data } = await supabase
          .from('user_profiles')
          .select('id, username, email, phone, created_at, total_earnings, wallet_balance')
          .in('referrer_id', l2Ids)
        setL3((l3Data || []).map(m => ({ ...m, level: 3 })))
      }
    }

    // Commissions
    const { data: comData } = await supabase
      .from('referral_commissions')
      .select('*, from_user:from_user_id(username)')
      .eq('earner_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setCommissions(comData || [])
    setLoading(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied!')
  }

  const shareWhatsApp = () => {
    const text = `🎉 Join Samsung Earnings Platform!\n\n📱 Earn daily income with Samsung Galaxy investments\n🎁 Get 7,000 UGX FREE registration bonus!\n💰 Minimum invest: 15,000 UGX\n\nJoin via my link: ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const MemberRow = ({ m }: { m: TeamMember }) => (
    <div className="bg-samsung-card border border-samsung-border rounded-xl p-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-samsung-blue/20 rounded-full flex items-center justify-center font-bold text-samsung-accent">
          {m.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm">{m.username}</p>
          <p className="text-samsung-muted text-xs">{m.phone || m.email} • {formatDate(m.created_at)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-samsung-muted">Earned</p>
        <p className="text-green-400 font-bold text-xs">{formatUGX(m.total_earnings)}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-samsung-dark page-with-nav">
      <AppHeader title="My Team" />

      <div className="px-5 py-4 animate-fade-in">
        {/* Referral Card */}
        <div className="bg-samsung-gradient rounded-2xl p-5 mb-5 border border-samsung-blue/30">
          <p className="text-blue-200 text-xs mb-1">Your Referral Code</p>
          <p className="text-3xl font-extrabold tracking-widest text-samsung-gold mb-4">
            {profile?.referral_code || '--------'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={copyLink}
              className="flex flex-col items-center gap-1 bg-white/10 rounded-xl p-2.5 hover:bg-white/20 transition-colors">
              <Copy size={18} />
              <span className="text-xs">Copy Link</span>
            </button>
            <button onClick={shareWhatsApp}
              className="flex flex-col items-center gap-1 bg-green-500/20 rounded-xl p-2.5 hover:bg-green-500/30 transition-colors text-green-400">
              <Share2 size={18} />
              <span className="text-xs">WhatsApp</span>
            </button>
            <button onClick={() => setShowQR(true)}
              className="flex flex-col items-center gap-1 bg-white/10 rounded-xl p-2.5 hover:bg-white/20 transition-colors">
              <QrCode size={18} />
              <span className="text-xs">QR Code</span>
            </button>
          </div>
        </div>

        {/* Commission rates */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { level: 'L1', pct: '30%', count: l1.length, color: 'text-samsung-gold' },
            { level: 'L2', pct: '2%', count: l2.length, color: 'text-samsung-accent' },
            { level: 'L3', pct: '1%', count: l3.length, color: 'text-purple-400' },
          ].map(({ level, pct, count, color }) => (
            <div key={level} className="bg-samsung-card border border-samsung-border rounded-xl p-3 text-center">
              <p className={`text-xl font-extrabold ${color}`}>{count}</p>
              <p className="text-xs text-samsung-muted mt-0.5">{level} Members</p>
              <p className={`text-xs font-bold ${color} mt-1`}>{pct} commission</p>
            </div>
          ))}
        </div>

        {/* Referral earnings */}
        <div className="bg-samsung-card border border-samsung-border rounded-xl p-4 mb-5">
          <p className="text-samsung-muted text-xs mb-1">Total Referral Earnings</p>
          <p className="text-2xl font-extrabold text-samsung-gold">{formatUGX(profile?.referral_earnings || 0)}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* L1 */}
            {l1.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-samsung-gold" />
                  <h3 className="font-bold">Level 1 – Direct ({l1.length})</h3>
                  <span className="text-xs text-samsung-gold">30% commission</span>
                </div>
                <div className="space-y-2">{l1.map(m => <MemberRow key={m.id} m={m} />)}</div>
              </div>
            )}

            {/* L2 */}
            {l2.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-samsung-accent" />
                  <h3 className="font-bold">Level 2 ({l2.length})</h3>
                  <span className="text-xs text-samsung-accent">2% commission</span>
                </div>
                <div className="space-y-2">{l2.map(m => <MemberRow key={m.id} m={m} />)}</div>
              </div>
            )}

            {/* L3 */}
            {l3.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-purple-400" />
                  <h3 className="font-bold">Level 3 ({l3.length})</h3>
                  <span className="text-xs text-purple-400">1% commission</span>
                </div>
                <div className="space-y-2">{l3.map(m => <MemberRow key={m.id} m={m} />)}</div>
              </div>
            )}

            {l1.length === 0 && l2.length === 0 && l3.length === 0 && (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">👥</p>
                <p className="font-semibold mb-2">No team members yet</p>
                <p className="text-samsung-muted text-sm mb-4">Share your referral link and earn 30% commission when they invest!</p>
                <button onClick={shareWhatsApp}
                  className="btn-primary max-w-xs mx-auto py-3 flex items-center justify-center gap-2">
                  <Share2 size={16} /> Share on WhatsApp
                </button>
              </div>
            )}

            {/* Commission history */}
            {commissions.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold mb-3">Commission History</h3>
                <div className="space-y-2">
                  {commissions.map(c => (
                    <div key={c.id} className="bg-samsung-card border border-samsung-border rounded-xl p-3 flex justify-between">
                      <div>
                        <p className="text-sm font-medium">From: {c.from_user?.username || 'User'}</p>
                        <p className="text-xs text-samsung-muted">Level {c.level} • {formatDate(c.created_at)}</p>
                      </div>
                      <p className="text-green-400 font-bold">+{formatUGX(c.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showQR && <QRModal url={referralLink} onClose={() => setShowQR(false)} />}
      <BottomNav />
    </div>
  )
}
