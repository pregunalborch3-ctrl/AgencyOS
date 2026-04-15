import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Rocket, Copy, Check, Zap, Megaphone, Video,
  BarChart3, Users, AlertCircle, RefreshCw,
  TrendingUp, Target, ChevronDown, ArrowRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShortCopy { hook: string; body: string; cta: string; type: string; platform: string }
interface LongCopy  { format: string; platform: string; content: string }
interface Hook      { type: string; text: string; why: string }
interface Creative  { format: string; platform: string; duration: string; structure: Array<{ time: string; action: string }> }
interface FunnelRow { stage: string; objective: string; audience: string; budget: string; format: string }
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
type AppState = 'idle' | 'loading' | 'result'

// ─── Constants ────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'agencyos_token'

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
  { value: 'ventas',  label: 'Ventas' },
  { value: 'leads',   label: 'Leads' },
  { value: 'trafico', label: 'Tráfico' },
]
const STYLES = [
  { value: 'performance', label: 'Performance' },
  { value: 'ugc',         label: 'UGC' },
  { value: 'branding',    label: 'Branding' },
]
const LOADING_STEPS = [
  'Analizando tienda...',
  'Detectando cliente ideal...',
  'Identificando ángulos de venta...',
  'Generando anuncios y hooks...',
]
const TABS = [
  { id: 'ads',       label: 'Anuncios',  icon: Megaphone },
  { id: 'hooks',     label: 'Hooks',     icon: Zap },
  { id: 'creatives', label: 'Creativos', icon: Video },
  { id: 'campaign',  label: 'Campaña',   icon: BarChart3 },
  { id: 'audience',  label: 'Audiencia', icon: Users },
]

