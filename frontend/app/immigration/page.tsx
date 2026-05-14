'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plane, ChevronRight, BookOpen, HelpCircle, Send, CheckCircle, ArrowLeft, X } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Country { id: number; name: string; code: string; flag_emoji: string }
interface Guide { id: number; title: string; content: string; category: string; last_updated: string }
interface Question {
  id: number; content: string; is_answered: boolean; created_at: string
  user: { first_name: string; last_name: string }
  answers: Answer[]
}
interface Answer { id: number; content: string; is_accepted: boolean; author: { first_name: string; last_name: string } }

const guideCategories: Record<string, string> = {
  visa: 'Visa', residence: 'Titre de séjour', citizenship: 'Naturalisation',
  travel: 'Voyage', work: 'Travail', study: 'Études',
}

const guideCategoryColors: Record<string, string> = {
  visa: 'bg-blue-50 text-blue-700', residence: 'bg-purple-50 text-purple-700',
  citizenship: 'bg-green-50 text-green-700', travel: 'bg-sky-50 text-sky-700',
  work: 'bg-amber-50 text-amber-700', study: 'bg-orange-50 text-orange-700',
}

export default function ImmigrationPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [tab, setTab] = useState<'guides' | 'qa'>('guides')
  const [question, setQuestion] = useState('')
  const [expandedQ, setExpandedQ] = useState<number | null>(null)
  const [answer, setAnswer] = useState('')

  const { data: countriesData, isLoading: loadingCountries } = useQuery<{ results: Country[] }>({
    queryKey: ['countries'],
    queryFn: () => api.get('/api/immigration/countries/').then(r => r.data),
  })

  const { data: guidesData, isLoading: loadingGuides } = useQuery<{ results: Guide[] }>({
    queryKey: ['guides', selectedCountry?.id],
    queryFn: () => api.get(`/api/immigration/guides/?country=${selectedCountry!.id}`).then(r => r.data),
    enabled: !!selectedCountry,
  })

  const { data: questionsData, isLoading: loadingQuestions } = useQuery<{ results: Question[] }>({
    queryKey: ['immigration-questions', selectedCountry?.id],
    queryFn: () => api.get(`/api/immigration/questions/?country=${selectedCountry!.id}`).then(r => r.data),
    enabled: !!selectedCountry && tab === 'qa',
  })

  const askQuestion = useMutation({
    mutationFn: () => api.post('/api/immigration/questions/', { country: selectedCountry!.id, content: question }),
    onSuccess: () => { setQuestion(''); qc.invalidateQueries({ queryKey: ['immigration-questions', selectedCountry?.id] }) },
  })

  const postAnswer = useMutation({
    mutationFn: (questionId: number) => api.post('/api/immigration/answers/', { question: questionId, content: answer }),
    onSuccess: () => { setAnswer(''); setExpandedQ(null); qc.invalidateQueries({ queryKey: ['immigration-questions', selectedCountry?.id] }) },
  })

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const countries = countriesData?.results ?? []
  const guides = guidesData?.results ?? []
  const questions = questionsData?.results ?? []

  return (
    <AppLayout title="Immigration" user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-sky-600 to-sky-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 bottom-4 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Immigration — Guides & Ressources</p>
              <h2 className="text-2xl font-black mb-2">Naviguer à l'étranger</h2>
              <p className="text-white/80 text-sm max-w-sm">Guides pratiques par pays, Q&A communautaire, conseils visa et résidence.</p>
            </div>
            <Plane size={40} className="text-white/30 flex-shrink-0 mt-1" />
          </div>
        </div>

        {!selectedCountry ? (
          <>
            <h3 className="font-bold text-gray-900 mb-4">Sélectionnez un pays</h3>
            {loadingCountries ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
              </div>
            ) : countries.length === 0 ? (
              <div className="text-center py-16">
                <Plane size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucun pays disponible pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {countries.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCountry(c)}
                    className="bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow text-left flex items-center gap-3 group"
                  >
                    <span className="text-2xl">{c.flag_emoji || '🌍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-sky-600 transition">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.code}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-sky-400 transition flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Country header */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedCountry(null)}
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="text-2xl">{selectedCountry.flag_emoji || '🌍'}</span>
              <div>
                <h3 className="font-bold text-gray-900">{selectedCountry.name}</h3>
                <p className="text-xs text-gray-400">Guides et questions</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              {([['guides', 'Guides', BookOpen], ['qa', 'Q & A', HelpCircle]] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition',
                    tab === key ? 'bg-sky-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
                  )}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {tab === 'guides' && (
              <>
                {loadingGuides ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                  </div>
                ) : guides.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Aucun guide disponible pour {selectedCountry.name}.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {guides.map(g => (
                      <div key={g.id} className="bg-white rounded-2xl p-5 shadow-card">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-gray-900 text-sm flex-1 mr-3">{g.title}</h4>
                          <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0', guideCategoryColors[g.category] ?? 'bg-gray-100 text-gray-600')}>
                            {guideCategories[g.category] ?? g.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{g.content}</p>
                        <p className="text-xs text-gray-400 mt-3">
                          Mis à jour : {new Date(g.last_updated).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'qa' && (
              <div className="space-y-4">
                {/* Ask a question */}
                <div className="bg-white rounded-2xl p-4 shadow-card">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Poser une question</p>
                  <textarea
                    value={question} onChange={e => setQuestion(e.target.value)}
                    placeholder={`Votre question sur l'immigration en ${selectedCountry.name}...`}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none mb-3"
                  />
                  <button
                    onClick={() => askQuestion.mutate()}
                    disabled={!question.trim() || askQuestion.isPending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition disabled:opacity-40"
                  >
                    <Send size={14} />
                    {askQuestion.isPending ? 'Envoi...' : 'Poser la question'}
                  </button>
                </div>

                {/* Questions list */}
                {loadingQuestions ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-10">
                    <HelpCircle size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Aucune question encore. Soyez le premier !</p>
                  </div>
                ) : (
                  questions.map(q => (
                    <div key={q.id} className="bg-white rounded-2xl p-5 shadow-card">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 flex-1 mr-3">{q.content}</p>
                        {q.is_answered && (
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        {q.user.first_name} {q.user.last_name} · {new Date(q.created_at).toLocaleDateString('fr-FR')}
                        {q.answers.length > 0 && ` · ${q.answers.length} réponse${q.answers.length > 1 ? 's' : ''}`}
                      </p>

                      {q.answers.length > 0 && (
                        <div className="space-y-2 mb-3 border-l-2 border-sky-100 pl-3">
                          {q.answers.map(a => (
                            <div key={a.id} className={cn('text-xs p-3 rounded-xl', a.is_accepted ? 'bg-green-50' : 'bg-gray-50')}>
                              {a.is_accepted && <p className="text-green-600 font-semibold text-[10px] mb-1">✓ Réponse acceptée</p>}
                              <p className="text-gray-700">{a.content}</p>
                              <p className="text-gray-400 mt-1">{a.author.first_name} {a.author.last_name}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {expandedQ === q.id ? (
                        <div className="space-y-2">
                          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Votre réponse..." rows={2}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none" />
                          <div className="flex gap-2">
                            <button onClick={() => { setExpandedQ(null); setAnswer('') }}
                              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50">
                              Annuler
                            </button>
                            <button onClick={() => postAnswer.mutate(q.id)}
                              disabled={!answer.trim() || postAnswer.isPending}
                              className="px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition disabled:opacity-40">
                              {postAnswer.isPending ? 'Envoi...' : 'Répondre'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setExpandedQ(q.id); setAnswer('') }}
                          className="text-xs text-sky-600 font-medium hover:underline">
                          Répondre
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
