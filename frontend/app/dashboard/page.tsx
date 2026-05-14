'use client'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Users, Calendar, Briefcase, MessageCircle, TrendingUp,
  MapPin, Globe, ArrowRight, Bell, Flame, Star, Clock,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore, type UserProfile } from '@/store/auth-store'

interface DashboardStats {
  members: number
  upcoming_events: number
  active_businesses: number
  unread_notifications: number
}

interface Event {
  id: number
  title: string
  city: string
  country: string
  is_online: boolean
  start_datetime: string
  attendee_count: number
  category: string
}

interface Member {
  id: number
  first_name: string
  last_name: string
  country_of_residence: string
  city: string
  avatar: string | null
  trust_score: number
}

interface Notification {
  id: number
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

const categoryColors: Record<string, 'orange' | 'green' | 'purple'> = {
  business: 'orange', community: 'green', cultural: 'purple',
  sports: 'green', education: 'orange', other: 'purple',
}

const notifIconColor: Record<string, string> = {
  message: 'bg-indigo-50 text-indigo-500',
  group_join: 'bg-blue-50 text-blue-500',
  event_rsvp: 'bg-purple-50 text-purple-500',
  tontine: 'bg-amber-50 text-amber-500',
  solidarity: 'bg-green-50 text-green-500',
  mentorship: 'bg-sky-50 text-sky-500',
  marketplace: 'bg-ci-orange-light text-ci-orange',
  general: 'bg-gray-100 text-gray-500',
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 60) return `Il y a ${diff} min`
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const quickLinks = [
  { href: '/community', icon: Users, label: 'Communauté', desc: 'Groupes par région', color: 'text-blue-500', bg: 'bg-blue-50', border: 'hover:border-blue-200' },
  { href: '/events', icon: Calendar, label: 'Événements', desc: 'À venir près de vous', color: 'text-purple-500', bg: 'bg-purple-50', border: 'hover:border-purple-200' },
  { href: '/business', icon: Briefcase, label: 'Business', desc: 'Annuaire ivoirien', color: 'text-ci-orange', bg: 'bg-ci-orange-light', border: 'hover:border-orange-200' },
  { href: '/news', icon: Flame, label: 'Flash Info', desc: 'Actualités du jour', color: 'text-red-500', bg: 'bg-red-50', border: 'hover:border-red-200' },
  { href: '/immigration', icon: Globe, label: 'Immigration', desc: 'Guides par pays', color: 'text-sky-500', bg: 'bg-sky-50', border: 'hover:border-sky-200' },
  { href: '/messaging', icon: MessageCircle, label: 'Messagerie', desc: 'Conversations', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'hover:border-indigo-200' },
]

function WelcomeSkeleton() {
  return (
    <div className="bg-[#0D1117] rounded-2xl p-6 space-y-3">
      <Skeleton className="h-4 w-32 bg-white/10" />
      <Skeleton className="h-7 w-48 bg-white/10" />
      <Skeleton className="h-4 w-40 bg-white/10" />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { clearAuth, user: cachedUser, getRefreshToken } = useAuthStore()

  const { data: user, isLoading, isError } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: () => api.get('/api/users/me/').then(r => r.data),
    initialData: cachedUser ?? undefined,
    enabled: typeof window === 'undefined' || !!getRefreshToken() || !!cachedUser,
  })

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/api/users/stats/').then(r => r.data),
    enabled: !!user,
  })

  const { data: eventsData } = useQuery<{ results: Event[] }>({
    queryKey: ['dashboard-events'],
    queryFn: () => api.get('/api/events/events/?upcoming=true&page_size=3').then(r => r.data),
    enabled: !!user,
  })

  const { data: membersData } = useQuery<{ results: Member[] }>({
    queryKey: ['dashboard-members'],
    queryFn: () => api.get('/api/users/?ordering=-trust_score&page_size=4').then(r => r.data),
    enabled: !!user,
  })

  const { data: notificationsData } = useQuery<{ results: Notification[] }>({
    queryKey: ['dashboard-notifications'],
    queryFn: () => api.get('/api/notifications/notifications/?page_size=5').then(r => r.data),
    enabled: !!user,
  })

  if (!isLoading && !user && typeof window !== 'undefined') {
    if (!getRefreshToken() && !cachedUser) {
      router.push('/auth/login')
      return null
    }
  }

  const handleLogout = () => { clearAuth(); router.push('/') }

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-ci-orange/20 border-t-ci-orange rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <p className="text-gray-600">Impossible de charger votre profil.</p>
          <button onClick={() => router.push('/auth/login')} className="text-ci-orange font-semibold hover:underline text-sm">
            Se reconnecter
          </button>
        </div>
      </div>
    )
  }

  const events = eventsData?.results ?? []
  const members = membersData?.results ?? []
  const notifications = notificationsData?.results ?? []

  return (
    <AppLayout title="Tableau de bord" user={user!} onLogout={handleLogout}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Welcome banner */}
        {isLoading ? <WelcomeSkeleton /> : (
          <div className="relative bg-gradient-to-br from-[#0D1117] to-[#1a1a2e] rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-ci-orange/10 to-transparent pointer-events-none" />
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-ci-orange/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/50 text-sm mb-1">Bienvenue de retour 👋</p>
                  <h2 className="text-2xl font-black text-white mb-1">{user!.first_name} !</h2>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    {user!.city || user!.country_of_residence ? (
                      <><MapPin size={13} /><span>{[user!.city, user!.country_of_residence].filter(Boolean).join(', ')}</span></>
                    ) : (
                      <span>Complétez votre profil pour apparaître sur la carte</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {user!.is_verified && <Badge variant="green">✓ Vérifié</Badge>}
                  <div className="flex items-center gap-1.5 bg-white/8 px-3 py-1.5 rounded-xl">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="text-white text-sm font-bold">Score {user!.trust_score}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Membres diaspora" value={stats ? stats.members.toLocaleString('fr-FR') : '—'} icon={Users} />
          <StatCard label="Événements à venir" value={stats ? String(stats.upcoming_events) : '—'} icon={Calendar} iconBg="bg-purple-50" iconColor="text-purple-500" />
          <StatCard label="Businesses actifs" value={stats ? stats.active_businesses.toLocaleString('fr-FR') : '—'} icon={Briefcase} iconBg="bg-ci-green-light" iconColor="text-ci-green" />
          <StatCard label="Notifications non lues" value={stats ? String(stats.unread_notifications) : '—'} icon={Bell} iconBg="bg-orange-50" iconColor="text-ci-orange" />
        </div>

        {/* Quick access */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Accès rapide</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map(link => (
              <a key={link.href} href={link.href}
                className={cn('bg-white rounded-2xl p-4 border border-gray-100 transition-all duration-200 group cursor-pointer hover:shadow-card-hover', link.border)}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', link.bg)}>
                  <link.icon size={18} className={link.color} />
                </div>
                <div className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{link.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{link.desc}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-5 gap-5">

          {/* Notifications / activity feed */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Bell size={15} className="text-ci-orange" /> Activité récente
              </h3>
              <a href="/notifications" className="text-xs text-ci-orange font-semibold hover:underline flex items-center gap-1">
                Tout voir <ArrowRight size={12} />
              </a>
            </div>
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">Aucune activité récente.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', notifIconColor[n.type] ?? notifIconColor.general)}>
                      <Bell size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.body}</p>}
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-ci-orange flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Upcoming events */}
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Calendar size={15} className="text-purple-500" /> Événements à venir
                </h3>
                <a href="/events" className="text-xs text-ci-orange font-semibold hover:underline flex items-center gap-1">
                  Voir tout <ArrowRight size={12} />
                </a>
              </div>
              {events.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Aucun événement à venir.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {events.map(ev => (
                    <div key={ev.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-snug truncate">{ev.title}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <MapPin size={10} /> {ev.is_online ? 'En ligne' : [ev.city, ev.country].filter(Boolean).join(', ')}
                          </div>
                        </div>
                        <Badge variant={categoryColors[ev.category] ?? 'purple'}>
                          {ev.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(ev.start_datetime)}</span>
                        <span className="flex items-center gap-1"><Users size={10} /> {ev.attendee_count} inscrits</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top members */}
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <TrendingUp size={15} className="text-ci-green" /> Membres populaires
                </h3>
                <a href="/community" className="text-xs text-ci-orange font-semibold hover:underline flex items-center gap-1">
                  Explorer <ArrowRight size={12} />
                </a>
              </div>
              {members.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Aucun membre.</div>
              ) : (
                <div className="p-4 space-y-3">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-xl bg-gradient-ci flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {m.first_name[0]}{m.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{m.first_name} {m.last_name}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin size={9} /> {[m.city, m.country_of_residence].filter(Boolean).join(', ') || '—'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star size={11} className="fill-amber-400" /> {m.trust_score}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
