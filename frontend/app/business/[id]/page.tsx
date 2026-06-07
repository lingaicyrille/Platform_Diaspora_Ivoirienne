'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Briefcase, MapPin, Phone, Globe, Mail, BadgeCheck,
  Star, ExternalLink, User, Send,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

function TrustBadge({ score }: { score: number }) {
  const level = score >= 80 ? { label: 'Expert', color: 'text-amber-600 bg-amber-50' }
    : score >= 50 ? { label: 'Confirmé', color: 'text-blue-600 bg-blue-50' }
    : score >= 20 ? { label: 'Actif', color: 'text-green-600 bg-green-50' }
    : { label: 'Nouveau', color: 'text-gray-500 bg-gray-100' }
  return (
    <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1', level.color)}>
      <Star size={10} /> {level.label} · {score} pts
    </span>
  )
}

interface Business {
  id: number
  name: string
  owner: { id: number; first_name: string; last_name: string; trust_score: number }
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
  average_rating: number
  review_count: number
  created_at: string
}

interface Review {
  id: number
  author: { id: number; first_name: string; last_name: string }
  rating: number
  comment: string
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

function StarRating({ rating, interactive = false, onRate }: {
  rating: number
  interactive?: boolean
  onRate?: (r: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={interactive ? 22 : 13}
          onClick={() => interactive && onRate?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={cn(
            interactive && 'cursor-pointer transition-colors',
            i <= (interactive ? hovered || rating : Math.round(rating))
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 fill-gray-200',
          )}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-b border-gray-100 last:border-0 py-4">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-ci-orange/10 flex items-center justify-center">
            <User size={13} className="text-ci-orange" />
          </div>
          <span className="text-sm font-medium text-gray-800">
            {review.author.first_name} {review.author.last_name}
          </span>
        </div>
        <StarRating rating={review.rating} />
      </div>
      {review.comment && <p className="text-sm text-gray-600 mt-1 ml-9">{review.comment}</p>}
      <p className="text-xs text-gray-400 mt-1 ml-9">
        {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { user, clearAuth } = useAuthStore()
  const businessId = Number(params.id)

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')

  const { data: business, isLoading } = useQuery<Business>({
    queryKey: ['business', businessId],
    queryFn: () => api.get(`/api/business/businesses/${businessId}/`).then(r => r.data),
  })

  const { data: reviewsData } = useQuery<{ results: Review[] }>({
    queryKey: ['business-reviews', businessId],
    queryFn: () => api.get(`/api/business/reviews/?business=${businessId}`).then(r => r.data),
    enabled: !!businessId,
  })

  const submitReview = useMutation({
    mutationFn: () => api.post('/api/business/reviews/', {
      business: businessId,
      rating: reviewRating,
      comment: reviewComment,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business', businessId] })
      qc.invalidateQueries({ queryKey: ['business-reviews', businessId] })
      setReviewRating(0)
      setReviewComment('')
    },
  })

  const reviews = reviewsData?.results ?? []
  const isOwner = user && business && user.id === business.owner.id
  const hasReviewed = user && reviews.some(r => r.author.id === user.id)
  const canReview = !isOwner && !hasReviewed

  if (isLoading) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </AppLayout>
    )
  }

  if (!business) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
          Entreprise introuvable.
        </div>
      </AppLayout>
    )
  }

  const mapQuery = [business.address, business.city, business.country].filter(Boolean).join(', ')

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

        {/* Header card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <div className="flex items-start gap-4">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-ci-orange/10 flex items-center justify-center flex-shrink-0">
                <Briefcase size={24} className="text-ci-orange" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
                {business.is_verified && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <BadgeCheck size={12} /> Vérifiée
                  </span>
                )}
              </div>
              <span className={cn('inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1', categoryColors[business.category] ?? categoryColors.other)}>
                {categoryLabels[business.category] ?? business.category}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={business.average_rating} />
                <span className="text-xs text-gray-500">
                  {business.average_rating.toFixed(1)} ({business.review_count} avis)
                </span>
              </div>
            </div>
          </div>

          {business.description && (
            <p className="text-sm text-gray-700 mt-4 leading-relaxed">{business.description}</p>
          )}
        </div>

        {/* Contact & location */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Coordonnées</h2>

          {(business.address || business.city || business.country) && (
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-ci-green mt-0.5 shrink-0" />
              <div>
                {business.address && <p className="text-sm text-gray-700">{business.address}</p>}
                <p className="text-sm text-gray-500">{[business.city, business.country].filter(Boolean).join(', ')}</p>
                {mapQuery && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-ci-green hover:underline mt-0.5"
                  >
                    Voir sur la carte <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          )}

          {business.phone && (
            <div className="flex items-center gap-3">
              <Phone size={15} className="text-ci-green shrink-0" />
              <a href={`tel:${business.phone}`} className="text-sm text-gray-700 hover:text-ci-green">{business.phone}</a>
            </div>
          )}

          {business.email && (
            <div className="flex items-center gap-3">
              <Mail size={15} className="text-ci-green shrink-0" />
              <a href={`mailto:${business.email}`} className="text-sm text-gray-700 hover:text-ci-green">{business.email}</a>
            </div>
          )}

          {business.website && (
            <div className="flex items-center gap-3">
              <Globe size={15} className="text-ci-green shrink-0" />
              <a href={business.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-ci-green hover:underline">
                {business.website.replace(/^https?:\/\//, '')} <ExternalLink size={11} />
              </a>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
            <User size={15} className="text-ci-green shrink-0" />
            <p className="text-sm text-gray-700 flex-1">
              Propriétaire : <span className="font-medium">{business.owner.first_name} {business.owner.last_name}</span>
            </p>
            <TrustBadge score={business.owner.trust_score ?? 0} />
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Avis clients ({business.review_count})
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Aucun avis pour l'instant.</p>
          ) : (
            reviews.map(r => <ReviewCard key={r.id} review={r} />)
          )}
        </div>

        {/* Leave a review */}
        {canReview && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Laisser un avis</h2>
            <div className="mb-3">
              <StarRating rating={reviewRating} interactive onRate={setReviewRating} />
            </div>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder="Partagez votre expérience (optionnel)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange resize-none mb-3"
            />
            <button
              onClick={() => submitReview.mutate()}
              disabled={reviewRating === 0 || submitReview.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition"
            >
              <Send size={14} />
              {submitReview.isPending ? 'Envoi...' : 'Publier l\'avis'}
            </button>
          </div>
        )}

        {hasReviewed && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-700 text-center">
            Vous avez déjà évalué cette entreprise.
          </div>
        )}
      </div>
    </AppLayout>
  )
}
