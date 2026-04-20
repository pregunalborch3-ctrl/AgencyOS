import { useState } from 'react'
import { Layers } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import FrameworkLayout, {
  ResultSection, FormField, inputCls, selectCls,
} from '../../components/FrameworkLayout'
import { printHTML, downloadCSV } from '../../lib/exportUtils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Phase {
  name: string
  duration: string
  goal: string
  actions: string[]
  kpis: string[]
  milestone: string
}
interface RoadmapData {
  phases: Phase[]
  summary: string
  projectedROI: string
}

const TIMEFRAMES = ['6 meses', '12 meses', '18 meses', '24 meses']

const PHASE_COLORS: Record<string, { border: string; badge: string; dot: string }> = {
  'Estabilizar': { border: 'border-blue-500/30',    badge: 'bg-blue-500/15 text-blue-400',    dot: 'bg-blue-500'    },
  'Automatizar': { border: 'border-violet-500/30',  badge: 'bg-violet-500/15 text-violet-400',dot: 'bg-violet-500'  },
  'Delegar':     { border: 'border-amber-500/30',   badge: 'bg-amber-500/15 text-amber-400',  dot: 'bg-amber-500'   },
  'Escalar':     { border: 'border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-500' },
}

// ─── Export helpers ───────────────────────────────────────────────────────────
function toPDF(target: string, d: RoadmapData) {
  printHTML(`Roadmap de Escalado — ${target}`, `
    <h1>Roadmap de Escalado: ${target}</h1>
    <div class="section"><p>${d.summary}</p><p><strong>ROI Proyectado: ${d.projectedROI}</strong></p></div>
    ${d.phases.map(p => `
      <div class="phase">
        <h2>${p.name} — ${p.duration}</h2>
        <p><strong>Objetivo:</strong> ${p.goal}</p>
        <h3>Acciones</h3>
        <ul>${p.actions.map(a => `<li>${a}</li>`).join('')}</ul>
        <h3>KPIs</h3>
        <ul>${p.kpis.map(k => `<li>${k}</li>`).join('')}</ul>
        <p><strong>Hito:</strong> ${p.milestone}</p>
      </div>`).join('')}
  `)
}

function toCSV(target: string, d: RoadmapData) {
  downloadCSV(`escalado_${target}`, [
    ['Roadmap de Escalado', target],
    ['Resumen', d.summary],
    ['ROI Proyectado', d.projectedROI],
    [],
    ['Fase', 'Duración', 'Objetivo', 'Acciones', 'KPIs', 'Hito'],
    ...d.phases.map(p => [
      p.name,
      p.duration,
      p.goal,
      p.actions.join(' | '),
      p.kpis.join(' | '),
      p.milestone,
    ]),
  ])
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ScalingRoadmap() {
  const { token } = useAuth()
  const [currentRevenue, setCurrentRevenue] = useState('')
  const [target,         setTarget]         = useState('')
  const [timeframe,      setTimeframe]      = useState(TIMEFRAMES[1])
  const [isLoading,      setIsLoading]      = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [data,           setData]           = useState<RoadmapData | null>(null)

  async function handleGenerate() {
    if (!currentRevenue.trim() || !target.trim()) return
    setIsLoading(true); setError(null); setData(null)
    try {
      const res = await fetch('/api/frameworks/escalado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentRevenue, target, timeframe }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando el roadmap.')
    } finally {
      setIsLoading(false)
    }
  }

  const result = data ? (
    <>
      {/* Summary */}
      <ResultSection title="Resumen Ejecutivo">
        <p className="text-sm text-zinc-300 leading-relaxed">{data.summary}</p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-xs text-zinc-500">ROI proyectado:</span>
          <span className="text-sm font-black text-emerald-400">{data.projectedROI}</span>
        </div>
      </ResultSection>

      {/* Phases */}
      <ResultSection title="Hoja de Ruta — 4 Fases">
        {/* Timeline connector */}
        <div className="relative space-y-4">
          {data.phases.map((phase, i) => {
            const colors = PHASE_COLORS[phase.name] ?? PHASE_COLORS['Estabilizar']
            return (
              <div key={i} className={`relative rounded-2xl border ${colors.border} bg-zinc-800/30 overflow-hidden`}>
                {/* Phase header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${colors.badge}`}>{phase.name}</span>
                      <span className="text-[10px] text-zinc-600">{phase.duration}</span>
                    </div>
                    <p className="text-sm text-white font-semibold mt-1">{phase.goal}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wide">Hito</p>
                    <p className="text-xs text-zinc-400 max-w-[160px] text-right leading-tight">{phase.milestone}</p>
                  </div>
                </div>

                {/* Actions + KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5">
                  <div className="bg-zinc-900 p-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Acciones</p>
                    <ul className="space-y-1.5">
                      {phase.actions.map((a, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-zinc-400">
                          <span className="text-zinc-600 flex-shrink-0 mt-0.5">→</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-zinc-900 p-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">KPIs</p>
                    <ul className="space-y-1.5">
                      {phase.kpis.map((k, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-zinc-400">
                          <span className="text-indigo-500 flex-shrink-0 mt-0.5">◆</span>{k}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ResultSection>
    </>
  ) : undefined

  return (
    <FrameworkLayout
      title="Roadmap de Escalado"
      subtitle="4 fases: Estabilizar → Automatizar → Delegar → Escalar"
      icon={Layers}
      onGenerate={handleGenerate}
      isLoading={isLoading}
      hasResult={!!data}
      result={result}
      generateDisabled={!currentRevenue.trim() || !target.trim()}
      onExportPDF={data ? () => toPDF(target, data) : undefined}
      onExportCSV={data ? () => toCSV(target, data) : undefined}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Ingresos actuales / mes">
          <input className={inputCls} placeholder="ej. €3.000, €15.000…" value={currentRevenue} onChange={e => setCurrentRevenue(e.target.value)} />
        </FormField>
        <FormField label="Objetivo de ingresos / mes">
          <input className={inputCls} placeholder="ej. €20.000, €100.000…" value={target} onChange={e => setTarget(e.target.value)} />
        </FormField>
        <FormField label="Horizonte temporal">
          <select className={selectCls} value={timeframe} onChange={e => setTimeframe(e.target.value)}>
            {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </FrameworkLayout>
  )
}
