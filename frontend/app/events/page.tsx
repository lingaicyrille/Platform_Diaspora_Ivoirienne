'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Wifi, Plus, Users, Clock, X, CheckCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Event {
  id: number
  title: string
  description: string
  organizer: { id: number; first_name: string; last_name: string }
  address: string
  city: string
  country: string
  start_datetime: string
  end_datetime: string
  is_online: boolean
  online_link: string
  capacity: number | null
  category: string
  rsvp_count: number
  user_rsvp: string | null
}

const categoryColors: Record<string, string> = {
  cultural: 'bg-purple-50 text-purple-700',
  sports: 'bg-green-50 text-green-700',
  business: 'bg-blue-50 text-blue-700',
  community: 'bg-ci-orange-light text-ci-orange',
  education: 'bg-yellow-50 text-yellow-700',
  other: 'bg-gray-100 text-gray-600',
}

const categoryLabels: Record<string, string> = {
  cultural: 'Culturel', sports: 'Sports', business: 'Business',
  community: 'Communauté', education: 'Éducation', other: 'Autre',
}

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', city: '', country: '', address: '',
    start_datetime: '', end_datetime: '', is_online: false,
    online_link: '', category: 'other', capacity: '',
  })
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const create = useMutation({
    mutationFn: () => api.post('/api/events/events/', {
      ...form,
      capacity: form.capacity ? parseInt(form.capacity) : null,
    }),
    onSuccess: () => { onCreated(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl my-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Créer un événement</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>

        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titre de l'événement"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />

        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description" rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange resize-none" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Début</label>
            <input value={form.start_datetime} onChange={e => set('start_datetime', e.target.value)} type="datetime-local"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fin</label>
            <input value={form.end_datetime} onChange={e => set('end_datetime', e.target.value)} type="datetime-local"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange">
            {Object.entries(categoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="Capacité (optionnel)" type="number"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={form.is_online} onChange={e => set('is_online', e.target.checked)} className="w-4 h-4 accent-ci-orange" />
          <span className="text-sm text-gray-700">Événement en ligne</span>
        </label>

        {form.is_online ? (
          <input value={form.online_link} onChange={e => set('online_link', e.target.value)} placeholder="Lien de la réunion"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ville"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
            <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Pays"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.title || !form.start_datetime || create.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? 'Création...' : 'Créer l\'événement'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [category, setCategory] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery<{ results: Event[] }>({
    queryKey: ['events', category, onlineOnly],
    queryFn: () => {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (onlineOnly) params.set('is_online', 'true')
      return api.get(`/api/events/events/?${params}`).then(r => r.data)
    },
  })

  const rsvp = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.post(`/api/events/events/${id}/rsvp/`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const events = data?.results ?? []

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function formatTime(dt: string) {
    return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <AppLayout title="Événements" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['events'] })}
        />
      )}

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Événements — Culturels, Business, Sports</p>
              <h2 className="text-2xl font-black mb-2">Vivez la diaspora</h2>
              <p className="text-white/80 text-sm max-w-sm">Découvrez et rejoignez des événements partout dans le monde.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-2 bg-white text-purple-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-purple-50 transition shadow"
              >
                <Plus size={16} /> Créer un événement
              </button>
            </div>
            <Calendar size={40} className="text-white/30 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCategory('')}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', !category ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
          >
            Tous
          </button>
          {Object.entries(categoryLabels).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setCategory(v === category ? '' : v)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', category === v ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
            >
              {l}
            </button>
          ))}
          <button
            onClick={() => setOnlineOnly(!onlineOnly)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1', onlineOnly ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
          >
            <Wifi size={11} /> En ligne
          </button>
        </div>

        {/* Events grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun événement trouvé</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-purple-600 font-medium hover:underline">
              Organiser le premier
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {events.map(ev => (
              <div key={ev.id} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{ev.title}</h3>
                    <p className="text-xs text-gray-400">par {ev.organizer.first_name} {ev.organizer.last_name}</p>
                  </div>
                  <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0', categoryColors[ev.category] ?? categoryColors.other)}>
                    {categoryLabels[ev.category] ?? ev.category}
                  </span>
                </div>

                {ev.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{ev.description}</p>}

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} className="text-purple-400 flex-shrink-0" />
                    {formatDate(ev.start_datetime)} · {formatTime(ev.start_datetime)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {ev.is_online ? (
                      <><Wifi size={12} className="text-green-500 flex-shrink-0" /> En ligne</>
                    ) : (
                      <><MapPin size={12} className="text-red-400 flex-shrink-0" /> {[ev.city, ev.country].filter(Boolean).join(', ') || 'Lieu non précisé'}</>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users size={12} className="text-gray-400 flex-shrink-0" />
                    {ev.rsvp_count} participant{ev.rsvp_count !== 1 ? 's' : ''}
                    {ev.capacity && ` · Max ${ev.capacity}`}
                  </div>
                </div>

                <div className="mt-auto">
                  {ev.user_rsvp === 'going' ? (
                    <button
                      onClick={() => rsvp.mutate({ id: ev.id, status: 'not_going' })}
                      className="w-full py-2 flex items-center justify-center gap-2 border border-green-200 bg-green-50 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 transition"
                    >
                      <CheckCircle size={13} /> Vous y allez — Annuler
                    </button>
                  ) : (
                    <button
                      onClick={() => rsvp.mutate({ id: ev.id, status: 'going' })}
                      disabled={rsvp.isPending}
                      className="w-full py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition disabled:opacity-40"
                    >
                      {ev.user_rsvp === 'maybe' ? 'Confirmer ma présence' : 'Participer'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
