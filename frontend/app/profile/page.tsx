'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User, Mail, Phone, MapPin, Globe, Shield, Star,
  Edit3, Save, X, Camera, CheckCircle,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Profile {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  bio: string
  avatar: string | null
  country_of_residence: string
  city: string
  continent: string
  preferred_language: string
  is_verified: boolean
  trust_score: number
  date_joined: string
}

const continentLabels: Record<string, string> = {
  AF: 'Afrique', EU: 'Europe', NA: 'Amérique du Nord',
  SA: 'Amérique du Sud', AS: 'Asie', OC: 'Océanie', ME: 'Moyen-Orient',
}
const languageLabels: Record<string, string> = {
  fr: 'Français', en: 'English', di: 'Dioula', ba: 'Baoulé', be: 'Bété',
}

function TrustBadge({ score }: { score: number }) {
  const level = score >= 80 ? { label: 'Expert', color: 'text-amber-600 bg-amber-50' }
    : score >= 50 ? { label: 'Confirmé', color: 'text-blue-600 bg-blue-50' }
    : score >= 20 ? { label: 'Actif', color: 'text-green-600 bg-green-50' }
    : { label: 'Nouveau', color: 'text-gray-500 bg-gray-100' }
  return (
    <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1', level.color)}>
      <Star size={10} /> {level.label} · {score} pts
    </span>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, setUser, clearAuth } = useAuthStore() as { user: Profile | null; setUser: (u: Profile) => void; clearAuth: () => void }
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Profile>>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/users/me/').then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      if (avatarFile) {
        const fd = new FormData()
        Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)))
        fd.append('avatar', avatarFile)
        return api.patch('/api/users/me/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
      }
      return api.patch('/api/users/me/', data).then(r => r.data)
    },
    onSuccess: (updated: Profile) => {
      qc.setQueryData(['profile'], updated)
      setUser(updated)
      setEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      setError('')
    },
    onError: () => setError('Impossible de sauvegarder les modifications.'),
  })

  const startEdit = () => {
    if (!profile) return
    setForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      bio: profile.bio,
      country_of_residence: profile.country_of_residence,
      city: profile.city,
      continent: profile.continent,
      preferred_language: profile.preferred_language,
    })
    setEditing(true)
    setError('')
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const userMeta = authUser ? {
    full_name: `${authUser.first_name} ${authUser.last_name}`,
    email: authUser.email,
    country_of_residence: authUser.country_of_residence,
    is_verified: authUser.is_verified,
  } : null

  return (
    <AppLayout title="Mon Profil" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        ) : !profile ? (
          <p className="text-center text-gray-500 py-20">Profil introuvable.</p>
        ) : (
          <div className="space-y-4">
            {/* Avatar card */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="flex items-center gap-4 relative">
                <div className="relative flex-shrink-0">
                  {avatarPreview || profile.avatar ? (
                    <img
                      src={avatarPreview ?? (profile.avatar as string)}
                      alt={profile.full_name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-black">
                      {profile.first_name[0]}{profile.last_name[0]}
                    </div>
                  )}
                  {editing && (
                    <label className="absolute -bottom-2 -right-2 bg-white text-orange-500 rounded-full p-1.5 cursor-pointer shadow-md">
                      <Camera size={13} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black leading-tight">{profile.full_name}</h2>
                  <p className="text-white/80 text-sm">{profile.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <TrustBadge score={profile.trust_score} />
                    {profile.is_verified && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                        <CheckCircle size={10} /> Vérifié
                      </span>
                    )}
                  </div>
                </div>
                {!editing ? (
                  <button onClick={startEdit}
                    className="flex-shrink-0 bg-white/20 hover:bg-white/30 rounded-xl p-2.5 transition">
                    <Edit3 size={16} />
                  </button>
                ) : (
                  <button onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(null) }}
                    className="flex-shrink-0 bg-white/20 hover:bg-white/30 rounded-xl p-2.5 transition">
                    <X size={16} />
                  </button>
                )}
              </div>
              <p className="text-white/60 text-xs mt-3">
                Membre depuis {new Date(profile.date_joined).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Info / Edit card */}
            <div className="bg-white rounded-3xl shadow-card p-5">
              {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>
              )}

              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Prénom</label>
                      <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={form.first_name ?? ''} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Nom</label>
                      <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={form.last_name ?? ''} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Téléphone</label>
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+225 07 00 00 00 00" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Bio</label>
                    <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                      value={form.bio ?? ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      placeholder="Parlez-nous de vous..." />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Pays de résidence</label>
                      <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={form.country_of_residence ?? ''} onChange={e => setForm(f => ({ ...f, country_of_residence: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Ville</label>
                      <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Continent</label>
                      <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={form.continent ?? ''} onChange={e => setForm(f => ({ ...f, continent: e.target.value }))}>
                        <option value="">— Choisir —</option>
                        {Object.entries(continentLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Langue préférée</label>
                      <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={form.preferred_language ?? 'fr'} onChange={e => setForm(f => ({ ...f, preferred_language: e.target.value }))}>
                        {Object.entries(languageLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => saveMutation.mutate(form)}
                    disabled={saveMutation.isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-60"
                  >
                    <Save size={16} />
                    {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-black text-gray-900">Informations personnelles</h3>
                  <div className="space-y-3">
                    <Row icon={<Mail size={15} />} label="Email" value={profile.email} />
                    <Row icon={<Phone size={15} />} label="Téléphone" value={profile.phone || '—'} />
                    <Row icon={<MapPin size={15} />} label="Localisation"
                      value={[profile.city, profile.country_of_residence].filter(Boolean).join(', ') || '—'} />
                    <Row icon={<Globe size={15} />} label="Continent"
                      value={continentLabels[profile.continent] ?? '—'} />
                    <Row icon={<User size={15} />} label="Langue"
                      value={languageLabels[profile.preferred_language] ?? '—'} />
                    <Row icon={<Shield size={15} />} label="Statut"
                      value={profile.is_verified ? 'Compte vérifié' : 'Non vérifié'} />
                  </div>
                  {profile.bio && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Bio</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium flex-1">{value}</span>
    </div>
  )
}
