import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill all fields'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message || 'Login failed')
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
        <button onClick={() => navigate('/')} className="text-samsung-muted hover:text-white transition-colors">
          ←
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-samsung-blue rounded-lg flex items-center justify-center font-bold text-xs">S</div>
          <span className="font-bold">Samsung Earnings</span>
        </div>
      </div>

      <div className="flex-1 px-5 pt-4">
        <h1 className="text-2xl font-extrabold mb-1">Welcome back!</h1>
        <p className="text-samsung-muted text-sm mb-8">Sign in to your account</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
            <input
              type="email"
              className="samsung-input"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="samsung-input pr-12"
                placeholder="Enter password"
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
            {loading ? 'Signing In...' : 'Sign In'}
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

        {/* Admin hint */}
        <div className="mt-8 p-4 bg-samsung-card border border-samsung-border rounded-xl">
          <p className="text-xs text-samsung-muted text-center">
            Admin? Login with your admin email and go to <span className="text-samsung-accent">/admin</span>
          </p>
        </div>
      </div>
    </div>
  )
}
