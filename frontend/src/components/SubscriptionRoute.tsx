import { Outlet } from 'react-router-dom'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useAuth } from '../contexts/AuthContext'
  Sparkles, CheckCircle2, Lock, Loader2, ArrowRight, Zap,
} from 'lucide-react'

const PLAN_FEATURES = [
  'Generador de contenido IA — ilimitado',
  'Calendario de publicación inteligente',
  'Calculadora de presupuestos profesional',
  'Analizador de competencia en tiempo real',
  'Publicación directa en Instagram',
  'Plantilla de briefing para clientes',
]

function UpgradeWall() {
  const { subscribe, isLoading } = useSubscription()
  const [loading, setLoading] = useState(false)

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
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="card overflow-hidden">
          {/* Gradient top bar */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />

          <div className="p-8">
            {/* Icon */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl gradient-indigo flex items-center justify-center shadow-lg shadow-indigo-200">
                <Zap size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">AgencyOS Pro</p>
                <h2 className="text-xl font-black text-gray-900">Suscríbete para acceder</h2>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-black text-gray-900">$49</span>
              <span className="text-gray-400 text-lg mb-1.5">/ mes</span>
            </div>
            <p className="text-sm text-indigo-500 font-medium mb-6 flex items-center gap-1.5">
              <Sparkles size={13} /> 14 días de prueba gratis — sin tarjeta de crédito
            </p>

            {/* Features */}
            <ul className="space-y-2.5 mb-7">
              {PLAN_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              className="btn-primary w-full justify-center py-3.5 text-base font-semibold"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Redirigiendo a Stripe...</>
                : <><span>Empezar prueba gratuita</span><ArrowRight size={17} /></>
              }
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Cancela en cualquier momento · Pago seguro con Stripe
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-5">
          {['🔒 Pago cifrado SSL', '✅ Cancela cuando quieras', '💳 Stripe Payments'].map(b => (
            <span key={b} className="text-xs text-gray-400">{b}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Need useState import in this file
import { useState } from 'react'

export default function SubscriptionRoute() {
  const { isActive, isLoading } = useSubscription()
  const { user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-indigo-400" />
      </div>
    )
  }

if (!isActive && (user as any)?.role !== 'admin') return <UpgradeWall />
  return <Outlet />
}
