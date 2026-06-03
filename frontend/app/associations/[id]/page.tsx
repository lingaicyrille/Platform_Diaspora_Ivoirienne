'use client'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Building2, Globe, Mail, MapPin, Users,
  BadgeCheck, Crown, Shield, User, ExternalLink,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Association {
  id: number
  name: string
  description: string
  category: string
  country: string
  city: string
  logo: string | null
  website: string
  contact_email: string
  is_verified: boolean
  member_count: number
  is_member: boolean
  created_by: { id: number; first_name: string; last_name: string }
  created_at: string
}

interface Member {
  id: number
  user: { id: number; first_name: string; last_name: string }
  role: 'member' | 'board' | 'president'
  joined_at: string
}

const categoryLabels: Record<string, string> = {
  cultural: 'Culturelle', humanitarian: 'Humanitaire', educational: 'Éducative',
  professional: 'Professionnelle', sports: 'Sportive', religious: 'Religieuse', other: 'Autre',
}

const categoryColors: Record<string, string> = {
  cultural: 'bg-purple-50 text-purple-700', humanitarian: 'bg-red-50 text-red-700',
  educational: 'bg-yellow-50 text-yellow-700', professional: 'bg-blue-50 text-blue-700',
  sports: 'bg-green-50 text-green-700', religious: 'bg-indigo-50 text-indigo-700',
  other: 'bg-gray-100 text-gray-600',
}

const roleConfig = {
  president: { label: 'Président', icon: Crown,  color: 'text-amber-600 bg-amber-50' },
  board:     { label: 'Bureau',    icon: Shield, color: 'text-blue-600 bg-blue-50' },
  member:    { label: 'Membre',    icon: User,   color: 'text-gray-600 bg-gray-100' },
}

export default function AssociationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { user, clearAuth } = useAuthStore()
  const assocId = Number(params.id)

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const { data: assoc, isLoading } = useQuery<Association>({
    queryKey: ['association', assocId],
    queryFn: () => api.get(`/api/associations/associations/${assocId}/`).then(r => r.data),
  })

  const { data: membersData } = useQuery<{ results: Member[] }>({
    queryKey: ['association-members', assocId],
    queryFn: () => api.get(`/api/associations/members/?association=${assocId}&page_size=50`).then(r => r.data),
    enabled: !!assocId,
  })

  const join = useMutation({
    mutationFn: () => api.post(`/api/associations/associations/${assocId}/join/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['association', assocId] })
      qc.invalidateQueries({ queryKey: ['association-members', assocId] })
    },
  })

  const leave = useMutation({
    mutationFn: () => api.post(`/api/associations/associations/${assocId}/leave/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['association', assocId] })
      qc.invalidateQueries({ queryKey: ['association-members', assocId] })
    },
  })

  const members = membersData?.results ?? []

  if (isLoading) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </AppLayout>
    )
  }

  if (!assoc) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
          Association introuvable.
        </div>
      </AppLayout>
    )
  }

  const isCreator = user?.id === assoc.created_by.id

  return (
    <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <div className="flex items-start gap-4">
            {assoc.logo ? (
              <img src={assoc.logo} alt={assoc.name} className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-ci-green/10 flex items-center justify-center flex-shrink-0">
                <Building2 size={24} className="text-ci-green" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{assoc.name}</h1>
                {assoc.is_verified && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <BadgeCheck size={12} /> Vérifiée
                  </span>
                )}
              </div>
              <span className={cn('inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1', categoryColors[assoc.category] ?? categoryColors.other)}>
                {categoryLabels[assoc.category] ?? assoc.category}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
                <Users size={12} /> {assoc.member_count} membre{assoc.member_count !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Join / Leave */}
            {!isCreator && (
              assoc.is_member ? (
                <button
                  onClick={() => leave.mutate()}
                  disabled={leave.isPending}
                  className="shrink-0 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
                >
                  Quitter
                </button>
              ) : (
                <button
                  onClick={() => join.mutate()}
                  disabled={join.isPending}
                  className="shrink-0 px-4 py-2 bg-ci-green text-white rounded-xl text-sm font-semibold hover:bg-ci-green-dark transition disabled:opacity-40"
                >
                  Rejoindre
                </button>
              )
            )}
          </div>

          {assoc.description && (
            <p className="text-sm text-gray-700 mt-4 leading-relaxed">{assoc.description}</p>
          )}
        </div>

        {/* Contact info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Coordonnées</h2>

          {(assoc.city || assoc.country) && (
            <div className="flex items-center gap-3">
              <MapPin size={15} className="text-ci-green shrink-0" />
              <span className="text-sm text-gray-700">{[assoc.city, assoc.country].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {assoc.contact_email && (
            <div className="flex items-center gap-3">
              <Mail size={15} className="text-ci-green shrink-0" />
              <a href={`mailto:${assoc.contact_email}`} className="text-sm text-gray-700 hover:text-ci-green">
                {assoc.contact_email}
              </a>
            </div>
          )}

          {assoc.website && (
            <div className="flex items-center gap-3">
              <Globe size={15} className="text-ci-green shrink-0" />
              <a href={assoc.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-ci-green hover:underline">
                {assoc.website.replace(/^https?:\/\//, '')} <ExternalLink size={11} />
              </a>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
            <User size={15} className="text-ci-green shrink-0" />
            <span className="text-sm text-gray-700">
              Créée par <span className="font-medium">{assoc.created_by.first_name} {assoc.created_by.last_name}</span>
            </span>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Membres ({assoc.member_count})
          </h2>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun membre.</p>
          ) : (
            <div className="space-y-2">
              {members.map(m => {
                const cfg = roleConfig[m.role] ?? roleConfig.member
                return (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition">
                    <div className="w-8 h-8 rounded-xl bg-ci-green/10 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-ci-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {m.user.first_name} {m.user.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Depuis {new Date(m.joined_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', cfg.color)}>
                      <cfg.icon size={11} /> {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
