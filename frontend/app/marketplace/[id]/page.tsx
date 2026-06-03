'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, ShoppingBag, MapPin, Tag, User, Send,
  CheckCircle, XCircle, Clock,
} from 'lucide-react'
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
  images: { id: number; image: string }[]
  location: string
  is_active: boolean
  offer_count: number
  created_at: string
}

interface Offer {
  id: number
  buyer: { id: number; first_name: string; last_name: string }
  listing: number
  amount: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

const categoryLabels: Record<string, string> = {
  electronics: 'Électronique', clothing: 'Vêtements', furniture: 'Mobilier',
  vehicles: 'Véhicules', food: 'Alimentation', services: 'Services', other: 'Autre',
}

const offerStatusConfig = {
  pending:  { label: 'En attente', icon: Clock,        color: 'text-yellow-600 bg-yellow-50' },
  accepted: { label: 'Acceptée',   icon: CheckCircle,  color: 'text-green-600 bg-green-50' },
  rejected: { label: 'Refusée',    icon: XCircle,      color: 'text-red-500 bg-red-50' },
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { user, clearAuth } = useAuthStore()
  const listingId = Number(params.id)

  const [offerAmount, setOfferAmount] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [activeImg, setActiveImg] = useState(0)

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: ['listing', listingId],
    queryFn: () => api.get(`/api/marketplace/listings/${listingId}/`).then(r => r.data),
  })

  const { data: offersData } = useQuery<{ results: Offer[] }>({
    queryKey: ['listing-offers', listingId],
    queryFn: () => api.get(`/api/marketplace/offers/?listing=${listingId}`).then(r => r.data),
    enabled: !!listing && listing.seller.id === user?.id,
  })

  const makeOffer = useMutation({
    mutationFn: () => api.post(`/api/marketplace/listings/${listingId}/make_offer/`, {
      amount: parseFloat(offerAmount),
      message: offerMessage,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing', listingId] })
      setOfferAmount('')
      setOfferMessage('')
    },
  })

  const updateOffer = useMutation({
    mutationFn: ({ offerId, status }: { offerId: number; status: string }) =>
      api.patch(`/api/marketplace/offers/${offerId}/`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing-offers', listingId] }),
  })

  if (isLoading) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </AppLayout>
    )
  }

  if (!listing) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
          Annonce introuvable.
        </div>
      </AppLayout>
    )
  }

  const isOwn = user?.id === listing.seller.id
  const offers = offersData?.results ?? []

  return (
    <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        {/* Image gallery */}
        {listing.images.length > 0 ? (
          <div className="mb-5">
            <img
              src={listing.images[activeImg]?.image}
              alt={listing.title}
              className="w-full h-72 object-cover rounded-2xl"
            />
            {listing.images.length > 1 && (
              <div className="flex gap-2 mt-2">
                {listing.images.map((img, idx) => (
                  <button key={img.id} onClick={() => setActiveImg(idx)}
                    className={cn('w-14 h-14 rounded-xl overflow-hidden border-2 transition', idx === activeImg ? 'border-pink-500' : 'border-transparent')}>
                    <img src={img.image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : listing.image ? (
          <img src={listing.image} alt={listing.title} className="w-full h-72 object-cover rounded-2xl mb-5" />
        ) : (
          <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center mb-5">
            <ShoppingBag size={48} className="text-pink-300" />
          </div>
        )}

        {/* Title & price */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                  listing.condition === 'new' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600',
                )}>
                  {listing.condition === 'new' ? 'Neuf' : 'Occasion'}
                </span>
                <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {categoryLabels[listing.category] ?? listing.category}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{listing.title}</h1>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-gray-900">
                {parseFloat(listing.price).toLocaleString('fr-FR')}
              </p>
              <p className="text-sm font-semibold text-gray-500">{listing.currency}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-500 pt-3 border-t border-gray-100">
            <span className="flex items-center gap-1.5">
              <User size={13} className="text-ci-green" />
              {isOwn ? 'Votre annonce' : `${listing.seller.first_name} ${listing.seller.last_name}`}
            </span>
            {listing.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-ci-green" />
                {listing.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Tag size={13} className="text-ci-green" />
              {listing.offer_count} offre{listing.offer_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Make an offer (non-owners only) */}
        {!isOwn && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Faire une offre</h2>
            <div className="flex gap-2 mb-3">
              <input
                value={offerAmount}
                onChange={e => setOfferAmount(e.target.value)}
                type="number"
                placeholder="Votre offre"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
              />
              <span className="self-center text-sm font-semibold text-gray-600 px-1">{listing.currency}</span>
            </div>
            <textarea
              value={offerMessage}
              onChange={e => setOfferMessage(e.target.value)}
              placeholder="Message au vendeur (optionnel)"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 resize-none mb-3"
            />
            <button
              onClick={() => makeOffer.mutate()}
              disabled={!offerAmount || makeOffer.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition"
            >
              <Send size={14} />
              {makeOffer.isPending ? 'Envoi...' : "Envoyer l'offre"}
            </button>
            {makeOffer.isSuccess && (
              <p className="text-xs text-green-600 mt-2">Offre envoyée avec succès !</p>
            )}
          </div>
        )}

        {/* Offers received (owner only) */}
        {isOwn && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Offres reçues ({offers.length})
            </h2>
            {offers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune offre pour l'instant.</p>
            ) : (
              <div className="space-y-3">
                {offers.map(offer => {
                  const cfg = offerStatusConfig[offer.status]
                  return (
                    <div key={offer.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center">
                            <User size={13} className="text-pink-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {offer.buyer.first_name} {offer.buyer.last_name}
                          </span>
                        </div>
                        <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', cfg.color)}>
                          <cfg.icon size={11} /> {cfg.label}
                        </span>
                      </div>
                      <p className="text-base font-black text-gray-900 ml-9">
                        {parseFloat(offer.amount).toLocaleString('fr-FR')} {listing.currency}
                      </p>
                      {offer.message && (
                        <p className="text-xs text-gray-500 mt-1 ml-9">"{offer.message}"</p>
                      )}
                      {offer.status === 'pending' && (
                        <div className="flex gap-2 mt-3 ml-9">
                          <button
                            onClick={() => updateOffer.mutate({ offerId: offer.id, status: 'accepted' })}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition"
                          >
                            <CheckCircle size={12} /> Accepter
                          </button>
                          <button
                            onClick={() => updateOffer.mutate({ offerId: offer.id, status: 'rejected' })}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                          >
                            <XCircle size={12} /> Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
