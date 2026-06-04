'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HandHeart, Plus, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, Send, X } from 'lucide-react'
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
  low: { label: 'Faible', color: 'bg-green-50 text-green-700' },
  medium: { label: 'Moyen', color: 'bg-yellow-50 text-yellow-700' },
  high: { label: 'Urgent', color: 'bg-red-50 text-red-700' },
}

const statusConfig = {
  open: { label: 'Ouvert', icon: Clock, color: 'text-blue-500' },
  in_progress: { label: 'En cours', icon: AlertTriangle, color: 'text-yellow-500' },
  resolved: { label: 'Résolu', icon: CheckCircle, color: 'text-green-500' },
}

function CreateRequestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'other', urgency: 'medium' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const create = useMutation({
    mutationFn: () => api.post('/api/help/requests/', form),
    onSuccess: () => { onCreated(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Demander de l'aide</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titre de votre demande"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Décrivez votre situation..." rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500">
            {Object.entries(categoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={form.urgency} onChange={e => set('urgency', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500">
            <option value="low">Faible</option>
            <option value="medium">Moyen</option>
            <option value="high">Urgent</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.title || !form.description || create.isPending}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-40"
          >
            {create.isPending ? 'Envoi...' : 'Publier la demande'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HelpPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [offerText, setOfferText] = useState('')
  const [offerTarget, setOfferTarget] = useState<number | null>(null)

  const { data, isLoading } = useQuery<{ results: HelpRequest[] }>({
    queryKey: ['help-requests', category, urgency],
    queryFn: () => {
      const params = new URLSearchParams({ status: 'open' })
      if (category) params.set('category', category)
      if (urgency) params.set('urgency', urgency)
      return api.get(`/api/help/requests/?${params}`).then(r => r.data)
    },
  })

  const sendOffer = useMutation({
    mutationFn: (id: number) => api.post(`/api/help/requests/${id}/offer/`, { message: offerText }),
    onSuccess: () => { setOfferText(''); setOfferTarget(null); qc.invalidateQueries({ queryKey: ['help-requests'] }) },
  })

  const resolve = useMutation({
    mutationFn: (id: number) => api.post(`/api/help/requests/${id}/resolve/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['help-requests'] }),
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const requests = data?.results ?? []

  return (
    <AppLayout title="Aide & Solidarité" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      {showCreate && (
        <CreateRequestModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['help-requests'] })}
        />
      )}

      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Aide & Solidarité — Entraide communautaire</p>
              <h2 className="text-2xl font-black mb-2">Aidez-vous mutuellement</h2>
              <p className="text-white/80 text-sm max-w-sm">Logement, emploi, conseil juridique — la communauté est là pour vous.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-2 bg-white text-red-500 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-red-50 transition shadow"
              >
                <Plus size={16} /> Demander de l'aide
              </button>
            </div>
            <HandHeart size={40} className="text-white/30 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Demandes ouvertes', value: requests.filter(r => r.status === 'open').length, color: 'text-blue-600' },
            { label: 'Urgentes', value: requests.filter(r => r.urgency === 'high').length, color: 'text-red-500' },
            { label: 'Avec offres', value: requests.filter(r => r.offer_count > 0).length, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card text-center">
              <div className={cn('text-xl font-black', s.color)}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => setCategory('')}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', !category ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
            Toutes catégories
          </button>
          {Object.entries(categoryLabels).map(([v, l]) => (
            <button key={v} onClick={() => setCategory(v === category ? '' : v)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', category === v ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              {l}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {(['', 'high', 'medium', 'low'] as const).map(u => (
              <button key={u} onClick={() => setUrgency(u === urgency ? '' : u)}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition', urgency === u ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
                {u === '' ? 'Toute urgence' : urgencyConfig[u].label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <HandHeart size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune demande d'aide ouverte</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-red-500 font-medium hover:underline">
              Poster la première demande
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const isOwn = req.requester.id === user?.id
              const isExpanded = expanded === req.id
              const StatusIcon = statusConfig[req.status].icon

              return (
                <div key={req.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-3">
                        <Link href={`/help/${req.id}`} className="font-bold text-gray-900 text-sm hover:text-red-500 transition">
                          {req.title}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {req.requester.first_name} {req.requester.last_name} ·{' '}
                          {new Date(req.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span className={cn('text-[11px] font-semibold px-2 py-1 rounded-full', urgencyConfig[req.urgency].color)}>
                          {urgencyConfig[req.urgency].label}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {categoryLabels[req.category] ?? req.category}
                        </span>
                      </div>
                    </div>

                    <p className={cn('text-sm text-gray-600 mb-3', isExpanded ? '' : 'line-clamp-2')}>{req.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className={cn('flex items-center gap-1', statusConfig[req.status].color)}>
                          <StatusIcon size={12} /> {statusConfig[req.status].label}
                        </span>
                        {req.offer_count > 0 && (
                          <span>{req.offer_count} offre{req.offer_count > 1 ? 's' : ''} d'aide</span>
                        )}
                      </div>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : req.id)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Réduire' : 'Voir plus'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
                      {/* Existing offers */}
                      {req.offers.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700">Offres d'aide reçues</p>
                          {req.offers.map(o => (
                            <div key={o.id} className="bg-white rounded-xl p-3 text-sm border border-gray-100">
                              <p className="font-semibold text-gray-900 text-xs mb-1">
                                {o.helper.first_name} {o.helper.last_name}
                              </p>
                              <p className="text-gray-600 text-xs">{o.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Offer form (not own request) */}
                      {!isOwn && req.status === 'open' && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Proposer votre aide</p>
                          {offerTarget === req.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={offerText} onChange={e => setOfferText(e.target.value)}
                                placeholder="Comment pouvez-vous aider ?" rows={3}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none bg-white"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => { setOfferTarget(null); setOfferText('') }}
                                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100">
                                  Annuler
                                </button>
                                <button
                                  onClick={() => sendOffer.mutate(req.id)}
                                  disabled={!offerText.trim() || sendOffer.isPending}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition disabled:opacity-40"
                                >
                                  <Send size={12} /> {sendOffer.isPending ? 'Envoi...' : 'Envoyer'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setOfferTarget(req.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition"
                            >
                              <HandHeart size={13} /> Je peux aider
                            </button>
                          )}
                        </div>
                      )}

                      {/* Resolve (own request) */}
                      {isOwn && req.status === 'open' && (
                        <button
                          onClick={() => resolve.mutate(req.id)}
                          disabled={resolve.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition disabled:opacity-40"
                        >
                          <CheckCircle size={13} /> Marquer comme résolu
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
