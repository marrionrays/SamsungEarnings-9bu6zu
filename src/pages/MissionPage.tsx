import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatUGX } from '@/lib/utils'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import { ArrowLeft, Users, ShoppingBag, Trophy } from 'lucide-react'
import { toast } from 'sonner'

interface MissionTask {
  id: string
  type: 'invite' | 'purchase'
  title: string
  description: string
  target: number
  reward: number
  packageName?: string
}

const INVITE_TASKS: MissionTask[] = [
  { id: 'inv_1', type: 'invite', title: 'Task 1', description: 'Invite 5 Level 1 investors', target: 5, reward: 8000 },
  { id: 'inv_2', type: 'invite', title: 'Task 2', description: 'Invite 15 Level 1 investors', target: 15, reward: 20000 },
  { id: 'inv_3', type: 'invite', title: 'Task 3', description: 'Invite 50 Level 1 investors', target: 50, reward: 50000 },
  { id: 'inv_4', type: 'invite', title: 'Task 4', description: 'Invite 100 Level 1 investors', target: 100, reward: 120000 },
  { id: 'inv_5', type: 'invite', title: 'Task 5', description: 'Invite 200 Level 1 investors', target: 200, reward: 300000 },
]

const PURCHASE_TASKS: MissionTask[] = [
  { id: 'pur_1', type: 'purchase', title: 'Task 1', description: 'Purchase Galaxy A05', target: 1, reward: 100, packageName: 'Galaxy A05' },
  { id: 'pur_2', type: 'purchase', title: 'Task 2', description: 'Purchase Galaxy A15', target: 1, reward: 200, packageName: 'Galaxy A15' },
  { id: 'pur_3', type: 'purchase', title: 'Task 3', description: 'Purchase Galaxy A25', target: 1, reward: 500, packageName: 'Galaxy A25' },
  { id: 'pur_4', type: 'purchase', title: 'Task 4', description: 'Purchase Galaxy A35', target: 1, reward: 1000, packageName: 'Galaxy A35' },
  { id: 'pur_5', type: 'purchase', title: 'Task 5', description: 'Purchase Galaxy A55', target: 1, reward: 2000, packageName: 'Galaxy A55' },
  { id: 'pur_6', type: 'purchase', title: 'Task 6', description: 'Purchase Galaxy S23 FE', target: 1, reward: 4000, packageName: 'Galaxy S23 FE' },
  { id: 'pur_7', type: 'purchase', title: 'Task 7', description: 'Purchase Galaxy S24', target: 1, reward: 8000, packageName: 'Galaxy S24' },
  { id: 'pur_8', type: 'purchase', title: 'Task 8', description: 'Purchase Galaxy S24+', target: 1, reward: 15000, packageName: 'Galaxy S24+' },
  { id: 'pur_9', type: 'purchase', title: 'Task 9', description: 'Purchase Galaxy S24 Ultra', target: 1, reward: 35000, packageName: 'Galaxy S24 Ultra' },
  { id: 'pur_10', type: 'purchase', title: 'Task 10', description: 'Purchase Galaxy Z Flip6', target: 1, reward: 50000, packageName: 'Galaxy Z Flip6' },
  { id: 'pur_11', type: 'purchase', title: 'Task 11', description: 'Purchase Galaxy Z Fold6 VIP', target: 1, reward: 70000, packageName: 'Galaxy Z Fold6 VIP' },
]

