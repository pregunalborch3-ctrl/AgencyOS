import { useNavigate } from 'react-router-dom'
import { Zap, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8">
        <Zap size={24} className="text-indigo-400" />
      </div>

      <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">404</p>
      <h1 className="text-white text-3xl font-black mb-3">Página no encontrada</h1>
      <p className="text-zinc-400 text-sm max-w-xs mb-10">
        La URL que buscas no existe o ha sido movida.
      </p>

      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors"
      >
        <ArrowLeft size={15} />
        Volver al inicio
      </button>
    </div>
  )
}
