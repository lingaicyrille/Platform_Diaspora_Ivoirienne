'use client'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck, Trash2, MessageCircle, Calendar, Coins, HandHeart, GraduationCap, ShoppingBag, Info } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Notification {
  id: number
  type: string
  title: string
  body: string
  link: string
  is_read: boolean
  created_at: string
  sender: { id: number; first_name: string; last_name: string } | null
}

const typeIcon: Record<string, React.ElementType> = {
  message: MessageCircle,
  event_rsvp: Calendar,
  tontine: Coins,
  solidarity: HandHeart,
  mentorship: GraduationCap,
  marketplace: ShoppingBag,
  offer: ShoppingBag,
  general: Info,
  group_join: Bell,
}

const typeColor: Record<string, string> = {
  message: 'bg-indigo-50 text-indigo-500',
  event_rsvp: 'bg-purple-50 text-purple-500',
  tontine: 'bg-yellow-50 text-yellow-600',
  solidarity: 'bg-red-50 text-red-500',
  mentorship: 'bg-ci-green-light text-ci-green',
  marketplace: 'bg-ci-orange-light text-ci-orange',
  offer: 'bg-ci-orange-light text-ci-orange',
  general: 'bg-gray-100 text-gray-500',
  group_join: 'bg-blue-50 text-blue-500',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Il y a ${hrs}h`
  return `Il y a ${Math.floor(hrs / 24)}j`
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ results: Notification[] }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/api/notifications/').then(r => r.data),
  })

  const markRead = useMutation({
    mutationFn: (id: number) => api.post(`/api/notifications/${id}/read/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/api/notifications/read-all/'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const deleteNotif = useMutation({
    mutationFn: (id: number) => api.delete(`/api/notifications/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const notifications = data?.results ?? []
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <AppLayout title="Notifications" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1.5 text-sm text-ci-orange font-medium hover:underline"
            >
              <CheckCheck size={15} />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex gap-3">
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Aucune notification</p>
            <p className="text-sm text-gray-400 mt-1">Vous êtes à jour !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const Icon = typeIcon[notif.type] ?? Info
              const color = typeColor[notif.type] ?? 'bg-gray-100 text-gray-500'
              return (
                <div
                  key={notif.id}
                  className={cn(
                    'bg-white rounded-2xl p-4 flex gap-3 group hover:shadow-card transition-shadow cursor-pointer',
                    !notif.is_read && 'border-l-4 border-ci-orange',
                  )}
                  onClick={() => {
                    if (!notif.is_read) markRead.mutate(notif.id)
                    if (notif.link) router.push(notif.link)
                  }}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold text-gray-900', notif.is_read && 'font-medium text-gray-600')}>
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                  <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button
                        onClick={e => { e.stopPropagation(); markRead.mutate(notif.id) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-ci-green hover:bg-ci-green-light transition-colors"
                        title="Marquer comme lu"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotif.mutate(notif.id) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
