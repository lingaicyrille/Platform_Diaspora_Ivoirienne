import Link from 'next/link'
import {
  Users, Calendar, Briefcase, ShoppingBag, Newspaper, Plane,
  Building2, Heart, MessageCircle, Globe, Shield, TrendingUp,
  Star, ArrowRight, CheckCircle,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────

const features = [
  { icon: Users, label: 'Communauté mondiale', desc: 'Groupes par pays et continent. Discussions, sondages, rencontres.', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Building2, label: 'Associations & ONG', desc: 'Créez votre association, gérez membres, cotisations et gouvernance.', color: 'text-ci-orange', bg: 'bg-ci-orange-light' },
  { icon: Calendar, label: 'Événements', desc: 'Virtuel ou présentiel. Ticketing, rappels, RSVP intégrés.', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Briefcase, label: 'Business Directory', desc: 'Répertoriez et découvrez des entreprises ivoiriennes de confiance.', color: 'text-ci-green', bg: 'bg-ci-green-light' },
  { icon: ShoppingBag, label: 'Marketplace', desc: 'Achetez et vendez des produits, services et créations ivoiriennes.', color: 'text-pink-500', bg: 'bg-pink-50' },
  { icon: Newspaper, label: 'Actualités & Flash Info', desc: "Dernières nouvelles de Côte d'Ivoire et de la diaspora mondiale.", color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Plane, label: "Immigration & Visa", desc: 'Guides par pays, ressources juridiques, conseils pratiques.', color: 'text-sky-500', bg: 'bg-sky-50' },
  { icon: Heart, label: 'Aide & Solidarité', desc: 'Demandez ou offrez de l\'aide — logement, emploi, urgences.', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: MessageCircle, label: 'Messagerie', desc: 'Chat privé et groupes. Notifications temps réel.', color: 'text-indigo-500', bg: 'bg-indigo-50' },
]

const stats = [
  { value: '15 000+', label: 'Membres actifs' },
  { value: '52', label: 'Pays couverts' },
  { value: '6', label: 'Continents' },
  { value: '800+', label: 'Associations' },
]

const steps = [
  {
    n: '01',
    title: 'Créez votre profil',
    desc: 'Inscription gratuite en 2 minutes. Indiquez votre pays de résidence et votre continent.',
  },
  {
    n: '02',
    title: 'Rejoignez votre communauté',
    desc: 'Trouvez des Ivoiriens près de vous ou sur votre continent. Intégrez des groupes et associations.',
  },
  {
    n: '03',
    title: 'Créez et développez',
    desc: 'Organisez des événements, développez votre business et accédez aux ressources d\'immigration.',
  },
]

const testimonials = [
  {
    quote: "Grâce à PDI, j'ai retrouvé des compatriotes au Canada et fondé une association. En 3 mois on était 80 membres.",
    name: 'Kouamé Diallo',
    location: 'Toronto, Canada',
    role: 'Fondateur d\'association',
    avatar: 'K',
    stars: 5,
  },
  {
    quote: "J'ai trouvé un emploi via le réseau PDI en moins d'une semaine à Paris. La confiance entre membres fait toute la différence.",
    name: 'Aya Touré',
    location: 'Paris, France',
    role: 'Ingénieure logiciel',
    avatar: 'A',
    stars: 5,
  },
  {
    quote: "Mon entreprise de produits ivoiriens a multiplié son chiffre par 3 grâce à la marketplace et aux annonces sur PDI.",
    name: 'Bamba Konaté',
    location: 'Bruxelles, Belgique',
    role: 'Entrepreneur',
    avatar: 'B',
    stars: 5,
  },
]

const myAdded = [
  { icon: Globe, label: 'Carte de la diaspora', desc: 'Carte interactive mondiale des membres.', color: 'text-teal-500', bg: 'bg-teal-50' },
  { icon: Shield, label: 'Score de confiance', desc: 'Système de vérification et de réputation.', color: 'text-amber-500', bg: 'bg-amber-50' },
  { icon: TrendingUp, label: 'Tontine numérique', desc: 'Groupes d\'épargne collectifs sécurisés.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
]

// ─── Page ────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-ci flex items-center justify-center shadow-orange">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <div>
              <div className="font-black text-gray-900 text-sm leading-tight">PDI</div>
              <div className="text-[10px] text-gray-400 leading-none">Diaspora Ivoirienne</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-ci-orange transition">Fonctionnalités</a>
            <a href="#how" className="hover:text-ci-orange transition">Comment ça marche</a>
            <a href="#testimonials" className="hover:text-ci-orange transition">Témoignages</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login"
              className="hidden sm:block text-sm font-semibold text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition">
              Connexion
            </Link>
            <Link href="/auth/register"
              className="text-sm font-bold text-white bg-ci-orange px-5 py-2.5 rounded-xl hover:bg-ci-orange-dark transition shadow-orange">
              S'inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen bg-[#0D1117] flex flex-col items-center justify-center overflow-hidden px-6 pt-16">

        {/* Background glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-ci-orange/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-ci-green/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative text-center max-w-5xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/10 text-white/70 text-xs font-semibold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-ci-green rounded-full animate-pulse-slow" />
            🇨🇮 La plateforme officielle de la diaspora ivoirienne
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            La diaspora ivoirienne,{' '}
            <br className="hidden md:block" />
            <span className="gradient-text-ci">enfin réunie</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            Des milliers d'Ivoiriens sur tous les continents. Connectez-vous, créez des activités,
            développez vos affaires et gardez votre culture vivante.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-ci-orange text-white font-bold text-base rounded-2xl hover:bg-ci-orange-dark transition shadow-orange">
              Rejoindre gratuitement
              <ArrowRight size={18} />
            </Link>
            <Link href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/15 text-white/80 font-semibold text-base rounded-2xl hover:bg-white/8 transition">
              Se connecter
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/8 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl md:text-3xl font-black text-white mb-1">{s.value}</div>
                <div className="text-xs text-white/45">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade into white */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-ci-orange text-sm font-bold tracking-widest uppercase">Fonctionnalités</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2 mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Une plateforme complète pensée pour chaque aspect de la vie diaspora — social, économique, culturel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...features, ...myAdded].map((f) => (
              <div key={f.label}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-ci-orange/20 hover:shadow-card-hover transition-all duration-300 bg-white cursor-default">
                <div className={`w-11 h-11 rounded-2xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon size={21} className={f.color} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5 group-hover:text-ci-orange transition-colors">{f.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-ci-orange text-sm font-bold tracking-widest uppercase">Simple & rapide</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2">Comment ça marche</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.n} className="relative text-center md:text-left">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-ci-orange/40 to-transparent -translate-y-1/2 z-0" />
                )}
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-ci text-white text-xl font-black shadow-orange mb-4">
                    {step.n}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-ci-orange text-sm font-bold tracking-widest uppercase">Témoignages</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2">Ce que dit la communauté</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-ci flex items-center justify-center text-white font-bold text-sm shadow-orange">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role} · {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── World presence banner ── */}
      <section className="py-16 bg-gray-950 px-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-ci-orange/10 via-transparent to-ci-green/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <Globe size={40} className="text-ci-orange mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Présents dans <span className="gradient-text-ci">52 pays</span>
          </h2>
          <p className="text-white/50 text-lg">
            Europe · Amérique du Nord & Sud · Asie · Afrique · Océanie · Moyen-Orient
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-ci-green px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ci-green via-ci-green to-ci-green-dark pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-4xl font-black text-white mb-4">Prêt à rejoindre la famille ?</h2>
          <p className="text-white/70 text-lg mb-8">
            Inscription gratuite. Rejoignez des milliers d'Ivoiriens qui vous attendent.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-10 py-4 bg-white text-ci-green font-bold text-lg rounded-2xl hover:bg-gray-50 transition shadow-green">
              Créer mon compte
              <ArrowRight size={20} />
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-white/60">
            {['100% gratuit', 'Sans carte bancaire', 'Communauté vérifiée'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-white/40" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-500 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-ci flex items-center justify-center">
                  <span className="text-white font-black text-sm">P</span>
                </div>
                <span className="text-white font-black">PDI</span>
              </div>
              <p className="text-sm max-w-xs">La plateforme de référence de la diaspora ivoirienne mondiale.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="text-white font-semibold mb-3">Plateforme</div>
                {['Communauté', 'Événements', 'Business', 'Marketplace'].map(l => (
                  <div key={l} className="mb-1.5"><a href="#" className="hover:text-white transition">{l}</a></div>
                ))}
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Ressources</div>
                {['Immigration', 'Actualités', 'Associations', 'Aide'].map(l => (
                  <div key={l} className="mb-1.5"><a href="#" className="hover:text-white transition">{l}</a></div>
                ))}
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Légal</div>
                {['Confidentialité', 'CGU', 'Contact'].map(l => (
                  <div key={l} className="mb-1.5"><a href="#" className="hover:text-white transition">{l}</a></div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-10 pt-6 text-sm text-center md:text-left">
            © 2026 Platform Diaspora Ivoirienne — Fait avec amour pour la Côte d'Ivoire 🇨🇮
          </div>
        </div>
      </footer>

    </div>
  )
}
