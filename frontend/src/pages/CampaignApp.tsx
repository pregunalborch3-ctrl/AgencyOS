import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Rocket, Copy, Check, Zap, Megaphone, Video,
  BarChart3, Users, AlertCircle, RefreshCw,
  TrendingUp, Target, ChevronDown, ArrowRight,
  Crosshair, UserCheck, Flame, Lock, Crown, Sparkles,
  Bookmark, BookmarkCheck,
} from 'lucide-react'
import { saveToHistory, hasFreeUsed, markFreeUsed, type HistoryEntry } from '../lib/history'
import { saveCampaign } from '../lib/campaignsApi'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useAuth } from '../contexts/AuthContext'

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
interface Insight { angle: string; clientType: string; aggressiveness: string }
interface CampaignResult {
  id: string; generatedAt: string
  input: { productDescription?: string; productUrl?: string; niche: string; objective: string }
  shortCopies: ShortCopy[]; longCopies: LongCopy[]; hooks: Hook[]
  creatives: Creative[]; campaignStructure: CampaignStructure; segmentation: Segmentation
  insight?: Insight
}
type AppState = 'idle' | 'loading' | 'result' | 'paywall'

// ─── Constants ────────────────────────────────────────────────────────────────
const TOKEN_KEY   = 'agencyos_token'
const ONBOARD_KEY = 'agencyos_onboarded'

