import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Eye, EyeOff, Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { user, profile, loading, refreshProfile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user && profile?.is_admin) {
      navigate('/admin', { replace: true })
    }
  }, [user, profile, loading])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill all fields'); return }
    setSubmitting(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Login failed: ' + error.message)
      setSubmitting(false)
      return
    }

    if (data.user) {
      await refreshProfile()
      // Fetch profile directly to check admin status
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single()

      if (!prof?.is_admin) {
        await supabase.auth.signOut()
        toast.error('Access denied. This login is for administrators only.')
        setSubmitting(false)
        return
      }

      toast.success('Welcome, Admin!')
      navigate('/admin', { replace: true })
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-samsung-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-samsung-dark flex flex-col items-center justify-center px-5">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-samsung-gradient rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-samsung-blue/40">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Admin Portal</h1>
          <p className="text-samsung-muted text-sm mt-1">Samsung Earnings Platform</p>
        </div>

        <div className="bg-samsung-card border border-samsung-border rounded-2xl p-6">
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 mb-5 flex items-start gap-2">
            <span className="text-red-400 mt-0.5">⚠️</span>
            <p className="text-red-300 text-xs leading-relaxed">
              This area is restricted to authorized administrators only. Unauthorized access attempts are logged.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Admin Email</label>
              <input
                type="email"
                className="samsung-input"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="samsung-input pr-12"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-samsung-muted hover:text-white">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Access Admin Panel
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-samsung-muted text-xs mt-5">
          Not an admin?{' '}
          <button onClick={() => navigate('/login')} className="text-samsung-accent hover:underline">
            Go to user login
          </button>
        </p>
      </div>
    </div>
  )
}
