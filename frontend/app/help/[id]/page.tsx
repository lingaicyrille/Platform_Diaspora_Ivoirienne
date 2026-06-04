'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, HandHeart, Clock, CheckCircle, AlertTriangle, Send } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface HelpOffer { id: number; helper: { id: number; first_name: string; last_name: string }; message: string; created_at: string }
interface HelpRequest {
  id: number
  title: string
  description: string
  category: string
  urgency: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved'
  requester: { id: number; first_name: string; last_name: string }
  offers: HelpOffer[]
  offer_count: number
  created_at: string
}

const categoryLabels: Record<string, string> = {
  housing: 'Logement', employment: 'Emploi', legal: 'Juridique',
  medical: 'Médical', education: 'Éducation', financial: 'Financier', other: 'Autre',
}

const urgencyConfig = {
  low: { label: 'Faible urgence', color: 'bg-green-50 text-green-700 border-green-200' },
  medium: { label: 'Urgence modérée', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  high: { label: 'Urgent', color: 'bg-red-50 text-red-700 border-red-200' },
}

const statusConfig = {
  open: { label: 'Ouvert', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  in_progress: { label: 'En cours', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  resolved: { label: 'Résolu', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
}

export default function HelpDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { user, clearAuth } = useAuthStore()
  const requestId = Number(params.id)

  const [offerText, setOfferText] = useState('')

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const { data: req, isLoading } = useQuery<HelpRequest>({
    queryKey: ['help-request', requestId],
    queryFn: () => api.get(`/api/help/requests/${requestId}/`).then(r => r.data),
  })

  const sendOffer = useMutation({
    mutationFn: () => api.post(`/api/help/requests/${requestId}/offer/`, { message: offerText }),
    onSuccess: () => {
      setOfferText('')
      qc.invalidateQueries({ queryKey: ['help-request', requestId] })
      qc.invalidateQueries({ queryKey: ['help-requests'] })
    },
  })

  const resolve = useMutation({
    mutationFn: () => api.post(`/api/help/requests/${requestId}/resolve/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help-request', requestId] })
      qc.invalidateQueries({ queryKey: ['help-requests'] })
    },
  })

  if (isLoading) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-4">
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </AppLayout>
    )
  }

  if (!req) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="text-center py-20 text-gray-500">Demande introuvable.</div>
      </AppLayout>
    )
  }

  const isOwn = req.requester.id === user?.id
  const StatusIcon = statusConfig[req.status].icon
  const alreadyOffered = req.offers.some(o => o.helper.id === user?.id)

  return (
    <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="max-w-2xl mx-auto p-4 lg:p-6 space-y-5">
        {/* Back */}
        <button
          onClick={() => router.push('/help')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft size={16} /> Retour aux demandes
        </button>

        {/* Request card */}
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-black text-gray-900 leading-tight">{req.title}</h1>
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 border',
              urgencyConfig[req.urgency].color,
            )}>
              {urgencyConfig[req.urgency].label}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold', statusConfig[req.status].bg, statusConfig[req.status].color)}>
              <StatusIcon size={12} /> {statusConfig[req.status].label}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {categoryLabels[req.category] ?? req.category}
            </span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">{req.description}</p>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>
              Demandé par <span className="font-semibold text-gray-600">
                {req.requester.first_name} {req.requester.last_name}
              </span>
            </span>
            <span>{new Date(req.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Offers */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HandHeart size={18} className="text-red-500" />
            Offres d'aide
            <span className="ml-1 text-sm font-normal text-gray-400">({req.offer_count})</span>
          </h2>

          {req.offers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune offre d'aide pour le moment. Soyez le premier à aider !</p>
          ) : (
            <div className="space-y-3">
              {req.offers.map(o => (
                <div key={o.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-ci flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {o.helper.first_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 mb-1">
                      {o.helper.first_name} {o.helper.last_name}
                      <span className="ml-2 font-normal text-gray-400">
                        · {new Date(o.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700">{o.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offer form — non-owner, open request, not already offered */}
        {!isOwn && req.status === 'open' && !alreadyOffered && (
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-3">
            <h2 className="font-bold text-gray-900">Proposer votre aide</h2>
            <textarea
              value={offerText}
              onChange={e => setOfferText(e.target.value)}
              placeholder="Expliquez comment vous pouvez aider cette personne..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => sendOffer.mutate()}
                disabled={!offerText.trim() || sendOffer.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-40"
              >
                <Send size={15} />
                {sendOffer.isPending ? 'Envoi...' : 'Envoyer mon aide'}
              </button>
            </div>
          </div>
        )}

        {!isOwn && req.status === 'open' && alreadyOffered && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center text-sm text-green-700 font-medium">
            <CheckCircle size={16} className="inline mr-2" />
            Vous avez déjà proposé votre aide pour cette demande.
          </div>
        )}

        {/* Resolve — owner, open request */}
        {isOwn && req.status === 'open' && (
          <div className="bg-white rounded-2xl shadow-card p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Votre problème est résolu ?</p>
              <p className="text-xs text-gray-400 mt-0.5">Marquez cette demande comme résolue pour informer la communauté.</p>
            </div>
            <button
              onClick={() => resolve.mutate()}
              disabled={resolve.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-40 flex-shrink-0 ml-4"
            >
              <CheckCircle size={15} />
              {resolve.isPending ? 'Résolution...' : 'Marquer résolu'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
