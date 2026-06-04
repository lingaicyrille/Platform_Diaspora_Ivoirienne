'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, BookOpen, HelpCircle, Send, CheckCircle, ChevronRight,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface Country { id: number; name: string; code: string; flag_emoji: string }
interface Guide { id: number; title: string; content: string; category: string; last_updated: string }
interface Answer {
  id: number
  content: string
  is_accepted: boolean
  author: { id: number; first_name: string; last_name: string }
}
interface Question {
  id: number
  content: string
  is_answered: boolean
  created_at: string
  user: { id: number; first_name: string; last_name: string }
  answers: Answer[]
  answer_count: number
}

const guideCategories: Record<string, string> = {
  visa: 'Visa', residence: 'Titre de séjour', citizenship: 'Naturalisation',
  travel: 'Voyage', work: 'Travail', study: 'Études',
}

const guideCategoryColors: Record<string, string> = {
  visa: 'bg-blue-50 text-blue-700', residence: 'bg-purple-50 text-purple-700',
  citizenship: 'bg-green-50 text-green-700', travel: 'bg-sky-50 text-sky-700',
  work: 'bg-amber-50 text-amber-700', study: 'bg-orange-50 text-orange-700',
}

export default function CountryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { user, clearAuth } = useAuthStore()
  const countryId = Number(params.id)

  const [tab, setTab] = useState<'guides' | 'qa'>('guides')
  const [questionText, setQuestionText] = useState('')
  const [expandedQ, setExpandedQ] = useState<number | null>(null)
  const [answerText, setAnswerText] = useState('')

  const userMeta = user ? {
    full_name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    country_of_residence: user.country_of_residence,
    is_verified: user.is_verified,
  } : null

  const { data: country, isLoading: loadingCountry } = useQuery<Country>({
    queryKey: ['country', countryId],
    queryFn: () => api.get(`/api/immigration/countries/${countryId}/`).then(r => r.data),
  })

  const { data: guidesData, isLoading: loadingGuides } = useQuery<{ results: Guide[] }>({
    queryKey: ['guides', countryId],
    queryFn: () => api.get(`/api/immigration/guides/?country=${countryId}`).then(r => r.data),
    enabled: tab === 'guides',
  })

  const { data: questionsData, isLoading: loadingQuestions } = useQuery<{ results: Question[] }>({
    queryKey: ['immigration-questions', countryId],
    queryFn: () => api.get(`/api/immigration/questions/?country=${countryId}`).then(r => r.data),
    enabled: tab === 'qa',
  })

  const askQuestion = useMutation({
    mutationFn: () => api.post('/api/immigration/questions/', { country: countryId, content: questionText }),
    onSuccess: () => {
      setQuestionText('')
      qc.invalidateQueries({ queryKey: ['immigration-questions', countryId] })
    },
  })

  const postAnswer = useMutation({
    mutationFn: (questionId: number) =>
      api.post(`/api/immigration/questions/${questionId}/answer/`, { content: answerText }),
    onSuccess: () => {
      setAnswerText('')
      setExpandedQ(null)
      qc.invalidateQueries({ queryKey: ['immigration-questions', countryId] })
    },
  })

  const acceptAnswer = useMutation({
    mutationFn: (answerId: number) =>
      api.post(`/api/immigration/answers/${answerId}/accept/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['immigration-questions', countryId] }),
  })

  const guides = guidesData?.results ?? []
  const questions = questionsData?.results ?? []

  if (loadingCountry) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </AppLayout>
    )
  }

  if (!country) {
    return (
      <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">Pays introuvable.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={userMeta} onLogout={() => { clearAuth(); router.push('/auth/login') }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-3xl">{country.flag_emoji || '🌍'}</span>
          <div>
            <h2 className="font-black text-gray-900 text-xl">{country.name}</h2>
            <p className="text-xs text-gray-400">{country.code} — Ressources immigration</p>
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

        {/* Guides tab */}
        {tab === 'guides' && (
          <>
            {loadingGuides ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            ) : guides.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucun guide disponible pour {country.name}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {guides.map(g => (
                  <div
                    key={g.id}
                    className="bg-white rounded-2xl p-5 shadow-card cursor-pointer hover:shadow-card-hover transition-shadow"
                    onClick={() => router.push(`/immigration/${countryId}/guides/${g.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900 text-sm flex-1 mr-3">{g.title}</h4>
                      <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0',
                        guideCategoryColors[g.category] ?? 'bg-gray-100 text-gray-600')}>
                        {guideCategories[g.category] ?? g.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{g.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-400">
                        Mis à jour : {new Date(g.last_updated).toLocaleDateString('fr-FR')}
                      </p>
                      <span className="text-xs text-sky-600 font-semibold flex items-center gap-1">
                        Lire <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Q&A tab */}
        {tab === 'qa' && (
          <div className="space-y-4">
            {/* Ask a question */}
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-sm font-semibold text-gray-900 mb-3">Poser une question</p>
              <textarea
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                placeholder={`Votre question sur l'immigration en ${country.name}...`}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none mb-3"
              />
              <button
                onClick={() => askQuestion.mutate()}
                disabled={!questionText.trim() || askQuestion.isPending}
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
              questions.map(q => {
                const isMyQuestion = user?.id === q.user.id
                return (
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

                    {/* Answers */}
                    {q.answers.length > 0 && (
                      <div className="space-y-2 mb-3 border-l-2 border-sky-100 pl-3">
                        {q.answers.map(a => (
                          <div key={a.id} className={cn('text-xs p-3 rounded-xl', a.is_accepted ? 'bg-green-50' : 'bg-gray-50')}>
                            {a.is_accepted && (
                              <p className="text-green-600 font-semibold text-[10px] mb-1">✓ Réponse acceptée</p>
                            )}
                            <p className="text-gray-700">{a.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-gray-400">{a.author.first_name} {a.author.last_name}</p>
                              {isMyQuestion && !a.is_accepted && !q.answers.some(x => x.is_accepted) && (
                                <button
                                  onClick={() => acceptAnswer.mutate(a.id)}
                                  disabled={acceptAnswer.isPending}
                                  className="text-[10px] text-green-600 font-semibold hover:underline disabled:opacity-40"
                                >
                                  Accepter
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply form */}
                    {expandedQ === q.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={answerText}
                          onChange={e => setAnswerText(e.target.value)}
                          placeholder="Votre réponse..."
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setExpandedQ(null); setAnswerText('') }}
                            className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => postAnswer.mutate(q.id)}
                            disabled={!answerText.trim() || postAnswer.isPending}
                            className="px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition disabled:opacity-40"
                          >
                            {postAnswer.isPending ? 'Envoi...' : 'Répondre'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setExpandedQ(q.id); setAnswerText('') }}
                        className="text-xs text-sky-600 font-medium hover:underline"
                      >
                        Répondre
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
