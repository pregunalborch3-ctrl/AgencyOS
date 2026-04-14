import { useState } from 'react'
import {
  Sparkles, CalendarDays, Calculator, FileText, BarChart3,
  TrendingUp, Users, DollarSign, ArrowRight, CheckCircle2,
  Zap, Lock, Loader2, Crown,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '../components/Layout/Header'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'

// ─── Data ─────────────────────────────────────────────────────────────────────
const stats = [
  { label: 'Contenidos generados', value: '248', change: '+12%', icon: Sparkles,    color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Posts programados',    value: '37',  change: '+5%',  icon: CalendarDays, color: 'bg-violet-50 text-violet-600' },
  { label: 'Presupuestos activos', value: '14',  change: '+3',   icon: DollarSign,   color: 'bg-purple-50 text-purple-600' },
  { label: 'Clientes activos',     value: '9',   change: '+2',   icon: Users,        color: 'bg-fuchsia-50 text-fuchsia-600' },
]
const tools = [
  { id: 'content',    title: 'Generador de Contenido',     description: 'Crea posts, captions y copys para todas las plataformas usando IA.',         path: '/content',    icon: Sparkles,    gradient: 'from-indigo-500 to-indigo-600',  tag: 'IA' },
  { id: 'calendar',   title: 'Calendario de Publicación',  description: 'Planifica y programa tus publicaciones en un calendario visual.',             path: '/calendar',   icon: CalendarDays, gradient: 'from-violet-500 to-violet-600',  tag: 'Planificación' },
  { id: 'budget',     title: 'Calculadora de Presupuesto', description: 'Genera presupuestos detallados para tus campañas y proyectos.',               path: '/budget',     icon: Calculator,  gradient: 'from-purple-500 to-purple-600',  tag: 'Finanzas' },
  { id: 'briefing',   title: 'Plantilla de Briefing',      description: 'Recoge toda la información del cliente con formularios estructurados.',        path: '/briefing',   icon: FileText,    gradient: 'from-fuchsia-500 to-fuchsia-600', tag: 'Clientes' },
  { id: 'competitor', title: 'Analizador de Competencia',  description: 'Monitoriza y compara métricas de tus competidores en redes sociales.',        path: '/competitor', icon: BarChart3,   gradient: 'from-pink-500 to-pink-600',      tag: 'Análisis' },
]
const recentActivity = [
  { action: 'Contenido generado para Instagram', client: 'Nike España',      time: 'hace 5 min' },
  { action: 'Briefing completado',               client: 'Zara Home',        time: 'hace 1h' },
  { action: 'Presupuesto enviado',               client: 'Banco Santander',  time: 'hace 2h' },
  { action: '5 posts programados',               client: 'Mahou',            time: 'hace 3h' },
  { action: 'Análisis de competencia',           client: 'Telefónica',       time: 'ayer' },
]
const PLAN_FEATURES = [
  'Generador de contenido IA ilimitado',
  'Calendario de publicación inteligente',
  'Calculadora de presupuestos profesional',
  'Analizador de competencia en tiempo real',
  'Publicación directa en Instagram',
  'Plantilla de briefing para clientes',
]

// ─── Upgrade CTA ──────────────────────────────────────────────────────────────
function UpgradeBanner() {
  const { subscribe } = useSubscription()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try { await subscribe() } catch { setLoading(false) }
  }

  return (
    <div className="card overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              <Sparkles size={12} /> 14 días de prueba gratuita
            </div>
            <h2 className="text-3xl font-black text-gray-900 leading-tight mb-3">
              Desbloquea todas las<br />
              <span className="text-gradient">herramientas Pro</span>
            </h2>
            <p className="text-gray-500 leading-relaxed mb-5">
              Una sola suscripción. Acceso completo. Ahorra más de 12 horas semanales en gestión de clientes y contenido.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {PLAN_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-indigo-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{f}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button
                className="btn-primary py-3.5 px-8 text-base font-semibold"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading
                  ? <><Loader2 size={17} className="animate-spin" /> Redirigiendo...</>
                  : <><Zap size={17} /> Suscribirse por $49/mes</>
                }
              </button>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[140px]">
                Cancela cuando quieras. Sin permanencia.
              </p>
            </div>
          </div>

          {/* Right: price + trust */}
          <div className="flex flex-col items-center lg:items-end gap-5">
            <div className="card p-6 text-center w-full max-w-xs border-2 border-indigo-100">
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">AgencyOS Pro</p>
              <div className="flex items-end justify-center gap-1 my-2">
                <span className="text-5xl font-black text-gray-900">$49</span>
                <span className="text-gray-400 text-lg mb-1.5">/mes</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">Facturado mensualmente</p>
              <div className="space-y-2 text-left">
                {[
                  '14 días gratis incluidos',
                  'Acceso a todas las herramientas',
                  'Soporte prioritario',
                  'Actualizaciones incluidas',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 size={12} className="text-emerald-500" /> {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>🔒 SSL</span>
              <span>💳 Stripe</span>
              <span>✅ Sin riesgos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Locked tool card ─────────────────────────────────────────────────────────
function LockedToolCard({ tool }: { tool: typeof tools[0] }) {
  const Icon = tool.icon
  return (
    <div className="card p-5 opacity-60 select-none relative overflow-hidden">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
        <div className="flex items-center gap-2 bg-white/90 border border-gray-200 shadow-sm px-3 py-1.5 rounded-full">
          <Lock size={12} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-600">Requiere Pro</span>
        </div>
      </div>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-md`}>
          <Icon size={20} className="text-white" />
        </div>
        <span className="badge bg-gray-100 text-gray-400">{tool.tag}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1.5">{tool.title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }                    = useAuth()
  const { isActive, isLoading, subscription } = useSubscription()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="flex-1">
      <Header
        title="Dashboard"
        subtitle={`${greeting()}, ${user?.name?.split(' ')[0] ?? 'usuario'} 👋`}
      />
      <div className="p-6 space-y-8">

        {/* ── Pro status hero / Upgrade CTA ─────────────────────────────── */}
        {isLoading ? (
          <div className="card p-8 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-indigo-400" />
          </div>
        ) : isActive ? (
          /* Pro hero */
          <div className="card p-6 gradient-indigo text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white" />
              <div className="absolute -bottom-12 -left-4 w-36 h-36 rounded-full bg-white" />
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={15} className="opacity-80" />
                  <span className="text-sm font-medium opacity-80">AgencyOS Pro — Activo</span>
                </div>
                <h2 className="text-2xl font-bold mb-1">Abril 2026</h2>
                <p className="text-indigo-100 text-sm">
                  Todo en orden. 5 proyectos activos, 37 publicaciones programadas.
                  {subscription?.cancelAtPeriodEnd && (
                    <span className="ml-2 bg-amber-400/30 text-amber-100 text-xs px-2 py-0.5 rounded-full font-medium">
                      Cancela el {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-white/15 border border-white/20 px-3 py-1.5 rounded-full">
                <TrendingUp size={14} className="text-indigo-200" />
                <span className="text-sm font-semibold">Plan Pro</span>
              </div>
            </div>
          </div>
        ) : (
          <UpgradeBanner />
        )}

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* ── Tools grid ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Herramientas</h2>
            {!isActive && !isLoading && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Lock size={11} /> Requiere suscripción Pro
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map(tool => {
              const Icon = tool.icon
              if (!isActive && !isLoading) return <LockedToolCard key={tool.id} tool={tool} />
              return (
                <Link key={tool.id} to={tool.path}
                  className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-md`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <span className="badge bg-gray-100 text-gray-600">{tool.tag}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">{tool.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
                  <div className="flex items-center gap-1 mt-4 text-indigo-500 text-sm font-medium group-hover:gap-2 transition-all">
                    Abrir <ArrowRight size={14} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── Recent activity ───────────────────────────────────────────── */}
        <div>
          <h2 className="section-title mb-4">Actividad reciente</h2>
          <div className="card divide-y divide-gray-50">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.client}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
