import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Rocket, ArrowRight, Zap, Crown, Loader2,
  TrendingUp, LayoutGrid, Clock, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { getCampaigns, type SavedCampaign } from '../lib/campaignsApi'

const TOKEN_KEY = 'agencyos_token'
const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#818cf8', '#7c3aed']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'ahora mismo'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

function nicheData(campaigns: SavedCampaign[]) {
  const counts = campaigns.reduce<Record<string, number>>((acc, c) => {
    const key = c.niche?.trim() || 'Sin nicho'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  return Object.entries(counts)
    .map(([niche, count]) => ({ niche, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-bold">{payload[0].payload.niche}</p>
      <p className="text-indigo-300 mt-0.5">{payload[0].value} campaña{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── UpgradeBanner ────────────────────────────────────────────────────────────
function UpgradeBanner() {
  const { subscribe } = useSubscription()
  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
            <Zap size={11} /> 14 días gratis
          </span>
          <h2 className="text-2xl font-black text-white leading-tight">
            Activa tu acceso al<br />Generador de Campañas
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
            Genera campañas completas para Meta Ads y TikTok en minutos. Hooks, copies, creativos y estructura lista para lanzar.
          </p>
          <button
            onClick={() => subscribe().catch(() => {})}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
          >
            <Zap size={15} /> Suscribirse por $49/mes
          </button>
        </div>
        <div className="hidden lg:block text-6xl font-black text-indigo-500/10 select-none">$49</div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }                                   = useAuth()
  const { isActive, isLoading: subLoading, subscription } = useSubscription()

  const [campaigns, setCampaigns]   = useState<SavedCampaign[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setDataLoading(false); return }
    getCampaigns(token)
      .then(setCampaigns)
      .catch(() => {})
      .finally(() => setDataLoading(false))
  }, [])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  const total       = campaigns.length
  const uniqueNiches = new Set(campaigns.map(c => c.niche?.trim()).filter(Boolean)).size
  const lastCampaign = campaigns.length
    ? campaigns.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null
  const chartData = nicheData(campaigns)
  const recent    = campaigns
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5">
        <p className="text-zinc-500 text-sm">{greeting},</p>
        <h1 className="text-2xl font-black text-white mt-0.5">
          {user?.name?.split(' ')[0] ?? 'usuario'} 👋
        </h1>
      </div>

      <div className="p-8 space-y-6 flex-1">

        {/* Subscription status */}
        {subLoading ? (
          <div className="rounded-2xl border border-white/5 bg-zinc-900 p-8 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-indigo-400" />
          </div>
        ) : isActive ? (
          <div className="rounded-2xl bg-indigo-500 p-6 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown size={14} className="text-indigo-200" />
                  <span className="text-indigo-200 text-sm font-medium">AgencyOS Pro — Activo</span>
                </div>
                <p className="text-white font-bold text-lg">Sistema completo desbloqueado</p>
                {subscription?.cancelAtPeriodEnd && (
                  <p className="text-indigo-200 text-xs mt-1">
                    Cancela el {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </p>
                )}
              </div>
              <Link
                to="/campaigns"
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-white/20"
              >
                Generar campaña <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <UpgradeBanner />
        )}

        {/* Welcome banner — solo para usuarios sin campañas */}
        {!dataLoading && total === 0 && (
          <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-950/60 via-zinc-900 to-zinc-900 p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <p className="text-2xl font-black text-white">
                  👋 Bienvenido a AgencyOS
                </p>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                  Genera tu primera campaña en 3 minutos — introduce un producto o tienda Shopify y el sistema hace el resto.
                </p>
              </div>
              <Link
                to="/campaigns"
                className="flex-shrink-0 flex items-center gap-2.5 px-7 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 text-sm"
              >
                <Rocket size={16} /> Generar mi primera campaña
              </Link>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {dataLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-zinc-900 p-5 flex items-center justify-center h-24">
                <Loader2 size={16} className="animate-spin text-zinc-600" />
              </div>
            ))
          ) : (
            <>
              <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                    <TrendingUp size={13} className="text-indigo-400" />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Campañas totales</span>
                </div>
                <p className="text-3xl font-black text-white">{total}</p>
                <p className="text-xs text-zinc-600 mt-1">guardadas en tu cuenta</p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                    <LayoutGrid size={13} className="text-violet-400" />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Nichos trabajados</span>
                </div>
                <p className="text-3xl font-black text-white">{uniqueNiches}</p>
                <p className="text-xs text-zinc-600 mt-1">sectores distintos</p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Clock size={13} className="text-purple-400" />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Última campaña</span>
                </div>
                <p className="text-3xl font-black text-white">
                  {lastCampaign ? timeAgo(lastCampaign.createdAt) : '—'}
                </p>
                <p className="text-xs text-zinc-600 mt-1 truncate">
                  {lastCampaign?.name ?? 'Sin campañas aún'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Analytics grid: chart + recent */}
        <div className="grid lg:grid-cols-5 gap-4">

          {/* Bar chart — nichos */}
          <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-bold text-white">Campañas por nicho</p>
                <p className="text-xs text-zinc-500 mt-0.5">Top nichos generados</p>
              </div>
              <Link to="/historial" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                Ver todas <ChevronRight size={12} />
              </Link>
            </div>

            {dataLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-zinc-600" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <LayoutGrid size={18} className="text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-500">Aún no hay campañas guardadas</p>
                <Link to="/campaigns" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Genera tu primera campaña →
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
                  <XAxis
                    dataKey="niche"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v}
                  />
                  <YAxis
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recent campaigns */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-white">Recientes</p>
                <p className="text-xs text-zinc-500 mt-0.5">Últimas generadas</p>
              </div>
              <Link to="/historial" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                Ver todas <ChevronRight size={12} />
              </Link>
            </div>

            {dataLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-zinc-800/50 animate-pulse" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center gap-2">
                <Rocket size={22} className="text-zinc-700" />
                <p className="text-sm text-zinc-500">Sin campañas aún</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                      <Rocket size={13} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{c.niche}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 flex-shrink-0">{timeAgo(c.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main CTA card */}
        <Link
          to="/campaigns"
          className="block rounded-2xl border border-white/5 bg-zinc-900 hover:bg-zinc-800/80 hover:border-indigo-500/30 transition-all p-8 group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                <Rocket size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Generador de Campañas</h2>
                <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed max-w-lg">
                  Introduce una tienda o producto. El sistema analiza el ángulo de venta, el cliente ideal y genera campañas completas listas para Meta Ads y TikTok.
                </p>
              </div>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold group-hover:gap-3 transition-all">
                Generar ahora <ArrowRight size={15} />
              </div>
            </div>
            <div className="hidden lg:flex flex-col gap-2 text-right">
              {['Copies Meta Ads', 'Hooks virales', 'Ideas de creativos', 'Estructura de campaña', 'Segmentación'].map(f => (
                <span key={f} className="text-xs text-zinc-600 group-hover:text-zinc-500 transition-colors">{f}</span>
              ))}
            </div>
          </div>
        </Link>

      </div>
    </div>
  )
}
