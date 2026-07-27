import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { generateReferralCode } from '@/lib/utils'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

type Step = 'form' | 'otp'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref') || ''

  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    referral: refCode,
  })
  const [otp, setOtp] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const { username, email, phone, password, referral } = form
    if (!username || !email || !phone || !password) {
      toast.error('Please fill all fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (!phone.match(/^0[0-9]{9}$/)) {
      toast.error('Phone must be 10 digits starting with 0 (e.g. 0712345678)')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('OTP sent to ' + email)
    setStep('otp')
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 4) {
      toast.error('Enter the 4-digit OTP')
      return
    }
    setLoading(true)
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otp,
      type: 'email',
    })
    if (verifyError || !verifyData.user) {
      toast.error(verifyError?.message || 'Invalid OTP')
      setLoading(false)
      return
    }

    // Update password
    const { error: pwdError } = await supabase.auth.updateUser({
      password: form.password,
      data: { username: form.username },
    })
    if (pwdError) {
      toast.error(pwdError.message)
      setLoading(false)
      return
    }

    // Find referrer by referral code
    let referrerId: string | null = null
    if (form.referral) {
      const { data: referrerData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('referral_code', form.referral.toUpperCase())
        .single()
      if (referrerData) referrerId = referrerData.id
    }

    // Generate unique referral code
    let myCode = generateReferralCode()
    // Check uniqueness (retry if collision)
    for (let i = 0; i < 3; i++) {
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('referral_code', myCode)
        .single()
      if (!existing) break
      myCode = generateReferralCode()
    }

    // Upsert user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: verifyData.user.id,
        username: form.username,
        email: form.email,
        phone: form.phone,
        referral_code: myCode,
        referrer_id: referrerId,
        wallet_balance: 7000,
        total_earnings: 7000,
        registration_bonus_added: true,
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      toast.error('Failed to setup profile: ' + profileError.message)
      setLoading(false)
      return
    }

    // Add welcome notification
    await supabase.from('notifications').insert({
      user_id: verifyData.user.id,
      title: '🎉 Welcome Bonus!',
      message: 'You have received 7,000 UGX registration bonus. Recharge and buy a package to start earning!',
      type: 'success',
    })

    toast.success('Account created! Welcome to Samsung Earnings 🎉')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-samsung-dark flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <button onClick={() => step === 'otp' ? setStep('form') : navigate('/')}
          className="text-samsung-muted hover:text-white transition-colors text-lg">
          ←
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-samsung-blue rounded-lg flex items-center justify-center font-bold text-xs">S</div>
          <span className="font-bold">Samsung Earnings</span>
        </div>
      </div>

      <div className="flex-1 px-5 pt-2">
        {step === 'form' ? (
          <>
            <h1 className="text-2xl font-extrabold mb-1">Create Account</h1>
            <p className="text-samsung-muted text-sm mb-6">Get 7,000 UGX bonus on signup!</p>

            {refCode && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
                <span>🎁</span>
                <p className="text-green-400 text-sm">Invited by referral code: <strong>{refCode}</strong></p>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Username</label>
                <input className="samsung-input" placeholder="Your name" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                <input type="email" className="samsung-input" placeholder="your@email.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Phone Number</label>
                <input type="tel" className="samsung-input" placeholder="07XXXXXXXX" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} className="samsung-input pr-12"
                    placeholder="Min 6 characters" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-samsung-muted hover:text-white">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Referral Code (Optional)</label>
                <input className="samsung-input" placeholder="8-character code" value={form.referral}
                  onChange={e => setForm(f => ({ ...f, referral: e.target.value }))} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold mb-1">Verify Email</h1>
            <p className="text-samsung-muted text-sm mb-6">Enter the 4-digit code sent to<br /><strong className="text-white">{form.email}</strong></p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">OTP Code (4 digits)</label>
                <input className="samsung-input text-center text-2xl tracking-widest" placeholder="0000"
                  maxLength={4} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
              <button type="button" onClick={() => setStep('form')} className="btn-secondary">
                ← Back
              </button>
            </form>
          </>
        )}

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
