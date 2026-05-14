'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Newspaper, Clock, Tag, ChevronRight, Flame } from 'lucide-react'
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
  published_at: string
  author: { id: number; first_name: string; last_name: string }
  created_at: string
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

export default function NewsPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const [category, setCategory] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const { data, isLoading } = useQuery<{ results: Article[] }>({
    queryKey: ['articles', category],
    queryFn: () => {
      const params = new URLSearchParams({ published: 'true' })
      if (category) params.set('category', category)
      return api.get(`/api/news/articles/?${params}`).then(r => r.data)
    },
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const articles = data?.results ?? []
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
            <Flame size={40} className="text-white/30 flex-shrink-0 mt-1" />
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
                onClick={() => setExpanded(expanded === featured.id ? null : featured.id)}
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
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} /> {timeAgo(featured.published_at ?? featured.created_at)}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900 mb-2 leading-snug">{featured.title}</h2>
                  <p className={cn('text-sm text-gray-600 leading-relaxed', expanded === featured.id ? '' : 'line-clamp-3')}>
                    {featured.content}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400">
                      {featured.author.first_name} {featured.author.last_name}
                    </span>
                    <span className="text-xs text-orange-500 font-semibold flex items-center gap-1">
                      {expanded === featured.id ? 'Réduire' : 'Lire la suite'} <ChevronRight size={13} />
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

            {/* Rest of articles */}
            {rest.map(article => (
              <div
                key={article.id}
                className="bg-white rounded-2xl shadow-card p-5 cursor-pointer hover:shadow-card-hover transition-shadow"
                onClick={() => setExpanded(expanded === article.id ? null : article.id)}
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
                      <span className="text-[11px] text-gray-400">
                        {timeAgo(article.published_at ?? article.created_at)}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{article.title}</h3>
                    <p className={cn('text-xs text-gray-500 leading-relaxed', expanded === article.id ? '' : 'line-clamp-2')}>
                      {article.content}
                    </p>
                    {expanded === article.id && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {article.tags.map(t => (
                          <span key={t.id} className="flex items-center gap-1 text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            <Tag size={9} /> {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400 mt-2">
                      {article.author.first_name} {article.author.last_name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
