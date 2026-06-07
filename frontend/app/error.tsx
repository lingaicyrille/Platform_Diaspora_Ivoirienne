'use client'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Forward to Sentry if available (loaded via @sentry/nextjs when DSN is configured)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error)
    }
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-black text-gray-900">Une erreur est survenue</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Quelque chose s'est mal passé. L'équipe technique a été notifiée.
          {error.digest && (
            <span className="block mt-1 text-[11px] text-gray-400 font-mono">
              Réf : {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-gradient-to-r from-[#F77F00] to-[#CC6600] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
        >
          <RefreshCw size={15} /> Réessayer
        </button>
      </div>
    </div>
  )
}
