import { useNavigate } from 'react-router-dom'
import { formatUGX } from '@/lib/utils'

const STATS = [
  { label: 'Active Users', value: '12,450+' },
  { label: 'Daily Payouts', value: formatUGX(85000000) },
  { label: 'Total Withdrawn', value: formatUGX(2100000000) },
]

const FEATURES = [
  { icon: '📱', title: 'Samsung Packages', desc: 'Invest in Galaxy phones from 15,000 UGX and earn daily.' },
  { icon: '💸', title: '30% Referral Bonus', desc: 'Earn 30% when your friends invest. Plus 2% and 1% on deeper levels.' },
  { icon: '🏧', title: 'MTN & Airtel Payout', desc: 'Withdraw directly to your mobile money. 24/7 unlimited.' },
  { icon: '🎁', title: 'Daily Check-In', desc: 'Claim 100 UGX every day just by checking in. Plus gift codes.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-samsung-dark text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-samsung-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-samsung-blue rounded-lg flex items-center justify-center font-bold text-sm">S</div>
          <span className="font-bold text-lg">Samsung Earnings</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm text-samsung-accent border border-samsung-accent rounded-lg hover:bg-samsung-accent/10 transition-colors">
            Login
          </button>
          <button onClick={() => navigate('/register')} className="px-4 py-2 text-sm font-semibold bg-samsung-blue rounded-lg hover:bg-samsung-blue-light transition-colors">
            Register
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pt-10 pb-8 text-center">
        <div className="inline-block bg-samsung-blue/20 text-samsung-accent text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-samsung-blue/30">
          Uganda's #1 Investment Platform ✨
        </div>
        <h1 className="text-3xl font-extrabold leading-tight mb-3">
          Earn Daily Income with<br />
          <span className="text-samsung-accent">Samsung Investments</span>
        </h1>
        <p className="text-samsung-muted text-sm leading-relaxed mb-6 max-w-sm mx-auto">
          Invest in Samsung Galaxy phones from 15,000 UGX and earn daily returns. Get 7,000 UGX registration bonus instantly!
        </p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button onClick={() => navigate('/register')} className="btn-primary animate-pulse-glow">
            🚀 Start Earning – Join Free
          </button>
          <button onClick={() => navigate('/login')} className="btn-secondary">
            Already have an account? Login
          </button>
        </div>
      </section>

      {/* Hero Image */}
      <section className="px-5 mb-8">
        <div className="rounded-2xl overflow-hidden relative h-48 bg-samsung-card border border-samsung-border">
          <img
            src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop"
            alt="Samsung phones"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-samsung-dark via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center px-6">
            <div>
              <p className="text-xs text-samsung-accent font-semibold mb-1">REGISTRATION BONUS</p>
              <p className="text-2xl font-extrabold">{formatUGX(7000)}</p>
              <p className="text-xs text-samsung-muted">Added on signup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="bg-samsung-card border border-samsung-border rounded-xl p-3 text-center">
              <p className="text-samsung-accent font-bold text-sm">{s.value}</p>
              <p className="text-samsung-muted text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 mb-8">
        <h2 className="text-lg font-bold mb-4">Why Samsung Earnings?</h2>
        <div className="grid grid-cols-1 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-samsung-card border border-samsung-border rounded-xl p-4 flex gap-4 items-start">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="font-semibold text-sm mb-1">{f.title}</p>
                <p className="text-samsung-muted text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Packages preview */}
      <section className="px-5 mb-10">
        <h2 className="text-lg font-bold mb-4">Investment Packages</h2>
        <div className="space-y-3">
          {[
            { name: 'Galaxy A05', price: 15000, daily: 3000, duration: '60 Days' },
            { name: 'Galaxy S24', price: 500000, daily: 160000, duration: '210 Days' },
            { name: 'Galaxy Z Fold6 VIP', price: 2000000, daily: 8805000, duration: '210 Days' },
          ].map((pkg) => (
            <div key={pkg.name} className="bg-samsung-card border border-samsung-border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{pkg.name}</p>
                <p className="text-samsung-muted text-xs mt-0.5">Invest: {formatUGX(pkg.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold text-sm">+{formatUGX(pkg.daily)}/day</p>
                <p className="text-samsung-muted text-xs">{pkg.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Telegram links */}
      <section className="px-5 mb-8">
        <div className="bg-samsung-card border border-samsung-border rounded-xl p-4">
          <h3 className="font-semibold mb-3">💬 Join Our Community</h3>
          <div className="space-y-2">
            <a href="https://t.me/+adk1usHyKF4yYzQ0" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-samsung-accent text-sm hover:underline">
              📣 Official Support Channel
            </a>
            <a href="https://t.me/+kH7QuzE6dp0xZmVk" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-samsung-accent text-sm hover:underline">
              👥 Community Group Chat
            </a>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="px-5 pb-10">
        <button onClick={() => navigate('/register')} className="btn-primary text-base py-4">
          🎁 Claim Your 7,000 UGX Bonus – Register Now
        </button>
      </section>
    </div>
  )
}
