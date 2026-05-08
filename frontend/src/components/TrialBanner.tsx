import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'

const LAUNCH_COUPON = 'pDQrERMK'

function daysLeft(trialEnd: string): number {
  const ms = new Date(trialEnd).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export default function TrialBanner() {
  const { user } = useAuth()
  const { subscription, subscribe } = useSubscription()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null
  if (!user) return null

  const isTrialing = subscription?.status === 'trialing'
  if (!isTrialing) return null

  // Hide if user already has a paid active subscription via Stripe
  if (subscription?.stripeSubscriptionId && subscription.status === 'active') return null

  const trialEnd = subscription?.trialEnd
  if (!trialEnd) return null

  const days = daysLeft(trialEnd)
  const isUrgent = days <= 2

  const message = days === 0
    ? 'Tu prueba gratuita termina hoy.'
    : days === 1
    ? 'Te queda 1 día de prueba gratuita.'
    : `Te quedan ${days} días de prueba gratuita.`

  return (
    <div className={`relative flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium ${
      isUrgent
        ? 'bg-amber-500/20 border-b border-amber-500/40 text-amber-300'
        : 'bg-indigo-600/20 border-b border-indigo-500/30 text-indigo-200'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`shrink-0 text-base ${isUrgent ? 'text-amber-400' : 'text-indigo-400'}`}>
          {isUrgent ? '⚠️' : '🎁'}
        </span>
        <span className="truncate">
          {message}
          {isUrgent && (
            <span className="ml-1 text-amber-200/80 font-normal">
              Activa tu plan para no perder el acceso.
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => subscribe(undefined, LAUNCH_COUPON)}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
            isUrgent
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : 'bg-indigo-500 hover:bg-indigo-400 text-white'
          }`}
        >
          Elegir plan
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Cerrar"
          className="text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
