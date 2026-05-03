import { type ReactNode } from 'react'
import { Lock, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePlan, type PlanTier } from '../hooks/usePlan'

const PLAN_LABELS: Record<PlanTier, string> = {
  free:       'Gratuito',
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
}

interface Props {
  required: PlanTier
  children: ReactNode
  /** true = compact inline gate (inside a tab), false = full-page gate */
  inline?: boolean
}

export default function PlanGate({ required, children, inline = false }: Props) {
  const { hasAccess, isLoading } = usePlan()
  const navigate = useNavigate()

  if (isLoading) return null
  if (hasAccess(required)) return <>{children}</>

  const label = PLAN_LABELS[required]

  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
          <Lock size={20} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-white font-bold mb-1">Función {label}</p>
          <p className="text-zinc-500 text-sm">Actualiza tu plan para acceder a esta función.</p>
        </div>
        <button
          onClick={() => navigate('/settings?tab=facturacion')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold transition-all"
        >
          <Zap size={14} /> Ver planes
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
        <Lock size={26} className="text-indigo-400" />
      </div>
      <div>
        <p className="text-xl font-black text-white mb-2">Plan {label} requerido</p>
        <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
          Esta herramienta está disponible en el plan {label} y superiores.
        </p>
      </div>
      <button
        onClick={() => navigate('/settings?tab=facturacion')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
      >
        <Zap size={15} /> Actualizar plan
      </button>
    </div>
  )
}
