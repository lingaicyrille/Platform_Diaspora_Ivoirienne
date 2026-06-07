'use client'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import api from '@/lib/api'

interface Ad {
  id: number
  title: string
  body: string
  image: string | null
  link: string
}

export function AdSidebar() {
  const { data } = useQuery<{ results: Ad[] }>({
    queryKey: ['ads', 'sidebar'],
    queryFn: () => api.get('/api/ads/ads/?placement=sidebar&page_size=1').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const ad = data?.results?.[0]

  useEffect(() => {
    if (ad) {
      api.post(`/api/ads/ads/${ad.id}/track_impression/`).catch(() => {})
    }
  }, [ad?.id])

  if (!ad) return null

  return (
    <a
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => api.post(`/api/ads/ads/${ad.id}/track_click/`).catch(() => {})}
      className="block bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition group"
    >
      {ad.image && (
        <img
          src={ad.image}
          alt={ad.title}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-3">
        <p className="text-[10px] font-semibold text-ci-orange uppercase tracking-wide mb-1">Sponsorisé</p>
        <p className="text-sm font-bold text-gray-900 leading-snug">{ad.title}</p>
        {ad.body && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ad.body}</p>}
        <div className="flex items-center gap-1 mt-2 text-xs text-ci-orange font-semibold">
          En savoir plus <ExternalLink size={11} />
        </div>
      </div>
    </a>
  )
}
