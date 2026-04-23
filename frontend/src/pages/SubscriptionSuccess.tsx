import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Zap, ArrowRight, Sparkles } from 'lucide-react'
import { useSubscription } from '../contexts/SubscriptionContext'

const FEATURES = [
  'Generador de contenido IA',
  'Calendario inteligente',
  'Calculadora de presupuestos',
  'Analizador de competencia',
  'Publicación en Instagram',
]

export default function SubscriptionSuccess() {
  const navigate      = useNavigate()
  const [params]      = useSearchParams()
  const { refetch }   = useSubscription()
  const [countdown,   setCountdown]  = useState(5)
  const [verified,    setVerified]   = useState(false)

  const sessionId = params.get('session_id')

  useEffect(() => {
    // Sync subscription state from backend
    refetch().then(() => setVerified(true))
  }, [refetch])

  useEffect(() => {
    if (!verified) return
    if (countdown <= 0) { navigate('/', { replace: true }); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [verified, countdown, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Success animation */}
        <div className="relative inline-flex mb-6">
          <div className="w-24 h-24 rounded-3xl gradient-indigo flex items-center justify-center shadow-2xl shadow-indigo-300">
            <CheckCircle2 size={44} className="text-white" />
          </div>
          {/* Ring */}
          <div className="absolute inset-0 rounded-3xl border-4 border-indigo-300 animate-ping opacity-30" />
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">¡Bienvenido a Pro!</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Tu suscripción está activa. Tienes acceso completo a todas las herramientas de Agenciesos.
        </p>

        {/* Features unlocked */}
        <div className="card p-5 text-left mb-6">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Sparkles size={12} /> Herramientas desbloqueadas
          </p>
          <ul className="space-y-2">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={10} className="text-indigo-500" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Session ID */}
        {sessionId && (
          <p className="text-xs text-gray-300 mb-6 font-mono">ID: {sessionId.slice(0, 24)}…</p>
        )}

        <button
          className="btn-primary w-full justify-center py-3.5 text-base"
          onClick={() => navigate('/', { replace: true })}
        >
          <Zap size={17} />
          Ir al Dashboard
          {verified && countdown < 5 && (
            <span className="ml-1 opacity-60 text-sm">({countdown}s)</span>
          )}
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  )
}
