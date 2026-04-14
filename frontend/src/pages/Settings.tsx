import { useState, useEffect, useRef } from 'react'
import {
  Plug, ShieldCheck, Eye, EyeOff, Copy, Check, CheckCircle2, XCircle,
  AlertTriangle, Loader2, RefreshCw, Trash2, ChevronDown, ChevronUp,
  ExternalLink, Lock, Building2, Globe, Clock, TrendingUp, TrendingDown,
  Zap, BarChart2, Lightbulb, Send, Image as ImageIcon, Hash,
  CalendarClock, Star, ArrowRight, Info, Flame, Target,
  MessageCircle, Heart, Users, Repeat2, X, CreditCard, Crown,
  AlertCircle, Sparkles,
} from 'lucide-react'
import Header from '../components/Layout/Header'
import { useSubscription } from '../contexts/SubscriptionContext'

// ─── Types ────────────────────────────────────────────────────────────────────
type SettingsSection = 'general' | 'integraciones' | 'seguridad' | 'facturacion'
type IgTab = 'conexion' | 'analisis' | 'sugerencias' | 'publicar'
type ConnectionStatus = 'idle' | 'verifying' | 'connected' | 'error'
type PostType = 'feed' | 'story' | 'reel'
type PublishStatus = 'idle' | 'uploading' | 'publishing' | 'success' | 'error'

