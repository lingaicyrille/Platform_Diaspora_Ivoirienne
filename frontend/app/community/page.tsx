'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Lock, Globe, MessageSquare, Heart, ChevronRight, X } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Group {
  id: number
  name: string
  description: string
  type: 'public' | 'private'
  creator: { id: number; first_name: string; last_name: string }
  member_count: number
  post_count: number
  is_member: boolean
  created_at: string
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', type: 'public' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const create = useMutation({
    mutationFn: () => api.post('/api/community/groups/', form),
    onSuccess: () => { onCreated(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Créer un groupe</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <input
          value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nom du groupe"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange"
        />
        <textarea
          value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Description (optionnel)" rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          {(['public', 'private'] as const).map(t => (
            <button
              key={t}
              onClick={() => set('type', t)}
              className={cn(
                'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition',
                form.type === t ? 'border-ci-orange bg-ci-orange-light text-ci-orange' : 'border-gray-200 text-gray-600 hover:border-gray-300',
              )}
            >
              {t === 'public' ? <Globe size={15} /> : <Lock size={15} />}
              {t === 'public' ? 'Public' : 'Privé'}
            </button>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.name || create.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? 'Création...' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery<{ results: Group[] }>({
    queryKey: ['groups'],
    queryFn: () => api.get('/api/community/groups/').then(r => r.data),
  })

  const join = useMutation({
    mutationFn: (id: number) => api.post(`/api/community/groups/${id}/join/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })

  const leave = useMutation({
    mutationFn: (id: number) => api.post(`/api/community/groups/${id}/leave/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const all = data?.results ?? []
  const groups = tab === 'mine' ? all.filter(g => g.is_member) : all

  return (
    <AppLayout title="Communauté" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['groups'] })}
        />
      )}

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Communauté — Groupes & Forums</p>
              <h2 className="text-2xl font-black mb-2">Trouvez votre tribu</h2>
              <p className="text-white/80 text-sm max-w-sm">
                Rejoignez des groupes par pays, ville, intérêt ou profession.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-2 bg-white text-blue-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition shadow"
              >
                <Plus size={16} /> Créer un groupe
              </button>
            </div>
            <Users size={40} className="text-white/30 flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Groupes', value: all.length, color: 'text-blue-600 bg-blue-50' },
            { label: 'Mes groupes', value: all.filter(g => g.is_member).length, color: 'text-ci-orange bg-ci-orange-light' },
            { label: 'Publics', value: all.filter(g => g.type === 'public').length, color: 'text-green-600 bg-green-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card text-center">
              <div className={cn('text-xl font-black', s.color.split(' ')[0])}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {([['all', 'Tous les groupes'], ['mine', 'Mes groupes']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold transition',
                tab === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
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
        ) : groups.length === 0 ? (
          <div className="text-center py-20">
            <Users size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {tab === 'mine' ? 'Vous n\'avez rejoint aucun groupe' : 'Aucun groupe disponible'}
            </p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-blue-600 font-medium hover:underline">
              Créer le premier groupe
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => (
              <div key={g.id} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mr-3 flex-shrink-0">
                    {g.type === 'private' ? <Lock size={18} className="text-blue-500" /> : <Globe size={18} className="text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-sm">{g.name}</h3>
                    <p className="text-xs text-gray-400">par {g.creator.first_name} {g.creator.last_name}</p>
                  </div>
                  <Badge variant={g.type === 'public' ? 'success' : 'warning'} className="ml-2 flex-shrink-0 text-[10px]">
                    {g.type === 'public' ? 'Public' : 'Privé'}
                  </Badge>
                </div>

                {g.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{g.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><Users size={11} /> {g.member_count} membres</span>
                  <span className="flex items-center gap-1"><MessageSquare size={11} /> {g.post_count ?? 0} posts</span>
                </div>

                <div className="flex gap-2 mt-auto">
                  {g.is_member ? (
                    <button
                      onClick={() => leave.mutate(g.id)}
                      disabled={leave.isPending}
                      className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
                    >
                      Quitter
                    </button>
                  ) : (
                    <button
                      onClick={() => join.mutate(g.id)}
                      disabled={join.isPending}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-40"
                    >
                      Rejoindre
                    </button>
                  )}
                  <button className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition">
                    <ChevronRight size={14} />
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
