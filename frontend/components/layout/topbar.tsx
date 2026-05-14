'use client'
import Link from 'next/link'
import { Bell, Menu, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

interface TopBarProps {
  onMenuClick: () => void
  title?: string
  user: { full_name: string; is_verified?: boolean } | null
}

function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/api/notifications/unread-count/').then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}

export function TopBar({ onMenuClick, title = 'Tableau de bord', user }: TopBarProps) {
  const { data: unread } = useUnreadCount()
  const count = unread?.count ?? 0

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center gap-4 px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition"
      >
        <Menu size={20} />
      </button>

      <h1 className="hidden lg:block text-base font-bold text-gray-900 whitespace-nowrap">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher membres, événements..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange
                       focus:bg-white transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Notifications bell */}
        <Link
          href="/notifications"
          className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition"
        >
          <Bell size={19} />
          {count > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-ci-orange rounded-full ring-2 ring-white" />
          )}
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User chip */}
        {user && (
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-ci flex items-center justify-center text-white text-sm font-bold shadow-orange">
              {user.full_name?.[0] ?? '?'}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-gray-900 leading-tight">
                {user.full_name?.split(' ')[0]}
              </div>
              {user.is_verified ? (
                <div className="text-[10px] text-ci-green font-semibold">✓ Vérifié</div>
              ) : (
                <div className="text-[10px] text-gray-400">Membre</div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
