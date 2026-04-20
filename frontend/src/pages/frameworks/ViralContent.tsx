import { useState } from 'react'
import { Flame } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import FrameworkLayout, {
  ResultSection, FormField, inputCls, selectCls,
} from '../../components/FrameworkLayout'
import { printHTML, downloadCSV } from '../../lib/exportUtils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Hook      { type: string; text: string; why: string }
interface Format    { platform: string; format: string; frequency: string; goal: string }
interface DayPlan   { day: string; platform: string; format: string; topic: string }
interface ViralData {
  hooks: Hook[]
  formatMatrix: Format[]
  weeklyCalendar: DayPlan[]
}

const TONES     = ['Educativo', 'Entretenimiento', 'Inspiracional', 'Controversial', 'Humor', 'Directo / Ventas']
const PLATFORMS = ['Meta Ads', 'TikTok', 'Instagram', 'YouTube', 'LinkedIn', 'Twitter/X']

const HOOK_COLORS: Record<string, string> = {
  curiosidad:    'bg-violet-500/15 text-violet-400 border-violet-500/20',
  dolor:         'bg-red-500/15 text-red-400 border-red-500/20',
  urgencia:      'bg-amber-500/15 text-amber-400 border-amber-500/20',
  transformación:'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  controversia:  'bg-orange-500/15 text-orange-400 border-orange-500/20',
  humor:         'bg-pink-500/15 text-pink-400 border-pink-500/20',
}

// ─── Export helpers ───────────────────────────────────────────────────────────
function toPDF(niche: string, d: ViralData) {
  printHTML(`Motor de Contenido Viral — ${niche}`, `
    <h1>Motor de Contenido Viral: ${niche}</h1>
    <h2>10 Hooks</h2>
    ${d.hooks.map((h, i) => `<div class="section"><h3>${i + 1}. [${h.type}]</h3><p><strong>"${h.text}"</strong></p><p><em>Por qué funciona: ${h.why}</em></p></div>`).join('')}
    <h2>Matriz de Formatos</h2>
    <table>
      <tr><th>Plataforma</th><th>Formato</th><th>Frecuencia</th><th>Objetivo</th></tr>
      ${d.formatMatrix.map(f => `<tr><td>${f.platform}</td><td>${f.format}</td><td>${f.frequency}</td><td>${f.goal}</td></tr>`).join('')}
    </table>
    <h2>Calendario Semanal</h2>
    <table>
      <tr><th>Día</th><th>Plataforma</th><th>Formato</th><th>Tema</th></tr>
      ${d.weeklyCalendar.map(c => `<tr><td>${c.day}</td><td>${c.platform}</td><td>${c.format}</td><td>${c.topic}</td></tr>`).join('')}
    </table>
  `)
}

function toCSV(niche: string, d: ViralData) {
  downloadCSV(`contenido_viral_${niche}`, [
    ['Motor de Contenido Viral', niche],
    [],
    ['HOOKS'],
    ['#', 'Tipo', 'Texto del Hook', 'Por qué funciona'],
    ...d.hooks.map((h, i) => [i + 1, h.type, h.text, h.why]),
    [],
    ['MATRIZ DE FORMATOS'],
    ['Plataforma', 'Formato', 'Frecuencia', 'Objetivo'],
    ...d.formatMatrix.map(f => [f.platform, f.format, f.frequency, f.goal]),
    [],
    ['CALENDARIO SEMANAL'],
    ['Día', 'Plataforma', 'Formato', 'Tema'],
    ...d.weeklyCalendar.map(c => [c.day, c.platform, c.format, c.topic]),
  ])
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ViralContent() {
  const { token } = useAuth()
  const [niche,        setNiche]        = useState('')
  const [tone,         setTone]         = useState(TONES[0])
  const [selPlatforms, setSelPlatforms] = useState<string[]>(['Meta Ads', 'TikTok'])
  const [isLoading,    setIsLoading]    = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [data,         setData]         = useState<ViralData | null>(null)

  function togglePlatform(p: string) {
    setSelPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  async function handleGenerate() {
    if (!niche.trim() || selPlatforms.length === 0) return
    setIsLoading(true); setError(null); setData(null)
    try {
      const res = await fetch('/api/frameworks/contenido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ niche, tone, platforms: selPlatforms }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando el motor de contenido.')
    } finally {
      setIsLoading(false)
    }
  }

  const result = data ? (
    <>
      {/* Hooks */}
      <ResultSection title={`${data.hooks.length} Hooks listos para usar`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.hooks.map((h, i) => {
            const colorCls = HOOK_COLORS[h.type.toLowerCase()] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'
            return (
              <div key={i} className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-zinc-600">{i + 1}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorCls}`}>{h.type}</span>
                </div>
                <p className="text-sm font-semibold text-white leading-snug mb-1.5">"{h.text}"</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{h.why}</p>
              </div>
            )
          })}
        </div>
      </ResultSection>

      {/* Format matrix */}
      <ResultSection title="Matriz de Formatos">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-zinc-500 font-semibold pb-2 pr-4">Plataforma</th>
                <th className="text-left text-zinc-500 font-semibold pb-2 pr-4">Formato</th>
                <th className="text-left text-zinc-500 font-semibold pb-2 pr-4">Frecuencia</th>
                <th className="text-left text-zinc-500 font-semibold pb-2">Objetivo</th>
              </tr>
            </thead>
            <tbody>
              {data.formatMatrix.map((f, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-white font-semibold">{f.platform}</td>
                  <td className="py-2 pr-4 text-zinc-400">{f.format}</td>
                  <td className="py-2 pr-4 text-zinc-500">{f.frequency}</td>
                  <td className="py-2 text-zinc-500">{f.goal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResultSection>

      {/* Weekly calendar */}
      <ResultSection title="Calendario Semanal">
        <div className="space-y-1.5">
          {data.weeklyCalendar.map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/40 border border-white/5">
              <span className="text-[10px] font-black text-zinc-600 w-16 flex-shrink-0">{c.day}</span>
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">{c.platform}</span>
              <span className="text-[10px] text-zinc-500 flex-shrink-0">{c.format}</span>
              <span className="text-xs text-zinc-300 flex-1 min-w-0 truncate">{c.topic}</span>
            </div>
          ))}
        </div>
      </ResultSection>
    </>
  ) : undefined

  return (
    <FrameworkLayout
      title="Motor de Contenido Viral"
      subtitle="10 hooks + matriz de formatos + calendario semanal"
      icon={Flame}
      onGenerate={handleGenerate}
      isLoading={isLoading}
      hasResult={!!data}
      result={result}
      generateDisabled={!niche.trim() || selPlatforms.length === 0}
      onExportPDF={data ? () => toPDF(niche, data) : undefined}
      onExportCSV={data ? () => toCSV(niche, data) : undefined}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nicho">
          <input className={inputCls} placeholder="ej. fitness femenino, trading, moda sostenible…" value={niche} onChange={e => setNiche(e.target.value)} />
        </FormField>
        <FormField label="Tono de comunicación">
          <select className={selectCls} value={tone} onChange={e => setTone(e.target.value)}>
            {TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Plataformas">
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selPlatforms.includes(p)
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-zinc-800 border-white/8 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </FormField>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </FrameworkLayout>
  )
}
