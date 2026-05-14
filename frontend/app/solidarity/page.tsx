'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HandHeart, Plus, Users, Heart, Target, Clock } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface SolidarityFund {
  id: number
  title: string
  creator: { id: number; first_name: string; last_name: string }
  description: string
  target_amount: string
  collected_amount: string
  progress_pct: number
  currency: string
  deadline: string | null
  category: string
  status: string
  cover_image: string | null
  beneficiary_name: string
  contributor_count: number
  created_at: string
}

const categoryLabel: Record<string, string> = {
  medical: 'Médical',
  education: 'Éducation',
  emergency: 'Urgence',
  repatriation: 'Rapatriement',
  funeral: 'Obsèques',
  other: 'Autre',
}

const categoryColor: Record<string, string> = {
  medical: 'bg-red-50 text-red-600',
  education: 'bg-blue-50 text-blue-600',
  emergency: 'bg-orange-50 text-orange-600',
  repatriation: 'bg-purple-50 text-purple-600',
  funeral: 'bg-gray-100 text-gray-600',
  other: 'bg-ci-green-light text-ci-green',
}

function ContributeModal({ fund, onClose, onDone }: { fund: SolidarityFund; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [anon, setAnon] = useState(false)

  const contribute = useMutation({
    mutationFn: () => api.post(`/api/solidarity/funds/${fund.id}/contribute/`, {
      amount: parseFloat(amount),
      message,
      is_anonymous: anon,
    }),
    onSuccess: () => { onDone(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900">Contribuer</h3>
        <p className="text-sm text-gray-500">{fund.title}</p>
        <div className="flex gap-2 items-center">
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            type="number"
            placeholder="Montant"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange"
          />
          <span className="text-sm font-semibold text-gray-700 w-10">{fund.currency}</span>
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Message (optionnel)"
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} className="rounded" />
          Contribuer anonymement
        </label>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => contribute.mutate()}
            disabled={!amount || parseFloat(amount) <= 0 || contribute.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {contribute.isPending ? 'Envoi...' : `Donner ${amount || '0'} ${fund.currency}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateFundModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', target_amount: '', currency: 'EUR',
    category: 'other', deadline: '', beneficiary_name: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const create = useMutation({
    mutationFn: () => api.post('/api/solidarity/funds/', {
      ...form,
      target_amount: parseFloat(form.target_amount),
      deadline: form.deadline || null,
    }),
    onSuccess: () => { onCreated(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900">Créer un fonds de solidarité</h3>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titre du fonds"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description et contexte" rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <input value={form.beneficiary_name} onChange={e => set('beneficiary_name', e.target.value)} placeholder="Bénéficiaire (nom)"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.target_amount} onChange={e => set('target_amount', e.target.value)} type="number" placeholder="Objectif"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange">
            <option value="EUR">EUR</option>
            <option value="XOF">XOF</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange">
          {Object.entries(categoryLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Date limite (optionnel)</label>
          <input value={form.deadline} onChange={e => set('deadline', e.target.value)} type="date"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.title || !form.description || !form.target_amount || create.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? 'Création...' : 'Créer le fonds'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SolidarityPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [contributing, setContributing] = useState<SolidarityFund | null>(null)

  const { data, isLoading } = useQuery<{ results: SolidarityFund[] }>({
    queryKey: ['solidarity-funds'],
    queryFn: () => api.get('/api/solidarity/funds/').then(r => r.data),
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const funds = data?.results ?? []
  const active = funds.filter(f => f.status === 'active')

  return (
    <AppLayout title="Solidarité" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      {showCreate && (
        <CreateFundModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['solidarity-funds'] })}
        />
      )}
      {contributing && (
        <ContributeModal
          fund={contributing}
          onClose={() => setContributing(null)}
          onDone={() => qc.invalidateQueries({ queryKey: ['solidarity-funds'] })}
        />
      )}

      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Solidarité communautaire</p>
              <h2 className="text-2xl font-black mb-2">Ensemble on est plus fort</h2>
              <p className="text-white/80 text-sm max-w-sm">
                Soutenez les membres de la diaspora dans les moments difficiles.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 bg-white text-red-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-red-50 transition shadow"
                >
                  <Plus size={16} />
                  Créer un fonds
                </button>
              </div>
            </div>
            <HandHeart size={48} className="text-white/30 flex-shrink-0" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Fonds actifs', value: active.length, icon: Heart, color: 'text-red-500 bg-red-50' },
            { label: 'Contributeurs', value: funds.reduce((s, f) => s + f.contributor_count, 0), icon: Users, color: 'text-blue-500 bg-blue-50' },
            { label: 'Fonds clôturés', value: funds.filter(f => f.status === 'completed').length, icon: Target, color: 'text-ci-green bg-ci-green-light' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', s.color)}>
                <s.icon size={16} />
              </div>
              <div className="text-xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Fund list */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : funds.length === 0 ? (
          <div className="text-center py-20">
            <HandHeart size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun fonds actif</p>
            <p className="text-sm text-gray-400 mt-1">Créez le premier fonds de solidarité !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {funds.map(fund => (
              <div key={fund.id} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex items-start gap-4">
                  {fund.cover_image ? (
                    <img src={fund.cover_image} alt={fund.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <HandHeart size={24} className="text-red-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{fund.title}</h3>
                        {fund.beneficiary_name && (
                          <p className="text-xs text-gray-500">Pour : {fund.beneficiary_name}</p>
                        )}
                      </div>
                      <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0', categoryColor[fund.category] ?? categoryColor.other)}>
                        {categoryLabel[fund.category]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{fund.description}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-bold text-gray-900">
                      {parseFloat(fund.collected_amount).toLocaleString()} {fund.currency}
                    </span>
                    <span className="text-gray-500">
                      objectif: {parseFloat(fund.target_amount).toLocaleString()} {fund.currency}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-pink-500 rounded-full transition-all"
                      style={{ width: `${fund.progress_pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {fund.contributor_count} contributeur{fund.contributor_count !== 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold text-red-500">{fund.progress_pct}%</span>
                    {fund.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(fund.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>

                {fund.status === 'active' && (
                  <button
                    onClick={() => setContributing(fund)}
                    className="mt-4 w-full py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <Heart size={15} />
                    Contribuer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
