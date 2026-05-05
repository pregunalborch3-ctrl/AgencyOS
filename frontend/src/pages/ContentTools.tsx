import { useState } from 'react'
import { Wand2, ChevronDown, Loader2, Copy, CheckCheck, RotateCcw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { InfoTooltip } from '../components/InfoTooltip'

// ─── Tool definitions ─────────────────────────────────────────────────────────
type FieldType = 'text' | 'textarea' | 'select'
interface Field { key: string; label: string; placeholder?: string; type: FieldType; options?: string[] }
interface ToolDef {
  id:          string
  title:       string
  description: string
  emoji:       string
  fields:      Field[]
}

const TOOLS: ToolDef[] = [
  {
    id:          'viral-strategy',
    emoji:       '🚀',
    title:       'Estrategia de contenido viral',
    description: 'Plan de 30 días con pilares, ideas diarias, horarios y hashtags para tu nicho.',
    fields: [
      { key: 'niche',       label: 'Nicho',              placeholder: 'ej. fitness femenino, finanzas personales…', type: 'text' },
      { key: 'accountSize', label: 'Tamaño de la cuenta', placeholder: 'ej. 2.500 seguidores',                      type: 'text' },
      { key: 'audience',    label: 'Audiencia objetivo',  placeholder: 'ej. mujeres 25-35 que quieren perder peso', type: 'text' },
    ],
  },
  {
    id:          'scroll-hook',
    emoji:       '⚡',
    title:       'Gancho que para el scroll',
    description: '10 hooks con el trigger psicológico de cada uno y el formato ideal.',
    fields: [
      { key: 'topic',    label: 'Tema del post',   placeholder: 'ej. cómo ahorrar 500€ al mes',        type: 'text' },
      { key: 'audience', label: 'Audiencia',        placeholder: 'ej. emprendedores que empiezan',      type: 'text' },
      { key: 'tone',     label: 'Tono',             type: 'select',
        options: ['Educativo', 'Entretenido', 'Inspiracional', 'Provocador', 'Directo'] },
    ],
  },
  {
    id:          'carousel',
    emoji:       '🎠',
    title:       'Carrusel que genera guardados',
    description: '8 slides completos con texto, visual sugerido, caption y hashtags.',
    fields: [
      { key: 'topic',         label: 'Tema',                  placeholder: 'ej. 7 errores al invertir en bolsa', type: 'text' },
      { key: 'niche',         label: 'Nicho',                  placeholder: 'ej. inversión para principiantes',  type: 'text' },
      { key: 'audienceLevel', label: 'Nivel de la audiencia',  type: 'select',
        options: ['Principiante', 'Intermedio', 'Avanzado'] },
    ],
  },
  {
    id:          'caption',
    emoji:       '✍️',
    title:       'Caption que convierte',
    description: 'Caption largo + corto + 30 hashtags optimizados para tu objetivo.',
    fields: [
      { key: 'topic',     label: 'Tema',      placeholder: 'ej. lanzamiento de mi nuevo curso',          type: 'text' },
      { key: 'objective', label: 'Objetivo',  type: 'select',
        options: ['Generar comentarios', 'Conseguir ventas', 'Ganar seguidores', 'Aumentar guardados', 'Dirigir tráfico al link'] },
      { key: 'tone',      label: 'Tono',      type: 'select',
        options: ['Cercano y personal', 'Profesional', 'Motivacional', 'Educativo', 'Humorístico'] },
    ],
  },
  {
    id:          'reach-diagnosis',
    emoji:       '📊',
    title:       'Diagnóstico de alcance',
    description: 'Análisis de tus métricas reales + plan de acción de 2 semanas.',
    fields: [
      { key: 'metrics', label: 'Métricas de tus últimos posts',
        placeholder: 'Pega aquí tus datos: alcance, impresiones, guardados, compartidos, comentarios…\nEj:\nPost 1 (Reel): alcance 1.200, impresiones 1.800, guardados 45, compartidos 12\nPost 2 (Carrusel): alcance 850, impresiones 1.100, guardados 23…',
        type: 'textarea' },
      { key: 'format', label: 'Formato principal analizado', type: 'select',
        options: ['Reel', 'Carrusel', 'Foto', 'Story', 'Directo', 'Mixto'] },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initInputs(tool: ToolDef): Record<string, string> {
  return Object.fromEntries(tool.fields.map(f => [f.key, '']))
}

// ─── Result display (renders markdown-ish text) ───────────────────────────────
function ResultBlock({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="text-sm text-zinc-300 leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## '))  return <h3 key={i} className="text-white font-bold text-base mt-5 mb-1 first:mt-0">{line.slice(3)}</h3>
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-white font-semibold mt-3">{line.slice(2, -2)}</p>
        if (line.startsWith('- '))   return <li key={i} className="ml-3 list-disc list-inside text-zinc-400">{line.slice(2)}</li>
        if (line.startsWith('→ '))   return <p key={i} className="ml-3 text-zinc-500 text-xs">{line}</p>
        if (line.startsWith('---'))  return <hr key={i} className="border-white/8 my-3" />
        if (line.trim() === '')      return <div key={i} className="h-1" />
        return <p key={i}>{line}</p>
      })}
    </div>
  )
}

// ─── Single tool card ─────────────────────────────────────────────────────────
function ToolCard({ tool, token }: { tool: ToolDef; token: string | null }) {
  const [open,    setOpen]    = useState(false)
  const [inputs,  setInputs]  = useState<Record<string, string>>(initInputs(tool))
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)

  function setField(key: string, value: string) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  function reset() {
    setInputs(initInputs(tool))
    setResult(null)
    setError(null)
  }

  async function generate() {
    if (!token) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/content-tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tool: tool.id, inputs }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Error al generar')
      setResult(data.data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const canGenerate = tool.fields.every(f => inputs[f.key]?.trim()) && !loading

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      open ? 'border-indigo-500/40 bg-zinc-900/80' : 'border-white/8 bg-zinc-900/40 hover:border-white/15'
    }`}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <span className="text-2xl select-none">{tool.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{tool.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{tool.description}</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-zinc-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-4">

          {/* Fields */}
          <div className="space-y-3">
            {tool.fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={inputs[field.key]}
                    onChange={e => setField(field.key, e.target.value)}
                    className="w-full bg-zinc-800 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  >
                    <option value="">Selecciona una opción…</option>
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={5}
                    value={inputs[field.key]}
                    onChange={e => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-zinc-800 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={inputs[field.key]}
                    onChange={e => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-zinc-800 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                    onKeyDown={e => { if (e.key === 'Enter' && canGenerate) generate() }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Generando…</>
              : <><Wand2 size={15} /> Generar</>
            }
          </button>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Resultado</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    <RotateCcw size={11} /> Nueva consulta
                  </button>
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    {copied ? <><CheckCheck size={11} className="text-emerald-400" /> Copiado</> : <><Copy size={11} /> Copiar</>}
                  </button>
                </div>
              </div>
              <div className="rounded-xl bg-zinc-800/60 border border-white/6 px-4 py-4 max-h-[520px] overflow-y-auto">
                <ResultBlock text={result} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ContentTools() {
  const { token } = useAuth()

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                <Wand2 size={16} className="text-indigo-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Herramientas IA</h1>
            </div>
            <InfoTooltip text="Genera contenido optimizado para Instagram y TikTok con prompts expertos. Estrategias virales, hooks, carruseles, captions y diagnóstico de alcance." />
          </div>
          <p className="text-sm text-zinc-500 ml-12">
            5 herramientas de contenido para Instagram y TikTok. Rellena los campos y Claude genera el resultado al instante.
          </p>
        </div>

        {/* Tool cards */}
        <div className="space-y-3">
          {TOOLS.map(tool => (
            <ToolCard key={tool.id} tool={tool} token={token} />
          ))}
        </div>

      </div>
    </div>
  )
}
