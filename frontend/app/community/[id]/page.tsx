'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, Lock, Globe, MessageSquare, Heart, ThumbsUp, HandHeart,
  ChevronDown, ChevronUp, Send, ArrowLeft, Image as ImageIcon, X,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Author { id: number; first_name: string; last_name: string }

interface Comment {
  id: number
  post: number
  author: Author
  content: string
  created_at: string
}

interface Reaction {
  id: number
  post: number
  user: number
  type: 'like' | 'heart' | 'support'
}

interface Post {
  id: number
  author: Author
  group: number
  content: string
  image: string | null
  comment_count: number
  reaction_count: number
  created_at: string
}

interface Member {
  id: number
  user: Author
  group: number
  role: string
  joined_at: string
}

interface Group {
  id: number
  name: string
  description: string
  type: 'public' | 'private'
  creator: Author
  member_count: number
  post_count: number
  is_member: boolean
  created_at: string
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 1) return 'À l\'instant'
  if (diff < 60) return `Il y a ${diff} min`
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function Avatar({ name, size = 9 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={cn(`w-${size} h-${size} rounded-xl bg-gradient-ci flex items-center justify-center text-white text-xs font-bold flex-shrink-0`)}>
      {initials}
    </div>
  )
}

function PostComposer({ groupId, isMember, groupType, onPosted }: {
  groupId: number; isMember: boolean; groupType: string; onPosted: () => void
}) {
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const { user } = useAuthStore()

  const canPost = isMember || groupType === 'public'

  const create = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('content', content)
      form.append('group', String(groupId))
      if (image) form.append('image', image)
      return api.post('/api/community/posts/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { setContent(''); setImage(null); setPreview(null); onPosted() },
  })

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  if (!canPost) return null

  return (
    <div className="bg-white rounded-2xl shadow-card p-4 space-y-3">
      <div className="flex gap-3">
        <Avatar name={user ? `${user.first_name} ${user.last_name}` : 'U'} />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Partagez quelque chose avec le groupe..."
          rows={3}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
        />
      </div>
      {preview && (
        <div className="relative pl-12">
          <img src={preview} alt="preview" className="rounded-xl max-h-40 object-cover" />
          <button
            onClick={() => { setImage(null); setPreview(null) }}
            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-lg hover:bg-black/70 transition"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between pl-12">
        <label className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition cursor-pointer">
          <ImageIcon size={14} /> Photo
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>
        <button
          onClick={() => create.mutate()}
          disabled={!content.trim() || create.isPending}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition disabled:opacity-40"
        >
          <Send size={13} /> {create.isPending ? 'Envoi...' : 'Publier'}
        </button>
      </div>
    </div>
  )
}

function CommentThread({ postId }: { postId: number }) {
  const [newComment, setNewComment] = useState('')
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const { data } = useQuery<{ results: Comment[] }>({
    queryKey: ['comments', postId],
    queryFn: () => api.get(`/api/community/comments/?post=${postId}`).then(r => r.data),
  })

  const addComment = useMutation({
    mutationFn: () => api.post('/api/community/comments/', { post: postId, content: newComment }),
    onSuccess: () => { setNewComment(''); qc.invalidateQueries({ queryKey: ['comments', postId] }) },
  })

  const comments = data?.results ?? []

  return (
    <div className="border-t border-gray-50 pt-3 space-y-3">
      {comments.map(c => (
        <div key={c.id} className="flex gap-2.5">
          <Avatar name={`${c.author.first_name} ${c.author.last_name}`} size={7} />
          <div className="flex-1">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-gray-800">{c.author.first_name} {c.author.last_name}</p>
              <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 pl-1">{timeAgo(c.created_at)}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2.5">
        <Avatar name={user ? `${user.first_name} ${user.last_name}` : 'U'} size={7} />
        <div className="flex-1 flex gap-2">
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (newComment.trim()) addComment.mutate() } }}
            placeholder="Écrire un commentaire..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
          />
          <button
            onClick={() => addComment.mutate()}
            disabled={!newComment.trim() || addComment.isPending}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-40"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

const reactionConfig = [
  { type: 'like', icon: ThumbsUp, label: "J'aime", color: 'text-blue-500' },
  { type: 'heart', icon: Heart, label: 'Coeur', color: 'text-red-500' },
  { type: 'support', icon: HandHeart, label: 'Soutien', color: 'text-green-500' },
] as const

function PostCard({ post }: { post: Post }) {
  const [showComments, setShowComments] = useState(false)
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const { data: reactionsData } = useQuery<{ results: Reaction[] }>({
    queryKey: ['reactions', post.id],
    queryFn: () => api.get(`/api/community/reactions/?post=${post.id}`).then(r => r.data),
  })

  const reactions = reactionsData?.results ?? []
  const myReaction = reactions.find(r => r.user === user?.id)

  const react = useMutation({
    mutationFn: (type: string) => {
      if (myReaction) return api.delete(`/api/community/reactions/${myReaction.id}/`)
      return api.post('/api/community/reactions/', { post: post.id, type })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reactions', post.id] }),
  })

  const reactionCounts = reactionConfig.map(r => ({
    ...r,
    count: reactions.filter(rx => rx.type === r.type).length,
  }))

  return (
    <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Avatar name={`${post.author.first_name} ${post.author.last_name}`} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{post.author.first_name} {post.author.last_name}</p>
          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>

      {post.image && (
        <img src={post.image} alt="" className="w-full rounded-xl object-cover max-h-64" />
      )}

      <div className="flex items-center gap-1 pt-1 border-t border-gray-50">
        {reactionCounts.map(r => (
          <button
            key={r.type}
            onClick={() => react.mutate(r.type)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition',
              myReaction?.type === r.type
                ? `${r.color} bg-gray-100`
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
            )}
          >
            <r.icon size={13} />
            {r.count > 0 && <span>{r.count}</span>}
            <span className="hidden sm:inline">{r.label}</span>
          </button>
        ))}

        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition ml-auto"
        >
          <MessageSquare size={13} />
          {post.comment_count > 0 && <span>{post.comment_count}</span>}
          <span>Commenter</span>
          {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {showComments && <CommentThread postId={post.id} />}
    </div>
  )
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const groupId = Number(id)

  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: ['group', groupId],
    queryFn: () => api.get(`/api/community/groups/${groupId}/`).then(r => r.data),
  })

  const { data: postsData, isLoading: postsLoading } = useQuery<{ results: Post[] }>({
    queryKey: ['posts', groupId],
    queryFn: () => api.get(`/api/community/posts/?group=${groupId}`).then(r => r.data),
    enabled: !!group,
  })

  const join = useMutation({
    mutationFn: () => api.post(`/api/community/groups/${groupId}/join/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['group', groupId] }) },
  })

  const leave = useMutation({
    mutationFn: () => api.post(`/api/community/groups/${groupId}/leave/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['group', groupId] }) },
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const posts = postsData?.results ?? []

  return (
    <AppLayout title={group?.name ?? 'Groupe'} user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => router.push('/community')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition"
        >
          <ArrowLeft size={16} /> Retour aux groupes
        </button>

        {/* Group header */}
        {groupLoading ? (
          <div className="bg-white rounded-2xl shadow-card p-6 mb-5 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : group && (
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 mb-5 text-white relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {group.type === 'private' ? <Lock size={16} /> : <Globe size={16} />}
                  <Badge variant={group.type === 'public' ? 'green' : 'orange'} className="text-[10px]">
                    {group.type === 'public' ? 'Public' : 'Privé'}
                  </Badge>
                </div>
                <h1 className="text-2xl font-black mb-1">{group.name}</h1>
                {group.description && (
                  <p className="text-white/80 text-sm mb-3 max-w-lg">{group.description}</p>
                )}
                <div className="flex items-center gap-4 text-white/70 text-sm">
                  <span className="flex items-center gap-1"><Users size={13} /> {group.member_count} membres</span>
                  <span className="flex items-center gap-1"><MessageSquare size={13} /> {group.post_count} posts</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {group.is_member ? (
                  <button
                    onClick={() => leave.mutate()}
                    disabled={leave.isPending}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition disabled:opacity-40"
                  >
                    Quitter
                  </button>
                ) : (
                  <button
                    onClick={() => join.mutate()}
                    disabled={join.isPending}
                    className="px-4 py-2 bg-white text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition disabled:opacity-40"
                  >
                    {join.isPending ? 'Rejoindre...' : 'Rejoindre'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Posts feed */}
          <div className="lg:col-span-2 space-y-4">
            {group && (
              <PostComposer
                groupId={groupId}
                isMember={group.is_member}
                groupType={group.type}
                onPosted={() => qc.invalidateQueries({ queryKey: ['posts', groupId] })}
              />
            )}

            {postsLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-card p-5 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-card py-16 text-center">
                <MessageSquare size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">Aucune publication pour l'instant</p>
                <p className="text-gray-400 text-xs mt-1">Soyez le premier à partager quelque chose !</p>
              </div>
            ) : (
              posts.map(p => <PostCard key={p.id} post={p} />)
            )}
          </div>

          {/* Members panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Users size={14} className="text-blue-500" /> Membres
                  {group && <span className="text-gray-400 font-normal">({group.member_count})</span>}
                </h3>
              </div>
              <MembersList groupId={groupId} />
            </div>

            {group && (
              <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">À propos</h3>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    {group.type === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                    <span>{group.type === 'public' ? 'Groupe public — tout le monde peut rejoindre' : 'Groupe privé — sur invitation'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={12} />
                    <span>Créé par {group.creator.first_name} {group.creator.last_name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function MembersList({ groupId }: { groupId: number }) {
  const { data, isLoading } = useQuery<Member[]>({
    queryKey: ['members', groupId],
    queryFn: () => api.get(`/api/community/groups/${groupId}/members/`).then(r => r.data),
  })

  if (isLoading) return (
    <div className="p-4 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )

  const members = data ?? []

  return (
    <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
      {members.slice(0, 10).map(m => (
        <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
          <Avatar name={`${m.user.first_name} ${m.user.last_name}`} size={8} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{m.user.first_name} {m.user.last_name}</p>
            <p className="text-[10px] text-gray-400 capitalize">{m.role}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
