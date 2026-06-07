'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Plus, Eye, MousePointer, Trash2, ToggleLeft, ToggleRight, X, ExternalLink } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Ad {
  id: number
  title: string
  body: string
  image: string | null
  link: string
  placement: 'banner' | 'sidebar' | 'feed'
  start_date: string
  end_date: string
  is_active: boolean
  impressions: number
  clicks: number
  created_at: string
}

const placementLabels = { banner: 'Bannière', sidebar: 'Sidebar', feed: "Fil d'actualité" }

interface AdFormData {
  title: string
  body: string
  link: string
  placement: string
  start_date: string
  end_date: string
}

function CreateAdModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<AdFormData>({
    title: '', body: '', link: '', placement: 'feed',
    start_date: '', end_date: '',
  })
  const set = (k: keyof AdFormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  const create = useMutation({
    mutationFn: () => api.post('/api/ads/ads/', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-ads'] }); onClose() },
  })

  const canSubmit = form.title && form.link && form.start_date && form.end_date

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Créer une publicité</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>

        <input
          value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Titre de l'annonce *"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange"
        />
        <textarea
          value={form.body} onChange={e => set('body', e.target.value)}
          placeholder="Description (optionnel)"
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange resize-none"
        />
        <input
          value={form.link} onChange={e => set('link', e.target.value)}
          placeholder="URL de destination *"
          type="url"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange"
        />
        <select
          value={form.placement} onChange={e => set('placement', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange"
        >
          <option value="banner">Bannière</option>
          <option value="sidebar">Sidebar</option>
          <option value="feed">Fil d'actualité</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date de début *</label>
            <input
              value={form.start_date} onChange={e => set('start_date', e.target.value)}
              type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date de fin *</label>
            <input
              value={form.end_date} onChange={e => set('end_date', e.target.value)}
              type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition"
          >
            {create.isPending ? 'Création...' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdsPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const { data, isLoading } = useQuery<{ results: Ad[] }>({
    queryKey: ['my-ads'],
    queryFn: () => api.get('/api/ads/ads/?mine=true&page_size=50').then(r => r.data),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/api/ads/ads/${id}/`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-ads'] }),
  })

  const deleteAd = useMutation({
    mutationFn: (id: number) => api.delete(`/api/ads/ads/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-ads'] }),
  })

  const ads = data?.results ?? []
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0)
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0)
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0'

  return (
    <AppLayout title="Publicités" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      {showCreate && <CreateAdModal onClose={() => setShowCreate(false)} />}

      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-500 to-ci-orange rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Espace publicitaire communautaire</p>
              <h2 className="text-2xl font-black mb-2">Mes publicités</h2>
              <p className="text-white/80 text-sm max-w-sm">Touchez la diaspora ivoirienne avec vos annonces sponsorisées.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-2 bg-white text-ci-orange font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-orange-50 transition shadow"
              >
                <Plus size={16} /> Créer une publicité
              </button>
            </div>
            <Megaphone size={40} className="text-white/30 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Impressions totales', value: totalImpressions.toLocaleString('fr-FR'), icon: Eye, color: 'text-blue-600' },
            { label: 'Clics totaux', value: totalClicks.toLocaleString('fr-FR'), icon: MousePointer, color: 'text-green-600' },
            { label: 'Taux de clic', value: `${ctr}%`, icon: Megaphone, color: 'text-ci-orange' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card text-center">
              <s.icon size={18} className={cn('mx-auto mb-1', s.color)} />
              <div className={cn('text-xl font-black', s.color)}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Ad list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune publicité pour le moment.</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-ci-orange font-medium hover:underline">
              Créer ma première publicité
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map(ad => (
              <div key={ad.id} className="bg-white rounded-2xl shadow-card p-5">
                <div className="flex items-start gap-4">
                  {ad.image && (
                    <img src={ad.image} alt={ad.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate text-sm">{ad.title}</p>
                        {ad.body && <p className="text-xs text-gray-500 truncate mt-0.5">{ad.body}</p>}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {placementLabels[ad.placement]}
                        </span>
                        <span className={cn(
                          'text-[11px] font-semibold px-2 py-1 rounded-full',
                          ad.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500',
                        )}>
                          {ad.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1"><Eye size={11} /> {ad.impressions.toLocaleString('fr-FR')} vues</span>
                      <span className="flex items-center gap-1"><MousePointer size={11} /> {ad.clicks.toLocaleString('fr-FR')} clics</span>
                      <span>{new Date(ad.start_date).toLocaleDateString('fr-FR')} → {new Date(ad.end_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <a
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-ci-orange font-medium hover:underline"
                  >
                    <ExternalLink size={12} /> Voir le lien
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive.mutate({ id: ad.id, is_active: !ad.is_active })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                    >
                      {ad.is_active
                        ? <><ToggleRight size={14} className="text-green-600" /> Désactiver</>
                        : <><ToggleLeft size={14} /> Activer</>}
                    </button>
                    <button
                      onClick={() => { if (confirm('Supprimer cette publicité ?')) deleteAd.mutate(ad.id) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-100 text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
