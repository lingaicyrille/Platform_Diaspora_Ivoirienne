'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Newspaper, Clock, Tag, ChevronRight, Flame, Plus, Image as ImageIcon, X, EyeOff } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { AdSidebar } from '@/components/ads/AdSidebar'

interface Article {
  id: number
  title: string
  content: string
  category: string
  cover_image: string | null
  tags: { id: number; name: string }[]
  is_published: boolean
  published_at: string
  author: { id: number; first_name: string; last_name: string }
  created_at: string
}

interface TagOption {
  id: number
  name: string
}

const categoryLabels: Record<string, string> = {
  politics: 'Politique', economy: 'Économie', culture: 'Culture',
  sports: 'Sports', diaspora: 'Diaspora', tech: 'Technologie',
  health: 'Santé', other: 'Autre',
}

const categoryColors: Record<string, string> = {
  politics: 'bg-red-50 text-red-700', economy: 'bg-blue-50 text-blue-700',
  culture: 'bg-purple-50 text-purple-700', sports: 'bg-green-50 text-green-700',
  diaspora: 'bg-ci-orange-light text-ci-orange', tech: 'bg-indigo-50 text-indigo-700',
  health: 'bg-teal-50 text-teal-700', other: 'bg-gray-100 text-gray-600',
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 60) return `Il y a ${diff} min`
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const EMPTY_FORM = { title: '', content: '', category: 'other' }

function CreateArticleModal({
  onClose, tagOptions,
}: {
  onClose: () => void
  tagOptions: TagOption[]
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      selectedTags.forEach(id => fd.append('tag_ids', String(id)))
      if (coverImage) fd.append('cover_image', coverImage)
      return api.post('/api/news/articles/', fd)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] })
      onClose()
    },
  })

  function toggleTag(id: number) {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverImage(file)
    setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Créer un article</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Titre *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              placeholder="Titre de l'article"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Catégorie</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              {Object.entries(categoryLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contenu *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none"
              placeholder="Contenu de l'article..."
            />
          </div>

          {tagOptions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition border',
                      selectedTags.includes(t.id)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300',
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Image de couverture</label>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="" className="w-full h-40 object-cover rounded-xl" />
                <button
                  onClick={() => { setCoverImage(null); setPreview(null) }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-orange-300 transition text-gray-400"
              >
                <ImageIcon size={24} />
                <span className="text-xs">Ajouter une image</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Annuler
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.title || !form.content || create.isPending}
            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition"
          >
            {create.isPending ? 'Publication...' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewsPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const [category, setCategory] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const isStaff = (user as any)?.is_staff

  const { data, isLoading } = useQuery<{ results: Article[] }>({
    queryKey: ['articles', category, isStaff],
    queryFn: () => {
      const params = new URLSearchParams()
      if (!isStaff) params.set('published', 'true')
      if (category) params.set('category', category)
      return api.get(`/api/news/articles/?${params}`).then(r => r.data)
    },
  })

  const { data: tagsData } = useQuery<{ results: TagOption[] }>({
    queryKey: ['tags'],
    queryFn: () => api.get('/api/news/tags/').then(r => r.data),
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const articles = data?.results ?? []
  const tagOptions = tagsData?.results ?? []
  const featured = articles[0]
  const rest = articles.slice(1)

  return (
    <AppLayout title="Actualités" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Flash Info — Actualités & Diaspora</p>
              <h2 className="text-2xl font-black mb-2">Restez informé</h2>
              <p className="text-white/80 text-sm max-w-sm">
                Les dernières nouvelles de Côte d'Ivoire et de la diaspora mondiale.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Flame size={40} className="text-white/30 flex-shrink-0" />
              {isStaff && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                >
                  <Plus size={14} /> Créer un article
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCategory('')}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition',
              !category ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
          >
            Tout
          </button>
          {Object.entries(categoryLabels).map(([v, l]) => (
            <button key={v} onClick={() => setCategory(v === category ? '' : v)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition',
                category === v ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
            >
              {l}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-3xl" />
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun article publié pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured article */}
            {featured && (
              <div
                className="bg-white rounded-3xl shadow-card overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
                onClick={() => router.push(`/news/${featured.id}`)}
              >
                {featured.cover_image && (
                  <img src={featured.cover_image} alt={featured.title}
                    className="w-full h-48 object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full',
                      categoryColors[featured.category] ?? categoryColors.other)}>
                      {categoryLabels[featured.category] ?? featured.category}
                    </span>
                    {isStaff && !featured.is_published && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                        <EyeOff size={9} /> Brouillon
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} /> {timeAgo(featured.published_at ?? featured.created_at)}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900 mb-2 leading-snug">{featured.title}</h2>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{featured.content}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400">
                      {featured.author.first_name} {featured.author.last_name}
                    </span>
                    <span className="text-xs text-orange-500 font-semibold flex items-center gap-1">
                      Lire la suite <ChevronRight size={13} />
                    </span>
                  </div>
                  {featured.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {featured.tags.map(t => (
                        <span key={t.id} className="flex items-center gap-1 text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          <Tag size={9} /> {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sponsored sidebar ad between featured and rest */}
            <AdSidebar />

            {/* Rest of articles */}
            {rest.map(article => (
              <div
                key={article.id}
                className="bg-white rounded-2xl shadow-card p-5 cursor-pointer hover:shadow-card-hover transition-shadow"
                onClick={() => router.push(`/news/${article.id}`)}
              >
                <div className="flex items-start gap-4">
                  {article.cover_image && (
                    <img src={article.cover_image} alt={article.title}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full',
                        categoryColors[article.category] ?? categoryColors.other)}>
                        {categoryLabels[article.category] ?? article.category}
                      </span>
                      {isStaff && !article.is_published && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                          <EyeOff size={9} /> Brouillon
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {timeAgo(article.published_at ?? article.created_at)}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{article.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{article.content}</p>
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {article.tags.map(t => (
                          <span key={t.id} className="flex items-center gap-1 text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            <Tag size={9} /> {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[11px] text-gray-400">
                        {article.author.first_name} {article.author.last_name}
                      </p>
                      <span className="text-[11px] text-orange-500 font-semibold flex items-center gap-1">
                        Lire <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateArticleModal onClose={() => setShowCreate(false)} tagOptions={tagOptions} />
      )}
    </AppLayout>
  )
}
