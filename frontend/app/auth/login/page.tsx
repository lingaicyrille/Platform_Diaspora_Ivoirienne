'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Users, Calendar, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

const highlights = [
  { icon: Users, text: '15 000+ membres dans 52 pays' },
  { icon: Calendar, text: 'Événements et associations' },
  { icon: Briefcase, text: 'Business et marketplace ivoiriens' },
]

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/users/login/', form)
      setAuth(data.access, data.refresh, data.user)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Identifiants invalides.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0D1117] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-ci-orange/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-ci-green/15 rounded-full blur-[70px] pointer-events-none" />

        <Link href="/" className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-ci flex items-center justify-center shadow-orange">
            <span className="text-white font-black">P</span>
          </div>
          <span className="text-white font-black text-xl">PDI</span>
        </Link>

        <div className="relative">
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            Bon retour dans<br />
            <span className="gradient-text-ci">votre communauté</span>
          </h2>
          <p className="text-white/50 text-base mb-10">
            Des milliers d'Ivoiriens vous attendent partout dans le monde.
          </p>
          <div className="space-y-4">
            {highlights.map((h) => (
              <div key={h.text} className="flex items-center gap-3 text-white/70 text-sm">
                <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
                  <h.icon size={15} className="text-ci-orange" />
                </div>
                {h.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex gap-0 rounded-full overflow-hidden w-16 h-2 opacity-60">
          <div className="flex-1 bg-ci-orange" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-ci-green" />
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-ci flex items-center justify-center">
                <span className="text-white font-black text-sm">P</span>
              </div>
              <span className="font-black text-xl text-gray-900">PDI</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-1.5">Connexion</h1>
            <p className="text-gray-500">Connectez-vous à votre espace diaspora</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3.5 mb-5 text-sm flex items-start gap-2">
              <span className="mt-0.5">⚠</span> {error}
            </div>
          )}

          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse email</label>
              <input
                id="email" type="email" required autoFocus value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange
                           transition-all bg-gray-50 focus:bg-white"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">Mot de passe</label>
                <Link href="/auth/forgot-password" className="text-xs text-ci-orange hover:underline">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <input
                  id="password" type={showPwd ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange
                             transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
                <button type="button" aria-label="Afficher le mot de passe"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full py-3 text-base mt-2" size="lg">
              {!loading && 'Se connecter'}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">Pas encore de compte ?</span>
            </div>
          </div>

          <Link href="/auth/register"
            className="flex items-center justify-center gap-2 w-full py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-ci-orange hover:text-ci-orange transition">
            Créer un compte gratuit
          </Link>
        </div>
      </div>

    </div>
  )
}
