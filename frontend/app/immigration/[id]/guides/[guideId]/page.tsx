'use client'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, BookOpen } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Guide {
  id: number
  title: string
  content: string
  category: string
  country: number
  country_name: string
  last_updated: string
  created_at: string
}

const guideCategories: Record<string, string> = {
  visa: 'Visa', residence: 'Titre de séjour', citizenship: 'Naturalisation',
  travel: 'Voyage', work: 'Travail', study: 'Études',
}

const guideCategoryColors: Record<string, string> = {
  visa: 'bg-blue-50 text-blue-700', residence: 'bg-purple-50 text-purple-700',
  citizenship: 'bg-green-50 text-green-700', travel: 'bg-sky-50 text-sky-700',
  work: 'bg-amber-50 text-amber-700', study: 'bg-orange-50 text-orange-700',
}

export default function GuideDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const countryId = params.id
  const guideId = Number(params.guideId)

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const { data: guide, isLoading } = useQuery<Guide>({
    queryKey: ['guide', guideId],
    queryFn: () => api.get(`/api/immigration/guides/${guideId}/`).then(r => r.data),
  })

  if (isLoading) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </AppLayout>
    )
  }

  if (!guide) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">Guide introuvable.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.push(`/immigration/${countryId}`)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
        >
          <ArrowLeft size={16} /> Retour aux guides
        </button>

        {/* Header card */}
        <div className="bg-gradient-to-br from-sky-600 to-sky-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full" />
          <div className="relative">
            <span className={cn(
              'inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3',
              guideCategoryColors[guide.category] ?? 'bg-gray-100 text-gray-600',
            )}>
              {guideCategories[guide.category] ?? guide.category}
            </span>
            <h1 className="text-xl font-black leading-snug mb-2">{guide.title}</h1>
            <p className="text-white/70 text-xs">{guide.country_name}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
          <span className="flex items-center gap-1.5">
            <BookOpen size={12} /> {guideCategories[guide.category] ?? guide.category}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} /> Mis à jour le {new Date(guide.last_updated).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{guide.content}</p>
        </div>
      </div>
    </AppLayout>
  )
}
