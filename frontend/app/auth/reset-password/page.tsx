'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import api from '@/lib/api'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<'form' | 'success' | 'error'>('form')
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl shadow-card p-8 max-w-sm w-full text-center space-y-4">
          <XCircle size={48} className="text-red-400 mx-auto" />
          <h2 className="text-xl font-black text-gray-900">Lien invalide</h2>
          <p className="text-sm text-gray-500">Ce lien de réinitialisation est invalide ou a expiré.</p>
          <button onClick={() => router.push('/auth/forgot-password')}
            className="w-full bg-ci-orange hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition">
            Demander un nouveau lien
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/api/users/password-reset/confirm/', { token, new_password: newPassword })
      setState('success')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string | string[] } } })?.response?.data?.detail
      setError(Array.isArray(detail) ? detail.join(' ') : (detail ?? 'Une erreur est survenue.'))
      setState('error')
    } finally {
      setLoading(false)
    }
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl shadow-card p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle size={48} className="text-green-500 mx-auto" />
          <h2 className="text-xl font-black text-gray-900">Mot de passe réinitialisé !</h2>
          <p className="text-sm text-gray-500">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          <button onClick={() => router.push('/auth/login')}
            className="w-full bg-ci-orange hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition">
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-card p-8 max-w-sm w-full space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Nouveau mot de passe</h1>
          <p className="text-sm text-gray-500 mt-1">Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nouveau mot de passe</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/30 focus:border-ci-orange transition"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={8}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Répétez le mot de passe"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/30 focus:border-ci-orange transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ci-orange hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition disabled:opacity-60"
          >
            {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
