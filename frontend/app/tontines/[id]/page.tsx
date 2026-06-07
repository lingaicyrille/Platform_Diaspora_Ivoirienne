'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Coins, Users, Calendar, CheckCircle, Clock,
  AlertTriangle, Lock, Unlock, Send,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Member { id: number; first_name: string; last_name: string }
interface Contribution { id: number; contributor: Member; amount: string; paid_at: string; note: string }
interface Round {
  id: number
  round_number: number
  beneficiary: Member | null
  start_date: string
  end_date: string
  status: 'pending' | 'active' | 'completed'
  contributions: Contribution[]
  collected_amount: string
}
interface Membership { id: number; member: Member; joined_at: string; position: number | null }
interface TontineDetail {
  id: number
  name: string
  description: string
  organizer: Member
  contribution_amount: string
  currency: string
  frequency: string
  start_date: string
  max_members: number
  status: string
  member_count: number
  is_member: boolean
  memberships: Membership[]
  rounds: Round[]
}

const freqLabel: Record<string, string> = {
  weekly: 'Hebdomadaire', biweekly: 'Bimensuel', monthly: 'Mensuel',
}
const roundStatusConfig = {
  pending: { label: 'À venir', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50' },
  active: { label: 'En cours', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  completed: { label: 'Terminé', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
}

export default function TontineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { user, clearAuth } = useAuthStore()
  const tontineId = Number(params.id)

  const [contributeRound, setContributeRound] = useState<Round | null>(null)
  const [contribNote, setContribNote] = useState('')

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const { data: tontine, isLoading } = useQuery<TontineDetail>({
    queryKey: ['tontine', tontineId],
    queryFn: () => api.get(`/api/tontine/tontines/${tontineId}/`).then(r => r.data),
  })

  const join = useMutation({
    mutationFn: () => api.post(`/api/tontine/tontines/${tontineId}/join/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tontine', tontineId] }),
  })

  const leave = useMutation({
    mutationFn: () => api.post(`/api/tontine/tontines/${tontineId}/leave/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tontine', tontineId] }),
  })

  const contribute = useMutation({
    mutationFn: (roundId: number) =>
      api.post(`/api/tontine/tontines/${tontineId}/contribute/${roundId}/`, {
        amount: tontine!.contribution_amount,
        note: contribNote,
      }),
    onSuccess: () => {
      setContributeRound(null)
      setContribNote('')
      qc.invalidateQueries({ queryKey: ['tontine', tontineId] })
    },
  })

  if (isLoading) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto p-4 lg:p-6 space-y-4">
          <Skeleton className="h-8 w-32 rounded-xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </AppLayout>
    )
  }

  if (!tontine) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="text-center py-20 text-gray-500">Tontine introuvable.</div>
      </AppLayout>
    )
  }

  const isOrganizer = tontine.organizer.id === user?.id
  const totalCollected = tontine.rounds.reduce((s, r) => s + parseFloat(r.collected_amount || '0'), 0)

  return (
    <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="max-w-3xl mx-auto p-4 lg:p-6 space-y-5">
        {/* Back */}
        <button
          onClick={() => router.push('/tontines')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft size={16} /> Retour aux tontines
        </button>

        {/* Header card */}
        <div className="bg-gradient-to-br from-yellow-500 to-ci-orange rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-medium mb-1">{freqLabel[tontine.frequency]}</p>
              <h1 className="text-xl font-black mb-1 leading-snug">{tontine.name}</h1>
              {tontine.description && <p className="text-white/80 text-sm line-clamp-2">{tontine.description}</p>}
            </div>
            <Coins size={32} className="text-white/30 flex-shrink-0 ml-3" />
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div>
              <p className="text-white/60 text-xs">Cotisation</p>
              <p className="font-black">{tontine.contribution_amount} {tontine.currency}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Membres</p>
              <p className="font-black">{tontine.member_count}/{tontine.max_members}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Début</p>
              <p className="font-black">{new Date(tontine.start_date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Collecté total</p>
              <p className="font-black">{totalCollected.toLocaleString('fr-FR')} {tontine.currency}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {!isOrganizer && tontine.is_member && (
              <button
                onClick={() => leave.mutate()}
                disabled={leave.isPending}
                className="px-4 py-2 bg-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/30 transition disabled:opacity-40 flex items-center gap-2"
              >
                <Unlock size={14} /> Quitter
              </button>
            )}
            {!tontine.is_member && tontine.member_count < tontine.max_members && tontine.status !== 'completed' && (
              <button
                onClick={() => join.mutate()}
                disabled={join.isPending}
                className="px-4 py-2 bg-white text-ci-orange rounded-xl text-sm font-semibold hover:bg-yellow-50 transition disabled:opacity-40 flex items-center gap-2"
              >
                <Lock size={14} /> Rejoindre
              </button>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={16} className="text-ci-orange" /> Membres ({tontine.member_count})
          </h2>
          <div className="flex flex-wrap gap-2">
            {tontine.memberships.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-ci flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {m.member.first_name[0]}
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {m.member.first_name} {m.member.last_name}
                </span>
                {m.member.id === tontine.organizer.id && (
                  <span className="text-[10px] text-ci-orange font-semibold">Org.</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Round schedule */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-ci-orange" /> Calendrier des tours
          </h2>

          {tontine.rounds.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun tour planifié.</p>
          ) : (
            <div className="space-y-3">
              {tontine.rounds.map(round => {
                const cfg = roundStatusConfig[round.status]
                const StatusIcon = cfg.icon
                const myContrib = round.contributions.find(c => c.contributor.id === user?.id)
                const canContribute = tontine.is_member && round.status === 'active' && !myContrib

                return (
                  <div key={round.id} className={cn('rounded-xl p-4 border', round.status === 'active' ? 'border-amber-200' : 'border-gray-100')}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Tour {round.round_number}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(round.start_date).toLocaleDateString('fr-FR')} → {new Date(round.end_date).toLocaleDateString('fr-FR')}
                        </p>
                        {round.beneficiary && (
                          <p className="text-xs text-ci-orange font-semibold mt-0.5">
                            Bénéficiaire : {round.beneficiary.first_name} {round.beneficiary.last_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-black text-gray-700">
                          {parseFloat(round.collected_amount || '0').toLocaleString('fr-FR')} {tontine.currency}
                        </span>
                        <span className={cn('flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full', cfg.bg, cfg.color)}>
                          <StatusIcon size={11} /> {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Contributions */}
                    {round.contributions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {round.contributions.map(c => (
                          <div key={c.id} className="flex items-center gap-1 text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            <CheckCircle size={9} />
                            {c.contributor.first_name} {c.contributor.last_name}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contribute button */}
                    {canContribute && contributeRound?.id !== round.id && (
                      <button
                        onClick={() => setContributeRound(round)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-ci-orange text-white rounded-xl text-xs font-semibold hover:opacity-90 transition"
                      >
                        <Coins size={12} /> Payer ma cotisation
                      </button>
                    )}

                    {/* Contribute form */}
                    {canContribute && contributeRound?.id === round.id && (
                      <div className="mt-2 space-y-2">
                        <input
                          value={contribNote}
                          onChange={e => setContribNote(e.target.value)}
                          placeholder="Note / référence de paiement (optionnel)"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setContributeRound(null); setContribNote('') }}
                            className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => contribute.mutate(round.id)}
                            disabled={contribute.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-ci-orange text-white rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-40"
                          >
                            <Send size={11} /> {contribute.isPending ? 'Envoi...' : 'Confirmer'}
                          </button>
                        </div>
                      </div>
                    )}

                    {myContrib && (
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                        <CheckCircle size={11} /> Votre cotisation est confirmée
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
