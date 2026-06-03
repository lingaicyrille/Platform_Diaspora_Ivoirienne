'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Briefcase, Plus, Star, MapPin, Phone, Globe, BadgeCheck, X, Search } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Business {
  id: number
  name: string
  owner: { id: number; first_name: string; last_name: string }
  description: string
  category: string
  address: string
  country: string
  city: string
  phone: string
  website: string
  email: string
  logo: string | null
  is_verified: boolean
  average_rating: number | null
  review_count: number
  created_at: string
}

const categoryLabels: Record<string, string> = {
  restaurant: 'Restaurant', retail: 'Commerce', services: 'Services',
  tech: 'Technologie', health: 'Santé', education: 'Éducation',
  real_estate: 'Immobilier', other: 'Autre',
}

const categoryColors: Record<string, string> = {
  restaurant: 'bg-red-50 text-red-600', retail: 'bg-pink-50 text-pink-600',
  services: 'bg-blue-50 text-blue-600', tech: 'bg-indigo-50 text-indigo-600',
  health: 'bg-green-50 text-green-600', education: 'bg-yellow-50 text-yellow-700',
  real_estate: 'bg-purple-50 text-purple-600', other: 'bg-gray-100 text-gray-600',
}

function CreateBusinessModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', description: '', category: 'other',
    country: '', city: '', address: '', phone: '', website: '', email: '',
  })
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setLogo(file)
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (logo) fd.append('logo', logo)
      return api.post('/api/business/businesses/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { onCreated(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl my-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Référencer mon entreprise</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nom de l'entreprise"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description" rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange resize-none" />

        {/* Logo upload */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Logo (optionnel)</label>
          {logoPreview ? (
            <div className="relative w-20 h-20">
              <img src={logoPreview} alt="logo" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
              <button onClick={() => { setLogo(null); setLogoPreview(null) }}
                className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 text-gray-500 rounded-full p-0.5 hover:bg-gray-100">
                <X size={10} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-ci-orange transition">
              <span className="text-[10px] text-gray-400 text-center leading-tight px-1">Ajouter logo</span>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange">
            {Object.entries(categoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Téléphone"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ville"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
          <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Pays"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        </div>
        <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="Site web (https://...)"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email de contact"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.name || create.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? 'Ajout...' : 'Référencer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} className={cn(i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200')} />
      ))}
    </div>
  )
}

export default function BusinessPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery<{ results: Business[] }>({
    queryKey: ['businesses', category, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      return api.get(`/api/business/businesses/?${params}`).then(r => r.data)
    },
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const businesses = data?.results ?? []

  return (
    <AppLayout title="Business" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      {showCreate && (
        <CreateBusinessModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['businesses'] })}
        />
      )}

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-ci-orange to-amber-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Business — Annuaire des entreprises</p>
              <h2 className="text-2xl font-black mb-2">Soutenez le business ivoirien</h2>
              <p className="text-white/80 text-sm max-w-sm">Découvrez et faites confiance aux entrepreneurs de la diaspora.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-2 bg-white text-ci-orange font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-orange-50 transition shadow"
              >
                <Plus size={16} /> Référencer mon entreprise
              </button>
            </div>
            <Briefcase size={40} className="text-white/30 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Entreprises', value: businesses.length, color: 'text-ci-orange' },
            { label: 'Vérifiées', value: businesses.filter(b => b.is_verified).length, color: 'text-green-600' },
            { label: 'Pays', value: new Set(businesses.map(b => b.country).filter(Boolean)).size, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card text-center">
              <div className={cn('text-xl font-black', s.color)}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une entreprise..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange bg-white"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCategory('')}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', !category ? 'bg-ci-orange text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
          >
            Tous
          </button>
          {Object.entries(categoryLabels).map(([v, l]) => (
            <button key={v} onClick={() => setCategory(v === category ? '' : v)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', category === v ? 'bg-ci-orange text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune entreprise référencée</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-ci-orange font-medium hover:underline">Soyez le premier</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map(b => (
              <div key={b.id} onClick={() => router.push(`/business/${b.id}`)} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow flex flex-col cursor-pointer">
                <div className="flex items-start gap-3 mb-3">
                  {b.logo ? (
                    <img src={b.logo} alt={b.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-ci-orange/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase size={16} className="text-ci-orange" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{b.name}</h3>
                      {b.is_verified && <BadgeCheck size={13} className="text-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{b.owner.first_name} {b.owner.last_name}</p>
                  </div>
                  <span className={cn('text-[11px] font-semibold px-2 py-1 rounded-full flex-shrink-0', categoryColors[b.category] ?? categoryColors.other)}>
                    {categoryLabels[b.category] ?? b.category}
                  </span>
                </div>

                {b.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{b.description}</p>}

                <div className="space-y-1 mb-3">
                  {(b.city || b.country) && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MapPin size={11} /> {[b.city, b.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {b.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Phone size={11} /> {b.phone}
                    </div>
                  )}
                  {b.website && (
                    <a href={b.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-ci-orange hover:underline">
                      <Globe size={11} /> Site web
                    </a>
                  )}
                </div>

                {b.average_rating !== null && (
                  <div className="flex items-center gap-2 mt-auto">
                    <StarRating rating={b.average_rating} />
                    <span className="text-xs text-gray-400">{b.average_rating.toFixed(1)} ({b.review_count} avis)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
