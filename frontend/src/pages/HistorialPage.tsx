import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Eye, Copy, Trash2, Rocket, ChevronRight } from 'lucide-react'
import { HISTORY_KEY, type HistoryEntry } from '../lib/history'

function emptyHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') }
  catch { return [] }
}

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

export default function HistorialPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const navigate = useNavigate()

  useEffect(() => { setHistory(emptyHistory()) }, [])

  function handleView(entry: HistoryEntry) {
    navigate('/dashboard', { state: { loadCampaign: entry } })
  }

  function handleDuplicate(entry: HistoryEntry) {
    navigate('/dashboard', {
      state: { prefill: { input: entry.inputText, niche: entry.niche, objective: entry.objective, style: entry.style } },
    })
  }

  function handleDelete(id: string) {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5">
        <h1 className="text-2xl font-black text-white">Historial</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Campañas generadas anteriormente</p>
      </div>

      <div className="flex-1 p-8">
        {history.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-5">
              <Clock size={24} className="text-zinc-700" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Sin historial todavía</h3>
            <p className="text-zinc-500 text-sm mb-6 max-w-xs">
              Las campañas que generes aparecerán aquí para que puedas revisarlas o duplicarlas.
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
              {history.length} campaña{history.length !== 1 ? 's' : ''} guardada{history.length !== 1 ? 's' : ''}
            </p>
            {history.map(entry => (
              <div
                key={entry.id}
                className="group flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-zinc-900 hover:border-white/10 transition-all"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Rocket size={16} className="text-indigo-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate leading-tight">
                    {entry.productName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-500">{NICHE_LABELS[entry.niche] ?? entry.niche}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[10px] text-zinc-500">{OBJ_LABELS[entry.objective] ?? entry.objective}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                      <Clock size={9} /> {formatDate(entry.date)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleView(entry)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-indigo-500/15 hover:text-indigo-400 text-zinc-400 text-xs font-semibold transition-all border border-white/5"
                  >
                    <Eye size={12} /> Ver
                  </button>
                  <button
                    onClick={() => handleDuplicate(entry)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-white/5 text-zinc-400 text-xs font-semibold transition-all border border-white/5"
                  >
                    <Copy size={12} /> Duplicar
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <ChevronRight
                  size={14}
                  className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0 cursor-pointer"
                  onClick={() => handleView(entry)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
