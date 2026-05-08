import { useSubscription } from '../contexts/SubscriptionContext'
import { useAuth } from '../contexts/AuthContext'

export default function TrialExpiredModal() {
  const { user } = useAuth()
  const { subscription, isActive, subscribe } = useSubscription()

  if (!user) return null
  if (isActive) return null

  const wasTrialing = subscription?.status === 'trialing' || (
    !subscription && user.subscription?.status === 'trialing'
  )
  if (!wasTrialing) return null

  const trialEnd = subscription?.trialEnd ?? user.subscription?.trialEnd
  if (!trialEnd) return null

  const expired = new Date(trialEnd).getTime() < Date.now()
  if (!expired) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-8 text-center shadow-2xl">
        <div className="text-5xl mb-4">⏰</div>
        <h2 className="text-2xl font-bold text-white mb-2">Tu prueba gratuita ha terminado</h2>
        <p className="text-zinc-400 mb-1">
          Esperamos que hayas visto el valor de Agenciesos durante estos 7 días.
        </p>
        <p className="text-zinc-400 mb-6">
          Activa tu plan ahora y sigue generando campañas sin interrupciones.
        </p>

        {/* Oferta de lanzamiento */}
        <div className="bg-indigo-600/20 border border-indigo-500/40 rounded-xl p-4 mb-6">
          <p className="text-indigo-300 font-semibold text-sm uppercase tracking-wide mb-1">Oferta de lanzamiento</p>
          <p className="text-white font-bold text-2xl">50% de descuento</p>
          <p className="text-zinc-400 text-sm">en tu primer mes · Solo por tiempo limitado</p>
        </div>

        <button
          onClick={() => subscribe()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors text-base"
        >
          Activar mi plan ahora →
        </button>
        <p className="text-zinc-600 text-xs mt-3">Sin permanencia · Cancela cuando quieras</p>
      </div>
    </div>
  )
}
