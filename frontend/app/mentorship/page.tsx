'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GraduationCap, Plus, Users, Star, CheckCircle, Clock, MapPin, Languages, Send } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface MentorProfile {
  id: number
  mentor: { id: number; first_name: string; last_name: string; country_of_residence: string }
  bio: string
  areas: string[]
  languages: string[]
  country_of_expertise: string
  years_in_diaspora: number | null
  max_mentees: number
  is_available: boolean
  active_mentee_count: number
  has_capacity: boolean
  created_at: string
}

interface MentorshipRequest {
  id: number
  mentee: { id: number; first_name: string; last_name: string }
  mentor_profile: MentorProfile
  areas_requested: string[]
  message: string
  status: string
  created_at: string
}

const areaLabel: Record<string, string> = {
  career: 'Carrière',
  business: 'Entrepreneuriat',
  education: 'Éducation',
  immigration: 'Immigration',
  integration: 'Intégration',
  finance: 'Finance',
  health: 'Santé',
  other: 'Autre',
}

const statusIcon: Record<string, React.ElementType> = {
  pending: Clock,
  accepted: CheckCircle,
  rejected: Clock,
  completed: CheckCircle,
}

const statusColor: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  accepted: 'text-green-600 bg-green-50',
  rejected: 'text-red-500 bg-red-50',
  completed: 'text-gray-500 bg-gray-100',
}

