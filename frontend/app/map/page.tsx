'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Globe, Users, MapPin, TrendingUp } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface MapEntry {
  country_of_residence: string
  continent: string
  count: number
}

const continentLabels: Record<string, string> = {
  AF: 'Afrique', EU: 'Europe', NA: 'Amérique du Nord',
  SA: 'Amérique du Sud', AS: 'Asie', OC: 'Océanie', ME: 'Moyen-Orient', '': 'Autre',
}

const continentColors: Record<string, string> = {
  AF: 'bg-amber-500', EU: 'bg-blue-500', NA: 'bg-green-500',
  SA: 'bg-emerald-500', AS: 'bg-red-500', OC: 'bg-purple-500',
  ME: 'bg-orange-500', '': 'bg-gray-400',
}

export default function DiasporaMapPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const [activeContinent, setActiveContinent] = useState('')

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const { data: entries = [], isLoading } = useQuery<MapEntry[]>({
    queryKey: ['diaspora-map'],
    queryFn: () => api.get('/api/users/map/').then(r => r.data),
  })

  const continents = [...new Set(entries.map(e => e.continent))].sort()
  const filtered = activeContinent ? entries.filter(e => e.continent === activeContinent) : entries
  const totalMembers = entries.reduce((s, e) => s + e.count, 0)
  const maxCount = filtered[0]?.count ?? 1

  return (
    <AppLayout title="Carte de la Diaspora" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-ci-green to-emerald-600 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Communauté mondiale</p>
              <h2 className="text-2xl font-black mb-2">Carte de la Diaspora</h2>
              <p className="text-white/80 text-sm max-w-sm">
                La diaspora ivoirienne répartie à travers le monde.
              </p>
            </div>
            <Globe size={40} className="text-white/30 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-card text-center">
            <Users size={18} className="text-ci-green mx-auto mb-1" />
            <div className="text-xl font-black text-ci-green">{totalMembers.toLocaleString('fr-FR')}</div>
            <div className="text-xs text-gray-500">Membres localisés</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-card text-center">
            <MapPin size={18} className="text-blue-600 mx-auto mb-1" />
            <div className="text-xl font-black text-blue-600">{entries.length}</div>
            <div className="text-xs text-gray-500">Pays représentés</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-card text-center">
            <TrendingUp size={18} className="text-ci-orange mx-auto mb-1" />
            <div className="text-xl font-black text-ci-orange">{continents.length}</div>
            <div className="text-xs text-gray-500">Continents</div>
          </div>
        </div>

        {/* Continent filter */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveContinent('')}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition',
              !activeContinent ? 'bg-ci-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
          >
            Tous les continents
          </button>
          {continents.map(c => (
            <button
              key={c}
              onClick={() => setActiveContinent(c === activeContinent ? '' : c)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition',
                activeContinent === c ? 'bg-ci-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
            >
              <span className={cn('w-2 h-2 rounded-full', continentColors[c] ?? continentColors[''])} />
              {continentLabels[c] ?? c}
            </button>
          ))}
        </div>

        {/* Country bars */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Globe size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun membre localisé dans cette région.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {filtered.map((entry, i) => {
              const pct = Math.round((entry.count / maxCount) * 100)
              const barColor = continentColors[entry.continent] ?? continentColors['']
              return (
                <div
                  key={entry.country_of_residence}
                  className={cn('flex items-center gap-4 px-5 py-3.5', i !== 0 && 'border-t border-gray-50')}
                >
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {entry.country_of_residence}
                      </span>
                      <span className="text-sm font-black text-gray-700 flex-shrink-0 ml-2">
                        {entry.count.toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', barColor)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full text-white flex-shrink-0', barColor)}>
                    {continentLabels[entry.continent] ?? entry.continent}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