// ─── Demo campaign ────────────────────────────────────────────────────────────
const DEMO_CAMPAIGN: CampaignResult = {
  id: 'demo',
  generatedAt: new Date().toISOString(),
  input: { productDescription: 'Camiseta algodón orgánico mujer — moda sostenible, €39', niche: 'ropa', objective: 'ventas' },
  insight: {
    angle: 'Problema–Solución con identidad: "la ropa que llevas dice quién eres"',
    clientType: 'Mujer 25–38, consciente del impacto, compra calidad sobre cantidad',
    aggressiveness: 'Medio',
  },
  shortCopies: [
    {
      type: 'Dolor directo',
      platform: 'Meta Ads',
      hook: '¿Sigues comprando ropa que dura 3 lavados?',
      body: 'Nosotros hacemos camisetas de algodón orgánico certificado que mantienen el color, la forma y la suavidad lavado tras lavado. Sin microplásticos. Sin mano de obra explotada. Solo ropa que dura.',
      cta: 'Ver colección →',
    },
    {
      type: 'Beneficio inmediato',
      platform: 'Meta Ads',
      hook: 'La camiseta que llevas todos los lunes (y el resto de días también)',
      body: '€39 una vez. Sin decoloración a los 10 lavados. Sin encogimiento. Sin esa sensación barata. Algodón orgánico certificado GOTS, corte limpio, 12 colores que no mueren.',
      cta: 'Hazte con la tuya',
    },
    {
      type: 'Prueba social',
      platform: 'Meta Ads',
      hook: '+4.200 mujeres ya han actualizado su básico favorito',
      body: '"No voy a comprar más camisetas de fast fashion después de esto." — María, Valencia. Calidad que se nota desde el primer tacto.',
      cta: 'Comprar ahora',
    },
    {
      type: 'Scroll-stop',
      platform: 'TikTok Ads',
      hook: 'POV: encuentras la única camiseta que necesitas para los próximos 5 años',
      body: 'Algodón orgánico 180g/m². Corte recto. 12 colores neutros. Hecha para durar, no para reemplazar. €39 y no vas a volver a buscar camisetas.',
      cta: 'Link en bio 🔗',
    },
    {
      type: 'Contraste',
      platform: 'TikTok Ads',
      hook: 'Gasto €8 en Zara vs €39 aquí — la diferencia después de 1 año',
      body: 'La de €8: deformada, decolorada, en el fondo del armario. La nuestra: igual que el primer día. El algodón orgánico no miente. El fast fashion tampoco.',
      cta: 'Descúbrela',
    },
    {
      type: 'Urgencia suave',
      platform: 'TikTok Ads',
      hook: 'Solo quedan 3 tallas M en Blanco Hueso ⚡',
      body: 'La más vendida. La que agota primero. Algodón orgánico GOTS, corte oversize, €39. Las que la tienen no vuelven a comprar en otro sitio.',
      cta: 'Reservar ahora',
    },
  ],
  longCopies: [
    {
      format: 'Storytelling emocional',
      platform: 'Meta Ads (Feed)',
      content: `¿Cuántas camisetas "básicas" tienes guardadas que ya no te pones?

Muchas. Y todas compramos lo mismo: precio bajo, calidad mediocre, a la basura en 6 meses.

Hay otra forma.

Nuestra camiseta de algodón orgánico está hecha para ser la última que necesites.

✓ Certificación GOTS (algodón 100% orgánico)
✓ 180 g/m² — peso perfecto, no transparenta
✓ Corte recto, 3 largos disponibles
✓ 12 colores neutros que combinan con todo
✓ No encoge. No destiñe. No decepciona.

€39 que no vas a lamentar.

👉 Ver colección completa`,
    },
    {
      format: 'Razón + prueba',
      platform: 'Meta Ads (Carrusel)',
      content: `La moda rápida te cuesta más de lo que crees.

€8 × 4 camisetas al año = €32 en basura textil.
€39 × 1 camiseta que dura 5 años = €7,80/año en calidad real.

Pero no es solo dinero. Es el planeta. Es la persona que la fabricó.

Nuestro algodón es orgánico, certificado, trazable.
Nuestras costureras cobran salario justo.

Y tú tienes una camiseta que se nota diferente desde que te la pones.

Empieza por la básica. Después ya no querrás volver atrás.

→ Descubre la colección`,
    },
  ],
  hooks: [
    {
      type: 'Pregunta provocadora',
      text: '¿Cuándo fue la última vez que compraste ropa sin arrepentirte a los 3 meses?',
      why: 'Activa la disonancia cognitiva — el usuario piensa en sus malas compras pasadas y lo conecta con el producto solución.',
    },
    {
      type: 'Dato impactante',
      text: 'El 73% de la ropa que compramos acaba en vertedero antes de cumplir 1 año.',
      why: 'Los datos concretos paran el scroll. Crea contexto de urgencia sin presión directa.',
    },
    {
      type: 'Identidad',
      text: 'Para las que ya no compran por precio. Compran por valor.',
      why: 'Segmenta directamente a la compradora ideal y crea pertenencia a un grupo aspiracional.',
    },
    {
      type: 'Contraste visual',
      text: 'La misma camiseta después de 1 lavado vs. después de 200 lavados. (La nuestra, claro.)',
      why: 'El contraste tiempo-durabilidad es el argumento de compra más fuerte para básicos de calidad.',
    },
    {
      type: 'FOMO suave',
      text: 'La gente que la compra una vez no vuelve a buscar camisetas. Nosotros tampoco les hacemos falta.',
      why: 'Crea prueba social implícita y curiosidad sin agresividad. El tono de confianza vende solo.',
    },
  ],
  creatives: [
    {
      format: 'UGC Comparativa',
      platform: 'TikTok / Reels',
      duration: '30s',
      structure: [
        { time: '0–3s',  action: 'HOOK: Mano abriendo armario lleno de camisetas desgastadas. Voz en off: "¿Cuántas de estas llevas realmente puestas?"' },
        { time: '3–8s',  action: 'Mostrar 3 camisetas de fast fashion con deformaciones visibles, colores apagados. Música lo-fi melancólico.' },
        { time: '8–18s', action: 'Transición a nuestra camiseta en caja premium. Manos sacándola, textil en primer plano. "La última básica que vas a comprar."' },
        { time: '18–25s', action: 'Ponérsela. Corte limpio, caída perfecta. Plano espejo: mujer confiada, expresión satisfecha.' },
        { time: '25–30s', action: 'CTA en pantalla: "€39 · Algodón orgánico · Envío gratis" + logo + link en bio.' },
      ],
    },
    {
      format: 'Antes / Después Educativo',
      platform: 'TikTok / Reels',
      duration: '45s',
      structure: [
        { time: '0–4s',   action: 'HOOK disruptivo: "Deja de tirar €100 al año en camisetas malas." Texto grande en pantalla, música que rompe el scroll.' },
        { time: '4–15s',  action: 'Side by side: camiseta fast fashion a los 6 meses vs la nuestra. Zoom en costuras, color y tejido. Voz en off explicando diferencias.' },
        { time: '15–30s', action: 'Proceso de producción condensado: campo algodón → telar → costurera → caja. "Hecha diferente. De principio a fin."' },
        { time: '30–40s', action: 'Testimonios rápidos: 3 clips de 3s. Mujeres reales con la camiseta puesta en situaciones cotidianas.' },
        { time: '40–45s', action: 'CTA final: "Primera compra con 10% descuento → link en bio". Cuenta atrás visual de 5 segundos.' },
      ],
    },
  ],
  campaignStructure: {
    type: 'Full Funnel — Moda Sostenible TOFU→BOFU',
    funnel: [
      { stage: 'TOFU',  objective: 'Awareness',     audience: 'Intereses: moda sostenible, conscious fashion, GOTS', budget: '30%', format: 'Video UGC 30s' },
      { stage: 'MOFU',  objective: 'Consideración', audience: 'Visitantes sin compra + engagement vídeo >50%',        budget: '40%', format: 'Carrusel storytelling' },
      { stage: 'BOFU',  objective: 'Conversión',    audience: 'Retargeting carrito abandonado + lookalike clientes',  budget: '30%', format: 'Foto producto + UGC corto' },
    ],
    totalBudgetSuggestion: 'Mínimo €800/mes para datos significativos. Fase test: €300 en TOFU durante 7 días antes de activar retargeting.',
    notes: 'Priorizar UGC en TOFU — la audiencia de moda sostenible responde mejor a contenido auténtico que a producción pulida. Split test: storytelling emocional vs. datos concretos en MOFU.',
  },
  segmentation: {
    profile: 'Mujer 25–38 años, urbana, ingreso medio-alto. Compra ropa con intención, no por impulso. Se informa antes de comprar, valora la transparencia de marca. Ya ha reducido fast fashion o quiere hacerlo.',
    ageRange: '24–42 años',
    gender: 'Mayoritariamente mujer (85%)',
    interests: ['Moda sostenible', 'Slow fashion', 'Minimalismo', 'Conscious living', 'Yoga y bienestar', 'Decoración nórdica'],
    behaviors: ['Compra online frecuente', 'Interacción con marcas de lifestyle', 'Uso de apps segunda mano (Vinted, Wallapop)'],
    pains: [
      'Compra ropa que pierde calidad rápido y se siente estafada',
      'No sabe distinguir marcas realmente sostenibles del greenwashing',
      'Tiene el armario lleno pero siente que no tiene nada que ponerse',
    ],
    desires: [
      'Tener un armario cápsula con piezas que combinen entre sí',
      'Comprar menos pero mejor — invertir en calidad real',
      'Que la ropa refleje sus valores sin sacrificar estética',
    ],
    lookalike: ['Compradores de Patagonia', 'Seguidores de Organic Basics', 'Clientes de Arket y COS'],
    exclude: ['Interés en fast fashion', 'Compradores de muy bajo presupuesto', 'Menores de 18'],
  },
}

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
  if (t.match(/zapat|calzad|boot|shoe|sneaker|tacon/))          return 'calzado'
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