function RequestModal({ profile, onClose, onDone }: { profile: MentorProfile; onClose: () => void; onDone: () => void }) {
  const [message, setMessage] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const toggleArea = (a: string) => setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])

  const send = useMutation({
    mutationFn: () => api.post('/api/mentorship/requests/', {
      mentor_profile_id: profile.id,
      message,
      areas_requested: areas,
    }),
    onSuccess: () => { onDone(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900">Demande de mentorat</h3>
        <p className="text-sm text-gray-600">
          Mentor : <span className="font-semibold">{profile.mentor.first_name} {profile.mentor.last_name}</span>
        </p>

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Domaines souhaités</p>
          <div className="flex flex-wrap gap-2">
            {profile.areas.map(a => (
              <button
                key={a}
                onClick={() => toggleArea(a)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-medium border transition',
                  areas.includes(a)
                    ? 'bg-ci-orange-light border-ci-orange text-ci-orange'
                    : 'border-gray-200 text-gray-600 hover:border-ci-orange/50',
                )}
              >
                {areaLabel[a] ?? a}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Décrivez votre situation et vos objectifs..."
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => send.mutate()}
            disabled={!message.trim() || send.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Send size={14} />
            {send.isPending ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RegisterMentorModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ bio: '', country_of_expertise: '', years_in_diaspora: '', max_mentees: '3' })
  const [areas, setAreas] = useState<string[]>([])
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const toggleArea = (a: string) => setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])

  const create = useMutation({
    mutationFn: () => api.post('/api/mentorship/profiles/', {
      ...form,
      areas,
      languages: ['fr'],
      max_mentees: parseInt(form.max_mentees),
      years_in_diaspora: form.years_in_diaspora ? parseInt(form.years_in_diaspora) : null,
    }),
    onSuccess: () => { onDone(); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900">Devenir mentor</h3>
        <textarea value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Votre parcours et ce que vous pouvez apporter..." rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <input value={form.country_of_expertise} onChange={e => set('country_of_expertise', e.target.value)} placeholder="Pays principal d'expertise"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.years_in_diaspora} onChange={e => set('years_in_diaspora', e.target.value)} type="number" placeholder="Années en diaspora"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
          <input value={form.max_mentees} onChange={e => set('max_mentees', e.target.value)} type="number" placeholder="Max mentorés"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Domaines de mentorat</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(areaLabel).map(([v, l]) => (
              <button
                key={v}
                onClick={() => toggleArea(v)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-medium border transition',
                  areas.includes(v)
                    ? 'bg-ci-orange-light border-ci-orange text-ci-orange'
                    : 'border-gray-200 text-gray-600 hover:border-ci-orange/50',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.bio || areas.length === 0 || create.isPending}
            className="flex-1 py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? 'Enregistrement...' : "S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MentorshipPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'discover' | 'my-requests'>('discover')
  const [requesting, setRequesting] = useState<MentorProfile | null>(null)
  const [showRegister, setShowRegister] = useState(false)

  const { data: profilesData, isLoading: loadingProfiles } = useQuery<{ results: MentorProfile[] }>({
    queryKey: ['mentor-profiles'],
    queryFn: () => api.get('/api/mentorship/profiles/?available=true').then(r => r.data),
  })

  const { data: requestsData, isLoading: loadingRequests } = useQuery<{ results: MentorshipRequest[] }>({
    queryKey: ['mentorship-requests'],
    queryFn: () => api.get('/api/mentorship/requests/').then(r => r.data),
    enabled: tab === 'my-requests',
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const profiles = profilesData?.results ?? []
  const requests = requestsData?.results ?? []

  return (
    <AppLayout title="Mentorat" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      {requesting && (
        <RequestModal
          profile={requesting}
          onClose={() => setRequesting(null)}
          onDone={() => qc.invalidateQueries({ queryKey: ['mentorship-requests'] })}
        />
      )}
      {showRegister && (
        <RegisterMentorModal
          onClose={() => setShowRegister(false)}
          onDone={() => qc.invalidateQueries({ queryKey: ['mentor-profiles'] })}
        />
      )}

      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-ci-green to-teal-600 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Programme de mentorat</p>
              <h2 className="text-2xl font-black mb-2">Grandissez ensemble</h2>
              <p className="text-white/80 text-sm max-w-sm">
                Connectez-vous avec des mentors expérimentés de la diaspora ivoirienne.
              </p>
              <button
                onClick={() => setShowRegister(true)}
                className="mt-4 flex items-center gap-2 bg-white text-ci-green font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition shadow"
              >
                <Plus size={16} />
                Devenir mentor
              </button>
            </div>
            <GraduationCap size={48} className="text-white/30 flex-shrink-0" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-card">
          {([
            { key: 'discover', label: `Mentors disponibles (${profiles.length})` },
            { key: 'my-requests', label: 'Mes demandes' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-semibold transition',
                tab === t.key ? 'bg-gradient-ci text-white shadow-orange' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'discover' && (
          loadingProfiles ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap size={40} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun mentor disponible</p>
              <p className="text-sm text-gray-400 mt-1">Soyez le premier à vous inscrire comme mentor !</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {profiles.map(p => (
                <div key={p.id} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-ci flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {p.mentor.first_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 truncate">
                          {p.mentor.first_name} {p.mentor.last_name}
                        </h3>
                        {p.is_available && p.has_capacity && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex-shrink-0 ml-1">
                            Disponible
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        {p.mentor.country_of_residence && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {p.mentor.country_of_residence}
                          </span>
                        )}
                        {p.years_in_diaspora && (
                          <span>{p.years_in_diaspora} ans en diaspora</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {p.bio && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.areas.slice(0, 4).map(a => (
                      <span key={a} className="text-[11px] px-2.5 py-1 rounded-full bg-ci-green-light text-ci-green font-medium">
                        {areaLabel[a] ?? a}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {p.active_mentee_count}/{p.max_mentees} mentorés
                    </span>
                    {p.languages.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Languages size={11} />
                        {p.languages.join(', ')}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setRequesting(p)}
                    disabled={!p.has_capacity || !p.is_available || p.mentor.id === user?.id}
                    className="w-full py-2.5 bg-gradient-ci text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
                  >
                    {p.mentor.id === user?.id ? 'Mon profil' : !p.has_capacity ? 'Complet' : 'Demander un mentor'}
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'my-requests' && (
          loadingRequests ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20">
              <Send size={32} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucune demande envoyée</p>
              <p className="text-sm text-gray-400 mt-1">Trouvez un mentor dans l'onglet "Mentors disponibles"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
                const StatusIcon = statusIcon[req.status] ?? Clock
                return (
                  <div key={req.id} className="bg-white rounded-2xl p-5 shadow-card flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-ci flex items-center justify-center text-white font-bold flex-shrink-0">
                      {req.mentor_profile.mentor.first_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {req.mentor_profile.mentor.first_name} {req.mentor_profile.mentor.last_name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{req.message}</p>
                        </div>
                        <span className={cn('flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0', statusColor[req.status] ?? statusColor.pending)}>
                          <StatusIcon size={10} />
                          {req.status === 'pending' ? 'En attente' : req.status === 'accepted' ? 'Acceptée' : req.status === 'rejected' ? 'Refusée' : 'Terminée'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {req.areas_requested.map(a => (
                          <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {areaLabel[a] ?? a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </AppLayout>
  )
}
