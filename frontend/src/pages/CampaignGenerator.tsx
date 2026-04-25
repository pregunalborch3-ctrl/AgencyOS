import { useState } from 'react'
import {
  Rocket, Loader2, Copy, Check, ChevronDown, Store,
  Target, Zap, Megaphone, Video, BarChart3, Users,
  AlertCircle, Sparkles, Search, Download,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShortCopy  { hook: string; body: string; cta: string; type: string; platform: string }
interface LongCopy   { format: string; platform: string; content: string }
interface Hook       { type: string; text: string; why: string }
interface Creative   { format: string; platform: string; duration: string; structure: Array<{ time: string; action: string }> }
interface FunnelRow  { stage: string; objective: string; audience: string; budget: string; format: string }
interface CampaignStructure { type: string; funnel: FunnelRow[]; totalBudgetSuggestion: string; notes: string }
interface Segmentation {
  profile: string; ageRange: string; gender: string
  interests: string[]; behaviors: string[]; pains: string[]; desires: string[]
  lookalike: string[]; exclude: string[]
}
interface CampaignResult {
  id: string; generatedAt: string
  input: { productDescription?: string; productUrl?: string; niche: string; objective: string }
  shortCopies: ShortCopy[]; longCopies: LongCopy[]; hooks: Hook[]
  creatives: Creative[]; campaignStructure: CampaignStructure; segmentation: Segmentation
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'agencyos_token'
function token() { return localStorage.getItem(TOKEN_KEY) }

async function apiFetch<T>(endpoint: string, body: object): Promise<T> {
  const res  = await fetch(`/api${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok || !data.success) throw new Error(data.error ?? 'Error generando la campaña')
  return data.data as T
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handle}
      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all"
      title="Copiar"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ icon: Icon, title, badge, children }: {
  icon: React.ElementType; title: string; badge?: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Icon size={15} className="text-indigo-400" />
        </div>
        <h3 className="text-sm font-bold text-white flex-1">{title}</h3>
        {badge && <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Result sections ──────────────────────────────────────────────────────────
function ShortCopiesSection({ copies }: { copies: ShortCopy[] }) {
  return (
    <Section icon={Megaphone} title="Anuncios cortos" badge="Meta Ads · TikTok">
      <div className="space-y-4">
        {copies.map((c, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-zinc-800/50 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">{c.type}</span>
              <span className="text-[10px] text-zinc-600">{c.platform}</span>
            </div>
            <p className="text-sm font-bold text-white leading-snug">{c.hook}</p>
            <p className="text-sm text-zinc-400 leading-relaxed">{c.body}</p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-indigo-300">{c.cta}</span>
              <CopyBtn text={`${c.hook}\n\n${c.body}\n\n${c.cta}`} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function LongCopiesSection({ copies }: { copies: LongCopy[] }) {
  return (
    <Section icon={Megaphone} title="Anuncios largos" badge="Storytelling · Problema-Solución">
      <div className="space-y-4">
        {copies.map((c, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-zinc-800/50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full">{c.format}</span>
              <span className="text-[10px] text-zinc-600">{c.platform}</span>
            </div>
            <pre className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">{c.content}</pre>
            <div className="flex justify-end pt-1">
              <CopyBtn text={c.content} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function HooksSection({ hooks }: { hooks: Hook[] }) {
  return (
    <Section icon={Zap} title="Hooks virales" badge="5 scroll-stopping hooks">
      <div className="space-y-3">
        {hooks.map((h, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-zinc-800/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{h.type}</span>
                <p className="text-sm font-bold text-white leading-snug">{h.text}</p>
                <p className="text-xs text-zinc-500 leading-relaxed italic">{h.why}</p>
              </div>
              <CopyBtn text={h.text} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function CreativesSection({ creatives }: { creatives: Creative[] }) {
  return (
    <Section icon={Video} title="Ideas de creativos" badge="Guiones para TikTok · Reels">
      <div className="space-y-5">
        {creatives.map((c, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-zinc-800/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{c.format}</p>
                <p className="text-xs text-zinc-500">{c.platform} · {c.duration}</p>
              </div>
            </div>
            <div className="space-y-2">
              {c.structure.map((s, j) => (
                <div key={j} className="flex items-start gap-3">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md flex-shrink-0 font-mono w-14 text-center">
                    {s.time}
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed pt-0.5">{s.action}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function CampaignStructureSection({ structure }: { structure: CampaignStructure }) {
  return (
    <Section icon={BarChart3} title="Estructura de campaña" badge="Funnel completo">
      <div className="space-y-5">
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <p className="text-xs text-zinc-500 mb-1">Tipo de campaña</p>
          <p className="text-sm font-bold text-white">{structure.type}</p>
        </div>

        <div className="space-y-2">
          {structure.funnel.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_80px] gap-3 p-3 rounded-xl bg-zinc-800/40 border border-white/5 text-xs">
              <div>
                <p className="text-[10px] text-zinc-500 mb-0.5">Fase</p>
                <p className="font-bold text-white">{row.stage}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 mb-0.5">Objetivo</p>
                <p className="text-zinc-300">{row.objective}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 mb-0.5">Audiencia</p>
                <p className="text-zinc-300">{row.audience}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 mb-0.5">Budget</p>
                <p className="font-bold text-indigo-400">{row.budget}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-4 space-y-2">
          <p className="text-xs font-bold text-white">Presupuesto recomendado</p>
          <p className="text-xs text-zinc-400">{structure.totalBudgetSuggestion}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs font-bold text-amber-400 mb-1">Notas de optimización</p>
          <p className="text-xs text-zinc-400 leading-relaxed">{structure.notes}</p>
        </div>
      </div>
    </Section>
  )
}

function SegmentationSection({ seg }: { seg: Segmentation }) {
  return (
    <Section icon={Users} title="Segmentación" badge="Cliente ideal + audiencias">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-4">
            <p className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Perfil</p>
            <p className="text-xs text-zinc-300">{seg.profile}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-4">
            <p className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Edad · Género</p>
            <p className="text-xs text-zinc-300">{seg.ageRange}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{seg.gender}</p>
          </div>
        </div>

        {([
          { label: 'Intereses',         items: seg.interests,  color: 'text-indigo-400 bg-indigo-400/10' },
          { label: 'Comportamientos',   items: seg.behaviors,  color: 'text-violet-400 bg-violet-400/10' },
          { label: 'Lookalike',         items: seg.lookalike,  color: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'Excluir',           items: seg.exclude,    color: 'text-red-400 bg-red-400/10' },
        ] as const).map(({ label, items, color }) => (
          <div key={label}>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map(item => (
                <span key={item} className={`text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>{item}</span>
              ))}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Dolores del cliente</p>
            <ul className="space-y-1.5">
              {seg.pains.map(p => <li key={p} className="text-xs text-zinc-400 flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>{p}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Deseos del cliente</p>
            <ul className="space-y-1.5">
              {seg.desires.map(d => <li key={d} className="text-xs text-zinc-400 flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span>{d}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  )
}

// ─── Export to ad platforms (structured CSV) ─────────────────────────────────
async function exportForPlatform(result: CampaignResult, platform: 'meta' | 'google' | 'tiktok') {
  const { downloadCSV } = await import('../lib/exportUtils')

  if (platform === 'meta') {
    const rows: (string | number)[][] = [
      ['Campaign Name', 'Ad Set Name', 'Ad Name', 'Primary Text', 'Headline', 'CTA'],
      ...result.shortCopies.map((c, i) => [
        `Campaign_${result.input.objective}`,
        `AdSet_${result.input.niche}`,
        `Ad_${c.type}_${i + 1}`,
        c.body,
        c.hook,
        c.cta.replace(' →', ''),
      ]),
    ]
    downloadCSV('meta_ads_export', rows)
  }

  if (platform === 'google') {
    const rows: (string | number)[][] = [
      ['Campaign', 'Ad Group', 'Headline 1', 'Headline 2', 'Description 1', 'Description 2', 'Final URL'],
      ...result.shortCopies.map((c, i) => [
        `Campaign_${result.input.objective}`,
        `AdGroup_${result.input.niche}_${i + 1}`,
        c.hook.slice(0, 30),
        result.input.niche ?? '',
        c.body.split('.')[0].slice(0, 90),
        c.cta.replace(' →', '').slice(0, 90),
        result.input.productUrl || '',
      ]),
    ]
    downloadCSV('google_ads_export', rows)
  }

  if (platform === 'tiktok') {
    const creative = result.creatives[0]?.structure?.map(s => `[${s.time}] ${s.action}`).join(' | ') ?? ''
    const rows: (string | number)[][] = [
      ['Ad Name', 'Ad Text', 'CTA Button', 'Hook (0-3s)', 'Script Summary'],
      ...result.shortCopies.map((c, i) => [
        `TikTok_Ad_${c.type}_${i + 1}`,
        `${c.hook}\n\n${c.body}`,
        c.cta.replace(' →', ''),
        result.hooks[0]?.text ?? c.hook,
        creative.slice(0, 200),
      ]),
    ]
    downloadCSV('tiktok_ads_export', rows)
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'ads',       label: 'Anuncios',    icon: Megaphone },
  { id: 'hooks',     label: 'Hooks',       icon: Zap },
  { id: 'creatives', label: 'Creativos',   icon: Video },
  { id: 'structure', label: 'Campaña',     icon: BarChart3 },
  { id: 'audience',  label: 'Audiencia',   icon: Users },
]

// ─── Form ─────────────────────────────────────────────────────────────────────
const NICHES = [
  { value: 'ropa',         label: 'Ropa y moda' },
  { value: 'calzado',      label: 'Calzado' },
  { value: 'belleza',      label: 'Belleza y skincare' },
  { value: 'fitness',      label: 'Fitness y suplementos' },
  { value: 'hogar',        label: 'Hogar y decoración' },
  { value: 'tecnologia',   label: 'Tecnología' },
  { value: 'alimentacion', label: 'Alimentación saludable' },
  { value: 'joyeria',      label: 'Joyería y accesorios' },
  { value: 'mascotas',     label: 'Mascotas' },
  { value: 'deportes',     label: 'Deportes y outdoor' },
]

const OBJECTIVES = [
  { value: 'ventas',  label: 'Ventas / Conversiones' },
  { value: 'leads',   label: 'Generación de leads' },
  { value: 'trafico', label: 'Tráfico web' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CampaignGenerator() {
  const [productDescription, setProductDescription] = useState('')
  const [productUrl,         setProductUrl]         = useState('')
  const [niche,              setNiche]              = useState('')
  const [objective,          setObjective]          = useState('')
  const [loading,            setLoading]            = useState(false)
  const [analyzingUrl,       setAnalyzingUrl]       = useState(false)
  const [error,              setError]              = useState<string | null>(null)
  const [result,             setResult]             = useState<CampaignResult | null>(null)
  const [activeTab,          setActiveTab]          = useState('ads')

  async function handleAnalyzeUrl() {
    if (!productUrl.trim()) return
    setAnalyzingUrl(true)
    setError(null)
    try {
      const data = await apiFetch<{ suggestedDescription: string; productName: string }>('/campaigns/analyze-url', { url: productUrl })
      if (data.suggestedDescription) setProductDescription(data.suggestedDescription)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo analizar la URL.')
    } finally {
      setAnalyzingUrl(false)
    }
  }

  async function handleGenerate() {
    if (!productDescription.trim() && !productUrl.trim()) {
      setError('Introduce una descripción del producto o URL de la tienda.')
      return
    }
    if (!niche) { setError('Selecciona el nicho.'); return }
    if (!objective) { setError('Selecciona el objetivo.'); return }

    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const data = await apiFetch<CampaignResult>('/campaigns/generate', {
        productDescription, productUrl, niche, objective,
      })
      setResult(data)
      setActiveTab('ads')
      toast.success('¡Campaña generada con IA!')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error generando la campaña.'
      setError(msg)
      if (msg === 'FREE_LIMIT_REACHED') {
        toast.error('Has usado tu campaña gratuita. Suscríbete para continuar.')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleExportPDF() {
    if (!result) return
    const { downloadPDF } = await import('../lib/exportUtils')
    const body = `
      <h2>Anuncios cortos</h2>
      ${result.shortCopies.map(c => `
        <div class="card card-accent no-break">
          <p><span class="tag tag-indigo">${c.type}</span> <span style="font-size:11px;color:#9ca3af">${c.platform}</span></p>
          <h3 style="margin-top:8px">${c.hook}</h3>
          <p>${c.body}</p>
          <p><strong>${c.cta}</strong></p>
        </div>`).join('')}
      <h2>Hooks virales</h2>
      ${result.hooks.map(h => `
        <div class="card no-break">
          <p><span class="tag tag-violet">${h.type}</span></p>
          <h3>${h.text}</h3>
          <p style="color:#6b7280;font-style:italic">${h.why}</p>
        </div>`).join('')}
      <h2>Segmentación de audiencia</h2>
      <div class="card">
        <p><strong>Perfil:</strong> ${result.segmentation.profile}</p>
        <p><strong>Edad:</strong> ${result.segmentation.ageRange} · ${result.segmentation.gender}</p>
        <p><strong>Intereses:</strong> ${result.segmentation.interests.join(', ')}</p>
        <p><strong>Dolores:</strong> ${result.segmentation.pains.join(' | ')}</p>
        <p><strong>Deseos:</strong> ${result.segmentation.desires.join(' | ')}</p>
      </div>
      <h2>Estructura de campaña</h2>
      <div class="card"><p><strong>${result.campaignStructure.type}</strong></p></div>
      <table>
        <thead><tr><th>Fase</th><th>Objetivo</th><th>Audiencia</th><th>Budget</th></tr></thead>
        <tbody>
          ${result.campaignStructure.funnel.map(r => `<tr><td>${r.stage}</td><td>${r.objective}</td><td>${r.audience}</td><td>${r.budget}</td></tr>`).join('')}
        </tbody>
      </table>
    `
    const product = result.input.productDescription?.split(' ').slice(0, 3).join(' ') || 'Campaña'
    downloadPDF(`Campaña — ${product}`, `Objetivo: ${result.input.objective} · Nicho: ${result.input.niche}`, body)
    toast.success('PDF generado correctamente.')
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Generador de Campañas</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Introduce un producto o tienda y genera la campaña completa lista para lanzar.</p>
        </div>
        {result && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-full font-semibold transition-all"
            >
              <Download size={11} /> Exportar PDF
            </button>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full font-semibold">
              <Sparkles size={11} /> Campaña generada
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left: Form ──────────────────────────────────────────────────── */}
        <div className="w-80 flex-shrink-0 border-r border-white/5 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Product description */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <Store size={11} /> Producto o tienda
              </label>
              <textarea
                rows={4}
                value={productDescription}
                onChange={e => setProductDescription(e.target.value)}
                placeholder="Ej: Camisetas de algodón orgánico para mujer. Minimalistas, sostenibles, tallas S-XL. Precio €35."
                className="w-full px-3 py-2.5 bg-zinc-800 border border-white/5 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
              />
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                URL de la tienda <span className="text-zinc-600 normal-case font-normal">(opcional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={productUrl}
                  onChange={e => setProductUrl(e.target.value)}
                  placeholder="https://tienda.myshopify.com"
                  className="flex-1 min-w-0 px-3 py-2.5 bg-zinc-800 border border-white/5 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  onClick={handleAnalyzeUrl}
                  disabled={!productUrl.trim() || analyzingUrl}
                  title="Analizar URL"
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 border border-white/5 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {analyzingUrl ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                </button>
              </div>
              {analyzingUrl && (
                <p className="text-[10px] text-zinc-500">Analizando tienda...</p>
              )}
            </div>

            {/* Niche */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <Target size={11} /> Nicho
              </label>
              <div className="relative">
                <select
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 bg-zinc-800 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all pr-8"
                >
                  <option value="" className="text-zinc-500">Seleccionar nicho...</option>
                  {NICHES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Objective */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <Rocket size={11} /> Objetivo
              </label>
              <div className="space-y-2">
                {OBJECTIVES.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setObjective(o.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      objective === o.value
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-white'
                        : 'bg-zinc-800 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-300'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Generate button */}
          <div className="p-6 border-t border-white/5">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Generando campaña...</>
                : <><Rocket size={16} /> Generar campaña</>
              }
            </button>
          </div>
        </div>

        {/* ── Right: Results ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-5">
                <Rocket size={28} className="text-zinc-700" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Listo para generar</h3>
              <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                Rellena el formulario con el producto y objetivo. La campaña completa aparecerá aquí.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Analizando producto y generando campaña</p>
                <p className="text-zinc-500 text-sm mt-1">Esto tarda unos segundos...</p>
              </div>
            </div>
          )}

          {result && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs + export buttons */}
              <div className="flex items-center gap-1 px-6 py-3 border-b border-white/5 overflow-x-auto">
                {TABS.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-indigo-500 text-white'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={12} /> {tab.label}
                    </button>
                  )
                })}
                <div className="ml-auto flex items-center gap-1 pl-3 border-l border-white/5">
                  {(['meta', 'google', 'tiktok'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => { exportForPlatform(result, p); toast.success(`CSV para ${p === 'meta' ? 'Meta Ads' : p === 'google' ? 'Google Ads' : 'TikTok Ads'} descargado.`) }}
                      className="text-[10px] font-bold px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all whitespace-nowrap"
                    >
                      {p === 'meta' ? '↓ Meta' : p === 'google' ? '↓ Google' : '↓ TikTok'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {activeTab === 'ads' && (
                  <>
                    <ShortCopiesSection copies={result.shortCopies} />
                    <LongCopiesSection  copies={result.longCopies} />
                  </>
                )}
                {activeTab === 'hooks'     && <HooksSection     hooks={result.hooks} />}
                {activeTab === 'creatives' && <CreativesSection  creatives={result.creatives} />}
                {activeTab === 'structure' && <CampaignStructureSection structure={result.campaignStructure} />}
                {activeTab === 'audience'  && <SegmentationSection seg={result.segmentation} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