function extractProductName(input: string): string {
  const first = input.split(/[\n,—·]/)[0].trim()
  return first.length > 60 ? first.slice(0, 57) + '…' : first
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
function CopyBtn({ text, label, className = '' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
      } ${className}`}
    >
      {copied ? <><Check size={11} />Copiado</> : <><Copy size={11} />{label ?? 'Copiar'}</>}
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
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Rocket size={28} className="text-indigo-400 animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-2xl animate-ping bg-indigo-500/10" style={{ animationDuration: '2s' }} />
      </div>
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        {LOADING_STEPS.map((msg, i) => (
          <div key={i} className={`flex items-center gap-3 w-full transition-all duration-500 ${
            i < step ? 'opacity-30' : i === step ? 'opacity-100' : 'opacity-15'
          }`}>
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

// ─── Demo banner ──────────────────────────────────────────────────────────────
function DemoBanner({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-indigo-500/10 via-violet-500/8 to-indigo-500/10 p-5">
      {/* subtle glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={16} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-snug">
              Campaña de ejemplo — Camiseta algodón orgánico, moda sostenible
            </p>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Esto es exactamente lo que el sistema genera para cada producto de tus clientes.
              Copies, hooks, guiones y segmentación listos para lanzar.
            </p>
          </div>
        </div>

        <button
          onClick={onGenerate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 flex-shrink-0 whitespace-nowrap"
        >
          <Rocket size={14} /> Generar la mía gratis
        </button>
      </div>
    </div>
  )
}

// ─── Insight header ───────────────────────────────────────────────────────────
function InsightHeader({ insight }: { insight: Insight }) {
  const aggrColor =
    insight.aggressiveness === 'Alto'  ? 'text-red-400 bg-red-400/10 border-red-400/20' :
    insight.aggressiveness === 'Medio' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                                         'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-white/5">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <Crosshair size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Ángulo estratégico</p>
          <p className="text-xs font-semibold text-zinc-200 leading-snug">{insight.angle}</p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <UserCheck size={13} className="text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Cliente objetivo</p>
          <p className="text-xs font-semibold text-zinc-200 leading-snug truncate">{insight.clientType}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Flame size={13} className="text-zinc-500" />
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${aggrColor}`}>
          Agresividad {insight.aggressiveness}
        </span>
      </div>
    </div>
  )
}

