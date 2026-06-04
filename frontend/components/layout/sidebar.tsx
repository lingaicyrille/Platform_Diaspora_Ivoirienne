'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Home, Users, Calendar, Briefcase, ShoppingBag, Newspaper,
  Plane, Building2, MessageCircle, User, Settings, X, LogOut,
  Coins, HandHeart, GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

const mainNav = [
  { href: '/dashboard', icon: Home, label: 'Tableau de bord' },
  { href: '/community', icon: Users, label: 'Communauté' },
  { href: '/events', icon: Calendar, label: 'Événements' },
  { href: '/business', icon: Briefcase, label: 'Business' },
  { href: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { href: '/news', icon: Newspaper, label: 'Actualités' },
  { href: '/immigration', icon: Plane, label: 'Immigration' },
  { href: '/associations', icon: Building2, label: 'Associations' },
  { href: '/messaging', icon: MessageCircle, label: 'Messagerie', unreadKey: true },
  { href: '/tontines', icon: Coins, label: 'Tontines' },
  { href: '/solidarity', icon: HandHeart, label: 'Solidarité' },
  { href: '/mentorship', icon: GraduationCap, label: 'Mentorat' },
]

const bottomNav = [
  { href: '/profile', icon: User, label: 'Mon Profil' },
  { href: '/settings', icon: Settings, label: 'Paramètres' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  user: { full_name: string; email: string; country_of_residence?: string } | null
  onLogout: () => void
}

export function Sidebar({ isOpen, onClose, user, onLogout }: SidebarProps) {
  const pathname = usePathname()

  const { data: convData } = useQuery<{ results: { unread_count: number }[] }>({
    queryKey: ['conversations-unread'],
    queryFn: () => api.get('/api/messaging/conversations/').then(r => r.data),
    enabled: !!user,
    refetchInterval: 30_000,
  })

  const totalUnread = convData?.results?.reduce((sum, c) => sum + (c.unread_count ?? 0), 0) ?? 0

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-30',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-gradient-ci flex items-center justify-center shadow-orange">
              <span className="text-white text-sm font-black">P</span>
            </div>
            <div>
              <div className="text-sm font-black text-gray-900 leading-tight">PDI</div>
              <div className="text-[10px] text-gray-400">Diaspora Ivoirienne</div>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {mainNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const badge = item.unreadKey && totalUnread > 0 ? totalUnread : null
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-ci-orange-light text-ci-orange'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <item.icon
                  size={18}
                  className={active ? 'text-ci-orange' : 'text-gray-400 group-hover:text-gray-600'}
                />
                <span className="flex-1">{item.label}</span>
                {badge && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            )
          })}

          <div className="pt-4 mt-2 border-t border-gray-100 space-y-0.5">
            {bottomNav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-ci-orange-light text-ci-orange'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <item.icon size={18} className={active ? 'text-ci-orange' : 'text-gray-400'} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User footer */}
        {user && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-ci flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user.full_name?.[0] ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</div>
                <div className="text-xs text-gray-400 truncate">
                  {user.country_of_residence || user.email}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Déconnexion"
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
