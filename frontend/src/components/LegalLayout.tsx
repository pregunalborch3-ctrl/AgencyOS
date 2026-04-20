import { Link } from 'react-router-dom'
import { Zap, ArrowLeft } from 'lucide-react'
import Footer from './Footer'

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-white font-black text-base tracking-tight">AgencyOS</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft size={14} /> Volver
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
          {/* Header */}
          <div className="mb-10 pb-8 border-b border-white/5">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
              Legal
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{title}</h1>
            <p className="text-sm text-zinc-500">
              Última actualización: <span className="text-zinc-400">{lastUpdated}</span>
            </p>
          </div>

          {/* Legal content */}
          <div className="legal-content space-y-10 text-zinc-300 leading-relaxed">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ─── Shared section components ────────────────────────────────────────────────
export function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4">
      <h2 className="text-xl font-bold text-white border-l-2 border-indigo-500 pl-4">{title}</h2>
      <div className="space-y-3 pl-4 text-sm text-zinc-400 leading-relaxed">{children}</div>
    </section>
  )
}

export function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 pt-2">
      <h3 className="text-sm font-bold text-zinc-300">{title}</h3>
      <div className="space-y-2 text-sm text-zinc-500 leading-relaxed">{children}</div>
    </div>
  )
}

export function UL({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 pl-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-zinc-500">
          <span className="text-indigo-500 mt-1 flex-shrink-0">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
