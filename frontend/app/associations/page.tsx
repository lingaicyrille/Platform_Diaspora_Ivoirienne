'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Globe, Mail, BadgeCheck, Users, X } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Association {
  id: number
  name: string
  description: string
  category: string
  country: string
  city: string
  website: string
  contact_email: string
  is_verified: boolean
  member_count: number
  is_member: boolean
  created_by: { id: number; first_name: string; last_name: string }
}

const categoryLabels: Record<string, string> = {
  cultural: 'Culturelle', humanitarian: 'Humanitaire', educational: 'Éducative',
  professional: 'Professionnelle', sports: 'Sportive', religious: 'Religieuse', other: 'Autre',
}

const categoryColors: Record<string, string> = {
  cultural: 'bg-purple-50 text-purple-700', humanitarian: 'bg-red-50 text-red-700',
  educational: 'bg-yellow-50 text-yellow-700', professional: 'bg-blue-50 text-blue-700',
  sports: 'bg-green-50 text-green-700', religious: 'bg-indigo-50 text-indigo-700',
  other: 'bg-gray-100 text-gray-600',
}

function CreateAssociationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', description: '', category: 'other',
    country: '', city: '', website: '', contact_email: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const create = useMutation({
    mutationFn: () => api.post('/api/associations/associations/', form),
    onSuccess: () => { onCreated(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl my-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Créer une association</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nom de l'association"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description (mission, activités...)" rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange">
            {Object.entries(categoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Pays"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ville"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
          <input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="Email de contact"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        </div>
        <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="Site web (optionnel)"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.name || create.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? 'Création...' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AssociationsPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [category, setCategory] = useState('')
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery<{ results: Association[] }>({
    queryKey: ['associations', category],
    queryFn: () => {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      return api.get(`/api/associations/associations/?${params}`).then(r => r.data)
    },
  })

  const join = useMutation({
    mutationFn: (id: number) => api.post(`/api/associations/associations/${id}/join/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['associations'] }),
  })

  const leave = useMutation({
    mutationFn: (id: number) => api.post(`/api/associations/associations/${id}/leave/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['associations'] }),
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const all = data?.results ?? []
  const associations = tab === 'mine' ? all.filter(a => a.is_member) : all

  return (
    <AppLayout title="Associations" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      {showCreate && (
        <CreateAssociationModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['associations'] })}
        />
      )}

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-ci-green to-emerald-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Associations — ONG & Organisations</p>
              <h2 className="text-2xl font-black mb-2">Organisez la diaspora</h2>
              <p className="text-white/80 text-sm max-w-sm">Créez ou rejoignez des associations culturelles, humanitaires, professionnelles et plus.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-2 bg-white text-ci-green font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition shadow"
              >
                <Plus size={16} /> Créer une association
              </button>
            </div>
            <Building2 size={40} className="text-white/30 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Associations', value: all.length, color: 'text-ci-green' },
            { label: 'Mes associations', value: all.filter(a => a.is_member).length, color: 'text-ci-orange' },
            { label: 'Vérifiées', value: all.filter(a => a.is_verified).length, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card text-center">
              <div className={cn('text-xl font-black', s.color)}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs + category filter */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {([['all', 'Toutes'], ['mine', 'Mes associations']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition', tab === key ? 'bg-ci-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              {label}
            </button>
          ))}
          <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />
          {Object.entries(categoryLabels).map(([v, l]) => (
            <button key={v} onClick={() => setCategory(v === category ? '' : v)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', category === v ? 'bg-ci-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              {l}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : associations.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {tab === 'mine' ? 'Vous n\'avez rejoint aucune association' : 'Aucune association trouvée'}
            </p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-ci-green font-medium hover:underline">
              Créer la première
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {associations.map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{a.name}</h3>
                      {a.is_verified && <BadgeCheck size={13} className="text-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[a.city, a.country].filter(Boolean).join(', ') || 'Lieu non précisé'}
                    </p>
                  </div>
                  <span className={cn('text-[11px] font-semibold px-2 py-1 rounded-full flex-shrink-0', categoryColors[a.category] ?? categoryColors.other)}>
                    {categoryLabels[a.category] ?? a.category}
                  </span>
                </div>

                {a.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{a.description}</p>}

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><Users size={11} /> {a.member_count} membres</span>
                  {a.contact_email && (
                    <a href={`mailto:${a.contact_email}`} className="flex items-center gap-1 text-ci-orange hover:underline">
                      <Mail size={11} /> Contact
                    </a>
                  )}
                  {a.website && (
                    <a href={a.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-500 hover:underline">
                      <Globe size={11} /> Site
                    </a>
                  )}
                </div>

                <div className="mt-auto">
                  {a.is_member ? (
                    <button
                      onClick={() => leave.mutate(a.id)}
                      disabled={leave.isPending}
                      className="w-full py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
                    >
                      Quitter l'association
                    </button>
                  ) : (
                    <button
                      onClick={() => join.mutate(a.id)}
                      disabled={join.isPending}
                      className="w-full py-2 bg-ci-green text-white rounded-xl text-xs font-semibold hover:bg-ci-green-dark transition disabled:opacity-40"
                    >
                      Rejoindre
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
