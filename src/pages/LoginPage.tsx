import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Eye, EyeOff, Phone } from 'lucide-react'

// Convert phone number to internal email for Supabase auth
function phoneToEmail(phone: string) {
  const clean = phone.replace(/\D/g, '')
  return `${clean}@samsungearnings.com`
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !password) { toast.error('Please fill all fields'); return }
    // Normalize: strip all non-digit characters
    const normalizedPhone = phone.trim().replace(/[^0-9]/g, '')
    if (normalizedPhone.length < 9) {
      toast.error('Enter a valid phone number (at least 9 digits)')
      return
    }
    setLoading(true)
    const email = phoneToEmail(normalizedPhone)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('valid phone number or password')
      setLoading(false)
      return
    }
    if (data.user) {
      await refreshProfile()
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-samsung-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5">
        <button onClick={() => navigate('/')} className="text-samsung-muted hover:text-white transition-colors text-lg">
          ←
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-samsung-blue rounded-lg flex items-center justify-center font-bold text-xs">S</div>
          <span className="font-bold">Samsung Earnings</span>
        </div>
      </div>

      <div className="flex-1 px-5 pt-4 pb-8">
        <h1 className="text-2xl font-extrabold mb-1">Welcome back!</h1>
        <p className="text-samsung-muted text-sm mb-8">Sign in with your phone number</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-samsung-muted" />
              <input
                type="tel"
                className="samsung-input pl-9"
                placeholder="07XXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                maxLength={10}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="samsung-input pr-12"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-samsung-muted hover:text-white">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Signing In...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-samsung-muted text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-samsung-accent font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>

        {/* Admin login link */}
        <div className="mt-8 p-4 bg-samsung-card border border-samsung-border rounded-xl text-center">
          <p className="text-xs text-samsung-muted">
            Administrator?{' '}
            <button onClick={() => navigate('/admin/login')} className="text-red-400 hover:underline font-semibold">
              Admin Panel Login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
