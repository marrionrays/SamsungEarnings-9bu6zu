import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { generateReferralCode } from '@/lib/utils'
import { toast } from 'sonner'
import { Eye, EyeOff, Phone } from 'lucide-react'

// Convert phone number to internal email for Supabase auth
function phoneToEmail(phone: string) {
  const clean = phone.replace(/\D/g, '')
  return `${clean}@samsungearnings.com`
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref') || ''

  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referral: refCode,
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const { username, phone, password, confirmPassword, referral } = form

    if (!username || !phone || !password) {
      toast.error('Please fill all required fields')
      return
    }
    // Normalize: strip spaces/dashes, convert +256 to 0
    const normalizedPhone = phone.trim().replace(/[\s\-]/g, '').replace(/^\+256/, '0').replace(/^256/, '0')
    if (!normalizedPhone.match(/^0[0-9]{8,9}$/)) {
      toast.error('Enter a valid Ugandan phone number (e.g. 0756406186)')
      return
    }
    form.phone = normalizedPhone
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    const email = phoneToEmail(form.phone)

    // Sign up with generated email + password
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, phone: form.phone },
      },
    })

    if (signUpError) {
      // If user already exists, prompt to login
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
        toast.error('This phone number is already registered. Please login.')
      } else {
        toast.error(signUpError.message)
      }
      setLoading(false)
      return
    }

    if (!signUpData.user) {
      toast.error('Registration failed. Please try again.')
      setLoading(false)
      return
    }

    // Find referrer by referral code
    let referrerId: string | null = null
    if (referral.trim()) {
      const { data: referrerData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('referral_code', referral.trim().toUpperCase())
        .single()
      if (referrerData) referrerId = referrerData.id
    }

    // Generate unique referral code
    let myCode = generateReferralCode()
    for (let i = 0; i < 3; i++) {
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('referral_code', myCode)
        .single()
      if (!existing) break
      myCode = generateReferralCode()
    }

    // Upsert profile with 7000 bonus
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: signUpData.user.id,
        username,
        email,
        phone: form.phone,
        referral_code: myCode,
        referrer_id: referrerId,
        wallet_balance: 7000,
        total_earnings: 7000,
        registration_bonus_added: true,
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Don't block — auth user created, profile may still go through
    }

    // Welcome notification
    await supabase.from('notifications').insert({
      user_id: signUpData.user.id,
      title: '🎉 Welcome Bonus!',
      message: 'You have received 7,000 UGX registration bonus! Recharge and buy a package to start earning daily.',
      type: 'success',
    })

    toast.success('Account created! Welcome to Samsung Earnings 🎉')
    await refreshProfile()
    navigate('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-samsung-dark flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <button onClick={() => navigate('/')} className="text-samsung-muted hover:text-white transition-colors text-lg">
          ←
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-samsung-blue rounded-lg flex items-center justify-center font-bold text-xs">S</div>
          <span className="font-bold">Samsung Earnings</span>
        </div>
      </div>

      <div className="flex-1 px-5 pt-2 pb-8">
        <h1 className="text-2xl font-extrabold mb-1">Create Account</h1>
        <p className="text-samsung-muted text-sm mb-6">
          Register now and get <span className="text-samsung-gold font-bold">7,000 UGX</span> welcome bonus!
        </p>

        {refCode && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3 mb-5 flex items-center gap-2">
            <span>🎁</span>
            <p className="text-green-400 text-sm">Invited by referral code: <strong>{refCode}</strong></p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Full Name *</label>
            <input
              className="samsung-input"
              placeholder="Your full name"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Phone Number *</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-samsung-muted" />
              <input
                type="tel"
                className="samsung-input pl-9"
                placeholder="07XXXXXXXX"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                maxLength={10}
              />
            </div>
            <p className="text-samsung-muted text-xs mt-1">Enter 10-digit Ugandan number (e.g. 0712345678)</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Password *</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="samsung-input pr-12"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-samsung-muted hover:text-white">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="samsung-input pr-12"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-samsung-muted hover:text-white">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Referral */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Referral Code (Optional)</label>
            <input
              className="samsung-input uppercase tracking-widest"
              placeholder="Enter referral code"
              value={form.referral}
              onChange={e => setForm(f => ({ ...f, referral: e.target.value.toUpperCase() }))}
            />
          </div>

          {/* Bonus reminder */}
          <div className="bg-samsung-gold/10 border border-samsung-gold/30 rounded-xl p-3 flex items-start gap-2">
            <span className="text-xl">🎁</span>
            <div>
              <p className="text-samsung-gold font-semibold text-sm">7,000 UGX Welcome Bonus</p>
              <p className="text-samsung-muted text-xs mt-0.5">
                Credited instantly to your wallet. Recharge &amp; buy a package to unlock withdrawals.
              </p>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating Account...
              </span>
            ) : 'Create Account & Get Bonus'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-samsung-muted text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-samsung-accent font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
