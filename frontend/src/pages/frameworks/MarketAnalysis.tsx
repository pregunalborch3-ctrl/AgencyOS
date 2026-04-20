import { useState } from 'react'
import { Globe2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import FrameworkLayout, {
  ResultSection, ImpactBadge, FormField, inputCls,
} from '../../components/FrameworkLayout'
import { printHTML, downloadCSV } from '../../lib/exportUtils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface MarketData {
  tam: { value: string; description: string }
  sam: { value: string; description: string }
  som: { value: string; description: string }
  trends: { title: string; description: string; impact: string }[]
  opportunities: { title: string; description: string; action: string }[]
}

// ─── Export helpers ───────────────────────────────────────────────────────────
function toPDF(nicho: string, d: MarketData) {
  printHTML(`Análisis de Mercado — ${nicho}`, `
    <h1>Análisis de Mercado: ${nicho}</h1>
    <h2>TAM / SAM / SOM</h2>
    <div class="section">
      <div class="metric"><span class="metric-value">${d.tam.value}</span><span class="metric-label">TAM — Mercado Total</span></div>
      <div class="metric"><span class="metric-value">${d.sam.value}</span><span class="metric-label">SAM — Mercado Servible</span></div>
      <div class="metric"><span class="metric-value">${d.som.value}</span><span class="metric-label">SOM — Mercado Obtenible</span></div>
      <p style="margin-top:12px">${d.tam.description}</p>
    </div>
    <h2>Top 5 Tendencias</h2>
    ${d.trends.map(t => `<div class="section"><h3>${t.title} <span class="badge ${t.impact.toLowerCase()}">${t.impact}</span></h3><p>${t.description}</p></div>`).join('')}
    <h2>Top 5 Oportunidades</h2>
    ${d.opportunities.map(o => `<div class="section"><h3>${o.title}</h3><p>${o.description}</p><p><strong>Acción:</strong> ${o.action}</p></div>`).join('')}
  `)
}

function toCSV(nicho: string, d: MarketData) {
  downloadCSV(`mercado_${nicho}`, [
    ['Análisis de Mercado', nicho],
    [],
    ['Segmento', 'Valor', 'Descripción'],
    ['TAM', d.tam.value, d.tam.description],
    ['SAM', d.sam.value, d.sam.description],
    ['SOM', d.som.value, d.som.description],
    [],
    ['TENDENCIAS'],
    ['Título', 'Descripción', 'Impacto'],
    ...d.trends.map(t => [t.title, t.description, t.impact]),
    [],
    ['OPORTUNIDADES'],
    ['Título', 'Descripción', 'Acción recomendada'],
    ...d.opportunities.map(o => [o.title, o.description, o.action]),
  ])
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MarketAnalysis() {
  const { token } = useAuth()
  const [nicho,     setNicho]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [data,      setData]      = useState<MarketData | null>(null)

  async function handleGenerate() {
    if (!nicho.trim()) return
    setIsLoading(true); setError(null); setData(null)
    try {
      const res = await fetch('/api/frameworks/mercado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nicho }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando el análisis.')
    } finally {
      setIsLoading(false)
    }
  }

  const result = data ? (
    <>
      {/* TAM / SAM / SOM */}
      <ResultSection title="Tamaño de Mercado">
        <div className="grid grid-cols-3 gap-4">
          {([
            { label: 'TAM', sub: 'Mercado Total Disponible', ...data.tam },
            { label: 'SAM', sub: 'Mercado Servible',        ...data.sam },
            { label: 'SOM', sub: 'Mercado Obtenible',       ...data.som },
          ]).map(m => (
            <div key={m.label} className="rounded-xl bg-zinc-800/60 border border-white/5 p-4">
              <p className="text-2xl font-black text-indigo-400">{m.value}</p>
              <p className="text-xs font-bold text-white mt-1">{m.label}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">{m.sub}</p>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      </ResultSection>

      {/* Tendencias */}
      <ResultSection title="Top 5 Tendencias">
        <div className="space-y-3">
          {data.trends.map((t, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl bg-zinc-800/40 border border-white/5">
              <span className="text-xs font-black text-zinc-600 w-5 flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-white">{t.title}</p>
                  <ImpactBadge impact={t.impact} />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </ResultSection>

      {/* Oportunidades */}
      <ResultSection title="Top 5 Oportunidades">
        <div className="space-y-3">
          {data.opportunities.map((o, i) => (
            <div key={i} className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
              <div className="flex items-start gap-3">
                <span className="text-xs font-black text-indigo-500 w-5 flex-shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">{o.title}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-2">{o.description}</p>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide flex-shrink-0 mt-0.5">Acción →</span>
                    <p className="text-xs text-indigo-300">{o.action}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ResultSection>
    </>
  ) : undefined

  return (
    <FrameworkLayout
      title="Análisis de Mercado"
      subtitle="TAM, SAM, SOM + tendencias + oportunidades generadas con IA"
      icon={Globe2}
      onGenerate={handleGenerate}
      isLoading={isLoading}
      hasResult={!!data}
      result={result}
      generateDisabled={!nicho.trim()}
      onExportPDF={data ? () => toPDF(nicho, data) : undefined}
      onExportCSV={data ? () => toCSV(nicho, data) : undefined}
    >
      <FormField label="Nicho de mercado">
        <input
          className={inputCls}
          placeholder="ej. ropa deportiva femenina, suplementos fitness, software B2B…"
          value={nicho}
          onChange={e => setNicho(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />
      </FormField>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </FrameworkLayout>
  )
}
