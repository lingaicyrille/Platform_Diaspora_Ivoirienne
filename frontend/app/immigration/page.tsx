'use client'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Plane, ChevronRight } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Country { id: number; name: string; code: string; flag_emoji: string }

export default function ImmigrationPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  const { data, isLoading } = useQuery<{ results: Country[] }>({
    queryKey: ['countries'],
    queryFn: () => api.get('/api/immigration/countries/').then(r => r.data),
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const countries = data?.results ?? []

  return (
    <AppLayout title="Immigration" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-sky-600 to-sky-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Immigration — Guides & Ressources</p>
              <h2 className="text-2xl font-black mb-2">Naviguer à l'étranger</h2>
              <p className="text-white/80 text-sm max-w-sm">
                Guides pratiques par pays, Q&A communautaire, conseils visa et résidence.
              </p>
            </div>
            <Plane size={40} className="text-white/30 flex-shrink-0 mt-1" />
          </div>
        </div>

        <h3 className="font-bold text-gray-900 mb-4">Sélectionnez un pays</h3>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : countries.length === 0 ? (
          <div className="text-center py-16">
            <Plane size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucun pays disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {countries.map(c => (
              <button
                key={c.id}
                onClick={() => router.push(`/immigration/${c.id}`)}
                className="bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow text-left flex items-center gap-3 group"
              >
                <span className="text-2xl">{c.flag_emoji || '🌍'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-sky-600 transition">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.code}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-sky-400 transition flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
