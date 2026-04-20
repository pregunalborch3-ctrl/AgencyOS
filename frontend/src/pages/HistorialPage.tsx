import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Eye, Copy, Trash2, Rocket, ChevronRight, Loader2 } from 'lucide-react'
import { type HistoryEntry } from '../lib/history'
import { getCampaigns, deleteCampaignById, type SavedCampaign } from '../lib/campaignsApi'
import { useAuth } from '../contexts/AuthContext'

const NICHE_LABELS: Record<string, string> = {
  ropa: 'Ropa y moda', calzado: 'Calzado', belleza: 'Belleza', fitness: 'Fitness',
  hogar: 'Hogar', tecnologia: 'Tecnología', alimentacion: 'Alimentación',
  joyeria: 'Joyería', mascotas: 'Mascotas', deportes: 'Deportes',
}
const OBJ_LABELS: Record<string, string> = { ventas: 'Ventas', leads: 'Leads', trafico: 'Tráfico' }

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3600000
  if (diffH < 1)  return 'Hace menos de 1h'
  if (diffH < 24) return `Hace ${Math.floor(diffH)}h`
  if (diffH < 48) return 'Ayer'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function toHistoryEntry(c: SavedCampaign): HistoryEntry {
  const data = c.data as Record<string, unknown> & { _inputText?: string; _style?: string }
  return {
    id:          c.id,
    date:        c.createdAt,
    productName: c.name,
    niche:       c.niche,
    objective:   c.objective,
    style:       data._style ?? 'performance',
    inputText:   data._inputText ?? c.name,
    result:      c.data,
  }
}

export default function HistorialPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setIsLoading(false); return }
    getCampaigns(token)
      .then(data => setCampaigns(data))
      .catch(() => setError('No se pudo cargar el historial.'))
      .finally(() => setIsLoading(false))
  }, [token])

  function handleView(c: SavedCampaign) {
    navigate('/dashboard', { state: { loadCampaign: toHistoryEntry(c) } })
  }

  function handleDuplicate(c: SavedCampaign) {
    const entry = toHistoryEntry(c)
    navigate('/dashboard', {
      state: { prefill: { input: entry.inputText, niche: entry.niche, objective: entry.objective, style: entry.style } },
    })
  }

  async function handleDelete(id: string) {
    if (!token) return
    setCampaigns(prev => prev.filter(c => c.id !== id))
    try {
      await deleteCampaignById(token, id)
    } catch {
      // re-fetch to restore if delete failed
      getCampaigns(token).then(setCampaigns).catch(() => {})
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5">
        <h1 className="text-2xl font-black text-white">Historial</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Campañas guardadas en tu cuenta</p>
      </div>

      <div className="flex-1 p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={20} className="text-zinc-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-zinc-500 text-sm">{error}</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-5">
              <Clock size={24} className="text-zinc-700" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Sin historial todavía</h3>
            <p className="text-zinc-500 text-sm mb-6 max-w-xs">
              Genera una campaña y pulsa "Guardar" para que aparezca aquí.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold rounded-xl transition-all"
            >
              <Rocket size={15} /> Generar primera campaña
            </button>
          </div>
        ) : (
          <div className="max-w-3xl space-y-2">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-5">
              {campaigns.length} campaña{campaigns.length !== 1 ? 's' : ''} guardada{campaigns.length !== 1 ? 's' : ''}
            </p>
            {campaigns.map(c => (
              <div
                key={c.id}
                className="group flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-zinc-900 hover:border-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Rocket size={16} className="text-indigo-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate leading-tight">{c.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-500">{NICHE_LABELS[c.niche] ?? c.niche}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[10px] text-zinc-500">{OBJ_LABELS[c.objective] ?? c.objective}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                      <Clock size={9} /> {formatDate(c.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleView(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-indigo-500/15 hover:text-indigo-400 text-zinc-400 text-xs font-semibold transition-all border border-white/5"
                  >
                    <Eye size={12} /> Ver
                  </button>
                  <button
                    onClick={() => handleDuplicate(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-white/5 text-zinc-400 text-xs font-semibold transition-all border border-white/5"
                  >
                    <Copy size={12} /> Duplicar
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <ChevronRight
                  size={14}
                  className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0 cursor-pointer"
                  onClick={() => handleView(c)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
