'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Plus, Search, Users, Clock, X, Check } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Participant { id: number; first_name: string; last_name: string; avatar: string | null }
interface LastMessage { id: number; content: string; sent_at: string; sender: { id: number } }
interface Conversation {
  id: number
  participants: Participant[]
  is_group: boolean
  name: string
  created_at: string
  last_message: LastMessage | null
  unread_count: number
}
interface UserResult { id: number; first_name: string; last_name: string; email: string }

function timeShort(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 1) return "À l'instant"
  if (diff < 60) return `${diff}m`
  if (diff < 1440) return `${Math.floor(diff / 60)}h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function convName(conv: Conversation, myId: number) {
  if (conv.is_group && conv.name) return conv.name
  const other = conv.participants.find(p => p.id !== myId)
  return other ? `${other.first_name} ${other.last_name}` : 'Conversation'
}

function NewConversationModal({ myId, onClose }: { myId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<UserResult | null>(null)
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupMembers, setGroupMembers] = useState<UserResult[]>([])

  const { data: usersData } = useQuery<{ results: UserResult[] }>({
    queryKey: ['user-search', search],
    queryFn: () => api.get(`/api/users/?search=${encodeURIComponent(search)}&page_size=10`).then(r => r.data),
    enabled: search.length >= 2,
  })

  const create = useMutation({
    mutationFn: () =>
      isGroup
        ? api.post('/api/messaging/conversations/', { is_group: true, name: groupName, participant_ids: groupMembers.map(m => m.id) })
        : api.post('/api/messaging/conversations/', { participant_ids: [selected!.id] }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['conversations-unread'] })
      onClose()
      router.push(`/messaging/${res.data.id}`)
    },
  })

  const users = (usersData?.results ?? []).filter(u => u.id !== myId)

  function toggleMember(u: UserResult) {
    setGroupMembers(prev => prev.some(m => m.id === u.id) ? prev.filter(m => m.id !== u.id) : [...prev, u])
  }

  const canSubmit = isGroup ? (groupName.trim().length > 0 && groupMembers.length > 0) : !!selected

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-900">Nouvelle conversation</h2>
            <button
              onClick={() => { setIsGroup(!isGroup); setSelected(null); setGroupMembers([]) }}
              className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition',
                isGroup ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              )}
            >
              <Users size={11} /> Groupe
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {isGroup && (
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Nom du groupe"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            />
          )}
          {isGroup && groupMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {groupMembers.map(m => (
                <span key={m.id} className="flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full">
                  {m.first_name} {m.last_name}
                  <button onClick={() => toggleMember(m)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-9 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            />
          </div>
          {users.map(u => {
            const picked = isGroup ? groupMembers.some(m => m.id === u.id) : selected?.id === u.id
            return (
              <button
                key={u.id}
                onClick={() => isGroup ? toggleMember(u) : setSelected(u)}
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition', picked ? 'bg-violet-50' : 'hover:bg-gray-50')}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-ci flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.first_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.first_name} {u.last_name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                {picked && <Check size={14} className="text-violet-600 flex-shrink-0" />}
              </button>
            )
          })}
          {search.length >= 2 && users.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Aucun utilisateur trouvé.</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Annuler
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition"
          >
            {create.isPending ? 'Création...' : 'Démarrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MessagingPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const [showNew, setShowNew] = useState(false)

  const { data, isLoading } = useQuery<{ results: Conversation[] }>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/api/messaging/conversations/').then(r => r.data),
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const conversations = data?.results ?? []

  return (
    <AppLayout title="Messagerie" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-gray-900">Messages</h2>
            <p className="text-sm text-gray-400">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
          >
            <Plus size={16} /> Nouveau
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun message pour le moment.</p>
            <button onClick={() => setShowNew(true)} className="mt-4 text-sm text-ci-orange font-semibold hover:underline">
              Démarrer une conversation
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => {
              const name = convName(conv, user?.id ?? 0)
              const hasUnread = conv.unread_count > 0
              return (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/messaging/${conv.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow text-left"
                >
                  <div className="relative flex-shrink-0">
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base', conv.is_group ? 'bg-violet-500' : 'bg-gradient-ci')}>
                      {conv.is_group ? <Users size={20} /> : name[0]}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn('text-sm truncate', hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800')}>
                        {name}
                      </p>
                      {conv.last_message && (
                        <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2 flex items-center gap-1">
                          <Clock size={10} /> {timeShort(conv.last_message.sent_at)}
                        </span>
                      )}
                    </div>
                    <p className={cn('text-xs truncate', hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400')}>
                      {conv.last_message
                        ? `${conv.last_message.sender.id === user?.id ? 'Vous : ' : ''}${conv.last_message.content}`
                        : 'Aucun message'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showNew && user && <NewConversationModal myId={user.id} onClose={() => setShowNew(false)} />}
    </AppLayout>
  )
}
