import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Rocket, TrendingUp, Target, Clock,
  Calendar, Loader2, ChevronRight, Lightbulb, Sparkles,
} from 'lucide-react'
import { InfoTooltip } from '../components/InfoTooltip'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'
import { getCampaigns, type SavedCampaign } from '../lib/campaignsApi'
import OnboardingModal from '../components/OnboardingModal'

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEKLY_GOAL = 5

const MOTIVATIONAL = [
  'El mejor anuncio es el que se lanza — el perfecto nunca sale.',       // lun
  'Un hook fuerte supera a un presupuesto grande. Siempre.',             // mar
  'Testa rápido, escala lo que funciona, mata lo que no.',               // mié
  'Tu cliente ideal ya existe. Tu trabajo es encontrarle con el mensaje correcto.', // jue
  'La consistencia en Meta Ads gana a la creatividad esporádica.',       // vie
  'Cada campaña que no lanzas es dinero que deja de entrar.',            // sáb
  'Los datos no mienten. Las suposiciones sí.',                          // dom
]

const NICHE_LABELS: Record<string, string> = {
  ropa: 'Moda', calzado: 'Calzado', belleza: 'Belleza',
  fitness: 'Fitness', hogar: 'Hogar', tecnologia: 'Tech',
  alimentacion: 'Food', joyeria: 'Joyería', mascotas: 'Mascotas', deportes: 'Deportes',
}

const NICHE_COLORS: Record<string, string> = {
  ropa: '#6C63FF', calzado: '#818CF8', belleza: '#F472B6',
  fitness: '#EF9F27', hogar: '#4ECFA0', tecnologia: '#4ECFA0',
  alimentacion: '#F97316', joyeria: '#F59E0B', mascotas: '#34D399', deportes: '#EF9F27',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

const GRADIENTS = [
  'from-indigo-500 to-violet-600', 'from-violet-500 to-purple-600',
  'from-purple-500 to-fuchsia-600', 'from-sky-500 to-indigo-600',
]

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function formatRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 3600000
  if (diff < 1)  return 'Hace menos de 1h'
  if (diff < 24) return `Hace ${Math.floor(diff)}h`
  if (diff < 48) return 'Ayer'
  return `Hace ${Math.floor(diff / 24)} días`
}

function buildWeeklyData(campaigns: SavedCampaign[]) {
  const now = new Date()
  const weeks: { week: string; count: number; weekNum: number }[] = []

  for (let i = 4; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const wk = getISOWeek(d)
    const label = i === 0 ? 'Esta sem' : i === 1 ? 'S. pasada' : `S${wk}`
    weeks.push({ week: label, count: 0, weekNum: wk })
  }

  campaigns.forEach(c => {
    const wk = getISOWeek(new Date(c.createdAt))
    const slot = weeks.find(w => w.weekNum === wk)
    if (slot) slot.count++
  })

  return weeks.map(({ week, count }) => ({ week, count }))
}

function buildNicheData(campaigns: SavedCampaign[]) {
  const counts: Record<string, number> = {}
  campaigns.forEach(c => { counts[c.niche] = (counts[c.niche] ?? 0) + 1 })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([niche, count]) => ({
      niche: NICHE_LABELS[niche] ?? niche,
      count,
      color: NICHE_COLORS[niche] ?? '#888',
    }))
}

