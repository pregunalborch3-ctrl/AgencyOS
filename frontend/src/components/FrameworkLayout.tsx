import { Zap, FileDown, TableIcon, Loader2 } from 'lucide-react'

interface FrameworkLayoutProps {
  title: string
  subtitle: string
  icon: React.ElementType
  children: React.ReactNode        // form inputs
  onGenerate: () => void
  isLoading: boolean
  hasResult: boolean
  result?: React.ReactNode
  onExportPDF?: () => void
  onExportCSV?: () => void
  generateDisabled?: boolean
}

export default function FrameworkLayout({
  title, subtitle, icon: Icon,
  children, onGenerate, isLoading, hasResult, result,
  onExportPDF, onExportCSV, generateDisabled,
}: FrameworkLayoutProps) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950">

      {/* Header */}
      <div className="px-4 py-5 md:px-8 md:py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <Icon size={17} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">{title}</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6 max-w-5xl w-full mx-auto">

        {/* Form card */}
        <div className="rounded-2xl border border-white/5 bg-zinc-900 p-6 space-y-5">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Inputs</p>
          {children}
          <button
            onClick={onGenerate}
            disabled={isLoading || generateDisabled}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading
              ? <><Loader2 size={15} className="animate-spin" /> Generando análisis…</>
              : <><Zap size={15} /> Generar análisis</>
            }
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="rounded-2xl border border-white/5 bg-zinc-900 p-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Loader2 size={22} className="animate-spin text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Claude está analizando…</p>
              <p className="text-zinc-600 text-xs mt-1">Puede tardar 10-20 segundos</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && hasResult && result && (
          <div className="space-y-4">
            {result}

            {/* Export buttons */}
            {(onExportPDF || onExportCSV) && (
              <div className="flex items-center gap-3 pt-2">
                <p className="text-xs text-zinc-600 mr-1">Exportar:</p>
                {onExportPDF && (
                  <button
                    onClick={onExportPDF}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/8 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-all"
                  >
                    <FileDown size={13} /> PDF
                  </button>
                )}
                {onExportCSV && (
                  <button
                    onClick={onExportCSV}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/8 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-all"
                  >
                    <TableIcon size={13} /> Excel / CSV
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Shared result sub-components ────────────────────────────────────────────

export function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">{title}</p>
      {children}
    </div>
  )
}

export function ImpactBadge({ impact }: { impact: string }) {
  const cfg: Record<string, string> = {
    alto:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    medio: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    bajo:  'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg[impact.toLowerCase()] ?? cfg.bajo}`}>
      {impact}
    </span>
  )
}

export function RoiBadge({ roi }: { roi: string }) {
  return <ImpactBadge impact={roi} />
}

export function FormField({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-400">{label}</label>
      {children}
    </div>
  )
}

export const inputCls = 'w-full px-3.5 py-2.5 bg-zinc-800 border border-white/8 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all'
export const selectCls = inputCls
