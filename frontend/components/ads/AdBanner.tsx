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
  placement: string
}

export function AdBanner() {
  const { data } = useQuery<{ results: Ad[] }>({
    queryKey: ['ads', 'banner'],
    queryFn: () => api.get('/api/ads/ads/?placement=banner&page_size=1').then(r => r.data),
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
      className="flex items-center gap-4 bg-gradient-to-r from-ci-orange/10 to-amber-50 border border-ci-orange/20 rounded-2xl p-4 hover:from-ci-orange/15 hover:to-amber-100 transition group"
    >
      {ad.image && (
        <img
          src={ad.image}
          alt={ad.title}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-ci-orange uppercase tracking-wide mb-0.5">Sponsorisé</p>
        <p className="text-sm font-bold text-gray-900 truncate">{ad.title}</p>
        {ad.body && <p className="text-xs text-gray-500 truncate mt-0.5">{ad.body}</p>}
      </div>
      <ExternalLink size={14} className="text-ci-orange flex-shrink-0 opacity-60 group-hover:opacity-100 transition" />
    </a>
  )
}
