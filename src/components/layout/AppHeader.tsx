import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AppHeader({ title }: { title?: string }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!profile) return
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false)
      setUnread(count || 0)
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [profile])

  return (
    <header className="flex items-center justify-between px-5 py-4 bg-samsung-dark border-b border-samsung-border">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-samsung-blue rounded-lg flex items-center justify-center font-bold text-xs">S</div>
        <span className="font-bold text-base">{title || 'Samsung Earnings'}</span>
      </div>
      <button onClick={() => navigate('/notifications')} className="relative p-2">
        <Bell size={20} className="text-gray-300" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </header>
  )
}
