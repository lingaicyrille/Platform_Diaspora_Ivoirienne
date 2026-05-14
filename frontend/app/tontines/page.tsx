'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Coins, Plus, Users, Calendar, TrendingUp, Lock, Unlock, ChevronRight } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Tontine {
  id: number
  name: string
  description: string
  organizer: { id: number; first_name: string; last_name: string }
  contribution_amount: string
  currency: string
  frequency: string
  start_date: string
  max_members: number
  status: string
  member_count: number
  is_member: boolean
  created_at: string
}

const freqLabel: Record<string, string> = {
  weekly: 'Hebdomadaire',
  biweekly: 'Bimensuel',
  monthly: 'Mensuel',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  active: 'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
  paused: 'bg-orange-50 text-orange-600',
}

function CreateTontineModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', description: '', contribution_amount: '', currency: 'EUR',
    frequency: 'monthly', start_date: '', max_members: '12',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const create = useMutation({
    mutationFn: () => api.post('/api/tontine/tontines/', {
      ...form,
      contribution_amount: parseFloat(form.contribution_amount),
      max_members: parseInt(form.max_members),
    }),
    onSuccess: () => { onCreated(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900">Créer une tontine</h3>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nom de la tontine"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description (optionnel)" rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.contribution_amount} onChange={e => set('contribution_amount', e.target.value)} placeholder="Montant (ex: 100)" type="number"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
          <select value={form.currency} onChange={e => set('currency', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange">
            <option value="EUR">EUR</option>
            <option value="XOF">XOF</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select value={form.frequency} onChange={e => set('frequency', e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange">
            <option value="weekly">Hebdomadaire</option>
            <option value="biweekly">Bimensuel</option>
            <option value="monthly">Mensuel</option>
          </select>
          <input value={form.max_members} onChange={e => set('max_members', e.target.value)} placeholder="Nb membres max" type="number"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Date de début</label>
          <input value={form.start_date} onChange={e => set('start_date', e.target.value)} type="date"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.name || !form.contribution_amount || !form.start_date || create.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? 'Création...' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TontinesPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery<{ results: Tontine[] }>({
    queryKey: ['tontines'],
    queryFn: () => api.get('/api/tontine/tontines/').then(r => r.data),
  })

  const join = useMutation({
    mutationFn: (id: number) => api.post(`/api/tontine/tontines/${id}/join/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tontines'] }),
  })

  const leave = useMutation({
    mutationFn: (id: number) => api.post(`/api/tontine/tontines/${id}/leave/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tontines'] }),
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const tontines = data?.results ?? []

  return (
    <AppLayout title="Tontines" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      {showCreate && (
        <CreateTontineModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['tontines'] })}
        />
      )}

      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-yellow-500 to-ci-orange rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Tontines — Épargne communautaire</p>
                <h2 className="text-2xl font-black mb-2">Épargnez ensemble</h2>
                <p className="text-white/80 text-sm max-w-sm">
                  Rejoignez ou créez une tontine pour épargner collectivement avec la communauté ivoirienne.
                </p>
              </div>
              <Coins size={40} className="text-white/30 flex-shrink-0 mt-1" />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 bg-white text-ci-orange font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-yellow-50 transition shadow"
            >
              <Plus size={16} />
              Créer une tontine
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Tontines actives', value: tontines.filter(t => t.status === 'active').length, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
            { label: 'Mes tontines', value: tontines.filter(t => t.is_member).length, icon: Coins, color: 'text-ci-orange bg-ci-orange-light' },
            { label: 'Total membres', value: tontines.reduce((s, t) => s + t.member_count, 0), icon: Users, color: 'text-blue-600 bg-blue-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-card">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', stat.color)}>
                <stat.icon size={16} />
              </div>
              <div className="text-xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
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
        ) : tontines.length === 0 ? (
          <div className="text-center py-20">
            <Coins size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune tontine disponible</p>
            <p className="text-sm text-gray-400 mt-1">Soyez le premier à en créer une !</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {tontines.map(t => (
              <div key={t.id} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{t.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Par {t.organizer.first_name} {t.organizer.last_name}
                    </p>
                  </div>
                  <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full ml-2 flex-shrink-0', statusColor[t.status] ?? statusColor.pending)}>
                    {t.status === 'pending' ? 'En attente' : t.status === 'active' ? 'Active' : t.status === 'completed' ? 'Terminée' : 'En pause'}
                  </span>
                </div>

                {t.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{t.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Coins size={12} className="text-ci-orange" />
                    {t.contribution_amount} {t.currency}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {freqLabel[t.frequency]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {t.member_count}/{t.max_members}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-ci rounded-full transition-all"
                    style={{ width: `${Math.round(t.member_count / t.max_members * 100)}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  {t.is_member ? (
                    <button
                      onClick={() => leave.mutate(t.id)}
                      disabled={leave.isPending}
                      className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
                    >
                      Quitter
                    </button>
                  ) : (
                    <button
                      onClick={() => join.mutate(t.id)}
                      disabled={join.isPending || t.member_count >= t.max_members || t.status === 'completed'}
                      className="flex-1 py-2 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
                    >
                      {t.member_count >= t.max_members ? 'Complet' : 'Rejoindre'}
                    </button>
                  )}
                  <button className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-ci-orange hover:border-ci-orange transition">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
