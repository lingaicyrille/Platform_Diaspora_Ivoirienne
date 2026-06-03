'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar, MapPin, Wifi, Users, Clock, ArrowLeft,
  CheckCircle, X, HelpCircle, ExternalLink, User,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface Event {
  id: number
  title: string
  description: string
  organizer: { id: number; first_name: string; last_name: string }
  address: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
  start_datetime: string
  end_datetime: string
  cover_image: string | null
  is_online: boolean
  online_link: string
  capacity: number | null
  category: string
  attendee_count: number
  user_rsvp_status: string | null
}

const categoryColors: Record<string, string> = {
  cultural: 'bg-purple-50 text-purple-700',
  sports: 'bg-green-50 text-green-700',
  business: 'bg-blue-50 text-blue-700',
  community: 'bg-ci-orange-light text-ci-orange',
  education: 'bg-yellow-50 text-yellow-700',
  other: 'bg-gray-100 text-gray-600',
}

const categoryLabels: Record<string, string> = {
  cultural: 'Culturel', sports: 'Sports', business: 'Business',
  community: 'Communauté', education: 'Éducation', other: 'Autre',
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const rsvpOptions = [
  { value: 'going', label: "J'y vais", icon: CheckCircle, color: 'text-green-600' },
  { value: 'maybe', label: 'Peut-être', icon: HelpCircle, color: 'text-yellow-600' },
  { value: 'not_going', label: "Je n'y vais pas", icon: X, color: 'text-red-500' },
]

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const eventId = Number(params.id)
  const [showRsvpMenu, setShowRsvpMenu] = useState(false)

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: () => api.get(`/api/events/events/${eventId}/`).then(r => r.data),
  })

  const rsvpMutation = useMutation({
    mutationFn: (rsvpStatus: string) =>
      api.post(`/api/events/events/${eventId}/rsvp/`, { status: rsvpStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', eventId] })
      setShowRsvpMenu(false)
    },
  })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    )
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
          Événement introuvable.
        </div>
      </AppLayout>
    )
  }

  const currentRsvp = rsvpOptions.find(o => o.value === event.user_rsvp_status)
  const isFull = event.capacity !== null && event.attendee_count >= event.capacity

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        {/* Cover */}
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-64 object-cover rounded-2xl mb-6"
          />
        ) : (
          <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-ci-green to-ci-orange mb-6 flex items-center justify-center">
            <Calendar size={48} className="text-white opacity-60" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', categoryColors[event.category] ?? categoryColors.other)}>
              {categoryLabels[event.category] ?? event.category}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{event.title}</h1>
          </div>

          {/* RSVP button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowRsvpMenu(m => !m)}
              disabled={isFull && !event.user_rsvp_status}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition',
                event.user_rsvp_status === 'going'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : event.user_rsvp_status === 'maybe'
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : event.user_rsvp_status === 'not_going'
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : isFull
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-ci-green text-white hover:bg-ci-green/90',
              )}
            >
              {currentRsvp ? (
                <>
                  <currentRsvp.icon size={16} />
                  {currentRsvp.label}
                </>
              ) : isFull ? (
                'Complet'
              ) : (
                'Participer'
              )}
            </button>

            {showRsvpMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {rsvpOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => rsvpMutation.mutate(opt.value)}
                    className={cn(
                      'flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50',
                      opt.color,
                      event.user_rsvp_status === opt.value && 'bg-gray-50 font-medium',
                    )}
                  >
                    <opt.icon size={15} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mb-6">
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <Users size={15} className="text-ci-green" />
            {event.attendee_count} participant{event.attendee_count !== 1 ? 's' : ''}
            {event.capacity ? ` / ${event.capacity}` : ''}
          </span>
          {isFull && (
            <Badge className="bg-red-100 text-red-600 text-xs">Complet</Badge>
          )}
        </div>

        {/* Details card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 space-y-4">
          {/* Date & time */}
          <div className="flex gap-3">
            <Calendar size={18} className="text-ci-green mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">{formatDate(event.start_datetime)}</p>
              <p className="text-sm text-gray-500">
                {formatTime(event.start_datetime)}
                {event.end_datetime && ` – ${formatTime(event.end_datetime)}`}
              </p>
              {event.start_datetime !== event.end_datetime &&
                new Date(event.end_datetime).toDateString() !== new Date(event.start_datetime).toDateString() && (
                <p className="text-sm text-gray-500">Fin: {formatDate(event.end_datetime)}</p>
              )}
            </div>
          </div>

          {/* Location */}
          {event.is_online ? (
            <div className="flex gap-3 items-start">
              <Wifi size={18} className="text-ci-green mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Événement en ligne</p>
                {event.online_link && (
                  <a
                    href={event.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-ci-green hover:underline mt-0.5"
                  >
                    Rejoindre le lien <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-3 items-start">
              <MapPin size={18} className="text-ci-green mt-0.5 shrink-0" />
              <div>
                {event.address && <p className="text-sm text-gray-900">{event.address}</p>}
                <p className="text-sm text-gray-500">
                  {[event.city, event.country].filter(Boolean).join(', ')}
                </p>
                {(event.address || event.city) && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [event.address, event.city, event.country].filter(Boolean).join(', ')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-ci-green hover:underline mt-0.5"
                  >
                    Voir sur la carte <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Organizer */}
          <div className="flex gap-3 items-center">
            <User size={18} className="text-ci-green shrink-0" />
            <p className="text-sm text-gray-700">
              Organisé par{' '}
              <span className="font-medium">
                {event.organizer.first_name} {event.organizer.last_name}
              </span>
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">À propos de l'événement</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{event.description}</p>
        </div>

        {/* Close rsvp menu on outside click */}
        {showRsvpMenu && (
          <div
            className="fixed inset-0 z-[5]"
            onClick={() => setShowRsvpMenu(false)}
          />
        )}
      </div>
    </AppLayout>
  )
}