interface InstagramConfig {
  accessToken: string; appId: string; connectedAt: string | null
  accountName: string | null; accountId: string | null
  accountType: string | null; expiresAt: string | null
}
interface AgencyConfig {
  name: string; email: string; website: string
  currency: string; timezone: string; language: string
}
interface PublishForm {
  caption: string; mediaPreview: string | null
  postType: PostType; scheduleNow: boolean; scheduledAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'agencyos_instagram_config'
const AGENCY_KEY  = 'agencyos_agency_config'
const IG_CHAR_LIMIT = 2200

const defaultInstagram: InstagramConfig = {
  accessToken: '', appId: '', connectedAt: null,
  accountName: null, accountId: null, accountType: null, expiresAt: null,
}
const defaultAgency: AgencyConfig = {
  name: 'Mi Agencia', email: '', website: '',
  currency: 'EUR', timezone: 'Europe/Madrid', language: 'es',
}

// ─── Mock analytics data ──────────────────────────────────────────────────────
const HOURLY_ENG = [8,4,2,1,1,4,14,38,64,78,70,74,88,80,56,50,54,68,90,95,92,82,68,42]
const WEEKDAY_ENG = [
  { day: 'Lun', val: 72 }, { day: 'Mar', val: 88 }, { day: 'Mié', val: 61 },
  { day: 'Jue', val: 79 }, { day: 'Vie', val: 85 }, { day: 'Sáb', val: 54 }, { day: 'Dom', val: 47 },
]
const TRENDING_TAGS = [
  { tag: 'branding2026', growth: 42, uses: 128400 },
  { tag: 'marketingdigital', growth: 28, uses: 2310000 },
  { tag: 'socialmedia', growth: 19, uses: 8900000 },
  { tag: 'contentcreator', growth: 15, uses: 4200000 },
  { tag: 'agenciacreativa', growth: 67, uses: 38200 },
]
const CONTENT_TYPES = [
  { type: 'Reels', engRate: 6.4, reach: 12400, color: 'bg-indigo-500', pct: 82 },
  { type: 'Carrusel', engRate: 4.8, reach: 8700, color: 'bg-violet-500', pct: 62 },
  { type: 'Foto', engRate: 3.1, reach: 5900, color: 'bg-purple-400', pct: 40 },
  { type: 'Story', engRate: 2.4, reach: 9800, color: 'bg-fuchsia-400', pct: 31 },
]
const SUGGESTIONS = [
  {
    id: '1', priority: 'alta' as const, type: 'timing' as const,
    icon: <Clock size={16} />,
    title: 'Publica Reels los martes de 7–9 PM',
    insight: 'Tu audiencia tiene 2.8× más engagement en ese slot versus tu promedio actual.',
    action: 'Programa tu próximo Reel para el martes a las 7:30 PM',
    impact: '+2.8× engagement',
  },
  {
    id: '2', priority: 'alta' as const, type: 'content' as const,
    icon: <Flame size={16} />,
    title: 'Aumenta el contenido Behind-The-Scenes',
    insight: 'Tus posts de proceso creativo generan 45% más comentarios que el resto de tu contenido.',
    action: 'Añade 2 BTS stories por semana mostrando el workflow del equipo',
    impact: '+45% comentarios',
  },
  {
    id: '3', priority: 'media' as const, type: 'hashtag' as const,
    icon: <Hash size={16} />,
    title: 'Sustituye mega-hashtags por hashtags de nicho',
    insight: 'Los hashtags de 10K–500K seguidores te dan 30% más alcance orgánico que los saturados.',
    action: 'Reemplaza #marketing (300M posts) por #agenciacreativa (38K posts)',
    impact: '+30% alcance orgánico',
  },
  {
    id: '4', priority: 'media' as const, type: 'audience' as const,
    icon: <MessageCircle size={16} />,
    title: 'Responde comentarios en las primeras 2 horas',
    insight: 'El algoritmo de Instagram prioriza posts con alta actividad en la primera ventana.',
    action: 'Activa notificaciones y responde al menos los primeros 10 comentarios',
    impact: '+35% distribución orgánica',
  },
  {
    id: '5', priority: 'baja' as const, type: 'content' as const,
    icon: <Star size={16} />,
    title: 'Carruseles de 5–7 slides',
    insight: 'Ese rango tiene el doble de tiempo de visualización vs. carruseles de 2–3 slides.',
    action: 'En tu próximo carrusel educativo, expande a 6 slides mínimo',
    impact: '2× tiempo de visualización',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function maskToken(t: string) {
  if (t.length <= 12) return '•'.repeat(t.length)
  return t.slice(0, 8) + '•'.repeat(Math.max(t.length - 12, 6)) + t.slice(-4)
}
function validateToken(t: string): string | null {
  if (!t.trim()) return 'El token no puede estar vacío.'
  if (t.length < 30) return 'El token parece demasiado corto (mínimo 30 caracteres).'
  if (!/^[A-Za-z0-9_\-|]+$/.test(t)) return 'El token contiene caracteres no válidos.'
  return null
}
async function verifyMetaToken(token: string) {
  await new Promise(r => setTimeout(r, 1800))
  const err = validateToken(token)
  if (err) return { ok: false as const, message: err }
  if (!token.startsWith('EAA') && token.length < 60)
    return { ok: false as const, message: 'Token inválido. Los tokens de Meta empiezan por "EAA".' }
  return { ok: true as const, name: 'Mi Agencia Page', id: '17841400' + Math.floor(Math.random()*9999999), type: 'Instagram Business' }
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M'
  if (n >= 1_000) return (n/1_000).toFixed(0)+'K'
  return String(n)
}

// ─── IG Icon ──────────────────────────────────────────────────────────────────
function IgIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }}
      stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function IgTabBar({ active, onChange, locked }: {
  active: IgTab; onChange: (t: IgTab) => void; locked: boolean
}) {
  const tabs: { id: IgTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'conexion',    label: 'Conexión',    icon: <Lock size={14} /> },
    { id: 'analisis',    label: 'Análisis',    icon: <BarChart2 size={14} />,   badge: 'Live' },
    { id: 'sugerencias', label: 'Sugerencias', icon: <Lightbulb size={14} />,  badge: 'IA' },
    { id: 'publicar',    label: 'Publicar',    icon: <Send size={14} /> },
  ]
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
      {tabs.map(tab => {
        const isActive = tab.id === active
        const isLocked = locked && tab.id !== 'conexion'
        return (
          <button
            key={tab.id}
            onClick={() => !isLocked && onChange(tab.id)}
            disabled={isLocked}
            title={isLocked ? 'Conecta tu cuenta primero' : undefined}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-white text-indigo-600 shadow-sm'
                : isLocked
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && !isLocked && (
              <span className={`absolute -top-1 -right-1 px-1 py-0 rounded-full text-[9px] font-bold leading-4 ${
                tab.badge === 'IA' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'
              }`}>{tab.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — CONEXIÓN
// ═══════════════════════════════════════════════════════════════════════════════
function ConnectionTab({
  config, status, tokenInput, appIdInput, showToken, copied, errorMsg, tokenDirty,
  setTokenInput, setAppIdInput, setShowToken, setErrorMsg, setTokenDirty, setStatus,
  onVerify, onDisconnect, onCopy,
}: {
  config: InstagramConfig; status: ConnectionStatus
  tokenInput: string; appIdInput: string; showToken: boolean
  copied: boolean; errorMsg: string | null; tokenDirty: boolean
  setTokenInput: (v: string) => void; setAppIdInput: (v: string) => void
  setShowToken: (v: boolean) => void; setErrorMsg: (v: string | null) => void
  setTokenDirty: (v: boolean) => void; setStatus: (v: ConnectionStatus) => void
  onVerify: () => void; onDisconnect: () => void; onCopy: () => void
}) {
  const [showInstr, setShowInstr] = useState(false)
  const isConnected = status === 'connected'
  const isVerifying = status === 'verifying'

  return (
    <div className="space-y-5">
      {/* Account info strip */}
      {isConnected && config.accountName && (
        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-0.5">Cuenta</p>
              <p className="text-sm font-semibold text-gray-900">{config.accountName}</p>
            </div>
            <div>
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-0.5">Tipo</p>
              <p className="text-sm font-medium text-gray-700">{config.accountType}</p>
            </div>
            <div>
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-0.5">Desde</p>
              <p className="text-sm text-gray-700">
                {config.connectedAt ? new Date(config.connectedAt).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
              </p>
            </div>
          </div>
          {config.expiresAt && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-indigo-600">
              <Clock size={11} />
              Token válido hasta {new Date(config.expiresAt).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})}
            </div>
          )}
        </div>
      )}

      {/* Credentials */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Lock size={14} className="text-indigo-400" />
          <h4 className="text-sm font-semibold text-gray-800">Credenciales de acceso</h4>
        </div>
        <div>
          <label className="label">Access Token <span className="font-normal text-gray-400">(User Token o Page Token)</span></label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              className={`input pr-20 font-mono text-xs tracking-widest ${status === 'error' ? 'border-red-300 ring-1 ring-red-300' : ''}`}
              placeholder="EAAxxxxxxxxxxxxxxxxxx..."
              value={tokenInput} autoComplete="off" spellCheck={false}
              onChange={e => {
                setTokenInput(e.target.value); setTokenDirty(true)
                setErrorMsg(null)
                if (status === 'error' || status === 'connected') setStatus('idle')
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
              {isConnected && !tokenDirty && (
                <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors" onClick={onCopy}>
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              )}
              <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowToken(!showToken)}>
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {isConnected && !tokenDirty && config.accessToken && (
            <p className="mt-1.5 text-xs text-gray-400 font-mono">Guardado: {maskToken(config.accessToken)}</p>
          )}
          {errorMsg && (
            <div className="flex items-start gap-2 mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
              <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">{errorMsg}</p>
            </div>
          )}
        </div>
        <div>
          <label className="label">App ID <span className="font-normal text-gray-400">(opcional)</span></label>
          <input className="input font-mono text-sm" placeholder="ej. 1234567890123456"
            value={appIdInput} autoComplete="off" onChange={e => setAppIdInput(e.target.value)} />
          <p className="mt-1.5 text-xs text-gray-400">
            En{' '}
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer"
              className="text-indigo-500 hover:underline inline-flex items-center gap-0.5">
              Meta for Developers <ExternalLink size={10} />
            </a>
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary flex-1 justify-center py-2.5" onClick={onVerify}
            disabled={isVerifying || !tokenInput.trim()}>
            {isVerifying ? <><Loader2 size={15} className="animate-spin" /> Verificando...</>
              : isConnected && !tokenDirty ? <><RefreshCw size={15} /> Reverificar</>
              : <><CheckCircle2 size={15} /> Verificar y conectar</>}
          </button>
          {isConnected && (
            <button className="btn-secondary px-4 py-2.5 text-red-600 border-red-100 hover:bg-red-50" onClick={onDisconnect}>
              <Trash2 size={15} /> Desconectar
            </button>
          )}
        </div>
      </div>

      {/* Security note */}
      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Token almacenado localmente.</span>{' '}
          Nunca se envía a servidores externos. Usa tokens de corta duración y renuévalos cada 60 días.
        </p>
      </div>

      {/* Instructions */}
      <div className="card overflow-hidden">
        <button className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={() => setShowInstr(v => !v)}>
          <span className="flex items-center gap-2"><ExternalLink size={14} className="text-indigo-400" />¿Cómo obtengo mi Access Token?</span>
          {showInstr ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showInstr && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <ol className="mt-4 space-y-3">
              {[
                ['Accede a Meta for Developers','Ve a developers.facebook.com e inicia sesión.'],
                ['Crea o selecciona tu App','En "Mis Apps" crea una de tipo "Negocio".'],
                ['Agrega Instagram Graph API','En "Agregar producto" selecciona Instagram Graph API.'],
                ['Genera el token','Herramientas → Explorador Graph API. Incluye permisos instagram_basic y instagram_content_publish.'],
                ['Extiende a Long-Lived Token','Usa /oauth/access_token?grant_type=fb_exchange_token para ~60 días de validez.'],
              ].map(([title, desc], i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — ANÁLISIS DE RENDIMIENTO
// ═══════════════════════════════════════════════════════════════════════════════
function AnalyticsTab() {
  const bestHour = HOURLY_ENG.indexOf(Math.max(...HOURLY_ENG))
  const bestDay  = WEEKDAY_ENG.reduce((a, b) => b.val > a.val ? b : a).day
  const avgEng   = (CONTENT_TYPES.reduce((s, t) => s + t.engRate, 0) / CONTENT_TYPES.length).toFixed(1)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Engagement promedio', value: `${avgEng}%`, sub: '+0.8% vs. mes anterior', icon: <Heart size={16}/>, color: 'text-pink-500', bg: 'bg-pink-50' },
          { label: 'Mejor hora de publicar', value: `${bestHour}:00`, sub: `${bestHour < 12 ? 'AM' : 'PM'} — pico máximo`, icon: <Clock size={16}/>, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Mejor día', value: bestDay, sub: 'Mayor alcance orgánico', icon: <Star size={16}/>, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <div className={`w-9 h-9 rounded-xl ${k.bg} ${k.color} flex items-center justify-center mb-3`}>{k.icon}</div>
            <p className="text-xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Hourly engagement chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800 text-sm">Engagement por hora del día</h4>
          <span className="badge bg-indigo-50 text-indigo-600 text-xs">Últimos 30 días</span>
        </div>
        <div className="flex items-end gap-[3px] h-20">
          {HOURLY_ENG.map((val, h) => {
            const isPeak = val === Math.max(...HOURLY_ENG)
            const heightPct = Math.max(4, val)
            return (
              <div key={h} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {h}:00 — {val}%
                </div>
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    isPeak ? 'bg-indigo-500 shadow-sm shadow-indigo-300' :
                    val > 60 ? 'bg-indigo-400' : val > 30 ? 'bg-indigo-300' : 'bg-indigo-100'
                  }`}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
        </div>
      </div>

      {/* Weekly + Content type side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly bar */}
        <div className="card p-5">
          <h4 className="font-semibold text-gray-800 text-sm mb-4">Engagement por día</h4>
          <div className="space-y-2.5">
            {WEEKDAY_ENG.map(({ day, val }) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-7">{day}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${val >= 85 ? 'bg-indigo-500' : val >= 70 ? 'bg-indigo-400' : 'bg-indigo-200'}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600 w-8 text-right">{val}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content types */}
        <div className="card p-5">
          <h4 className="font-semibold text-gray-800 text-sm mb-4">Rendimiento por formato</h4>
          <div className="space-y-3">
            {CONTENT_TYPES.map(ct => (
              <div key={ct.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{ct.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{fmtNum(ct.reach)} alcance</span>
                    <span className="text-xs font-bold text-indigo-600">{ct.engRate}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${ct.color} transition-all duration-500`} style={{ width: `${ct.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending hashtags */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800 text-sm">Hashtags en tendencia para tu nicho</h4>
          <span className="badge bg-red-50 text-red-500 text-xs flex items-center gap-1"><Flame size={10} /> Trending</span>
        </div>
        <div className="space-y-2.5">
          {TRENDING_TAGS.map(t => (
            <div key={t.tag} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Hash size={12} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">#{t.tag}</p>
                  <p className="text-xs text-gray-400">{fmtNum(t.uses)} posts</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <TrendingUp size={13} />
                <span className="text-xs font-bold">+{t.growth}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — SUGERENCIAS INTELIGENTES
// ═══════════════════════════════════════════════════════════════════════════════
function SuggestionsTab() {
  const [dismissed, setDismissed] = useState<string[]>([])
  const visible = SUGGESTIONS.filter(s => !dismissed.includes(s.id))

  const priorityStyle = {
    alta: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    media: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    baja: { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Motor de sugerencias IA</p>
          <p className="text-xs text-indigo-600 mt-0.5 leading-relaxed">
            Basado en el análisis de tu audiencia, historial de publicaciones y benchmarks del sector. Actualizado con los datos de los últimos 30 días.
          </p>
        </div>
      </div>

      {/* Score card */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Puntuación de perfil</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-gray-900">73</span>
              <span className="text-lg text-gray-400 mb-1">/100</span>
            </div>
          </div>
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e0e7ff" strokeWidth="3.2" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6366f1" strokeWidth="3.2"
                strokeDasharray={`${73} ${100 - 73}`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-600">73%</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Consistencia', val: 82, color: 'bg-emerald-400' },
            { label: 'Engagement', val: 68, color: 'bg-indigo-400' },
            { label: 'Optimización', val: 57, color: 'bg-amber-400' },
          ].map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">{m.label}</span>
                <span className="font-semibold text-gray-700">{m.val}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {visible.length === 0 && (
        <div className="card p-10 flex flex-col items-center text-center">
          <CheckCircle2 size={32} className="text-emerald-400 mb-3" />
          <p className="font-semibold text-gray-700">¡Todo aplicado!</p>
          <p className="text-sm text-gray-400 mt-1">Has gestionado todas las sugerencias activas.</p>
        </div>
      )}
      {visible.map(s => {
        const p = priorityStyle[s.priority]
        return (
          <div key={s.id} className="card p-5 group hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                  <span className={`badge text-xs ${p.badge} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    {s.priority}
                  </span>
                  <span className="badge bg-emerald-50 text-emerald-700 text-xs font-semibold">{s.impact}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{s.insight}</p>
                <div className="flex items-start gap-2 p-2.5 bg-indigo-50 rounded-lg">
                  <ArrowRight size={13} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-indigo-700 font-medium">{s.action}</p>
                </div>
              </div>
              <button
                className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 p-1 rounded"
                onClick={() => setDismissed(d => [...d, s.id])}
                title="Descartar"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )
      })}

      {/* Audience breakdown */}
      <div className="card p-5">
        <h4 className="font-semibold text-gray-800 text-sm mb-4">Insights de audiencia</h4>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Rango de edad principal', value: '25–34 años', icon: <Users size={14}/>, color: 'text-indigo-500 bg-indigo-50' },
            { label: 'Género dominante', value: '62% Mujeres', icon: <Target size={14}/>, color: 'text-violet-500 bg-violet-50' },
            { label: 'País #1', value: 'España', icon: <Globe size={14}/>, color: 'text-purple-500 bg-purple-50' },
            { label: 'Hora de mayor actividad', value: '19:00–21:00', icon: <Clock size={14}/>, color: 'text-fuchsia-500 bg-fuchsia-50' },
          ].map(it => (
            <div key={it.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${it.color}`}>{it.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{it.label}</p>
                <p className="text-sm font-semibold text-gray-800">{it.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — PUBLICAR EN INSTAGRAM
// ═══════════════════════════════════════════════════════════════════════════════
function PublishTab({ accountName }: { accountName: string | null }) {
  const [form, setForm] = useState<PublishForm>({
    caption: '', mediaPreview: null, postType: 'feed',
    scheduleNow: true, scheduledAt: '',
  })
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle')
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [suggestedTags, _] = useState(['#branding2026','#agenciacreativa','#marketingdigital','#contenido','#socialmedia'])

  const charCount = form.caption.length
  const charOver = charCount > IG_CHAR_LIMIT
  const hashtagCount = (form.caption.match(/#\w+/g) || []).length

  const setField = <K extends keyof PublishForm>(k: K, v: PublishForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setField('mediaPreview', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const addHashtag = (tag: string) => {
    if (form.caption.includes(tag)) return
    setField('caption', form.caption + (form.caption.endsWith(' ') || !form.caption ? '' : ' ') + tag + ' ')
  }

  const handlePublish = async () => {
    if (!form.caption.trim()) return
    setPublishStatus('uploading')
    await new Promise(r => setTimeout(r, 1200))
    setPublishStatus('publishing')
    await new Promise(r => setTimeout(r, 1600))
    setPublishedId('18023' + Math.floor(Math.random() * 9999999))
    setPublishStatus('success')
  }

  const reset = () => {
    setForm({ caption: '', mediaPreview: null, postType: 'feed', scheduleNow: true, scheduledAt: '' })
    setPublishStatus('idle'); setPublishedId(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (publishStatus === 'success') {
    return (
      <div className="card p-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
          <CheckCircle2 size={30} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">¡Publicado con éxito!</h3>
        <p className="text-sm text-gray-500 mb-1">Tu contenido ya está en Instagram</p>
        <code className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg mt-1">ID: {publishedId}</code>
        <div className="flex gap-3 mt-6">
          <button className="btn-secondary" onClick={reset}><RefreshCw size={15} /> Nueva publicación</button>
          <button className="btn-primary">Ver en Instagram <ExternalLink size={14} /></button>
        </div>
      </div>
    )
  }

  const isPublishing = publishStatus === 'uploading' || publishStatus === 'publishing'

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Form column */}
      <div className="space-y-4">
        {/* Post type */}
        <div>
          <label className="label">Tipo de publicación</label>
          <div className="flex gap-2">
            {([
              { id: 'feed', label: 'Feed', icon: '🖼️' },
              { id: 'story', label: 'Story', icon: '⚡' },
              { id: 'reel', label: 'Reel', icon: '🎬' },
            ] as const).map(pt => (
              <button
                key={pt.id}
                onClick={() => setField('postType', pt.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                  form.postType === pt.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-indigo-200'
                }`}
              >
                <span>{pt.icon}</span>{pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Media upload */}
        <div>
          <label className="label">Imagen / Vídeo</label>
          <div
            className="relative border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            {form.mediaPreview ? (
              <div className="relative">
                <img src={form.mediaPreview} alt="preview" className="max-h-28 mx-auto rounded-lg object-cover" />
                <button
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  onClick={e => { e.stopPropagation(); setField('mediaPreview', null); if (fileRef.current) fileRef.current.value = '' }}
                >×</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <ImageIcon size={22} />
                <p className="text-xs">Arrastra o haz clic para subir</p>
                <p className="text-[10px] text-gray-300">JPG, PNG, MP4 · Máx 8MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
        </div>

        {/* Caption */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Caption</label>
            <div className="flex items-center gap-2 text-xs">
              <span className={`${hashtagCount > 30 ? 'text-red-500' : 'text-gray-400'}`}>
                {hashtagCount}/30 hashtags
              </span>
              <span className={`font-medium ${charOver ? 'text-red-500' : 'text-gray-400'}`}>
                {charCount}/{IG_CHAR_LIMIT}
              </span>
            </div>
          </div>
          <textarea
            className={`input resize-none text-sm leading-relaxed ${charOver ? 'border-red-300' : ''}`}
            rows={5}
            placeholder="Escribe tu caption aquí... El texto se publicará exactamente como lo escribas."
            value={form.caption}
            onChange={e => setField('caption', e.target.value)}
          />
          {/* Progress bar */}
          <div className="h-0.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${charOver ? 'bg-red-400' : charCount > IG_CHAR_LIMIT * 0.8 ? 'bg-amber-400' : 'bg-indigo-400'}`}
              style={{ width: `${Math.min(100, (charCount / IG_CHAR_LIMIT) * 100)}%` }}
            />
          </div>
        </div>

        {/* Hashtag suggestions */}
        <div>
          <label className="label text-xs text-gray-500 font-normal">Hashtags sugeridos — clic para añadir</label>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.map(tag => (
              <button
                key={tag}
                onClick={() => addHashtag(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  form.caption.includes(tag)
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule toggle */}
        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <CalendarClock size={15} className="text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Programar para más tarde</span>
          </div>
          <button
            onClick={() => setField('scheduleNow', !form.scheduleNow)}
            className={`relative w-10 h-5.5 rounded-full transition-colors ${!form.scheduleNow ? 'bg-indigo-500' : 'bg-gray-200'}`}
            style={{ height: 22, width: 40 }}
          >
            <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${!form.scheduleNow ? 'translate-x-[18px]' : ''}`} />
          </button>
        </div>
        {!form.scheduleNow && (
          <input
            className="input"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={e => setField('scheduledAt', e.target.value)}
          />
        )}

        {/* Publish button */}
        <button
          className="btn-primary w-full justify-center py-3 text-base"
          onClick={handlePublish}
          disabled={isPublishing || !form.caption.trim() || charOver}
        >
          {isPublishing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {publishStatus === 'uploading' ? 'Subiendo media...' : 'Publicando en Instagram...'}
            </>
          ) : (
            <>
              <Send size={16} />
              {form.scheduleNow ? 'Publicar ahora en Instagram' : 'Programar publicación'}
            </>
          )}
        </button>
      </div>

      {/* Preview column */}
      <div className="flex flex-col gap-4">
        <label className="label">Vista previa</label>
        {/* Phone frame */}
        <div className="flex justify-center">
          <div className="relative w-48">
            {/* Phone shell */}
            <div className="bg-gray-900 rounded-[28px] p-2 shadow-xl shadow-gray-400/40">
              {/* Screen */}
              <div className="bg-white rounded-[20px] overflow-hidden">
                {/* Status bar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-white">
                  <span className="text-[8px] font-bold text-gray-800">9:41</span>
                  <div className="w-16 h-3 bg-gray-900 rounded-full" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-800 rounded-sm" />
                    <div className="w-2 h-2 bg-gray-800 rounded-sm" />
                  </div>
                </div>
                {/* IG header bar */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
                  <span className="text-[10px] font-black text-gray-900 italic">Instagram</span>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 border border-gray-400 rounded-full" />
                    <div className="w-3 h-3 border border-gray-400 rounded" />
                  </div>
                </div>
                {/* Post header */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">AG</span>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-gray-900">{accountName ?? 'tu_cuenta'}</p>
                    <p className="text-[7px] text-gray-400">España</p>
                  </div>
                  <div className="ml-auto text-[8px] text-indigo-500 font-bold">···</div>
                </div>
                {/* Media area */}
                <div className="w-full aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden">
                  {form.mediaPreview ? (
                    <img src={form.mediaPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-indigo-300">
                      <ImageIcon size={20} />
                      <span className="text-[8px]">sin imagen</span>
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex gap-3 px-3 pt-2 pb-1">
                  <Heart size={10} className="text-gray-700" />
                  <MessageCircle size={10} className="text-gray-700" />
                  <Send size={10} className="text-gray-700" />
                  <Repeat2 size={10} className="ml-auto text-gray-700" />
                </div>
                {/* Caption preview */}
                <div className="px-3 pb-3">
                  <p className="text-[7px] font-bold text-gray-800">{accountName ?? 'tu_cuenta'}</p>
                  <p className="text-[7px] text-gray-600 leading-relaxed line-clamp-3">
                    {form.caption || <span className="text-gray-300 italic">Tu caption aparecerá aquí...</span>}
                  </p>
                </div>
              </div>
            </div>
            {/* Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-2 bg-gray-900 rounded-full" />
          </div>
        </div>

        {/* Post stats preview */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Estimaciones de alcance</p>
          <div className="space-y-2">
            {[
              { label: 'Alcance estimado', value: '8.400–12.200', icon: <Users size={12}/> },
              { label: 'Impresiones', value: '14.000–18.000', icon: <Target size={12}/> },
              { label: 'Engagement esperado', value: '4.2%', icon: <Heart size={12}/> },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-500">{s.icon}{s.label}</span>
                <span className="font-semibold text-gray-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API note */}
        <div className="flex gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <Info size={13} className="text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-indigo-700 leading-relaxed">
            La publicación usa la <strong>Instagram Content Publishing API</strong>. Requiere cuenta Business o Creator y el permiso <code className="bg-indigo-100 px-1 rounded">instagram_content_publish</code>.
          </p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTAGRAM PANEL — Tab router
// ═══════════════════════════════════════════════════════════════════════════════
function InstagramPanel() {
  const [activeTab, setActiveTab] = useState<IgTab>('conexion')
  const [config, setConfig] = useState<InstagramConfig>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') ?? defaultInstagram }
    catch { return defaultInstagram }
  })
  const [status, setStatus]       = useState<ConnectionStatus>(config.connectedAt ? 'connected' : 'idle')
  const [tokenInput, setTokenInput] = useState(config.accessToken)
  const [appIdInput, setAppIdInput] = useState(config.appId)
  const [showToken, setShowToken]   = useState(false)
  const [copied, setCopied]         = useState(false)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)
  const [tokenDirty, setTokenDirty] = useState(false)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) }, [config])

  const handleVerify = async () => {
    setErrorMsg(null); setStatus('verifying')
    const res = await verifyMetaToken(tokenInput)
    if (res.ok) {
      const updated: InstagramConfig = {
        accessToken: tokenInput, appId: appIdInput, connectedAt: new Date().toISOString(),
        accountName: res.name, accountId: res.id, accountType: res.type,
        expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
      }
      setConfig(updated); setStatus('connected'); setTokenDirty(false)
    } else {
      setErrorMsg(res.message); setStatus('error')
    }
  }

  const handleDisconnect = () => {
    setConfig(defaultInstagram); setTokenInput(''); setAppIdInput('')
    setStatus('idle'); setErrorMsg(null); setTokenDirty(false); setShowToken(false)
    setActiveTab('conexion')
  }

  const isConnected = status === 'connected'

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-pink-400 via-fuchsia-500 to-purple-600" />
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 flex items-center justify-center shadow-md shadow-pink-200 flex-shrink-0 text-white">
              <IgIcon size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Instagram / Facebook</h3>
              <p className="text-xs text-gray-500">Meta Graph API v19.0{isConnected && config.accountName ? ` · ${config.accountName}` : ''}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            status === 'error' ? 'bg-red-50 text-red-600 border-red-200' :
            'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
            {isConnected ? 'Conectado' : status === 'error' ? 'Error' : 'Sin conectar'}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <IgTabBar active={activeTab} onChange={setActiveTab} locked={!isConnected} />

      {/* Tab content */}
      {activeTab === 'conexion' && (
        <ConnectionTab
          config={config} status={status} tokenInput={tokenInput} appIdInput={appIdInput}
          showToken={showToken} copied={copied} errorMsg={errorMsg} tokenDirty={tokenDirty}
          setTokenInput={setTokenInput} setAppIdInput={setAppIdInput}
          setShowToken={setShowToken} setErrorMsg={setErrorMsg}
          setTokenDirty={setTokenDirty} setStatus={setStatus}
          onVerify={handleVerify} onDisconnect={handleDisconnect}
          onCopy={() => { navigator.clipboard.writeText(config.accessToken); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        />
      )}
      {activeTab === 'analisis'    && <AnalyticsTab />}
      {activeTab === 'sugerencias' && <SuggestionsTab />}
      {activeTab === 'publicar'    && <PublishTab accountName={config.accountName} />}

      {/* Other platforms */}
      {activeTab === 'conexion' && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Próximamente</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'LinkedIn API', color: 'from-sky-400 to-sky-600' },
              { name: 'TikTok for Business', color: 'from-gray-700 to-gray-900' },
            ].map(p => (
              <div key={p.name} className="card p-4 opacity-50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                    <Plug size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{p.name}</p>
                    <span className="badge bg-gray-100 text-gray-500 text-xs">Próximamente</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── General Section ──────────────────────────────────────────────────────────
function GeneralSection() {
  const [form, setForm] = useState<AgencyConfig>(() => {
    try { return JSON.parse(localStorage.getItem(AGENCY_KEY) || 'null') ?? defaultAgency }
    catch { return defaultAgency }
  })
  const [saved, setSaved] = useState(false)
  const set = (k: keyof AgencyConfig, v: string) => setForm(f => ({ ...f, [k]: v }))
  const save = () => { localStorage.setItem(AGENCY_KEY, JSON.stringify(form)); setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <div className="card p-6 space-y-5">
      <h3 className="section-title">Información de la agencia</h3>
      <div className="grid grid-cols-2 gap-5">
        <div><label className="label">Nombre de la agencia</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div><label className="label">Email de contacto</label><input className="input" type="email" placeholder="hola@miagencia.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div>
          <label className="label">Sitio web</label>
          <div className="relative"><Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8" placeholder="https://miagencia.com" value={form.website} onChange={e => set('website', e.target.value)} /></div>
        </div>
        <div><label className="label">Moneda</label>
          <select className="select" value={form.currency} onChange={e => set('currency', e.target.value)}>
            {['EUR','USD','MXN','COP','ARS'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="label">Zona horaria</label>
          <select className="select" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
            {['Europe/Madrid','America/Mexico_City','America/Bogota','America/Buenos_Aires','America/New_York'].map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div><label className="label">Idioma</label>
          <select className="select" value={form.language} onChange={e => set('language', e.target.value)}>
            <option value="es">Español</option><option value="en">English</option><option value="pt">Português</option>
          </select>
        </div>
      </div>
      <button className={`btn-primary ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`} onClick={save}>
        {saved ? <><Check size={15}/> Guardado</> : 'Guardar cambios'}
      </button>
    </div>
  )
}

// ─── Security Section ─────────────────────────────────────────────────────────
function SecuritySection() {
  const tips = [
    { icon: <RefreshCw size={15}/>, title: 'Rota tus tokens regularmente', desc: 'Renueva el Access Token cada 60 días como máximo.' },
    { icon: <Lock size={15}/>, title: 'No expongas tokens en URLs', desc: 'Usa siempre variables de entorno o almacenamiento seguro.' },
    { icon: <ShieldCheck size={15}/>, title: 'Permisos mínimos necesarios', desc: 'Solicita solo los permisos que realmente necesitas.' },
    { icon: <AlertTriangle size={15}/>, title: 'localStorage no está cifrado', desc: 'En producción, gestiona credenciales desde un backend seguro.' },
  ]
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="section-title mb-5">Buenas prácticas de seguridad</h3>
        <div className="grid grid-cols-2 gap-4">
          {tips.map((t, i) => (
            <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">{t.icon}</div>
              <div><p className="text-sm font-medium text-gray-800 mb-0.5">{t.title}</p><p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Datos almacenados localmente</h3>
        <div className="space-y-2">
          {[
            { key: STORAGE_KEY, label: 'Configuración Instagram / Meta', sensitive: true },
            { key: AGENCY_KEY, label: 'Datos de la agencia', sensitive: false },
          ].map(item => {
            const exists = Boolean(localStorage.getItem(item.key))
            return (
              <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${exists ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-700">{item.label}</span>
                  {item.sensitive && <span className="badge bg-amber-100 text-amber-700 text-xs">Sensible</span>}
                </div>
                {exists && (
                  <button className="text-xs text-red-500 hover:text-red-700 font-medium" onClick={() => { localStorage.removeItem(item.key); window.location.reload() }}>Borrar</button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── BillingSection ───────────────────────────────────────────────────────────
function BillingSection() {
  const { subscription, isActive, isLoading, subscribe, openPortal, cancel, reactivate } = useSubscription()
  const [canceling, setCanceling]     = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirmCancel) { setConfirmCancel(true); return }
    setCanceling(true)
    try { await cancel() } finally { setCanceling(false); setConfirmCancel(false) }
  }
  const handleReactivate = async () => {
    setReactivating(true)
    try { await reactivate() } finally { setReactivating(false) }
  }
  const handleSubscribe = async () => {
    setSubscribing(true)
    try { await subscribe() } catch { setSubscribing(false) }
  }
  const handlePortal = async () => {
    setPortalLoading(true)
    try { await openPortal() } catch { setPortalLoading(false) }
  }

  const statusLabel: Record<string, { label: string; cls: string }> = {
    active:             { label: 'Activa',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    trialing:           { label: 'Prueba gratuita',  cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    canceled:           { label: 'Cancelada',        cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    past_due:           { label: 'Pago vencido',     cls: 'bg-red-50 text-red-700 border-red-200' },
    incomplete:         { label: 'Incompleta',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    incomplete_expired: { label: 'Expirada',         cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    unpaid:             { label: 'Sin pago',         cls: 'bg-red-50 text-red-700 border-red-200' },
    paused:             { label: 'Pausada',          cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-indigo-400" />
    </div>
  )

  if (!subscription) return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl gradient-indigo flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200">
            <Crown size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Sin suscripción activa</h2>
          <p className="text-gray-500 mb-7 max-w-sm mx-auto leading-relaxed">
            Suscríbete a AgencyOS Pro para acceder a todas las herramientas. 14 días de prueba gratuita incluidos.
          </p>
          <div className="flex items-end justify-center gap-1 mb-6">
            <span className="text-5xl font-black text-gray-900">$49</span>
            <span className="text-gray-400 text-lg mb-1.5">/mes</span>
          </div>
          <button className="btn-primary py-3.5 px-10 text-base font-semibold" onClick={handleSubscribe} disabled={subscribing}>
            {subscribing ? <><Loader2 size={16} className="animate-spin" /> Redirigiendo...</> : <><Sparkles size={16} /> Empezar prueba gratuita</>}
          </button>
          <p className="text-xs text-gray-400 mt-3">Cancela cuando quieras · Pago seguro con Stripe</p>
        </div>
      </div>
    </div>
  )

  const status = statusLabel[subscription.status] ?? { label: subscription.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
  const periodEnd = new Date(subscription.currentPeriodEnd)
  const trialEnd  = subscription.trialEnd ? new Date(subscription.trialEnd) : null

  return (
    <div className="space-y-5">
      {/* Plan card */}
      <div className="card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl gradient-indigo flex items-center justify-center shadow-md shadow-indigo-200">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">AgencyOS</p>
                <h3 className="text-lg font-black text-gray-900">Plan Pro</h3>
              </div>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${status.cls}`}>
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Precio</p>
              <p className="text-xl font-black text-gray-900">$49<span className="text-sm font-normal text-gray-400">/mes</span></p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">
                {subscription.cancelAtPeriodEnd ? 'Acceso hasta' : subscription.status === 'trialing' ? 'Trial hasta' : 'Próximo cobro'}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {(trialEnd && subscription.status === 'trialing' ? trialEnd : periodEnd)
                  .toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Cancel-at-period-end warning */}
          {subscription.cancelAtPeriodEnd && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Tu suscripción se cancelará el {periodEnd.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}</p>
                <p className="text-xs text-amber-600 mt-0.5">Después de esta fecha perderás el acceso a todas las herramientas Pro.</p>
              </div>
            </div>
          )}

          {/* Past-due warning */}
          {subscription.status === 'past_due' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Hay un problema con tu pago</p>
                <p className="text-xs text-red-600 mt-0.5">Actualiza tu método de pago para mantener el acceso.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn-secondary flex-1 justify-center py-2.5" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading ? <><Loader2 size={15} className="animate-spin" /> Abriendo...</> : <><CreditCard size={15} /> Gestionar suscripción</>}
            </button>
            {isActive && (
              subscription.cancelAtPeriodEnd ? (
                <button className="btn-primary flex-1 justify-center py-2.5" onClick={handleReactivate} disabled={reactivating}>
                  {reactivating ? <><Loader2 size={15} className="animate-spin" /> Reactivando...</> : <><Zap size={15} /> Reactivar plan</>}
                </button>
              ) : (
                <button
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    confirmCancel
                      ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                      : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50'
                  }`}
                  onClick={handleCancel}
                  disabled={canceling}
                >
                  {canceling
                    ? <><Loader2 size={15} className="animate-spin" /> Cancelando...</>
                    : confirmCancel
                    ? <><XCircle size={15} /> Confirmar cancelación</>
                    : <><XCircle size={15} /> Cancelar plan</>
                  }
                </button>
              )
            )}
          </div>
          {confirmCancel && !canceling && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Haz clic de nuevo para confirmar · <button className="text-indigo-500 font-medium" onClick={() => setConfirmCancel(false)}>Cancelar</button>
            </p>
          )}
        </div>
      </div>

      {/* Features included */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Sparkles size={16} className="text-indigo-500" /> Incluido en tu plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Generador de contenido IA ilimitado',
            'Calendario de publicación inteligente',
            'Calculadora de presupuestos profesional',
            'Analizador de competencia en tiempo real',
            'Publicación directa en Instagram',
            'Plantilla de briefing para clientes',
            'Soporte prioritario',
            'Actualizaciones incluidas',
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 py-1">
              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SectionNav ───────────────────────────────────────────────────────────────
function SectionNav({ active, onChange }: { active: SettingsSection; onChange: (s: SettingsSection) => void }) {
  const items: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: 'general',        label: 'General',        icon: <Building2 size={16}/> },
    { id: 'integraciones',  label: 'Integraciones',  icon: <Plug size={16}/> },
    { id: 'seguridad',      label: 'Seguridad',      icon: <ShieldCheck size={16}/> },
    { id: 'facturacion',    label: 'Facturación',    icon: <CreditCard size={16}/> },
  ]
  return (
    <nav className="space-y-1">
      {items.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
            active === item.id ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
          }`}>
          {item.icon}{item.label}
        </button>
      ))}
    </nav>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const [section, setSection] = useState<SettingsSection>('integraciones')
  const subtitles: Record<SettingsSection, string> = {
    general: 'Configura los datos de tu agencia',
    integraciones: 'Conecta y gestiona tus redes sociales',
    seguridad: 'Gestiona la seguridad de tus credenciales',
    facturacion: 'Gestiona tu plan y métodos de pago',
  }
  return (
    <div className="flex-1">
      <Header title="Configuración" subtitle={subtitles[section]} />
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="card p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3 mt-1">Ajustes</p>
              <SectionNav active={section} onChange={setSection} />
            </div>
          </div>
          <div className="col-span-9">
            {section === 'general'       && <GeneralSection />}
            {section === 'integraciones' && <InstagramPanel />}
            {section === 'seguridad'     && <SecuritySection />}
            {section === 'facturacion'   && <BillingSection />}
          </div>
        </div>
      </div>
    </div>
  )
}