// ─── Niche auto-detect ────────────────────────────────────────────────────────
function detectNiche(text: string): string {
  const t = text.toLowerCase()
  if (t.match(/zapat|calzad|boot|shoe|sneaker|tacon/))         return 'calzado'
  if (t.match(/camis|ropa|moda|fashion|vestid|pantalon|top|sudadera/)) return 'ropa'
  if (t.match(/cream|serum|mascara|belleza|beauty|skin|facial|hidrat/)) return 'belleza'
  if (t.match(/gym|fitness|suplemento|proteina|entreno|muscu|creatina/)) return 'fitness'
  if (t.match(/sofa|decorac|mueble|hogar|cojin|lampara|alfombra/))      return 'hogar'
  if (t.match(/movil|laptop|gadget|tech|auricular|cargador|tablet/))    return 'tecnologia'
  if (t.match(/organico|vegano|proteico|dieta|nutricion|snack|aliment/)) return 'alimentacion'
  if (t.match(/anillo|collar|pulsera|joya|plata|oro|pendiente/))        return 'joyeria'
  if (t.match(/perro|gato|mascota|pet|pienso|correa|juguete/))          return 'mascotas'
  if (t.match(/ciclismo|running|trail|natacion|deport|tenis|paddle/))   return 'deportes'
  return ''
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function generateCampaign(params: {
  productDescription: string; productUrl: string
  niche: string; objective: string; campaignStyle: string; variant?: string
}): Promise<CampaignResult> {
  const res = await fetch('/api/campaigns/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok || !data.success) throw new Error(data.error ?? 'Error generando la campaña')
  return data.data as CampaignResult
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
      } ${className}`}
    >
      {copied ? <><Check size={11} />Copiado</> : <><Copy size={11} />Copiar</>}
    </button>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder?: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-8 py-2 bg-zinc-900 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all cursor-pointer"
      >
        {placeholder && <option value="" className="text-zinc-600">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
    </div>
  )
}

// ─── Loading animation ────────────────────────────────────────────────────────
function LoadingState() {
  const [step, setStep] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const dotsTimer = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
    const stepTimer  = setInterval(() => setStep(s => s < LOADING_STEPS.length - 1 ? s + 1 : s), 1400)
    return () => { clearInterval(dotsTimer); clearInterval(stepTimer) }
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 py-20">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Rocket size={28} className="text-indigo-400 animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-2xl animate-ping bg-indigo-500/10" style={{ animationDuration: '2s' }} />
      </div>

      {/* Steps */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        {LOADING_STEPS.map((msg, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 w-full transition-all duration-500 ${
              i < step  ? 'opacity-30' :
              i === step ? 'opacity-100' : 'opacity-15'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
              i < step ? 'bg-emerald-400' : i === step ? 'bg-indigo-400' : 'bg-zinc-700'
            }`} />
            <span className={`text-sm font-medium transition-colors duration-300 ${
              i < step ? 'text-zinc-600' : i === step ? 'text-white' : 'text-zinc-700'
            }`}>
              {i === step ? msg.replace('...', dots) : i < step ? msg.replace('...', '') : msg}
            </span>
            {i < step && <Check size={12} className="text-emerald-400 ml-auto" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Output sections ──────────────────────────────────────────────────────────
function AdsSection({ copies: { short, long } }: { copies: { short: ShortCopy[]; long: LongCopy[] } }) {
  return (
    <div className="space-y-8">
      {/* Short copies */}
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Copies cortos · Meta Ads · TikTok</p>
        <div className="grid md:grid-cols-3 gap-3">
          {short.map((c, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-zinc-900 p-5 space-y-3 group hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded-full uppercase tracking-wide">{c.type}</span>
                <span className="text-[10px] text-zinc-600">{c.platform}</span>
              </div>
              <p className="text-sm font-bold text-white leading-snug">{c.hook}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{c.body}</p>
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-xs font-semibold text-indigo-300">{c.cta}</span>
                <CopyBtn text={`${c.hook}\n\n${c.body}\n\n${c.cta}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Long copies */}
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Copies largos · Storytelling</p>
        <div className="grid md:grid-cols-2 gap-3">
          {long.map((c, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-zinc-900 p-5 space-y-3 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 px-2.5 py-1 rounded-full uppercase tracking-wide">{c.format}</span>
                <span className="text-[10px] text-zinc-600">{c.platform}</span>
              </div>
              <pre className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">{c.content}</pre>
              <div className="flex justify-end border-t border-white/5 pt-2">
                <CopyBtn text={c.content} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HooksSection({ hooks }: { hooks: Hook[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">5 hooks scroll-stopping</p>
      {hooks.map((h, i) => (
        <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-white/5 bg-zinc-900 hover:border-white/10 transition-colors group">
          <span className="text-2xl font-black text-zinc-800 flex-shrink-0 w-7 text-right leading-none mt-0.5">{i + 1}</span>
          <div className="flex-1 space-y-1.5">
            <span className="inline-block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{h.type}</span>
            <p className="text-base font-bold text-white leading-snug">{h.text}</p>
            <p className="text-xs text-zinc-500 italic">{h.why}</p>
          </div>
          <CopyBtn text={h.text} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  )
}

function CreativesSection({ creatives }: { creatives: Creative[] }) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Guiones para TikTok · Reels</p>
      {creatives.map((c, i) => (
        <div key={i} className="rounded-xl border border-white/5 bg-zinc-900 overflow-hidden hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-zinc-950/40">
            <div>
              <p className="text-sm font-bold text-white">{c.format}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{c.platform} · {c.duration}</p>
            </div>
          </div>
          <div className="p-5 space-y-2">
            {c.structure.map((s, j) => (
              <div key={j} className="flex items-start gap-3">
                <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md flex-shrink-0 min-w-[52px] text-center">
                  {s.time}
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">{s.action}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CampaignSection({ structure }: { structure: CampaignStructure }) {
  return (
    <div className="space-y-5">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Estructura y funnel completo</p>
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4">
        <p className="text-[10px] text-zinc-500 mb-1">Tipo de campaña</p>
        <p className="text-sm font-bold text-white">{structure.type}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              {['Fase', 'Objetivo', 'Audiencia', 'Formato', 'Budget'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-zinc-600 uppercase tracking-wider pb-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {structure.funnel.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="py-3 pr-4 font-bold text-white">{row.stage}</td>
                <td className="py-3 pr-4 text-zinc-400">{row.objective}</td>
                <td className="py-3 pr-4 text-zinc-400">{row.audience}</td>
                <td className="py-3 pr-4 text-zinc-400">{row.format}</td>
                <td className="py-3 font-bold text-indigo-400">{row.budget}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/5 bg-zinc-900 p-4">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Presupuesto sugerido</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{structure.totalBudgetSuggestion}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">Notas de optimización</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{structure.notes}</p>
        </div>
      </div>
    </div>
  )
}

function AudienceSection({ seg }: { seg: Segmentation }) {
  return (
    <div className="space-y-5">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Público objetivo y segmentación</p>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/5 bg-zinc-900 p-4 md:col-span-2">
          <p className="text-[10px] text-zinc-500 mb-1">Perfil del cliente ideal</p>
          <p className="text-sm font-medium text-white">{seg.profile}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-zinc-900 p-4">
          <p className="text-[10px] text-zinc-500 mb-1">Edad · Género</p>
          <p className="text-sm font-bold text-white">{seg.ageRange}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{seg.gender}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {([
          { label: 'Intereses',       items: seg.interests,  accent: 'text-indigo-400 bg-indigo-400/10' },
          { label: 'Comportamientos', items: seg.behaviors,  accent: 'text-violet-400 bg-violet-400/10' },
          { label: 'Audiencias lookalike', items: seg.lookalike, accent: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'Excluir',         items: seg.exclude,    accent: 'text-red-400 bg-red-400/10' },
        ] as const).map(({ label, items, accent }) => (
          <div key={label}>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map(item => (
                <span key={item} className={`text-xs font-medium px-2.5 py-1 rounded-full ${accent}`}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Dolores del cliente</p>
          <ul className="space-y-2">
            {seg.pains.map(p => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-zinc-400">
                <span className="text-red-400 flex-shrink-0 mt-0.5">→</span>{p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Deseos del cliente</p>
          <ul className="space-y-2">
            {seg.desires.map(d => (
              <li key={d} className="flex items-start gap-2.5 text-sm text-zinc-400">
                <span className="text-emerald-400 flex-shrink-0 mt-0.5">→</span>{d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Action buttons ───────────────────────────────────────────────────────────
const ACTIONS: Array<{ label: string; icon: React.ElementType; variant: string }> = [
  { label: 'Regenerar',            icon: RefreshCw,   variant: ''           },
  { label: 'Más agresivo',         icon: TrendingUp,  variant: 'agresivo'   },
  { label: 'Para conversión',      icon: Target,      variant: 'conversion' },
  { label: 'Adaptar a TikTok',     icon: Zap,         variant: 'tiktok'     },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CampaignApp() {
  // Form state
  const [input,     setInput]     = useState('')
  const [niche,     setNiche]     = useState('')
  const [objective, setObjective] = useState('ventas')
  const [style,     setStyle]     = useState('performance')
  const [error,     setError]     = useState<string | null>(null)

  // App state
  const [appState,  setAppState]  = useState<AppState>('idle')
  const [result,    setResult]    = useState<CampaignResult | null>(null)
  const [activeTab, setActiveTab] = useState('ads')

  // Params snapshot (for re-generates)
  const lastParams = useRef({ input, niche, objective, style })

  // Auto-detect niche on input change
  useEffect(() => {
    if (!input.trim()) return
    const detected = detectNiche(input)
    if (detected && !niche) setNiche(detected)
  }, [input])

  const runGenerate = useCallback(async (variant = '') => {
    const params = variant ? lastParams.current : { input, niche, objective, style }
    if (!params.input.trim()) { setError('Describe el producto o pega una URL.'); return }
    if (!params.niche)        { setError('Selecciona el nicho.'); return }

    lastParams.current = { ...params }
    setError(null)
    setAppState('loading')
    setResult(null)

    try {
      const data = await generateCampaign({
        productDescription: params.input,
        productUrl:         params.input.startsWith('http') ? params.input : '',
        niche:              params.niche,
        objective:          params.objective,
        campaignStyle:      params.style,
        variant,
      })
      setResult(data)
      setActiveTab('ads')
      setAppState('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando la campaña.')
      setAppState('idle')
    }
  }, [input, niche, objective, style])

  const isIdle   = appState === 'idle'
  const isLoad   = appState === 'loading'
  const isResult = appState === 'result'

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950">

      {/* ── Input block ─────────────────────────────────────────────────── */}
      <div className={`border-b border-white/5 transition-all duration-500 ${isIdle ? 'py-16' : 'py-5'}`}>
        <div className={`mx-auto px-6 transition-all duration-500 ${isIdle ? 'max-w-2xl' : 'max-w-5xl'}`}>

          {/* Title — only in idle */}
          {isIdle && (
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/8 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs text-indigo-400 font-semibold">Sistema listo</span>
              </div>
              <h1 className="text-4xl font-black text-white leading-tight mb-3">
                Genera tu campaña<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                  lista para lanzar
                </span>
              </h1>
              <p className="text-zinc-500 text-base">Pega una URL de Shopify o describe el producto. El sistema hace el resto.</p>
            </div>
          )}

          {/* Input main */}
          <div className={`space-y-3 ${isIdle ? '' : 'flex items-end gap-3 space-y-0'}`}>
            <div className={`${isIdle ? '' : 'flex-1'} relative`}>
              {isIdle ? (
                <textarea
                  rows={3}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runGenerate() }}
                  placeholder="Ej: tienda.myshopify.com  ·  o describe el producto — «Camisetas algodón orgánico mujer, €35»"
                  className="w-full px-5 py-4 bg-zinc-900 border border-white/8 rounded-2xl text-white text-base placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none leading-relaxed"
                />
              ) : (
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') runGenerate() }}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-white/8 rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              )}
            </div>

            {/* Selectors */}
            <div className={`${isIdle ? 'grid grid-cols-3 gap-3' : 'flex items-center gap-2 flex-shrink-0'}`}>
              <Select
                value={niche}
                onChange={setNiche}
                options={NICHES}
                placeholder="Nicho detectado..."
              />
              <Select value={objective} onChange={setObjective} options={OBJECTIVES} />
              <Select value={style}     onChange={setStyle}     options={STYLES} />
            </div>

            {/* CTA */}
            <button
              onClick={() => runGenerate()}
              disabled={isLoad}
              className={`flex items-center justify-center gap-2 font-bold text-white bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 flex-shrink-0 ${
                isIdle ? 'w-full py-4 text-base mt-1' : 'px-5 py-2.5 text-sm'
              }`}
            >
              <Rocket size={isIdle ? 18 : 15} />
              {isIdle ? 'Generar campaña' : 'Generar'}
              {isIdle && <span className="ml-1 text-indigo-300 font-normal text-sm">⌘↵</span>}
            </button>
          </div>

          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 ${isIdle ? 'mt-3' : 'mt-2'}`}>
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoad && <LoadingState />}

      {/* ── Result ──────────────────────────────────────────────────────── */}
      {isResult && result && (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-6 gap-5">

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-600 mr-1">Variantes:</span>
            {ACTIONS.map(action => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={() => runGenerate(action.variant)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/8 bg-zinc-900 hover:bg-zinc-800 hover:border-white/15 text-zinc-400 hover:text-white text-xs font-semibold transition-all"
                >
                  <Icon size={12} /> {action.label}
                </button>
              )
            })}
            <span className="ml-auto text-[10px] text-zinc-700">
              {new Date(result.generatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-white/5 pb-0">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all relative ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon size={12} /> {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 inset-x-2 h-px bg-indigo-500 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1">
            {activeTab === 'ads'      && <AdsSection    copies={{ short: result.shortCopies, long: result.longCopies }} />}
            {activeTab === 'hooks'    && <HooksSection  hooks={result.hooks} />}
            {activeTab === 'creatives'&& <CreativesSection creatives={result.creatives} />}
            {activeTab === 'campaign' && <CampaignSection structure={result.campaignStructure} />}
            {activeTab === 'audience' && <AudienceSection seg={result.segmentation} />}
          </div>

          {/* New campaign prompt */}
          <div className="border-t border-white/5 pt-5 flex items-center justify-between">
            <p className="text-xs text-zinc-600">¿Quieres generar para otro producto?</p>
            <button
              onClick={() => { setAppState('idle'); setResult(null); setInput(''); setNiche('') }}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Nueva campaña <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
