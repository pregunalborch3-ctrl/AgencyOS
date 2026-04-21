import { Link } from 'react-router-dom'
import { Rocket, ArrowRight, Zap, Crown, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'

function UpgradeBanner() {
  const { subscribe } = useSubscription()
  const handleSubscribe = async () => {
    try { await subscribe() } catch {}
  }

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
            <Zap size={11} /> 14 días gratis
          </span>
          <h2 className="text-2xl font-black text-white leading-tight">
            Activa tu acceso al<br />Generador de Campañas
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
            Genera campañas completas para Meta Ads y TikTok en minutos. Hooks, copies, creativos y estructura lista para lanzar.
          </p>
          <button
            onClick={handleSubscribe}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
          >
            <Zap size={15} /> Suscribirse por $49/mes
          </button>
        </div>
        <div className="hidden lg:block text-6xl font-black text-indigo-500/10 select-none">$49</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user }                        = useAuth()
  const { isActive, isLoading, subscription } = useSubscription()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5">
        <p className="text-zinc-500 text-sm">{greeting},</p>
        <h1 className="text-2xl font-black text-white mt-0.5">
          {user?.name?.split(' ')[0] ?? 'usuario'} 👋
        </h1>
      </div>

      <div className="p-8 space-y-6 flex-1">
        {/* Pro status */}
        {isLoading ? (
          <div className="rounded-2xl border border-white/5 bg-zinc-900 p-8 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-indigo-400" />
          </div>
        ) : isActive ? (
          <div className="rounded-2xl bg-indigo-500 p-6 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown size={14} className="text-indigo-200" />
                  <span className="text-indigo-200 text-sm font-medium">AgencyOS Pro — Activo</span>
                </div>
                <p className="text-white font-bold text-lg">Sistema completo desbloqueado</p>
                {subscription?.cancelAtPeriodEnd && (
                  <p className="text-indigo-200 text-xs mt-1">
                    Cancela el {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </p>
                )}
              </div>
              <Link
                to="/campaigns"
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-white/20"
              >
                Generar campaña <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <UpgradeBanner />
        )}

        {/* Main CTA card */}
        <Link
          to="/campaigns"
          className="block rounded-2xl border border-white/5 bg-zinc-900 hover:bg-zinc-800/80 hover:border-indigo-500/30 transition-all p-8 group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                <Rocket size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Generador de Campañas</h2>
                <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed max-w-lg">
                  Introduce una tienda o producto. El sistema analiza el ángulo de venta, el cliente ideal y genera campañas completas listas para Meta Ads y TikTok.
                </p>
              </div>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold group-hover:gap-3 transition-all">
                Generar ahora <ArrowRight size={15} />
              </div>
            </div>
            <div className="hidden lg:flex flex-col gap-2 text-right">
              {['Copies Meta Ads', 'Hooks virales', 'Ideas de creativos', 'Estructura de campaña', 'Segmentación'].map(f => (
                <span key={f} className="text-xs text-zinc-600 group-hover:text-zinc-500 transition-colors">{f}</span>
              ))}
            </div>
          </div>
        </Link>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Tiempo medio por campaña', value: '< 3 min' },
            { label: 'Formatos generados', value: 'Meta · TikTok' },
            { label: 'Precio mensual', value: '$49 / mes' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-white/5 bg-zinc-900 p-5 text-center">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
