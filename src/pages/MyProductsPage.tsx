import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { UserPackage } from '@/types'
import { formatUGX, formatDate } from '@/lib/utils'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import { ArrowLeft } from 'lucide-react'

export default function MyProductsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [packages, setPackages] = useState<UserPackage[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadPackages()
  }, [profile])

  const loadPackages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_packages')
      .select('*, package:packages(*)')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })
    setPackages(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? packages : packages.filter(p => p.status === filter)

  const statusLabel: Record<string, string> = {
    pending: '⏳ Pending',
    active: '✅ Active',
    expired: '⏰ Expired',
    rejected: '❌ Rejected',
  }

  return (
    <div className="min-h-screen bg-samsung-dark page-with-nav">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-samsung-border">
        <button onClick={() => navigate(-1)} className="text-samsung-muted hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">My Products</h1>
      </div>

      <div className="px-5 py-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {(['pending','active','expired'] as const).map(s => (
            <div key={s} className="bg-samsung-card border border-samsung-border rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-samsung-accent">
                {packages.filter(p => p.status === s).length}
              </p>
              <p className="text-samsung-muted text-xs capitalize mt-1">{s}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {['all','pending','active','expired','rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f ? 'bg-samsung-blue text-white' : 'bg-samsung-card border border-samsung-border text-samsung-muted'
              }`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-samsung-muted">No packages found</p>
            <button onClick={() => navigate('/products')} className="btn-primary mt-4 py-2.5 text-sm max-w-xs mx-auto">
              Browse Packages
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(pkg => {
              const expiry = pkg.expiry_date ? new Date(pkg.expiry_date) : null
              const daysLeft = expiry ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000)) : 0
              const totalDays = pkg.package?.duration_days || 1
              const progress = expiry && pkg.buy_date
                ? Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)
                : 0

              return (
                <div key={pkg.id} className="bg-samsung-card border border-samsung-border rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold">{pkg.package?.name}</p>
                      <p className="text-samsung-muted text-xs">{pkg.package?.group_name}</p>
                    </div>
                    <span className={`status-badge ${
                      pkg.status === 'active' ? 'badge-active' :
                      pkg.status === 'pending' ? 'badge-pending' :
                      pkg.status === 'expired' ? 'badge-expired' : 'badge-rejected'
                    }`}>{pkg.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-samsung-dark rounded-xl p-3">
                      <p className="text-xs text-samsung-muted mb-1">Invested</p>
                      <p className="font-bold text-samsung-accent">{formatUGX(pkg.amount_paid)}</p>
                    </div>
                    <div className="bg-samsung-dark rounded-xl p-3">
                      <p className="text-xs text-samsung-muted mb-1">Daily Income</p>
                      <p className="font-bold text-green-400">+{formatUGX(pkg.package?.daily_income || 0)}</p>
                    </div>
                  </div>

                  {pkg.status === 'active' && (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-samsung-dark rounded-xl p-3">
                          <p className="text-xs text-samsung-muted mb-1">Buy Date</p>
                          <p className="font-semibold text-xs">{pkg.buy_date ? formatDate(pkg.buy_date) : '-'}</p>
                        </div>
                        <div className="bg-samsung-dark rounded-xl p-3">
                          <p className="text-xs text-samsung-muted mb-1">Expiry Date</p>
                          <p className="font-semibold text-xs">{pkg.expiry_date ? formatDate(pkg.expiry_date) : '-'}</p>
                        </div>
                      </div>
                      <div className="bg-samsung-dark rounded-xl p-3 mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs text-samsung-muted">Days Remaining</p>
                          <p className="font-bold text-samsung-accent text-sm">{daysLeft} / {totalDays} days</p>
                        </div>
                        <div className="bg-samsung-border rounded-full h-2">
                          <div className="bg-gradient-to-r from-samsung-blue to-samsung-accent rounded-full h-2 transition-all"
                            style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-3">
                        <p className="text-xs text-green-400">Total Earned from this package: <strong>{formatUGX(pkg.total_earned || 0)}</strong></p>
                      </div>
                    </>
                  )}

                  {pkg.status === 'pending' && (
                    <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-3 mt-2">
                      <p className="text-xs text-yellow-400">⏳ Waiting for admin approval. Your balance has been deducted.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
