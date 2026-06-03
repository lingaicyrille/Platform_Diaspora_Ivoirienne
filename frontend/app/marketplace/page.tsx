'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, Plus, Tag, MapPin, Sparkles, X } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Listing {
  id: number
  title: string
  seller: { id: number; first_name: string; last_name: string }
  description: string
  price: string
  currency: string
  category: string
  condition: 'new' | 'used'
  image: string | null
  location: string
  is_active: boolean
  offer_count: number
  created_at: string
}

const categoryLabels: Record<string, string> = {
  electronics: 'Électronique', clothing: 'Vêtements', furniture: 'Mobilier',
  vehicles: 'Véhicules', food: 'Alimentation', services: 'Services', other: 'Autre',
}

function CreateListingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', price: '', currency: 'EUR',
    category: 'other', condition: 'used', location: '',
  })
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImage(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (image) fd.append('image', image)
      return api.post('/api/marketplace/listings/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { onCreated(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl my-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Publier une annonce</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titre de l'annonce"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description" rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange resize-none" />

        {/* Image upload */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Photo (optionnel)</label>
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="preview" className="w-full h-36 object-cover rounded-xl" />
              <button onClick={() => { setImage(null); setImagePreview(null) }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-pink-400 transition">
              <span className="text-xs text-gray-400">Cliquez pour ajouter une photo</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input value={form.price} onChange={e => set('price', e.target.value)} placeholder="Prix" type="number"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange">
            {['EUR', 'XOF', 'USD', 'GBP', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange">
            {Object.entries(categoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={form.condition} onChange={e => set('condition', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange">
            <option value="used">Occasion</option>
            <option value="new">Neuf</option>
          </select>
        </div>
        <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Localisation (ex: Paris, France)"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.title || !form.price || create.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  )
}

function OfferModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  const makeOffer = useMutation({
    mutationFn: () => api.post(`/api/marketplace/listings/${listing.id}/make_offer/`, {
      amount: parseFloat(amount), message,
    }),
    onSuccess: onClose,
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Faire une offre</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Article</p>
          <p className="text-sm font-semibold text-gray-900">{listing.title}</p>
          <p className="text-xs text-ci-orange font-bold mt-1">{listing.price} {listing.currency}</p>
        </div>
        <div className="flex gap-2">
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Votre offre" type="number"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
          <span className="self-center text-sm font-semibold text-gray-600">{listing.currency}</span>
        </div>
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message au vendeur (optionnel)" rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange resize-none" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => makeOffer.mutate()}
            disabled={!amount || makeOffer.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {makeOffer.isPending ? 'Envoi...' : 'Envoyer l\'offre'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [offerTarget, setOfferTarget] = useState<Listing | null>(null)

  const { data, isLoading } = useQuery<{ results: Listing[] }>({
    queryKey: ['listings', category, condition],
    queryFn: () => {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (condition) params.set('condition', condition)
      return api.get(`/api/marketplace/listings/?${params}`).then(r => r.data)
    },
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const listings = data?.results ?? []

  return (
    <AppLayout title="Marketplace" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      {showCreate && (
        <CreateListingModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['listings'] })}
        />
      )}
      {offerTarget && (
        <OfferModal listing={offerTarget} onClose={() => setOfferTarget(null)} />
      )}

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-pink-600 to-rose-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Marketplace — Achats & Ventes</p>
              <h2 className="text-2xl font-black mb-2">Le marché de la diaspora</h2>
              <p className="text-white/80 text-sm max-w-sm">Achetez et vendez en toute confiance au sein de la communauté.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-2 bg-white text-pink-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-pink-50 transition shadow"
              >
                <Plus size={16} /> Publier une annonce
              </button>
            </div>
            <ShoppingBag size={40} className="text-white/30 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setCategory('')}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', !category ? 'bg-pink-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
            Tout
          </button>
          {Object.entries(categoryLabels).map(([v, l]) => (
            <button key={v} onClick={() => setCategory(v === category ? '' : v)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', category === v ? 'bg-pink-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              {l}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {(['', 'new', 'used'] as const).map(c => (
              <button key={c} onClick={() => setCondition(c)}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', condition === c ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
                {c === '' ? 'Tout état' : c === 'new' ? 'Neuf' : 'Occasion'}
              </button>
            ))}
          </div>
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune annonce disponible</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-pink-600 font-medium hover:underline">Publier la première annonce</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(l => {
              const isOwn = l.seller.id === user?.id
              return (
                <div key={l.id} onClick={() => router.push(`/marketplace/${l.id}`)} className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow flex flex-col cursor-pointer overflow-hidden">
                  {l.image ? (
                    <img src={l.image} alt={l.title} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
                      <ShoppingBag size={28} className="text-pink-300" />
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                      l.condition === 'new' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600',
                    )}>
                      {l.condition === 'new' ? 'Neuf' : 'Occasion'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(l.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm mb-1">{l.title}</h3>
                  {l.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{l.description}</p>}

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Tag size={11} className="text-gray-400" />
                      {categoryLabels[l.category] ?? l.category}
                    </div>
                    {l.location && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin size={11} /> {l.location}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-lg font-black text-gray-900">
                      {parseFloat(l.price).toLocaleString('fr-FR')} <span className="text-sm font-semibold text-gray-500">{l.currency}</span>
                    </span>
                    {!isOwn && (
                      <button
                        onClick={e => { e.stopPropagation(); setOfferTarget(l) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-ci text-white rounded-xl text-xs font-semibold hover:opacity-90 transition"
                      >
                        <Sparkles size={11} /> Offre
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400 mt-2">
                    {isOwn ? 'Votre annonce' : `${l.seller.first_name} ${l.seller.last_name}`}
                  </p>
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
