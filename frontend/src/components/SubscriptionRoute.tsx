import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useSubscription } from '../contexts/SubscriptionContext'
import { CheckCircle2, Loader2, ArrowRight, Zap, Sparkles } from 'lucide-react'

const PLAN_FEATURES = [
  'Generador de campañas completo e ilimitado',
  'Copies para Meta Ads y TikTok Ads',
  '5 hooks virales por campaña',
  'Ideas de creativos con guión incluido',
  'Estructura de campaña profesional',
  'Segmentación detallada por nicho',
]

function UpgradeWall() {
  const { subscribe, isLoading } = useSubscription()
  const [loading, setLoading]    = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try { await subscribe() } catch { setLoading(false) }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
      <div className="w-full max-w-lg">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-purple-500/20 rounded-2xl" />
          <div className="relative m-px rounded-2xl bg-zinc-900 p-8">
            {/* Icon + title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Zap size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">AgencyOS Pro</p>
                <h2 className="text-xl font-black text-white">Activa tu acceso</h2>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-2 mb-1">
              <span className="text-5xl font-black text-white">$49</span>
              <span className="text-zinc-400 text-lg mb-1.5">/ mes</span>
            </div>
            <p className="text-sm text-indigo-400 font-medium mb-6 flex items-center gap-1.5">
              <Sparkles size={13} /> 14 días gratis — sin tarjeta de crédito
            </p>

            {/* Features */}
            <ul className="space-y-2.5 mb-7">
              {PLAN_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 size={15} className="text-indigo-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-300">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 disabled:opacity-50"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Redirigiendo a Stripe...</>
                : <><span>Empezar prueba gratuita</span><ArrowRight size={17} /></>
              }
            </button>

            <p className="text-center text-xs text-zinc-600 mt-3">
              Cancela en cualquier momento · Pago seguro con Stripe
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-5">
          {['🔒 SSL', '✅ Sin riesgos', '💳 Stripe'].map(b => (
            <span key={b} className="text-xs text-zinc-600">{b}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionRoute() {
  const { isActive, isLoading } = useSubscription()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-indigo-400" />
      </div>
    )
  }

  if (!isActive) return <UpgradeWall />
  return <Outlet />
}
