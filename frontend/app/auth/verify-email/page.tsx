'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('Lien de vérification invalide ou manquant.')
      return
    }
    api.get(`/api/users/verify-email/?token=${token}`)
      .then(r => { setState('success'); setMessage(r.data.detail) })
      .catch(e => {
        setState('error')
        setMessage(e.response?.data?.detail ?? 'Une erreur est survenue.')
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-card p-8 max-w-sm w-full text-center space-y-4">
        {state === 'loading' && (
          <>
            <Loader2 size={40} className="text-ci-orange animate-spin mx-auto" />
            <p className="text-gray-600 font-medium">Vérification en cours…</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-black text-gray-900">Email vérifié !</h2>
            <p className="text-gray-500 text-sm">{message}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-ci-orange hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition mt-2"
            >
              Se connecter
            </button>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle size={48} className="text-red-400 mx-auto" />
            <h2 className="text-xl font-black text-gray-900">Lien invalide</h2>
            <p className="text-gray-500 text-sm">{message}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl transition mt-2"
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
