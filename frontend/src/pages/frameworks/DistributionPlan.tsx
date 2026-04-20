import { useState } from 'react'
import { Map } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import FrameworkLayout, {
  ResultSection, RoiBadge, FormField, inputCls,
} from '../../components/FrameworkLayout'
import { printHTML, downloadCSV } from '../../lib/exportUtils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Channel {
  name: string
  roi: string
  budget: string
  strategy: string
  priority: number
}
interface CalendarAction {
  channel: string
  action: string
  goal: string
}
interface CalendarWeek {
  week: number
  focus: string
  actions: CalendarAction[]
}
interface DistributionData {
  channels: Channel[]
  calendar: CalendarWeek[]
}

// ─── Export helpers ───────────────────────────────────────────────────────────
function toPDF(product: string, d: DistributionData) {
  printHTML(`Plan de Distribución 30 días — ${product}`, `
    <h1>Plan de Distribución 30 días: ${product}</h1>
    <h2>Canales por ROI</h2>
    <table>
      <tr><th>#</th><th>Canal</th><th>ROI</th><th>Presupuesto</th><th>Estrategia</th></tr>
      ${d.channels.map(c => `<tr><td>${c.priority}</td><td>${c.name}</td><td><span class="badge ${c.roi.toLowerCase()}">${c.roi}</span></td><td>${c.budget}</td><td>${c.strategy}</td></tr>`).join('')}
    </table>
    <h2>Calendario 4 Semanas</h2>
    ${d.calendar.map(w => `
      <div class="section">
        <h3>Semana ${w.week} — ${w.focus}</h3>
        ${w.actions.map(a => `<p><strong>${a.channel}:</strong> ${a.action} <em>(${a.goal})</em></p>`).join('')}
      </div>`).join('')}
  `)
}

function toCSV(product: string, d: DistributionData) {
  downloadCSV(`distribucion_${product}`, [
    ['Plan de Distribución 30 días', product],
    [],
    ['CANALES'],
    ['Prioridad', 'Canal', 'ROI', 'Presupuesto', 'Estrategia'],
    ...d.channels.map(c => [c.priority, c.name, c.roi, c.budget, c.strategy]),
    [],
    ['CALENDARIO'],
    ['Semana', 'Enfoque', 'Canal', 'Acción', 'Objetivo'],
    ...d.calendar.flatMap(w =>
      w.actions.map(a => [w.week, w.focus, a.channel, a.action, a.goal])
    ),
  ])
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const ROI_ORDER = { alto: 0, medio: 1, bajo: 2 }

export default function DistributionPlan() {
  const { token } = useAuth()
  const [product,   setProduct]   = useState('')
  const [audience,  setAudience]  = useState('')
  const [budget,    setBudget]    = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [data,      setData]      = useState<DistributionData | null>(null)

  async function handleGenerate() {
    if (!product.trim() || !audience.trim() || !budget.trim()) return
    setIsLoading(true); setError(null); setData(null)
    try {
      const res = await fetch('/api/frameworks/distribucion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product, audience, budget }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando el plan de distribución.')
    } finally {
      setIsLoading(false)
    }
  }

  const sorted = data
    ? [...data.channels].sort((a, b) =>
        (ROI_ORDER[a.roi.toLowerCase() as keyof typeof ROI_ORDER] ?? 9) -
        (ROI_ORDER[b.roi.toLowerCase() as keyof typeof ROI_ORDER] ?? 9)
      )
    : []

  const result = data ? (
    <>
      {/* Channels */}
      <ResultSection title="Canales ordenados por ROI">
        <div className="space-y-2">
          {sorted.map((c, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/40 border border-white/5">
              <span className="text-xs font-black text-zinc-600 w-5 flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-bold text-white">{c.name}</p>
                  <RoiBadge roi={c.roi} />
                  <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{c.budget}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{c.strategy}</p>
              </div>
            </div>
          ))}
        </div>
      </ResultSection>

      {/* Calendar */}
      <ResultSection title="Calendario 4 semanas">
        <div className="grid grid-cols-2 gap-3">
          {data.calendar.map(w => (
            <div key={w.week} className="rounded-xl border border-white/5 bg-zinc-800/40 overflow-hidden">
              <div className="px-3 py-2 bg-zinc-800 border-b border-white/5">
                <p className="text-xs font-bold text-white">Semana {w.week}</p>
                <p className="text-[10px] text-indigo-400">{w.focus}</p>
              </div>
              <div className="p-3 space-y-2">
                {w.actions.map((a, j) => (
                  <div key={j} className="text-xs">
                    <span className="font-semibold text-zinc-300">{a.channel}: </span>
                    <span className="text-zinc-500">{a.action}</span>
                    <div className="text-[10px] text-zinc-600 mt-0.5">→ {a.goal}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ResultSection>
    </>
  ) : undefined

  return (
    <FrameworkLayout
      title="Plan de Distribución 30 días"
      subtitle="Canales por ROI + calendario 4 semanas + estrategia por canal"
      icon={Map}
      onGenerate={handleGenerate}
      isLoading={isLoading}
      hasResult={!!data}
      result={result}
      generateDisabled={!product.trim() || !audience.trim() || !budget.trim()}
      onExportPDF={data ? () => toPDF(product, data) : undefined}
      onExportCSV={data ? () => toCSV(product, data) : undefined}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Producto o servicio">
          <input className={inputCls} placeholder="ej. curso online de trading, zapatos veganos…" value={product} onChange={e => setProduct(e.target.value)} />
        </FormField>
        <FormField label="Presupuesto mensual">
          <input className={inputCls} placeholder="ej. €2.000, €10.000…" value={budget} onChange={e => setBudget(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Público objetivo">
        <input className={inputCls} placeholder="ej. hombres 28-45 interesados en finanzas personales con ingresos medios-altos" value={audience} onChange={e => setAudience(e.target.value)} />
      </FormField>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </FrameworkLayout>
  )
}
