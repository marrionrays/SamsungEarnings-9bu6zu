import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatUGX, formatDate, isToday } from '@/lib/utils'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import { CheckIn } from '@/types'
import {
  User, Wallet, LogOut, ChevronRight, Gift,
  Bell, MessageCircle, Star, Shield
} from 'lucide-react'
import { toast } from 'sonner'

export default function MinePage() {
  const navigate = useNavigate()
  const { profile, signOut, refreshProfile } = useAuth()
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [giftCode, setGiftCode] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [totalCheckIns, setTotalCheckIns] = useState(0)

  useEffect(() => {
    if (profile) checkTodayCheckIn()
  }, [profile])

  const checkTodayCheckIn = async () => {
    const { data } = await supabase
      .from('check_ins')
      .select('id, checked_at')
      .eq('user_id', profile!.id)
      .order('checked_at', { ascending: false })
    if (data && data.length > 0) {
      setTotalCheckIns(data.length)
      if (isToday(data[0].checked_at)) setCheckedInToday(true)
    }
  }

  const handleCheckIn = async () => {
    if (checkedInToday) { toast.error('Already checked in today. Come back tomorrow!'); return }
    setCheckInLoading(true)
    const { error } = await supabase.from('check_ins').insert({
      user_id: profile!.id,
      bonus_amount: 100,
    })
    if (error) { toast.error(error.message); setCheckInLoading(false); return }

    await supabase.from('user_profiles').update({
      wallet_balance: (profile!.wallet_balance || 0) + 100,
      total_earnings: (profile!.total_earnings || 0) + 100,
    }).eq('id', profile!.id)

    await supabase.from('notifications').insert({
      user_id: profile!.id,
      title: '✅ Daily Check-In!',
      message: 'You earned 100 UGX from your daily check-in. Come back tomorrow!',
      type: 'success',
    })

    setCheckedInToday(true)
    setTotalCheckIns(prev => prev + 1)
    await refreshProfile()
    toast.success('+100 UGX check-in bonus claimed!')
    setCheckInLoading(false)
  }

  const handleRedeem = async () => {
    if (!giftCode.trim()) { toast.error('Enter a gift code'); return }
    setRedeemLoading(true)

    const { data: code, error } = await supabase
      .from('gift_codes')
      .select('*')
      .eq('code', giftCode.trim().toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !code) { toast.error('Invalid or expired gift code'); setRedeemLoading(false); return }

    // Check expiry
    if (new Date(code.expires_at) < new Date()) {
      toast.error('This gift code has expired (15 minute limit)')
      setRedeemLoading(false)
      return
    }

    // Check max uses
    if (code.current_uses >= code.max_uses) {
      toast.error('This gift code has reached its usage limit')
      setRedeemLoading(false)
      return
    }

    // Check if user already used this code
    const { data: alreadyUsed } = await supabase
      .from('gift_code_redemptions')
      .select('id')
      .eq('user_id', profile!.id)
      .eq('gift_code_id', code.id)
      .single()

    if (alreadyUsed) { toast.error('You already used this gift code'); setRedeemLoading(false); return }

    // Redeem
    await supabase.from('gift_code_redemptions').insert({
      user_id: profile!.id,
      gift_code_id: code.id,
      amount: code.amount,
    })

    await supabase.from('gift_codes').update({ current_uses: code.current_uses + 1 }).eq('id', code.id)

    await supabase.from('user_profiles').update({
      wallet_balance: (profile!.wallet_balance || 0) + code.amount,
      total_earnings: (profile!.total_earnings || 0) + code.amount,
    }).eq('id', profile!.id)

    await supabase.from('notifications').insert({
      user_id: profile!.id,
      title: '🎁 Gift Code Redeemed!',
      message: `You received ${formatUGX(code.amount)} from gift code ${code.code}!`,
      type: 'success',
    })

    await refreshProfile()
    toast.success(`🎁 +${formatUGX(code.amount)} redeemed!`)
    setGiftCode('')
    setRedeemLoading(false)
  }

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return
    await signOut()
    navigate('/login')
  }

  const MENU_ITEMS = [
    { icon: Wallet, label: 'My Wallets', onClick: () => navigate('/wallet'), color: 'text-samsung-accent' },
    { icon: Star, label: 'My Products', onClick: () => navigate('/my-products'), color: 'text-samsung-gold' },
    { icon: Bell, label: 'Notifications', onClick: () => navigate('/notifications'), color: 'text-purple-400' },
    { icon: MessageCircle, label: 'Official Support', onClick: () => window.open('https://t.me/+adk1usHyKF4yYzQ0', '_blank'), color: 'text-blue-400' },
    { icon: MessageCircle, label: 'Community Group', onClick: () => window.open('https://t.me/+kH7QuzE6dp0xZmVk', '_blank'), color: 'text-green-400' },
    ...(profile?.is_admin ? [{ icon: Shield, label: 'Admin Panel', onClick: () => navigate('/admin'), color: 'text-red-400' }] : []),
    { icon: LogOut, label: 'Logout', onClick: handleLogout, color: 'text-red-400' },
  ]

  return (
    <div className="min-h-screen bg-samsung-dark page-with-nav">
      <AppHeader title="My Profile" />

      <div className="px-5 py-4 animate-fade-in">
        {/* Profile card */}
        <div className="bg-samsung-card border border-samsung-border rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-samsung-gradient rounded-2xl flex items-center justify-center text-2xl font-extrabold border border-samsung-blue/30">
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg">{profile?.username}</p>
              <p className="text-samsung-muted text-sm">{profile?.email}</p>
              {profile?.phone && <p className="text-samsung-muted text-xs">{profile.phone}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-samsung-dark rounded-xl p-3 text-center">
              <p className="text-xs text-samsung-muted mb-1">Balance</p>
              <p className="font-bold text-samsung-accent">{formatUGX(profile?.wallet_balance || 0)}</p>
            </div>
            <div className="bg-samsung-dark rounded-xl p-3 text-center">
              <p className="text-xs text-samsung-muted mb-1">Total Earned</p>
              <p className="font-bold text-green-400">{formatUGX(profile?.total_earnings || 0)}</p>
            </div>
          </div>
        </div>

        {/* Check-in */}
        <div className={`rounded-2xl p-5 mb-5 border ${checkedInToday ? 'bg-green-900/20 border-green-500/30' : 'bg-samsung-card border-samsung-border'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold">Daily Check-In</h3>
              <p className="text-samsung-muted text-xs">Check in every day to earn 100 UGX</p>
            </div>
            <div className="text-right">
              <p className="text-samsung-gold font-bold text-lg">+100 UGX</p>
              <p className="text-samsung-muted text-xs">{totalCheckIns} days streak</p>
            </div>
          </div>
          <button onClick={handleCheckIn} disabled={checkedInToday || checkInLoading}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
              checkedInToday
                ? 'bg-green-900/30 text-green-400 border border-green-500/30 cursor-not-allowed'
                : 'bg-samsung-gold text-black hover:opacity-90'
            }`}>
            {checkInLoading ? 'Claiming...' : checkedInToday ? '✅ Checked In Today' : '🎁 Claim Daily Bonus'}
          </button>
          {checkedInToday && <p className="text-green-400 text-xs text-center mt-2">Come back tomorrow for another 100 UGX!</p>}
        </div>

        {/* Gift code */}
        <div className="bg-samsung-card border border-samsung-border rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={18} className="text-samsung-gold" />
            <h3 className="font-bold">Redeem Gift Code</h3>
          </div>
          <p className="text-samsung-muted text-xs mb-3">Enter codes shared on our Telegram (valid for 15 minutes only!)</p>
          <div className="flex gap-2">
            <input className="samsung-input flex-1 uppercase tracking-widest" placeholder="ENTER CODE"
              value={giftCode} onChange={e => setGiftCode(e.target.value.toUpperCase())} />
            <button onClick={handleRedeem} disabled={redeemLoading}
              className="bg-samsung-gold text-black font-bold px-4 rounded-xl text-sm hover:opacity-90 disabled:opacity-50">
              {redeemLoading ? '...' : 'Redeem'}
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <a href="https://t.me/+adk1usHyKF4yYzQ0" target="_blank" rel="noopener noreferrer"
              className="text-xs text-samsung-accent hover:underline flex-1">📣 Get codes from Telegram</a>
          </div>
        </div>

        {/* Referral code */}
        <div className="bg-samsung-card border border-samsung-border rounded-xl p-4 mb-5">
          <p className="text-samsung-muted text-xs mb-1">Your Referral Code</p>
          <p className="font-bold text-samsung-gold tracking-widest text-lg">{profile?.referral_code}</p>
          <p className="text-xs text-samsung-muted mt-1">Share this code and earn 30% commission!</p>
        </div>

        {/* Menu */}
        <div className="bg-samsung-card border border-samsung-border rounded-2xl overflow-hidden">
          {MENU_ITEMS.map(({ icon: Icon, label, onClick, color }, i) => (
            <button key={label} onClick={onClick}
              className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-samsung-dark transition-colors text-left ${i > 0 ? 'border-t border-samsung-border' : ''}`}>
              <Icon size={18} className={color} />
              <span className="flex-1 font-medium text-sm">{label}</span>
              <ChevronRight size={16} className="text-samsung-muted" />
            </button>
          ))}
        </div>

        <p className="text-center text-samsung-muted text-xs mt-6">
          Samsung Earnings Platform v1.0<br />
          Member since {profile?.created_at ? formatDate(profile.created_at) : '-'}
        </p>
      </div>
      <BottomNav />
    </div>
  )
}
