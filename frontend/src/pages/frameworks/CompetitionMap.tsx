import { useState } from 'react'
import { Crosshair } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import FrameworkLayout, {
  ResultSection, FormField, inputCls,
} from '../../components/FrameworkLayout'
import { printHTML, downloadCSV } from '../../lib/exportUtils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Competitor {
  name: string
  strengths: string[]
  weaknesses: string[]
  gap: string
  positioning: string
}
interface CompetitionData {
  competitors: Competitor[]
  suggestedPositioning: string
  keyDifferentiators: string[]
}

// ─── Export helpers ───────────────────────────────────────────────────────────
function toPDF(industry: string, d: CompetitionData) {
  printHTML(`Mapa de Competencia — ${industry}`, `
    <h1>Mapa de Competencia: ${industry}</h1>
    <table>
      <tr><th>Competidor</th><th>Fortalezas</th><th>Debilidades</th><th>Gap</th><th>Posicionamiento</th></tr>
      ${d.competitors.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.strengths.map(s => `• ${s}`).join('<br>')}</td>
          <td>${c.weaknesses.map(w => `• ${w}`).join('<br>')}</td>
          <td>${c.gap}</td>
          <td>${c.positioning}</td>
        </tr>`).join('')}
    </table>
    <h2>Posicionamiento Sugerido</h2>
    <div class="section"><p>${d.suggestedPositioning}</p></div>
    <h2>Diferenciadores Clave</h2>
    <ul>${d.keyDifferentiators.map(d => `<li>${d}</li>`).join('')}</ul>
  `)
}

function toCSV(industry: string, d: CompetitionData) {
  downloadCSV(`competencia_${industry}`, [
    ['Mapa de Competencia', industry],
    [],
    ['Competidor', 'Fortalezas', 'Debilidades', 'Gap', 'Posicionamiento'],
    ...d.competitors.map(c => [
      c.name,
      c.strengths.join(' | '),
      c.weaknesses.join(' | '),
      c.gap,
      c.positioning,
    ]),
    [],
    ['Posicionamiento Sugerido'],
    [d.suggestedPositioning],
    [],
    ['Diferenciadores Clave'],
    ...d.keyDifferentiators.map(df => [df]),
  ])
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CompetitionMap() {
  const { token } = useAuth()
  const [industry,    setIndustry]    = useState('')
  const [competitors, setCompetitors] = useState(['', '', '', '', ''])
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [data,        setData]        = useState<CompetitionData | null>(null)

  function updateCompetitor(i: number, val: string) {
    setCompetitors(prev => { const n = [...prev]; n[i] = val; return n })
  }

  const filledCompetitors = competitors.filter(c => c.trim())

  async function handleGenerate() {
    if (!industry.trim() || filledCompetitors.length < 2) return
    setIsLoading(true); setError(null); setData(null)
    try {
      const res = await fetch('/api/frameworks/competencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ competitors: filledCompetitors, industry }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando el mapa de competencia.')
    } finally {
      setIsLoading(false)
    }
  }

  const result = data ? (
    <>
      {/* Competitor table */}
      <ResultSection title="Análisis por Competidor">
        <div className="space-y-3">
          {data.competitors.map((c, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-zinc-800/40 overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-800 border-b border-white/5">
                <p className="text-sm font-bold text-white">{c.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5 italic">{c.positioning}</p>
              </div>
              <div className="grid grid-cols-3 gap-px bg-white/5">
                <div className="bg-zinc-900 p-3">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-2">Fortalezas</p>
                  <ul className="space-y-1">
                    {c.strengths.map((s, j) => (
                      <li key={j} className="text-xs text-zinc-400 flex gap-1.5"><span className="text-emerald-500">+</span>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-zinc-900 p-3">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-2">Debilidades</p>
                  <ul className="space-y-1">
                    {c.weaknesses.map((w, j) => (
                      <li key={j} className="text-xs text-zinc-400 flex gap-1.5"><span className="text-red-500">−</span>{w}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-zinc-900 p-3">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-2">Gap que deja</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{c.gap}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ResultSection>

      {/* Positioning */}
      <ResultSection title="Posicionamiento Sugerido">
        <p className="text-sm text-zinc-300 leading-relaxed">{data.suggestedPositioning}</p>
      </ResultSection>

      {/* Differentiators */}
      <ResultSection title="Diferenciadores Clave">
        <div className="grid grid-cols-2 gap-2">
          {data.keyDifferentiators.map((d, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-zinc-800/40 border border-indigo-500/15">
              <span className="text-indigo-400 font-black text-xs mt-0.5 flex-shrink-0">{i + 1}</span>
              <p className="text-xs text-zinc-300 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </ResultSection>
    </>
  ) : undefined

  return (
    <FrameworkLayout
      title="Mapa de Competencia"
      subtitle="Fortalezas, debilidades, gaps y posicionamiento sugerido"
      icon={Crosshair}
      onGenerate={handleGenerate}
      isLoading={isLoading}
      hasResult={!!data}
      result={result}
      generateDisabled={!industry.trim() || filledCompetitors.length < 2}
      onExportPDF={data ? () => toPDF(industry, data) : undefined}
      onExportCSV={data ? () => toCSV(industry, data) : undefined}
    >
      <FormField label="Industria">
        <input
          className={inputCls}
          placeholder="ej. moda online, software SaaS, restauración…"
          value={industry}
          onChange={e => setIndustry(e.target.value)}
        />
      </FormField>

      <FormField label="Competidores (mínimo 2, máximo 5)">
        <div className="space-y-2">
          {competitors.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputCls}
                placeholder={`Competidor ${i + 1}${i < 2 ? ' *' : ''}`}
                value={c}
                onChange={e => updateCompetitor(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </FormField>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </FrameworkLayout>
  )
}
