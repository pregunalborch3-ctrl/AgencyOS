import { useState, useRef, type DragEvent } from 'react'
import {
  Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb, FileText,
  X, BarChart2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalysisResult {
  summary: string
  performingWell: Array<{ name: string; reason: string; highlight: string }>
  performingPoorly: Array<{ name: string; reason: string; action: string }>
  belowAverage: Array<{ metric: string; value: string; benchmark: string; fix: string }>
  recommendations: Array<{ priority: 'alta' | 'media' | 'baja'; title: string; description: string }>
  executiveSummary: string
}

const PRIORITY_COLORS: Record<string, string> = {
  alta:  'bg-red-500/15 text-red-400 border-red-500/30',
  media: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  baja:  'bg-zinc-700/50 text-zinc-400 border-zinc-600/30',
}
const PRIORITY_LABELS: Record<string, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' }

// ─── Component ────────────────────────────────────────────────────────────────
export default function MetaAnalysis() {
  const { token } = useAuth()

  const [file,      setFile]      = useState<File | null>(null)
  const [dragging,  setDragging]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [result,    setResult]    = useState<{ analysis: AnalysisResult; rowCount: number } | null>(null)
  const [copyDone,  setCopyDone]  = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setError(null)
    setResult(null)
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  async function analyze() {
    if (!file || !token) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/meta/analyze', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Error al analizar')
      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar las campañas.')
    } finally {
      setLoading(false)
    }
  }

  function copyExecutiveSummary() {
    if (!result) return
    navigator.clipboard.writeText(result.analysis.executiveSummary).then(() => {
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    })
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="px-4 py-5 md:px-8 md:py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <BarChart2 size={17} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Análisis Meta Ads</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Sube tu export de Meta Ads Manager y obtén insights con IA</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6 flex-1">

        {/* How to export guide */}
        {!result && (
          <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Cómo exportar desde Meta Ads Manager</p>
            <ol className="space-y-1.5 text-sm text-zinc-400">
              <li className="flex gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">1.</span>Abre Meta Ads Manager → selecciona tus campañas</li>
              <li className="flex gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">2.</span>Haz clic en el botón <strong className="text-zinc-300">Exportar</strong> (icono de descarga) → <strong className="text-zinc-300">Exportar datos de tabla</strong></li>
              <li className="flex gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">3.</span>Selecciona formato <strong className="text-zinc-300">CSV</strong> o <strong className="text-zinc-300">Excel (.xlsx)</strong></li>
              <li className="flex gap-2"><span className="text-indigo-400 font-bold flex-shrink-0">4.</span>Sube el archivo aquí</li>
            </ol>
          </div>
        )}

        {/* Upload zone or results */}
        {!result ? (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && inputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 py-12 px-6 ${
                dragging
                  ? 'border-indigo-400 bg-indigo-500/8'
                  : file
                  ? 'border-emerald-500/40 bg-emerald-500/5 cursor-default'
                  : 'border-white/10 bg-zinc-900/40 hover:border-indigo-500/40 hover:bg-zinc-900/60'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={onFileInput}
                className="hidden"
              />

              {file ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FileSpreadsheet size={22} className="text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); reset() }}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <X size={12} /> Cambiar archivo
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/8 flex items-center justify-center">
                    <Upload size={22} className="text-zinc-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-300">Arrastra tu archivo aquí o <span className="text-indigo-400">selecciónalo</span></p>
                    <p className="text-xs text-zinc-600 mt-1">CSV o Excel · Máx. 10 MB</p>
                  </div>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={analyze}
              disabled={!file || loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm rounded-xl transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Analizando con IA...</>
              ) : (
                <><BarChart2 size={16} /> Analizar campañas</>
              )}
            </button>

            {loading && (
              <p className="text-center text-xs text-zinc-500 animate-pulse">
                La IA está leyendo tus datos y comparándolos con benchmarks del sector...
              </p>
            )}
          </div>
        ) : (
          /* Results */
          <div className="space-y-5">

            {/* Summary banner */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/8 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 size={15} className="text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Resumen general</span>
                </div>
                <button onClick={reset} className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{result.analysis.summary}</p>
              <p className="text-xs text-zinc-600 mt-2">{result.rowCount} filas procesadas</p>
            </div>

            {/* Two columns: performing well / poorly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Performing well */}
              {result.analysis.performingWell.length > 0 && (
                <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={15} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Funcionan bien</span>
                  </div>
                  <div className="space-y-3">
                    {result.analysis.performingWell.map((c, i) => (
                      <div key={i} className="border-l-2 border-emerald-500/40 pl-3">
                        <p className="text-sm font-semibold text-white truncate" title={c.name}>{c.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{c.reason}</p>
                        <p className="text-xs font-medium text-emerald-400 mt-1">{c.highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performing poorly */}
              {result.analysis.performingPoorly.length > 0 && (
                <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown size={15} className="text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Necesitan atención</span>
                  </div>
                  <div className="space-y-3">
                    {result.analysis.performingPoorly.map((c, i) => (
                      <div key={i} className="border-l-2 border-red-500/40 pl-3">
                        <p className="text-sm font-semibold text-white truncate" title={c.name}>{c.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{c.reason}</p>
                        <p className="text-xs font-medium text-amber-400 mt-1">Acción: {c.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Below average metrics */}
            {result.analysis.belowAverage.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={15} className="text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Métricas por debajo de referencia</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.analysis.belowAverage.map((m, i) => (
                    <div key={i} className="bg-zinc-800/60 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-white">{m.metric}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-red-400 font-medium">{m.value}</span>
                          <span className="text-zinc-600">vs</span>
                          <span className="text-zinc-400">{m.benchmark}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">{m.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.analysis.recommendations.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={15} className="text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Recomendaciones</span>
                </div>
                <div className="space-y-3">
                  {result.analysis.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[r.priority]}`}>
                        {PRIORITY_LABELS[r.priority]}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{r.title}</p>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{r.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Executive summary */}
            <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Resumen ejecutivo para el cliente</span>
                </div>
                <button
                  onClick={copyExecutiveSummary}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {copyDone ? <><CheckCircle2 size={12} className="text-emerald-400" /> Copiado</> : 'Copiar'}
                </button>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {result.analysis.executiveSummary}
              </p>
            </div>

            {/* Analyze another */}
            <button
              onClick={reset}
              className="w-full py-3 border border-white/8 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:border-white/15 transition-all"
            >
              Analizar otro archivo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
