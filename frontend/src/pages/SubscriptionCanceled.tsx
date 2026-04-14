import { useNavigate } from 'react-router-dom'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useState } from 'react'

export default function SubscriptionCanceled() {
  const navigate = useNavigate()
  const { subscribe } = useSubscription()
  const [loading, setLoading] = useState(false)

  const handleRetry = async () => {
    setLoading(true)
    try { await subscribe() } catch { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <XCircle size={30} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Pago cancelado</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          No se ha realizado ningún cargo. Puedes intentarlo de nuevo cuando quieras.
        </p>
        <div className="flex flex-col gap-3">
          <button className="btn-primary w-full justify-center py-3" onClick={handleRetry} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Intentar de nuevo
          </button>
          <button className="btn-secondary w-full justify-center" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