export default function MissionPage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'invite' | 'purchase'>('invite')
  const [l1Count, setL1Count] = useState(0)
  const [purchasedPackages, setPurchasedPackages] = useState<string[]>([])
  const [claimedTasks, setClaimedTasks] = useState<string[]>([])
  const [totalRewards, setTotalRewards] = useState(0)
  const [claiming, setClaiming] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      loadStats()
      loadClaimedTasks()
    }
  }, [profile])

  const loadStats = async () => {
    // Count L1 team members who invested
    const { data: l1Members } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('referrer_id', profile!.id)

    const l1Ids = (l1Members || []).map(m => m.id)
    let investorCount = 0
    if (l1Ids.length > 0) {
      const { count } = await supabase
        .from('user_packages')
        .select('user_id', { count: 'exact', head: true })
        .in('user_id', l1Ids)
        .eq('status', 'active')
      investorCount = count || 0
    }
    setL1Count(investorCount)

    // Get active/past packages purchased by user
    const { data: pkgs } = await supabase
      .from('user_packages')
      .select('package:packages(name)')
      .eq('user_id', profile!.id)
      .in('status', ['active', 'expired'])
    const names = (pkgs || []).map((p: any) => p.package?.name).filter(Boolean)
    setPurchasedPackages(names)
  }

  const loadClaimedTasks = async () => {
    // Use gift_code_redemptions table with special IDs to track claimed mission tasks
    // Store in notifications to track claimed tasks using title pattern
    const { data } = await supabase
      .from('notifications')
      .select('title')
      .eq('user_id', profile!.id)
      .like('title', 'MISSION_CLAIMED_%')
    const claimed = (data || []).map(n => n.title.replace('MISSION_CLAIMED_', ''))
    setClaimedTasks(claimed)

    // Calculate total rewards
    const allTasks = [...INVITE_TASKS, ...PURCHASE_TASKS]
    const total = claimed.reduce((sum, id) => {
      const task = allTasks.find(t => t.id === id)
      return sum + (task?.reward || 0)
    }, 0)
    setTotalRewards(total)
  }

  const getInviteProgress = (task: MissionTask) => Math.min(l1Count, task.target)
  const isPurchaseComplete = (task: MissionTask) => purchasedPackages.includes(task.packageName || '')
  const isInviteComplete = (task: MissionTask) => l1Count >= task.target
  const isClaimed = (taskId: string) => claimedTasks.includes(taskId)

  const claimReward = async (task: MissionTask) => {
    if (isClaimed(task.id)) { toast.error('Already claimed!'); return }
    const completed = task.type === 'invite' ? isInviteComplete(task) : isPurchaseComplete(task)
    if (!completed) {
      toast.error('Complete the task first!')
      return
    }

    setClaiming(task.id)

    // Mark as claimed using a notification with special title
    await supabase.from('notifications').insert({
      user_id: profile!.id,
      title: `MISSION_CLAIMED_${task.id}`,
      message: `Mission reward claimed: ${formatUGX(task.reward)}`,
      type: 'success',
      is_read: true,
    })

    // Add reward to wallet
    await supabase.from('user_profiles').update({
      wallet_balance: (profile!.wallet_balance || 0) + task.reward,
      total_earnings: (profile!.total_earnings || 0) + task.reward,
    }).eq('id', profile!.id)

    // Send visible notification
    await supabase.from('notifications').insert({
      user_id: profile!.id,
      title: '🏆 Mission Reward!',
      message: `You earned ${formatUGX(task.reward)} from completing: ${task.description}`,
      type: 'success',
    })

    await refreshProfile()
    toast.success(`🏆 +${formatUGX(task.reward)} mission reward claimed!`)
    setClaimedTasks(prev => [...prev, task.id])
    setTotalRewards(prev => prev + task.reward)
    setClaiming(null)
  }

  const tasks = activeTab === 'invite' ? INVITE_TASKS : PURCHASE_TASKS

  return (
    <div className="min-h-screen bg-samsung-dark page-with-nav">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-samsung-border">
        <button onClick={() => navigate(-1)} className="text-samsung-muted hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">Mission Center</h1>
      </div>

      <div className="px-5 py-4 animate-fade-in">
        {/* Hero banner */}
        <div className="relative rounded-2xl overflow-hidden mb-5 h-36 bg-samsung-gradient border border-samsung-blue/30">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=200&fit=crop"
            alt="Mission Center"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="relative z-10 p-5 h-full flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-200 mb-1">MISSION CENTER</p>
              <p className="font-extrabold text-xl">Claim Rewards</p>
              <p className="text-blue-200 text-xs mt-1">Complete tasks, earn bonuses!</p>
            </div>
            <Trophy size={48} className="text-samsung-gold opacity-80" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-samsung-card border border-samsung-border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={14} className="text-samsung-accent" />
              <p className="text-xs text-samsung-muted">L1 Investors</p>
            </div>
            <p className="font-extrabold text-2xl text-samsung-accent">{l1Count}</p>
            <p className="text-xs text-samsung-muted">Total People</p>
          </div>
          <div className="bg-samsung-card border border-samsung-border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy size={14} className="text-samsung-gold" />
              <p className="text-xs text-samsung-muted">Total Rewards</p>
            </div>
            <p className="font-extrabold text-lg text-samsung-gold">{formatUGX(totalRewards)}</p>
            <p className="text-xs text-samsung-muted">Earned</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-samsung-card border border-samsung-border rounded-xl p-1 mb-5">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'invite' ? 'bg-samsung-blue text-white' : 'text-samsung-muted'
            }`}
          >
            <Users size={14} />
            Invite Tasks
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'purchase' ? 'bg-samsung-blue text-white' : 'text-samsung-muted'
            }`}
          >
            <ShoppingBag size={14} />
            Purchase Tasks
          </button>
        </div>

        {/* Invite tasks info */}
        {activeTab === 'invite' && (
          <div className="bg-samsung-card border border-samsung-blue/30 rounded-xl p-4 mb-4">
            <p className="text-xs text-samsung-muted leading-relaxed">
              Invite friends using your referral link. Task progress counts Level 1 members who have an <span className="text-white">active package</span>.
              Your current count: <span className="text-samsung-accent font-bold">{l1Count} investors</span>
            </p>
          </div>
        )}

        {/* Task list */}
        <div className="space-y-3">
          {tasks.map(task => {
            const completed = task.type === 'invite' ? isInviteComplete(task) : isPurchaseComplete(task)
            const claimed = isClaimed(task.id)
            const progress = task.type === 'invite' ? getInviteProgress(task) : (isPurchaseComplete(task) ? 1 : 0)
            const pct = Math.min(100, (progress / task.target) * 100)

            return (
              <div key={task.id} className={`bg-samsung-card border rounded-2xl p-4 transition-all ${
                claimed ? 'border-green-500/30 bg-green-900/10' :
                completed ? 'border-samsung-gold/30' :
                'border-samsung-border'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 mr-3">
                    <p className="font-bold text-sm">{task.title}
                      <span className="text-samsung-muted font-normal text-xs ml-2">{task.description}</span>
                    </p>
                    <p className="text-samsung-gold text-xs font-semibold mt-0.5">
                      Reward: <span className="text-samsung-gold">{formatUGX(task.reward)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => claimReward(task)}
                    disabled={!completed || claimed || claiming === task.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-w-[70px] text-center ${
                      claimed ? 'bg-green-900/30 text-green-400 border border-green-500/30 cursor-not-allowed' :
                      completed ? 'bg-samsung-gold text-black hover:opacity-90' :
                      'bg-samsung-dark text-samsung-muted border border-samsung-border cursor-not-allowed'
                    }`}
                  >
                    {claiming === task.id ? '...' : claimed ? '✓ Done' : completed ? 'Claim' : 'In Progress'}
                  </button>
                </div>

                {/* Progress bar (invite tasks only) */}
                {task.type === 'invite' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-samsung-muted mb-1">
                      <span>{progress} / {task.target}</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="bg-samsung-dark rounded-full h-2">
                      <div
                        className={`rounded-full h-2 transition-all ${completed ? 'bg-samsung-gold' : 'bg-samsung-blue'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Purchase check */}
                {task.type === 'purchase' && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${isPurchaseComplete(task) ? 'bg-samsung-gold' : 'bg-samsung-border'}`} />
                    <span className="text-xs text-samsung-muted">
                      {isPurchaseComplete(task) ? `${task.packageName} purchased ✓` : `Buy ${task.packageName} to complete`}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 bg-samsung-card border border-samsung-border rounded-xl p-4">
          <p className="text-xs text-samsung-muted text-center leading-relaxed">
            💡 Share your referral link to invite friends. When they purchase a package, your L1 investor count increases and you unlock invite tasks.
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
