'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/users/password-reset/', { email })
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-card p-8 max-w-sm w-full space-y-6">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-5 transition">
            <ArrowLeft size={15} /> Retour
          </button>
          <h1 className="text-2xl font-black text-gray-900">Mot de passe oublié</h1>
          <p className="text-sm text-gray-500 mt-1">
            Entrez votre email et nous vous enverrons un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <p className="text-gray-700 font-medium">Vérifiez votre boîte email !</p>
            <p className="text-sm text-gray-500">
              Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien dans quelques minutes.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-ci-orange hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Adresse email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/30 focus:border-ci-orange transition"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ci-orange hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition disabled:opacity-60"
            >
              {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
