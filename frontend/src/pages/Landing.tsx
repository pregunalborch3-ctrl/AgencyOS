import { Link } from 'react-router-dom'
import {
  ArrowRight, Zap, CheckCircle2, Store, Search, Rocket,
  Clock, Lightbulb, TrendingUp, Target, ChevronRight,
  Play, Star,
} from 'lucide-react'

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-white font-black text-lg tracking-tight">AgencyOS</span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        {['Cómo funciona', 'Resultados', 'Precio'].map(item => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(' ', '-')}`}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {item}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="text-sm text-zinc-400 hover:text-white transition-colors font-medium"
        >
          Iniciar sesión
        </Link>
        <Link
          to="/register"
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-500/25"
        >
          Empezar gratis <ArrowRight size={14} />
        </Link>
      </div>
    </header>
  )
}

// ─── Hero mock dashboard ───────────────────────────────────────────────────────
function DashboardMock() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-3xl" />

      <div className="relative rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur overflow-hidden shadow-2xl shadow-black/60">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-zinc-950/50">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-3 text-xs text-zinc-500 font-mono">agencyos.com — Campaña Shopify · Moda Mujer ES</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Input row */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/60 border border-white/5">
            <Store size={15} className="text-indigo-400 flex-shrink-0" />
            <span className="text-sm text-zinc-300 font-mono">modaesencial.es — Camisetas algodón mujer</span>
            <span className="ml-auto text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-semibold">Analizado</span>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'ROAS', value: '3.8x', color: 'text-emerald-400' },
              { label: 'CTR', value: '+2.4%', color: 'text-indigo-400' },
              { label: 'Hook ganador', value: 'Detectado', color: 'text-violet-400' },
              { label: 'Audiencia', value: 'Validada', color: 'text-purple-400' },
            ].map(m => (
              <div key={m.label} className="p-2.5 rounded-lg bg-zinc-800/60 border border-white/5 text-center">
                <p className={`text-sm font-black ${m.color}`}>{m.value}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Ads generated */}
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">Anuncios generados · Meta Ads</p>

            {[
              {
                hook: '¿Por qué miles de mujeres están cambiando su armario por esta marca?',
                body: 'Algodón orgánico, tallas reales y diseño minimalista que dura años. Sin fast fashion. Sin compromisos.',
                cta: 'Ver colección →',
                badge: 'Hook de curiosidad',
                color: 'text-violet-400',
                bg: 'bg-violet-400/10',
              },
              {
                hook: 'Cansada de comprar ropa que pierde la forma al tercer lavado',
                body: 'Nuestras camisetas están hechas para durar, no para venderse. Algodón 100% orgánico certificado. €35.',
                cta: 'Quiero la mía →',
                badge: 'Hook de problema',
                color: 'text-indigo-400',
                bg: 'bg-indigo-400/10',
              },
            ].map((ad, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-zinc-800/40 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-white leading-snug">{ad.hook}</p>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${ad.color} ${ad.bg}`}>{ad.badge}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{ad.body}</p>
                <span className="inline-block text-xs text-indigo-300 font-semibold">{ad.cta}</span>
              </div>
            ))}
          </div>

          {/* Segmentation row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Audiencia', value: 'Hombres 25–40' },
              { label: 'Objetivo', value: 'Conversión' },
              { label: 'Presupuesto', value: '€30 / día' },
            ].map(item => (
              <div key={item.label} className="p-2.5 rounded-lg bg-zinc-800/60 border border-white/5 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.label}</p>
                <p className="text-xs font-semibold text-white mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section: Hero ────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-violet-600/8 blur-[80px] rounded-full pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs text-indigo-300 font-semibold tracking-wide">Solo para agencias de e-commerce (no para principiantes)</span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight">
            Consigue clientes de<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
              e-commerce en piloto
            </span>
            <br />automático
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Sistema que analiza tiendas de Shopify y genera campañas
            publicitarias listas para lanzar — en minutos, no en días.
          </p>
          <p className="text-base md:text-lg text-zinc-500 max-w-xl mx-auto font-medium">
            Las agencias que escalan no crean anuncios desde cero. Usan sistemas.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/register"
            className="flex items-center gap-2 px-7 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
          >
            Empezar ahora <ArrowRight size={16} />
          </Link>
          <a
            href="#demo"
            className="flex items-center gap-2 px-7 py-3.5 text-zinc-300 hover:text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all"
          >
            <Play size={14} className="text-indigo-400" /> Ver campaña lista para lanzar
          </a>
        </div>

        <p className="text-xs text-zinc-600">Empieza gratis. Sin tarjeta. Cancela cuando quieras.</p>

        {/* Dashboard mock */}
        <div className="w-full pt-4">
          <DashboardMock />
        </div>
      </div>
    </section>
  )
}