function thisWeekCount(campaigns: SavedCampaign[]): number {
  const now = new Date()
  const thisWeek = getISOWeek(now)
  return campaigns.filter(c => getISOWeek(new Date(c.createdAt)) === thisWeek).length
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, sub, info }: {
  label: string; value: string; icon: React.ElementType; sub?: string; info: string
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <Icon size={19} className="text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-black text-white leading-none">{value}</p>
        <p className="text-xs text-zinc-500 mt-1 leading-tight">{label}</p>
        {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
      <InfoTooltip text={info} />
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">{label}</p>
      <p className="text-white font-bold">{payload[0].value} campaña{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { user, token, isLoading } = useAuth()
  const { subscription, isActive } = useSubscription()
  const navigate = useNavigate()

  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([])
  const [tip, setTip]             = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const motivational = MOTIVATIONAL[new Date().getDay()]
  const initials     = user ? getInitials(user.name) : 'AG'
  const gradient     = GRADIENTS[(user?.name?.charCodeAt(0) ?? 0) % GRADIENTS.length]
  const firstName    = user?.name?.split(' ')[0] ?? 'usuario'

  useEffect(() => {
    if (!token) return
    Promise.all([
      getCampaigns(token),
      fetch('/api/home/tip', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => d.data?.tip ?? null).catch(() => null),
    ]).then(([camps, dailyTip]) => {
      setCampaigns(camps)
      setTip(dailyTip)
    }).catch(() => {}).finally(() => setLoadingData(false))
  }, [token])

  useEffect(() => {
    if (!isLoading && user && user.onboardingDone === false) {
      setShowOnboarding(true)
    }
  }, [isLoading, user])

  function handleOnboardingClose() {
    setShowOnboarding(false)
  }

  const weeklyData = useMemo(() => buildWeeklyData(campaigns), [campaigns])
  const nicheData  = useMemo(() => buildNicheData(campaigns),  [campaigns])
  const weekCount  = useMemo(() => thisWeekCount(campaigns),   [campaigns])

  const topNiche    = nicheData[0]
  const lastCampaign = campaigns.length > 0
    ? formatRelative(campaigns[0].createdAt)
    : null

  // Subscription countdown
  const daysLeft = (() => {
    if (!subscription?.currentPeriodEnd) return null
    const diff = new Date(subscription.currentPeriodEnd).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  })()
  const totalDays = 30
  const subProgress = daysLeft !== null ? Math.min(100, Math.round((daysLeft / totalDays) * 100)) : 0

  const last3 = campaigns.slice(0, 3)

  if (loadingData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <Loader2 size={22} className="animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950">

      {showOnboarding && (
        <OnboardingModal onClose={handleOnboardingClose} />
      )}

      {/* ── 0. Banner oferta lanzamiento (solo trial) ─────────────────────── */}
      {subscription?.status === 'trialing' && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-indigo-600/30 via-violet-600/20 to-indigo-600/30 border-b border-indigo-500/30">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={14} className="text-indigo-400 flex-shrink-0" />
            <p className="text-xs text-indigo-200 truncate">
              <span className="font-bold">🎉 Oferta de lanzamiento · 50% de descuento en tu primer mes</span>
              <span className="hidden sm:inline text-indigo-300/80"> · Usa el código <strong className="text-white">LANZAMIENTO50</strong> al contratar</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/settings?tab=facturacion')}
            className="flex-shrink-0 px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-colors whitespace-nowrap"
          >
            Ver planes
          </button>
        </div>
      )}

      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-5 md:px-8 md:py-7 border-b border-zinc-800/70 flex items-center justify-between gap-4">
        <div>
          <p className="text-zinc-500 text-sm">Panel principal</p>
          <h1 className="text-2xl font-black text-white mt-0.5 flex items-center gap-2">
            Hola, {firstName} <Zap size={20} className="text-indigo-400" />
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Zap size={14} /> Generar campaña
          </button>
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <span className="text-sm font-black text-white">{initials}</span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-8 flex-1">

        {/* ── 2. Hero activación (0 campañas) o mensaje motivador ──────────── */}
        {campaigns.length === 0 ? (
          <div
            onClick={() => navigate('/dashboard')}
            className="cursor-pointer flex flex-col sm:flex-row items-center gap-5 px-6 py-6 rounded-2xl bg-gradient-to-r from-indigo-600/20 via-violet-600/10 to-indigo-600/20 border border-indigo-500/30 hover:border-indigo-400/50 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/30 transition-colors">
              <Rocket size={26} className="text-indigo-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-white font-black text-lg leading-tight">Genera tu primera campaña</p>
              <p className="text-zinc-400 text-sm mt-1">Es el primer paso para ver el valor de AgenciesOS. Solo tarda 2 minutos.</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 group-hover:bg-indigo-400 text-white text-sm font-bold transition-colors whitespace-nowrap">
              <Zap size={14} /> Empezar ahora
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-indigo-500/8 border border-indigo-500/20">
            <Zap size={15} className="text-indigo-400 flex-shrink-0" />
            <p className="text-sm text-zinc-300 leading-relaxed">{motivational}</p>
          </div>
        )}

        {/* ── 3. Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Rocket}
            label="Campañas guardadas"
            value={String(campaigns.length)}
            info="Total de campañas generadas y guardadas en tu cuenta."
          />
          <StatCard
            icon={Target}
            label="Nicho más usado"
            value={topNiche ? (NICHE_LABELS[topNiche.niche] ?? topNiche.niche) : '—'}
            sub={topNiche ? `${topNiche.count} campaña${topNiche.count !== 1 ? 's' : ''}` : undefined}
            info="El nicho de producto para el que más has creado campañas."
          />
          <StatCard
            icon={Clock}
            label="Última campaña"
            value={lastCampaign ?? '—'}
            info="Tiempo transcurrido desde la última campaña generada."
          />
        </div>

        {/* ── 4. Gráficos ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Campañas por semana */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Campañas por semana</p>
              <InfoTooltip text="Evolución del número de campañas generadas en las últimas 5 semanas." />
            </div>
            {weeklyData.every(w => w.count === 0) ? (
              <div className="h-32 flex items-center justify-center text-zinc-700 text-sm">
                Sin datos aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weeklyData} barSize={22}>
                  <XAxis dataKey="week" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {weeklyData.map((_, i) => (
                      <Cell key={i} fill={i === weeklyData.length - 1 ? '#6366f1' : '#3f3f46'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Nichos usados */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nichos usados</p>
              <InfoTooltip text="Distribución de tus campañas guardadas por sector o nicho de producto." />
            </div>
            {nicheData.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-zinc-700 text-sm">
                Sin datos aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={nicheData} layout="vertical" barSize={14}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="niche" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={62} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {nicheData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── 5. Tres bloques ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Suscripción */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-zinc-500" />
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Suscripción</p>
              </div>
              <InfoTooltip text="Estado de tu plan actual y días restantes hasta la próxima renovación." />
            </div>
            {daysLeft !== null && isActive ? (
              <>
                <div>
                  <p className="text-3xl font-black text-white leading-none">{daysLeft}</p>
                  <p className="text-xs text-zinc-500 mt-1">días restantes</p>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${subProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-600">
                  Renueva el {new Date(subscription!.currentPeriodEnd).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </p>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-between gap-2">
                <p className="text-[11px] text-zinc-500 font-medium">Elige tu plan</p>
                <div className="space-y-1.5">
                  {[
                    { name: 'Starter',    price: '€49,99' },
                    { name: 'Pro',        price: '€129,99', highlight: true },
                    { name: 'Enterprise', price: '€259,99' },
                  ].map(p => (
                    <div key={p.name} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${p.highlight ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-zinc-800/60'}`}>
                      <span className={`text-[11px] font-semibold ${p.highlight ? 'text-indigo-300' : 'text-zinc-400'}`}>{p.name}</span>
                      <span className={`text-[11px] font-black ${p.highlight ? 'text-indigo-300' : 'text-zinc-500'}`}>{p.price}<span className="font-normal text-[9px] ml-0.5">/mes</span></span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/settings?tab=facturacion')}
                  className="mt-1 w-full py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-bold transition-colors"
                >
                  Ver planes →
                </button>
              </div>
            )}
          </div>

          {/* Consejo del día */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-400" />
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Consejo del día</p>
              </div>
              <InfoTooltip text="Tip de marketing generado por IA. Se actualiza automáticamente cada día." />
            </div>
            {tip ? (
              <p className="text-sm text-zinc-300 leading-relaxed flex-1">{tip}</p>
            ) : (
              <div className="flex-1 flex items-center">
                <Loader2 size={14} className="animate-spin text-zinc-600" />
              </div>
            )}
            <p className="text-[10px] text-zinc-700">Generado con IA · se renueva cada día</p>
          </div>

          {/* Meta semanal */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-400" />
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Meta semanal</p>
              </div>
              <InfoTooltip text="Objetivo de campañas a generar cada semana. El contador se reinicia cada lunes." />
            </div>
            <div>
              <p className="text-3xl font-black text-white leading-none">
                {weekCount}
                <span className="text-base font-semibold text-zinc-600"> / {WEEKLY_GOAL}</span>
              </p>
              <p className="text-xs text-zinc-500 mt-1">campañas esta semana</p>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${weekCount >= WEEKLY_GOAL ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(100, (weekCount / WEEKLY_GOAL) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-600">
              {weekCount >= WEEKLY_GOAL
                ? '¡Meta conseguida esta semana!'
                : `${WEEKLY_GOAL - weekCount} campaña${WEEKLY_GOAL - weekCount !== 1 ? 's' : ''} para llegar al objetivo`}
            </p>
          </div>
        </div>

        {/* ── 6. Últimas 3 campañas ─────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
            Últimas campañas guardadas
          </p>
          {last3.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="text-sm text-zinc-600">Todavía no tienes campañas guardadas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {last3.map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate('/historial')}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all cursor-pointer group"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: NICHE_COLORS[c.niche] ?? '#888' }}
                  />
                  <p className="text-sm font-semibold text-white flex-1 truncate">{c.name}</p>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${NICHE_COLORS[c.niche] ?? '#888'}22`, color: NICHE_COLORS[c.niche] ?? '#888' }}
                  >
                    {NICHE_LABELS[c.niche] ?? c.niche}
                  </span>
                  <span className="text-[10px] text-zinc-600 flex-shrink-0">{formatRelative(c.createdAt)}</span>
                  <ChevronRight size={13} className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 7. CTA (solo si ya tiene campañas) ────────────────────────────── */}
        {campaigns.length > 0 && (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-base transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Zap size={18} /> Generar nueva campaña
          </button>
        )}

      </div>
    </div>
  )
}