// ─── Output sections ──────────────────────────────────────────────────────────
function AdsSection({ copies: { short, long } }: { copies: { short: ShortCopy[]; long: LongCopy[] } }) {
  const metaCopies   = short.filter(c => c.platform.toLowerCase().includes('meta') || c.platform.toLowerCase().includes('facebook'))
  const tiktokCopies = short.filter(c => c.platform.toLowerCase().includes('tiktok'))

  const formatShort = (copies: ShortCopy[]) =>
    copies.map(c => `[${c.type}]\n${c.hook}\n\n${c.body}\n\n${c.cta}`).join('\n\n---\n\n')

  const formatAll = () => {
    const parts: string[] = []
    if (short.length) parts.push('== COPIES CORTOS ==\n\n' + formatShort(short))
    if (long.length)  parts.push('== COPIES LARGOS ==\n\n' + long.map(c => `[${c.format}]\n${c.content}`).join('\n\n---\n\n'))
    return parts.join('\n\n\n')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mr-1">Copiar todo:</span>
        {metaCopies.length > 0   && <CopyBtn text={formatShort(metaCopies)}   label="Meta Ads" />}
        {tiktokCopies.length > 0 && <CopyBtn text={formatShort(tiktokCopies)} label="TikTok Ads" />}
        <CopyBtn text={formatAll()} label="Todo" />
      </div>

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
  const allText = hooks.map((h, i) => `${i + 1}. ${h.text}`).join('\n')
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">5 hooks scroll-stopping</p>
        <CopyBtn text={allText} label="Copiar todos" />
      </div>
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
            <CopyBtn text={c.structure.map(s => `[${s.time}] ${s.action}`).join('\n')} label="Copiar guión" />
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
          { label: 'Intereses',            items: seg.interests,  accent: 'text-indigo-400 bg-indigo-400/10' },
          { label: 'Comportamientos',      items: seg.behaviors,  accent: 'text-violet-400 bg-violet-400/10' },
          { label: 'Audiencias lookalike', items: seg.lookalike,  accent: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'Excluir',              items: seg.exclude,    accent: 'text-red-400 bg-red-400/10' },
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

// ─── Paywall screen ───────────────────────────────────────────────────────────
function PaywallScreen({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center shadow-xl shadow-indigo-500/10">
            <Lock size={32} className="text-indigo-400" />
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">1 campaña gratis usada</p>
          <h2 className="text-3xl font-black text-white leading-tight">
            Genera campañas<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">ilimitadas</span>
          </h2>
          <p className="text-zinc-500 text-base">Desbloquea el sistema completo para todos tus clientes, sin límite.</p>
        </div>
        <ul className="space-y-2.5 text-left">
          {[
            'Campañas ilimitadas para cualquier nicho',
            'Copies, hooks, guiones y estructura de funnel',
            'Variantes agresivo, conversión y TikTok',
            'Historial completo de campañas generadas',
            'Actualizaciones del sistema incluidas',
          ].map(f => (
            <li key={f} className="flex items-center gap-3 text-sm text-zinc-400">
              <Check size={14} className="text-indigo-400 flex-shrink-0" />{f}
            </li>
          ))}
        </ul>
        <div className="space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-indigo-500/25 hover:-translate-y-0.5"
          >
            <Crown size={20} /> Desbloquear por 49€/mes
          </button>
          <p className="text-[11px] text-zinc-600">Sin contratos · Cancela cuando quieras</p>
        </div>
      </div>
    </div>
  )
}

// ─── Action buttons ───────────────────────────────────────────────────────────
const ACTIONS: Array<{ label: string; icon: React.ElementType; variant: string }> = [
  { label: 'Regenerar',        icon: RefreshCw,  variant: ''           },
  { label: 'Más agresivo',     icon: TrendingUp, variant: 'agresivo'   },
  { label: 'Para conversión',  icon: Target,     variant: 'conversion' },
  { label: 'Adaptar a TikTok', icon: Zap,        variant: 'tiktok'     },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CampaignApp() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { isActive } = useSubscription()
  const { token } = useAuth()

  const [input,     setInput]     = useState('')
  const [niche,     setNiche]     = useState('')
  const [objective, setObjective] = useState('ventas')
  const [style,     setStyle]     = useState('performance')
  const [error,     setError]     = useState<string | null>(null)

  const [appState,  setAppState]  = useState<AppState>('idle')
  const [result,    setResult]    = useState<CampaignResult | null>(null)
  const [activeTab, setActiveTab] = useState('ads')
  const [isDemo,    setIsDemo]    = useState(false)
  const [isSaving,  setIsSaving]  = useState(false)
  const [savedId,   setSavedId]   = useState<string | null>(null)

  const lastParams = useRef({ input, niche, objective, style })

  // ── Initial state: demo on first visit, or load from history state ──────────
  useEffect(() => {
    const state = location.state as {
      loadCampaign?: HistoryEntry
      prefill?: { input: string; niche: string; objective: string; style: string }
    } | null

    if (state?.loadCampaign) {
      const entry = state.loadCampaign
      setInput(entry.inputText)
      setNiche(entry.niche)
      setObjective(entry.objective)
      setStyle(entry.style)
      setResult(entry.result as CampaignResult)
      setActiveTab('ads')
      setAppState('result')
      window.history.replaceState({}, '')
      return
    }

    if (state?.prefill) {
      const p = state.prefill
      setInput(p.input)
      setNiche(p.niche)
      setObjective(p.objective)
      setStyle(p.style)
      window.history.replaceState({}, '')
      return
    }

    // First visit → show demo campaign immediately
    if (!localStorage.getItem(ONBOARD_KEY)) {
      setResult(DEMO_CAMPAIGN)
      setActiveTab('ads')
      setAppState('result')
      setIsDemo(true)
    }
  }, [])

  // Auto-detect niche on input change
  useEffect(() => {
    if (!input.trim()) return
    const detected = detectNiche(input)
    if (detected && !niche) setNiche(detected)
  }, [input])

  // Exit demo → go to idle form
  function exitDemo() {
    localStorage.setItem(ONBOARD_KEY, '1')
    setIsDemo(false)
    setAppState('idle')
    setResult(null)
  }

  const runGenerate = useCallback(async (variant = '') => {
    const params = variant ? lastParams.current : { input, niche, objective, style }
    if (!params.input.trim()) { setError('Describe el producto o pega una URL.'); return }
    if (!params.niche)        { setError('Selecciona el nicho.'); return }

    // Paywall check (only new generates, not variants)
    if (!variant && !isActive && hasFreeUsed()) {
      setAppState('paywall')
      return
    }

    lastParams.current = { ...params }
    setIsDemo(false)
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
      setSavedId(null)

      if (!variant) {
        localStorage.setItem(ONBOARD_KEY, '1')
        markFreeUsed()
        const entry: HistoryEntry = {
          id:          data.id,
          date:        data.generatedAt,
          productName: extractProductName(params.input),
          niche:       params.niche,
          objective:   params.objective,
          style:       params.style,
          inputText:   params.input,
          result:      data,
        }
        saveToHistory(entry)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando la campaña.')
      setAppState('idle')
    }
  }, [input, niche, objective, style, isActive])

  const isIdle    = appState === 'idle'
  const isLoad    = appState === 'loading'
  const isResult  = appState === 'result'
  const isPaywall = appState === 'paywall'

  async function handleSave() {
    if (!result || !token || savedId) return
    setIsSaving(true)
    try {
      const saved = await saveCampaign(token, {
        name:      extractProductName(input || result.input.productDescription || result.input.productUrl || 'Campaña'),
        niche:     result.input.niche,
        objective: result.input.objective,
        data:      { ...result, _style: style, _inputText: input },
      })
      setSavedId(saved.id)
    } catch {
      // silently fail — localStorage already has a copy
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950">

      {/* ── Input block (hidden during paywall and demo) ─────────────────── */}
      {!isPaywall && !isDemo && (
        <div className={`border-b border-white/5 transition-all duration-500 ${isIdle ? 'py-16' : 'py-5'}`}>
          <div className={`mx-auto px-6 transition-all duration-500 ${isIdle ? 'max-w-2xl' : 'max-w-5xl'}`}>

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
                {!isActive && !hasFreeUsed() && (
                  <p className="text-xs text-amber-400/80 mt-3 font-medium">1 campaña gratuita · Sin tarjeta de crédito</p>
                )}
              </div>
            )}

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

              <div className={`${isIdle ? 'grid grid-cols-3 gap-3' : 'flex items-center gap-2 flex-shrink-0'}`}>
                <Select value={niche}     onChange={setNiche}     options={NICHES}      placeholder="Nicho detectado..." />
                <Select value={objective} onChange={setObjective} options={OBJECTIVES} />
                <Select value={style}     onChange={setStyle}     options={STYLES} />
              </div>

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
      )}

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoad && <LoadingState />}

      {/* ── Paywall ─────────────────────────────────────────────────────── */}
      {isPaywall && <PaywallScreen onUpgrade={() => navigate('/settings')} />}

      {/* ── Result ──────────────────────────────────────────────────────── */}
      {isResult && result && (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-6 gap-5">

          {/* Demo banner */}
          {isDemo && <DemoBanner onGenerate={exitDemo} />}

          {/* Insight header */}
          {result.insight && <InsightHeader insight={result.insight} />}

          {/* Action buttons — hidden in demo */}
          {!isDemo && (
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
              <span className="ml-auto flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !!savedId}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    savedId
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default'
                      : 'border-white/8 bg-zinc-900 hover:bg-zinc-800 hover:border-white/15 text-zinc-400 hover:text-white'
                  }`}
                >
                  {savedId
                    ? <><BookmarkCheck size={12} /> Guardada</>
                    : isSaving
                      ? <><Bookmark size={12} /> Guardando…</>
                      : <><Bookmark size={12} /> Guardar</>
                  }
                </button>
                <span className="text-[10px] text-zinc-700">
                  {new Date(result.generatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-white/5 pb-0">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all relative ${
                    activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
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
            {activeTab === 'ads'       && <AdsSection      copies={{ short: result.shortCopies, long: result.longCopies }} />}
            {activeTab === 'hooks'     && <HooksSection    hooks={result.hooks} />}
            {activeTab === 'creatives' && <CreativesSection creatives={result.creatives} />}
            {activeTab === 'campaign'  && <CampaignSection structure={result.campaignStructure} />}
            {activeTab === 'audience'  && <AudienceSection seg={result.segmentation} />}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 pt-5 flex items-center justify-between">
            {isDemo ? (
              <>
                <p className="text-xs text-zinc-600">¿Listo para generar la tuya?</p>
                <button
                  onClick={exitDemo}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Generar mi primera campaña <ArrowRight size={12} />
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-zinc-600">¿Quieres generar para otro producto?</p>
                <button
                  onClick={() => { setAppState('idle'); setResult(null); setInput(''); setNiche('') }}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Nueva campaña <ArrowRight size={12} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
