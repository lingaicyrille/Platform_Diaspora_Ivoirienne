'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Users } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Participant { id: number; first_name: string; last_name: string; avatar: string | null }
interface Conversation {
  id: number
  participants: Participant[]
  is_group: boolean
  name: string
  created_at: string
  last_message: { id: number; content: string; sent_at: string } | null
  unread_count: number
}
interface Message {
  id: number
  sender: { id: number; first_name: string; last_name: string }
  content: string
  sent_at: string
  is_read: boolean
}

function convName(conv: Conversation, myId: number) {
  if (conv.is_group && conv.name) return conv.name
  const other = conv.participants.find(p => p.id !== myId)
  return other ? `${other.first_name} ${other.last_name}` : 'Conversation'
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { user, clearAuth, accessToken } = useAuthStore()
  const convId = Number(params.id)

  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [wsReady, setWsReady] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const { data: conv, isLoading: loadingConv } = useQuery<Conversation>({
    queryKey: ['conversation', convId],
    queryFn: () => api.get(`/api/messaging/conversations/${convId}/`).then(r => r.data),
  })

  const { data: historyData, isLoading: loadingHistory } = useQuery<{ results: Message[] }>({
    queryKey: ['messages', convId],
    queryFn: () => api.get(`/api/messaging/conversations/${convId}/messages/?page_size=100`).then(r => r.data),
  })

  // Populate messages from history
  useEffect(() => {
    if (historyData?.results) {
      setMessages(historyData.results)
    }
  }, [historyData])

  // Mark conversation as read when opened
  const markRead = useMutation({
    mutationFn: () => api.post(`/api/messaging/conversations/${convId}/mark_read/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['conversations-unread'] })
    },
  })

  useEffect(() => {
    if (conv) markRead.mutate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv?.id])

  // WebSocket connection
  useEffect(() => {
    if (!accessToken) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
    const wsBase = apiUrl.replace(/^https?/, m => m === 'https' ? 'wss' : 'ws')
    const ws = new WebSocket(`${wsBase}/ws/chat/${convId}/?token=${accessToken}`)
    wsRef.current = ws

    ws.onopen = () => setWsReady(true)
    ws.onclose = () => setWsReady(false)

    ws.onmessage = (event) => {
      try {
        const msg: Message = JSON.parse(event.data)
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Invalidate conversation list to update last_message + unread
        qc.invalidateQueries({ queryKey: ['conversations'] })
        qc.invalidateQueries({ queryKey: ['conversations-unread'] })
      } catch {
        // ignore malformed frames
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId, accessToken])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage() {
    const content = draft.trim()
    if (!content) return
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }))
      setDraft('')
    }
  }

  if (loadingConv || loadingHistory) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex-1 p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={cn('flex', i % 2 ? 'justify-end' : 'justify-start')}>
                <Skeleton className={cn('h-10 rounded-2xl', i % 2 ? 'w-40' : 'w-56')} />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!conv) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="text-center py-16 text-gray-500">Conversation introuvable.</div>
      </AppLayout>
    )
  }

  const name = convName(conv, user?.id ?? 0)

  return (
    <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => router.push('/messaging')}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0', conv.is_group ? 'bg-violet-500' : 'bg-gradient-ci')}>
            {conv.is_group ? <Users size={15} /> : name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
            <p className="text-[11px] text-gray-400">
              {conv.is_group
                ? `${conv.participants.length} participants`
                : wsReady ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
          {!wsReady && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Reconnexion…
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
          {messages.map(msg => {
            const isMe = msg.sender.id === user?.id
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                  isMe ? 'bg-gradient-ci text-white rounded-br-sm' : 'bg-white text-gray-900 shadow-sm rounded-bl-sm',
                )}>
                  {!isMe && conv.is_group && (
                    <p className="text-[10px] font-semibold text-ci-orange mb-1">
                      {msg.sender.first_name} {msg.sender.last_name}
                    </p>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={cn('text-[10px] mt-1 text-right', isMe ? 'text-white/60' : 'text-gray-400')}>
                    {new Date(msg.sent_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
          <form
            onSubmit={e => { e.preventDefault(); sendMessage() }}
            className="flex gap-2"
          >
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Écrire un message..."
              disabled={!wsReady}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!draft.trim() || !wsReady}
              className="p-2.5 bg-gradient-ci text-white rounded-xl hover:opacity-90 transition disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