// ─── Section: Logos / social proof ────────────────────────────────────────────
function SocialProof() {
  const logos = [
    'Shopify', 'WooCommerce', 'Meta Ads', 'Google Ads', 'TikTok Ads', 'Instagram',
  ]
  return (
    <section className="py-12 border-y border-white/5">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-8">
          Compatible con las plataformas que ya usas
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {logos.map(logo => (
            <span key={logo} className="text-sm font-bold text-zinc-600 hover:text-zinc-400 transition-colors">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: How it works ─────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: Store,
      number: '01',
      title: 'Introduce una tienda o producto',
      description: 'Pega la URL de cualquier tienda Shopify o describe el producto. El sistema extrae toda la información relevante automáticamente.',
      color: 'text-indigo-400',
      glow: 'shadow-indigo-500/20',
      border: 'border-indigo-500/20',
    },
    {
      icon: Search,
      number: '02',
      title: 'Análisis de producto, cliente y ángulos',
      description: 'El sistema identifica el cliente ideal, los puntos de dolor reales y los ángulos de venta más efectivos para ese mercado.',
      color: 'text-violet-400',
      glow: 'shadow-violet-500/20',
      border: 'border-violet-500/20',
    },
    {
      icon: Rocket,
      number: '03',
      title: 'Campañas listas para lanzar',
      description: 'Recibes ads completos, hooks testados, estructura de campaña y segmentación recomendada. Solo queda publicar.',
      color: 'text-purple-400',
      glow: 'shadow-purple-500/20',
      border: 'border-purple-500/20',
    },
  ]

  return (
    <section id="cómo-funciona" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">El sistema</p>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            De tienda Shopify a campaña activa<br />
            <span className="text-zinc-500">en menos de 5 minutos</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-1/3 right-1/3 h-px bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-purple-500/40" />

          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className={`relative p-8 rounded-2xl bg-zinc-900 border ${step.border} flex flex-col gap-5 group hover:-translate-y-1 transition-transform duration-300`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center shadow-lg ${step.glow} group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className={step.color} />
                  </div>
                  <span className="text-4xl font-black text-zinc-800">{step.number}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Section: Benefits ────────────────────────────────────────────────────────
function Benefits() {
  const benefits = [
    {
      icon: Clock,
      title: 'Ahorra 8+ horas por cliente',
      description: 'Lo que antes tardabas 2 días investigando y redactando, ahora sale en minutos. Tiempo que recuperas para cerrar más contratos.',
      accent: 'from-indigo-500/20 to-indigo-500/0',
    },
    {
      icon: Lightbulb,
      title: 'Sin bloqueos creativos',
      description: 'El sistema genera 10+ variaciones de hooks y copys por producto. Siempre tendrás ideas frescas para cualquier cliente.',
      accent: 'from-violet-500/20 to-violet-500/0',
    },
    {
      icon: TrendingUp,
      title: 'Lógica de agencia profesional',
      description: 'Cada campaña sigue la estructura que usan las mejores agencias: ángulo de entrada, prueba social, urgencia y CTA optimizado.',
      accent: 'from-purple-500/20 to-purple-500/0',
    },
    {
      icon: Target,
      title: 'Escala sin contratar',
      description: 'Gestiona más clientes con el mismo equipo. El sistema multiplica tu capacidad sin multiplicar tus costes operativos.',
      accent: 'from-fuchsia-500/20 to-fuchsia-500/0',
    },
  ]

  return (
    <section id="resultados" className="py-28 px-6 relative">
      <div className="absolute inset-0 bg-zinc-900/30 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Por qué funciona</p>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            No es otra herramienta de IA.<br />
            <span className="text-zinc-500">Es tu sistema de captación.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {benefits.map((b) => {
            const Icon = b.icon
            return (
              <div
                key={b.title}
                className="group relative p-8 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden hover:border-white/10 transition-all hover:-translate-y-0.5"
              >
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${b.accent} opacity-40`} />
                <div className="relative flex gap-5">
                  <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Icon size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-2">{b.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{b.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Section: Demo ────────────────────────────────────────────────────────────
function Demo() {
  const examples = [
    {
      label: 'Hook de Curiosidad',
      color: 'text-violet-400',
      border: 'border-violet-500/20',
      bg: 'bg-violet-500/5',
      badge: 'bg-violet-500/10 text-violet-300',
      content: '¿Por qué estas botas generan el triple de reseñas de 5 estrellas que el resto?',
      sub: 'Tienen algo que ninguna otra marca tiene. Y nuestros clientes lo saben.',
      cta: 'Descúbrelo aquí →',
      meta: { plataforma: 'Meta · Feed', formato: 'Imagen estática', ctr: '4.2% CTR estimado' },
    },
    {
      label: 'Hook de Problema',
      color: 'text-indigo-400',
      border: 'border-indigo-500/20',
      bg: 'bg-indigo-500/5',
      badge: 'bg-indigo-500/10 text-indigo-300',
      content: 'Si llevas devolviendo ropa online por la talla, no es culpa tuya.',
      sub: 'Las marcas te mienten con las guías de tallas. Nosotros no. Talla garantizada o te lo cambiamos gratis.',
      cta: 'Comprar sin riesgo →',
      meta: { plataforma: 'Instagram · Stories', formato: 'Vídeo corto', ctr: '6.1% CTR estimado' },
    },
    {
      label: 'Hook de Prueba Social',
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
      badge: 'bg-emerald-500/10 text-emerald-300',
      content: '4.200 personas compraron esto en los últimos 7 días. ¿Sabes por qué?',
      sub: 'Porque cuando algo funciona de verdad, no necesita descuentos. Solo resultados.',
      cta: 'Ver qué están comprando →',
      meta: { plataforma: 'TikTok Ads', formato: 'Spark Ad', ctr: '5.8% CTR estimado' },
    },
  ]

  return (
    <section id="demo" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Resultados reales</p>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Esto es lo que genera el sistema
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-lg">
            Ejemplos reales de anuncios generados para tiendas de e-commerce.
            No plantillas. Copys construidos con lógica de conversión.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {examples.map((ex) => (
            <div
              key={ex.label}
              className={`relative rounded-2xl border ${ex.border} ${ex.bg} p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform`}
            >
              <span className={`self-start text-xs font-bold px-3 py-1 rounded-full ${ex.badge}`}>{ex.label}</span>
              <div className="flex-1 space-y-2">
                <p className={`text-base font-bold leading-snug ${ex.color}`}>{ex.content}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{ex.sub}</p>
                <p className="text-sm font-semibold text-white">{ex.cta}</p>
              </div>
              <div className="pt-3 border-t border-white/5 grid grid-cols-3 gap-1 text-center">
                {Object.values(ex.meta).map((val, i) => (
                  <span key={i} className="text-[10px] text-zinc-600">{val}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Structure example */}
        <div className="mt-8 rounded-2xl border border-white/5 bg-zinc-900 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Rocket size={15} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-bold">Estructura de campaña completa</h3>
            <span className="ml-auto text-xs text-zinc-600 font-mono">Nike ES · Zapatillas Running</span>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            {[
              { fase: 'Awareness', objetivo: 'Alcance frío', audiencia: 'Intereses running 25–45', presupuesto: '30%', color: 'border-zinc-700' },
              { fase: 'Consideración', objetivo: 'Tráfico web', audiencia: 'Engagement últimos 60d', presupuesto: '25%', color: 'border-indigo-500/30' },
              { fase: 'Conversión', objetivo: 'Compras', audiencia: 'Visitantes sin compra', presupuesto: '35%', color: 'border-violet-500/30' },
              { fase: 'Retención', objetivo: 'Repetición', audiencia: 'Clientes últimos 180d', presupuesto: '10%', color: 'border-purple-500/30' },
            ].map((row) => (
              <div key={row.fase} className={`p-4 rounded-xl border ${row.color} bg-zinc-800/40 space-y-2`}>
                <p className="text-xs font-bold text-white">{row.fase}</p>
                <div className="space-y-1">
                  <p className="text-[11px] text-zinc-500">Objetivo</p>
                  <p className="text-xs text-zinc-300">{row.objetivo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-zinc-500">Audiencia</p>
                  <p className="text-xs text-zinc-300">{row.audiencia}</p>
                </div>
                <div className="pt-1 border-t border-white/5">
                  <span className="text-xs font-bold text-indigo-400">{row.presupuesto} del budget</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Pricing ─────────────────────────────────────────────────────────
function Pricing() {
  const features = [
    'Generador de campañas completas',
    'Análisis de cualquier tienda Shopify',
    'Hooks, copys y creativos ilimitados',
    'Estructura de campaña profesional',
    'Segmentación recomendada por producto',
    'Exportación lista para Meta · Google · TikTok',
    'Soporte prioritario',
  ]

  return (
    <section id="precio" className="py-28 px-6">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-4">Precio</p>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
          Un plan. Todo incluido.
        </h2>
        <p className="text-zinc-400 mb-12 text-lg">
          Sin niveles, sin límites, sin sorpresas.
        </p>

        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden">
          {/* Gradient border trick */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 via-violet-500/20 to-purple-500/40 rounded-3xl" />
          <div className="relative m-px rounded-3xl bg-zinc-900 p-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 mb-6">
              <Star size={11} className="text-indigo-400 fill-indigo-400" />
              <span className="text-xs text-indigo-300 font-semibold">Prueba gratis 14 días</span>
            </div>

            {/* Price */}
            <div className="flex items-end justify-center gap-2 mb-2">
              <span className="text-7xl font-black text-white leading-none">$49</span>
              <span className="text-zinc-400 text-xl mb-2">/ mes</span>
            </div>
            <p className="text-zinc-500 text-sm mb-8">Sin tarjeta de crédito para empezar</p>

            {/* Features */}
            <ul className="space-y-3 mb-10 text-left">
              {features.map(f => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={12} className="text-indigo-400" />
                  </div>
                  <span className="text-sm text-zinc-300">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-base rounded-xl transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
            >
              Empezar ahora <ChevronRight size={16} />
            </Link>

            <p className="text-center text-xs text-zinc-600 mt-4">
              Cancela en cualquier momento · Pago seguro con Stripe
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Final CTA ───────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
          Deja de perder tiempo.<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Empieza a conseguir clientes.
          </span>
        </h2>
        <p className="text-zinc-400 text-xl max-w-xl mx-auto">
          Únete a las agencias que ya generan campañas en minutos con AgencyOS.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/register"
            className="flex items-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg rounded-xl transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
          >
            Empezar gratis <ArrowRight size={18} />
          </Link>
        </div>
        <p className="text-xs text-zinc-700">14 días gratis. Sin tarjeta. Sin compromiso.</p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-white/5 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <span className="text-sm font-black text-white">AgencyOS</span>
          <span className="text-xs text-zinc-700 ml-1">© {year}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Privacidad</Link>
          <Link to="/terms"   className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Términos</Link>
          <Link to="/cookies" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Cookies</Link>
          <a href="mailto:pregunalborch3@gmail.com" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Contacto</a>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login"    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Iniciar sesión</Link>
          <Link to="/register" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Crear cuenta</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Nav />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Benefits />
      <Demo />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  )
}
