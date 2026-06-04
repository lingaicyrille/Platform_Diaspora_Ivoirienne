'use client'
import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Clock, Tag, User, Edit2, Eye, EyeOff, Image as ImageIcon, X,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Article {
  id: number
  title: string
  content: string
  category: string
  cover_image: string | null
  tags: { id: number; name: string }[]
  is_published: boolean
  published_at: string | null
  author: { id: number; first_name: string; last_name: string }
  created_at: string
  updated_at: string
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function EditArticleModal({
  article,
  tagOptions,
  onClose,
}: {
  article: Article
  tagOptions: TagOption[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: article.title,
    content: article.content,
    category: article.category,
  })
  const [selectedTags, setSelectedTags] = useState<number[]>(article.tags.map(t => t.id))
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(article.cover_image)
  const fileRef = useRef<HTMLInputElement>(null)

  const update = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      selectedTags.forEach(id => fd.append('tag_ids', String(id)))
      if (coverImage) fd.append('cover_image', coverImage)
      return api.patch(`/api/news/articles/${article.id}/`, fd)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', article.id] })
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
          <h2 className="font-bold text-gray-900">Modifier l'article</h2>
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
              rows={8}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none"
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
            onClick={() => update.mutate()}
            disabled={!form.title || !form.content || update.isPending}
            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition"
          >
            {update.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { user, clearAuth } = useAuthStore()
  const articleId = Number(params.id)
  const [showEdit, setShowEdit] = useState(false)

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const isStaff = (user as any)?.is_staff

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: ['article', articleId],
    queryFn: () => api.get(`/api/news/articles/${articleId}/`).then(r => r.data),
  })

  const { data: tagsData } = useQuery<{ results: TagOption[] }>({
    queryKey: ['tags'],
    queryFn: () => api.get('/api/news/tags/').then(r => r.data),
    enabled: isStaff,
  })

  const togglePublish = useMutation({
    mutationFn: () => {
      const action = article?.is_published ? 'unpublish' : 'publish'
      return api.post(`/api/news/articles/${articleId}/${action}/`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['article', articleId] }),
  })

  if (isLoading) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </AppLayout>
    )
  }

  if (!article) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
          Article introuvable.
        </div>
      </AppLayout>
    )
  }

  const tagOptions = tagsData?.results ?? []

  return (
    <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back + staff actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft size={16} /> Retour
          </button>

          {isStaff && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => togglePublish.mutate()}
                disabled={togglePublish.isPending}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition',
                  article.is_published
                    ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    : 'bg-green-50 text-green-700 hover:bg-green-100',
                )}
              >
                {article.is_published ? <><EyeOff size={13} /> Dépublier</> : <><Eye size={13} /> Publier</>}
              </button>
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl text-xs font-semibold transition"
              >
                <Edit2 size={13} /> Modifier
              </button>
            </div>
          )}
        </div>

        {/* Cover image */}
        {article.cover_image && (
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-64 object-cover rounded-3xl mb-6"
          />
        )}

        {/* Status badge (staff only) */}
        {isStaff && !article.is_published && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200">
            <EyeOff size={12} /> Brouillon — non publié
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={cn(
            'text-[11px] font-semibold px-2.5 py-1 rounded-full',
            categoryColors[article.category] ?? categoryColors.other,
          )}>
            {categoryLabels[article.category] ?? article.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <User size={11} /> {article.author.first_name} {article.author.last_name}
          </span>
          {article.published_at && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} /> {formatDate(article.published_at)}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-gray-900 leading-tight mb-6">{article.title}</h1>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{article.content}</p>
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map(t => (
              <span
                key={t.id}
                className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full"
              >
                <Tag size={10} /> {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {showEdit && (
        <EditArticleModal
          article={article}
          tagOptions={tagOptions}
          onClose={() => setShowEdit(false)}
        />
      )}
    </AppLayout>
  )
}
