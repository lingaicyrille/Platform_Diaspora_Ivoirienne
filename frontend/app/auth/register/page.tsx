'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

const CONTINENTS = [
  { value: 'AF', label: '🌍 Afrique' },
  { value: 'EU', label: '🌍 Europe' },
  { value: 'NA', label: '🌎 Amérique du Nord' },
  { value: 'SA', label: '🌎 Amérique du Sud' },
  { value: 'AS', label: '🌏 Asie' },
  { value: 'OC', label: '🌏 Océanie' },
  { value: 'ME', label: '🌍 Moyen-Orient' },
]

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'di', label: 'Dioula' },
]

const STEPS = ['Identité', 'Localisation', 'Compte']

type FormData = {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirm: string
  country_of_residence: string
  city: string
  continent: string
  preferred_language: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState<FormData>({
    first_name: '', last_name: '', email: '',
    password: '', password_confirm: '',
    country_of_residence: '', city: '', continent: '',
    preferred_language: 'fr',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: keyof FormData, val: string) => setForm(f => ({ ...f, [key]: val }))

  const validateStep = () => {
    setError('')
    if (step === 0 && (!form.first_name || !form.last_name)) {
      setError('Prénom et nom sont requis.'); return false
    }
    if (step === 2 && form.password !== form.password_confirm) {
      setError('Les mots de passe ne correspondent pas.'); return false
    }
    if (step === 2 && form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.'); return false
    }
    return true
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return
    setLoading(true)
    setError('')
    try {
      await api.post('/api/users/register/', form)
      router.push('/auth/login?registered=1')
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data) {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ')
        setError(msgs)
      } else {
        setError('Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ci-orange/20 focus:border-ci-orange transition-all bg-gray-50 focus:bg-white'
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5'

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0D1117] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-ci-orange/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-ci-green/15 rounded-full blur-[60px] pointer-events-none" />

        <Link href="/" className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-ci flex items-center justify-center shadow-orange">
            <span className="text-white font-black">P</span>
          </div>
          <span className="text-white font-black text-xl">PDI</span>
        </Link>

        <div className="relative">
          <h2 className="text-4xl font-black text-white leading-tight mb-5">
            Rejoignez<br />
            <span className="gradient-text-ci">la diaspora</span>
          </h2>
          <p className="text-white/50 mb-8 text-sm leading-relaxed">
            Créez votre profil et rejoignez des milliers d'Ivoiriens à travers le monde.
          </p>

          <div className="space-y-3">
            {STEPS.map((s, i) => (
              <div key={s} className={cn(
                'flex items-center gap-3 text-sm transition-all',
                i < step ? 'text-ci-green' : i === step ? 'text-white' : 'text-white/30'
              )}>
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs transition-all',
                  i < step ? 'bg-ci-green text-white' : i === step ? 'bg-ci-orange text-white' : 'bg-white/10 text-white/30'
                )}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                {s}
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

          <div className="flex gap-1.5 mb-6 lg:hidden">
            {STEPS.map((_, i) => (
              <div key={i} className={cn(
                'h-1 flex-1 rounded-full transition-all',
                i <= step ? 'bg-ci-orange' : 'bg-gray-200'
              )} />
            ))}
          </div>

          <div className="mb-7">
            <div className="text-xs font-bold text-ci-orange uppercase tracking-widest mb-1">
              Étape {step + 1} sur {STEPS.length} — {STEPS[step]}
            </div>
            <h1 className="text-3xl font-black text-gray-900">
              {step === 0 && 'Votre identité'}
              {step === 1 && 'Votre localisation'}
              {step === 2 && 'Créer votre compte'}
            </h1>
          </div>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3.5 mb-5 text-sm">
              ⚠ {error}
            </div>
          )}

          <form noValidate onSubmit={step < 2 ? (e) => { e.preventDefault(); next() } : handleSubmit} className="space-y-4">

            {/* Step 0: Identity */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="first_name" className={labelClass}>Prénom *</label>
                    <input id="first_name" type="text" required autoFocus value={form.first_name}
                      onChange={e => set('first_name', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="last_name" className={labelClass}>Nom *</label>
                    <input id="last_name" type="text" required value={form.last_name}
                      onChange={e => set('last_name', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label htmlFor="preferred_language" className={labelClass}>Langue préférée</label>
                  <select id="preferred_language" value={form.preferred_language}
                    onChange={e => set('preferred_language', e.target.value)} className={inputClass}>
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Step 1: Location */}
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="continent" className={labelClass}>Continent</label>
                  <select id="continent" value={form.continent}
                    onChange={e => set('continent', e.target.value)} className={inputClass}>
                    <option value="">Sélectionner un continent...</option>
                    {CONTINENTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="country_of_residence" className={labelClass}>Pays de résidence</label>
                  <input id="country_of_residence" type="text" value={form.country_of_residence}
                    placeholder="Ex: France, Canada, Belgique..."
                    onChange={e => set('country_of_residence', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="city" className={labelClass}>Ville</label>
                  <input id="city" type="text" value={form.city} placeholder="Ex: Paris, Montréal..."
                    onChange={e => set('city', e.target.value)} className={inputClass} />
                </div>
              </>
            )}

            {/* Step 2: Account */}
            {step === 2 && (
              <>
                <div>
                  <label htmlFor="email" className={labelClass}>Adresse email *</label>
                  <input id="email" type="email" required autoFocus value={form.email}
                    placeholder="votre@email.com"
                    onChange={e => set('email', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="password" className={labelClass}>Mot de passe *</label>
                  <div className="relative">
                    <input id="password" type={showPwd ? 'text' : 'password'} required value={form.password}
                      placeholder="Minimum 8 caractères"
                      onChange={e => set('password', e.target.value)} className={cn(inputClass, 'pr-11')} />
                    <button type="button" aria-label="Afficher le mot de passe"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="password_confirm" className={labelClass}>Confirmer le mot de passe *</label>
                  <input id="password_confirm" type="password" required value={form.password_confirm}
                    onChange={e => set('password_confirm', e.target.value)} className={inputClass} />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="ghost" onClick={back} className="flex-1 py-3">
                  <ArrowLeft size={17} /> Retour
                </Button>
              )}
              <Button
                type="submit"
                loading={loading}
                className={cn('py-3', step === 0 ? 'w-full' : 'flex-1')}
                size="lg"
              >
                {!loading && (step < 2 ? 'Continuer' : 'Créer mon compte')}
                {!loading && <ArrowRight size={17} />}
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà membre ?{' '}
            <Link href="/auth/login" className="text-ci-orange font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>

    </div>
  )
}
