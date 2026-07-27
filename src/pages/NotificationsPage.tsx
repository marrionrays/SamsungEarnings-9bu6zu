import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Notification } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadNotifications()
      markAllRead()
    }
  }, [profile])

  const loadNotifications = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data || [])
    setLoading(false)
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', profile!.id).eq('is_read', false)
  }

  const typeIcon: Record<string, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return (
    <div className="min-h-screen bg-samsung-dark">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-samsung-border">
        <button onClick={() => navigate(-1)} className="text-samsung-muted hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">Notifications</h1>
        <button onClick={markAllRead} className="ml-auto text-samsung-muted hover:text-white">
          <CheckCheck size={18} />
        </button>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={40} className="text-samsung-muted mx-auto mb-3" />
            <p className="text-samsung-muted">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id}
                className={`bg-samsung-card border rounded-xl p-4 ${!n.is_read ? 'border-samsung-blue/40' : 'border-samsung-border'}`}>
                <div className="flex gap-3">
                  <span className="text-lg">{typeIcon[n.type] || 'ℹ️'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm">{n.title}</p>
                      {!n.is_read && <div className="w-2 h-2 bg-samsung-blue rounded-full mt-1" />}
                    </div>
                    <p className="text-samsung-muted text-xs mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-samsung-muted text-[10px] mt-2">{formatDateTime(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
