import { useState, useRef, type DragEvent } from 'react'
import {
  Wand2, ChevronDown, ChevronUp, Loader2, Copy, CheckCheck, RotateCcw,
  Upload, FileSpreadsheet, X,
} from 'lucide-react'
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
    id:          'proposal',
    emoji:       '📋',
    title:       'Propuesta comercial',
    description: 'Propuesta completa con diagnóstico, solución, inversión y próximos pasos lista para enviar.',
    fields: [
      { key: 'tipoCliente', label: 'Tipo de cliente',    placeholder: 'ej. ecommerce de moda, clínica dental, SaaS B2B…',          type: 'text' },
      { key: 'sector',      label: 'Sector',              placeholder: 'ej. retail, salud, tecnología…',                            type: 'text' },
      { key: 'presupuesto', label: 'Presupuesto mensual', placeholder: 'ej. €2.000/mes',                                            type: 'text' },
      { key: 'servicios',   label: 'Servicios que necesita', placeholder: 'ej. Meta Ads, SEO, contenido…',                         type: 'text' },
      { key: 'painPoint',   label: 'Pain point principal', placeholder: 'ej. no consigue ventas online, pierde clientes a la competencia…', type: 'text' },
    ],
  },
  {
    id:          'monthly-report',
    emoji:       '📈',
    title:       'Reporte mensual para cliente',
    description: 'Informe ejecutivo claro y orientado a negocio. Sin jerga técnica.',
    fields: [
      { key: 'periodo',     label: 'Periodo',             placeholder: 'ej. Abril 2026',                                            type: 'text' },
      { key: 'cliente',     label: 'Cliente',             placeholder: 'ej. Clínica DentPlus',                                      type: 'text' },
      { key: 'canales',     label: 'Canales trabajados',  placeholder: 'ej. Meta Ads, Google Ads, Email…',                          type: 'text' },
      { key: 'metricas',    label: 'Métricas principales', placeholder: 'ej. 150 leads a €12 CPL, ROAS 4.2x, CTR 2.1%…',           type: 'textarea' },
      { key: 'objetivo',    label: 'Objetivo del mes',    placeholder: 'ej. conseguir 100 leads a menos de €15…',                   type: 'text' },
      { key: 'presupuesto', label: 'Presupuesto invertido', placeholder: 'ej. €3.500 en ads + €800 gestión',                       type: 'text' },
    ],
  },
  {
    id:          'difficult-email',
    emoji:       '✉️',
    title:       'Email difícil al cliente',
    description: 'El email complicado redactado con precisión. Directo, humano, sin excusas.',
    fields: [
      { key: 'cliente',       label: 'Cliente',              placeholder: 'ej. Carlos de Muebles García',                            type: 'text' },
      { key: 'situacion',     label: 'Situación',            placeholder: 'ej. resultados por debajo del objetivo por fallo en el pixel…', type: 'textarea' },
      { key: 'tonoRelacion',  label: 'Tono de la relación',  type: 'select',
        options: ['Formal y profesional', 'Cercano y de confianza', 'Tenso o conflictivo', 'Nuevo cliente (relación corta)'] },
      { key: 'objetivoEmail', label: 'Objetivo del email',   placeholder: 'ej. reconocer el problema, presentar plan de acción y mantener la confianza…', type: 'text' },
    ],
  },
  {
    id:          'reach-diagnosis',
    emoji:       '🔬',
    title:       'Diagnóstico de campañas paid media',
    description: 'Auditoría forense de Meta Ads y TikTok Ads. Sube tu export CSV/Excel y detecta saturación, fatiga y oportunidades.',
    fields: [
      { key: 'metrics', label: 'Datos exportados', type: 'textarea',
        placeholder: 'Sube un archivo o pega tus métricas aquí…' },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initInputs(tool: ToolDef): Record<string, string> {
  return Object.fromEntries(tool.fields.map(f => [f.key, '']))
}

// ─── Result display ───────────────────────────────────────────────────────────
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
  const [open,          setOpen]          = useState(false)
  const [inputs,        setInputs]        = useState<Record<string, string>>(initInputs(tool))
  const [loading,       setLoading]       = useState(false)
  const [result,        setResult]        = useState<string | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [copied,        setCopied]        = useState(false)
  const [reachFile,     setReachFile]     = useState<File | null>(null)
  const [reachParsing,  setReachParsing]  = useState(false)
  const [reachDragging, setReachDragging] = useState(false)
  const [showFull,      setShowFull]      = useState(false)
  const reachInputRef = useRef<HTMLInputElement>(null)

  const isReachDiagnosis = tool.id === 'reach-diagnosis'

  function setField(key: string, value: string) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  function reset() {
    setInputs(initInputs(tool))
    setResult(null)
    setError(null)
    setReachFile(null)
    setShowFull(false)
  }

  async function handleReachFile(f: File) {
    setReachFile(f)
    setReachParsing(true)
    setField('metrics', '')
    setError(null)
    try {
      const form = new FormData()
      form.append('file', f)
      const res  = await fetch('/api/content-tools/parse-file', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}` },
        body: form,
      })
      const data = await res.json()
      if (!data.success) {
        setReachFile(null)
        setError(data.error ?? 'Error al leer el archivo.')
      } else {
        setField('metrics', data.data.text)
      }
    } catch {
      setReachFile(null)
      setError('Error al leer el archivo. Comprueba el formato.')
    } finally {
      setReachParsing(false)
    }
  }

  function onReachDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setReachDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleReachFile(f)
  }

  async function generate() {
    if (!token) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res  = await fetch('/api/content-tools/generate', {
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

  const canGenerate = tool.fields.every(f => inputs[f.key]?.trim()) && !loading && !reachParsing

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
          <div className="space-y-3">
            {tool.fields.map(field => (
              <div key={field.key}>
                {/* reach-diagnosis metrics: export guide + file upload */}
                {isReachDiagnosis && field.key === 'metrics' ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-4">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Cómo exportar desde Meta Ads Manager</p>
                      <ol className="space-y-1.5 text-xs text-zinc-400">
                        <li className="flex gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">1.</span>Abre Meta Ads Manager → selecciona tus anuncios o campañas</li>
                        <li className="flex gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">2.</span>Haz clic en <strong className="text-zinc-300">Exportar</strong> → <strong className="text-zinc-300">Exportar datos de tabla</strong> → CSV o Excel</li>
                        <li className="flex gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">3.</span>También funciona con exports de Instagram Insights o TikTok Analytics</li>
                        <li className="flex gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">4.</span>Sube el archivo aquí — la IA analiza todas las métricas automáticamente</li>
                      </ol>
                    </div>

                    <div
                      onDragOver={e => { e.preventDefault(); setReachDragging(true) }}
                      onDragLeave={() => setReachDragging(false)}
                      onDrop={onReachDrop}
                      onClick={() => !reachFile && !reachParsing && reachInputRef.current?.click()}
                      className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-8 px-4 transition-all ${
                        reachDragging
                          ? 'border-indigo-400 bg-indigo-500/8'
                          : reachFile
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-white/10 bg-zinc-800/30 hover:border-indigo-500/40 cursor-pointer'
                      }`}
                    >
                      <input
                        ref={reachInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleReachFile(f) }}
                      />
                      {reachParsing ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-indigo-400" />
                          <p className="text-xs text-zinc-400">Leyendo archivo…</p>
                        </>
                      ) : reachFile ? (
                        <>
                          <FileSpreadsheet size={20} className="text-emerald-400" />
                          <p className="text-sm font-medium text-white text-center max-w-xs truncate">{reachFile.name}</p>
                          <p className="text-xs text-emerald-500">Datos cargados · listo para analizar</p>
                          <button
                            onClick={e => { e.stopPropagation(); setReachFile(null); setField('metrics', '') }}
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
                          >
                            <X size={10} /> Cambiar archivo
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload size={18} className="text-zinc-500" />
                          <p className="text-xs text-zinc-400 text-center">
                            Arrastra tu archivo aquí o <span className="text-indigo-400">selecciónalo</span>
                          </p>
                          <p className="text-xs text-zinc-600">CSV o Excel · Máx. 10 MB</p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            ))}
          </div>

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

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {result && (() => {
            const sepIdx      = result.indexOf('\n---')
            const summaryText = sepIdx !== -1 ? result.slice(0, sepIdx).trim() : result
            const fullText    = sepIdx !== -1 ? result.slice(sepIdx + 4).trim() : ''
            const hasFull     = isReachDiagnosis && fullText.length > 0

            return (
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
                  {isReachDiagnosis ? (
                    <>
                      <ResultBlock text={summaryText} />
                      {hasFull && showFull && (
                        <>
                          <hr className="border-white/8 my-4" />
                          <ResultBlock text={fullText} />
                        </>
                      )}
                    </>
                  ) : (
                    <ResultBlock text={result} />
                  )}
                </div>

                {hasFull && (
                  <button
                    onClick={() => setShowFull(v => !v)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-indigo-500/40 transition-all"
                  >
                    {showFull
                      ? <><ChevronUp size={13} /> Ocultar análisis completo</>
                      : <><ChevronDown size={13} /> Ver análisis completo</>
                    }
                  </button>
                )}
              </div>
            )
          })()}
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
            4 herramientas para el día a día de la agencia. Rellena los campos y Claude genera el resultado al instante.
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
