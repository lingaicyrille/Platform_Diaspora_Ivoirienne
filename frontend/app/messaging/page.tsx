'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, ArrowLeft, Users, Plus } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Participant { id: number; first_name: string; last_name: string }
interface Message { id: number; sender: { id: number; first_name: string; last_name: string }; content: string; sent_at: string; is_read: boolean }
interface Conversation {
  id: number
  name: string
  is_group: boolean
  participants: Participant[]
  last_message: Message | null
  unread_count: number
  created_at: string
}

function timeShort(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diff < 60) return `${diff}m`
  if (diff < 1440) return `${Math.floor(diff / 60)}h`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function getDisplayName(conv: Conversation, currentUserId: number) {
  if (conv.is_group && conv.name) return conv.name
  const other = conv.participants.find(p => p.id !== currentUserId)
  if (other) return `${other.first_name} ${other.last_name}`
  return 'Conversation'
}

export default function MessagingPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')

  const { data: convData, isLoading: loadingConvs } = useQuery<{ results: Conversation[] }>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/api/messaging/conversations/').then(r => r.data),
  })

  const { data: msgData, isLoading: loadingMsgs } = useQuery<{ results: Message[] }>({
    queryKey: ['messages', activeId],
    queryFn: () => api.get(`/api/messaging/conversations/${activeId}/messages/`).then(r => r.data),
    enabled: !!activeId,
  })

  const sendMsg = useMutation({
    mutationFn: () => api.post(`/api/messaging/conversations/${activeId}/send/`, { content: draft }),
    onSuccess: () => {
      setDraft('')
      qc.invalidateQueries({ queryKey: ['messages', activeId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const conversations = convData?.results ?? []
  const messages = msgData?.results ?? []
  const activeConv = conversations.find(c => c.id === activeId)

  return (
    <AppLayout title="Messagerie" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Conversation list */}
        <div className={cn(
          'w-full lg:w-80 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col',
          activeId ? 'hidden lg:flex' : 'flex',
        )}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Messages</h2>
            <button className="p-2 rounded-xl bg-ci-orange-light text-ci-orange hover:bg-orange-100 transition">
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-3 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageCircle size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucune conversation</p>
              </div>
            ) : (
              conversations.map(conv => {
                const displayName = getDisplayName(conv, user?.id ?? 0)
                const active = conv.id === activeId
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={cn(
                      'w-full flex gap-3 p-3 mx-1 rounded-xl text-left transition hover:bg-gray-50',
                      active && 'bg-ci-orange-light',
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-ci flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {conv.is_group ? <Users size={16} /> : displayName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn('text-sm font-semibold truncate', active ? 'text-ci-orange' : 'text-gray-900')}>
                          {displayName}
                        </span>
                        {conv.last_message && (
                          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                            {timeShort(conv.last_message.sent_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.last_message?.content ?? 'Démarrer une conversation'}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="bg-ci-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0 self-start mt-1">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={cn(
          'flex-1 flex flex-col bg-gray-50',
          !activeId ? 'hidden lg:flex' : 'flex',
        )}>
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-card flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={36} className="text-gray-200" />
                </div>
                <p className="text-gray-500 font-medium">Sélectionnez une conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setActiveId(null)}
                  className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-xl bg-gradient-ci flex items-center justify-center text-white text-sm font-bold">
                  {activeConv?.is_group ? <Users size={15} /> : (getDisplayName(activeConv!, user?.id ?? 0)[0])}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {activeConv ? getDisplayName(activeConv, user?.id ?? 0) : ''}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {activeConv?.participants.length} participant{(activeConv?.participants.length ?? 0) > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                        <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-40')} />
                      </div>
                    ))}
                  </div>
                ) : messages.map(msg => {
                  const isMe = msg.sender.id === user?.id
                  return (
                    <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                        isMe
                          ? 'bg-gradient-ci text-white rounded-br-sm'
                          : 'bg-white text-gray-900 shadow-sm rounded-bl-sm',
                      )}>
                        {!isMe && (
                          <p className="text-[10px] font-semibold text-ci-orange mb-1">
                            {msg.sender.first_name}
                          </p>
                        )}
                        <p>{msg.content}</p>
                        <p className={cn('text-[10px] mt-1', isMe ? 'text-white/70' : 'text-gray-400')}>
                          {new Date(msg.sent_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-100 p-4">
                <form
                  onSubmit={e => { e.preventDefault(); if (draft.trim()) sendMsg.mutate() }}
                  className="flex gap-2"
                >
                  <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="Écrire un message..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange transition"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sendMsg.isPending}
                    className="p-2.5 bg-gradient-ci text-white rounded-xl hover:opacity-90 transition disabled:opacity-40"
                  >
                    <Send size={17} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
