import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, ArrowRight, CheckCircle2, Zap,
  ShoppingBag, MapPin, Laptop, UtensilsCrossed, Home, Layers,
  BarChart2, FileText, Timer, Rocket,
} from 'lucide-react'
import { useAuth, type OnboardingSettings } from '../contexts/AuthContext'

// ─── Config ───────────────────────────────────────────────────────────────────
const CLIENT_TYPES = [
  { value: 'ecommerce',   label: 'E-commerce',        Icon: ShoppingBag },
  { value: 'local',       label: 'Servicios locales',  Icon: MapPin },
  { value: 'saas',        label: 'SaaS / Apps',        Icon: Laptop },
  { value: 'hospitality', label: 'Hostelería',          Icon: UtensilsCrossed },
  { value: 'realestate',  label: 'Inmobiliaria',        Icon: Home },
  { value: 'other',       label: 'Varios / Otro',       Icon: Layers },
] as const

const PRIMARY_GOALS = [
  { value: 'campaigns', label: 'Generar campañas con IA', desc: 'Copy, hooks y guiones en segundos',           Icon: Zap },
  { value: 'meta',      label: 'Analizar Meta Ads',       desc: 'Diagnóstico de tu cuenta al instante',        Icon: BarChart2 },
  { value: 'briefings', label: 'Gestionar briefings',     desc: 'Documentos profesionales para clientes',      Icon: FileText },
  { value: 'time',      label: 'Ahorrar tiempo',          desc: 'Automatizar tareas repetitivas',              Icon: Timer },
] as const

const GOAL_VALUE: Record<string, { title: string; stat: string; points: [string, string] }> = {
  campaigns: {
    title: '15 variaciones de copy listas en 90 segundos',
    stat:  '⚡ De briefing a campaña en 2 min',
    points: ['Hooks, titulares y CTAs para cada formato de anuncio', 'Diferentes tonos: urgente, emocional, racional'],
  },
  meta: {
    title: 'Tu cuenta de Meta Ads bajo el microscopio',
    stat:  '📊 10× más rápido que revisar en Excel',
    points: ['Detección automática de campañas que pierden dinero', 'Benchmarks del sector y recomendaciones concretas'],
  },
  briefings: {
    title: 'Briefings profesionales en minutos, no en horas',
    stat:  '📋 1h de trabajo → 5 minutos',
    points: ['PDF completo con KPIs, entregables y calendario', 'Historial de todos tus clientes en un mismo lugar'],
  },
  time: {
    title: 'Todo en un solo lugar, sin saltar entre herramientas',
    stat:  '⏱ 12h ahorradas por semana',
    points: ['Generador de campañas, análisis y briefings integrados', 'Lo que hacías en 8 apps, ahora en una sola'],
  },
}

const TOTAL_STEPS = 4

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { onClose: () => void }

export default function OnboardingModal({ onClose }: Props) {
  const { markOnboardingDone, user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] ?? 'ahí'

  const [step, setStep]       = useState(0)
  const [agencyName, setAgencyName] = useState('')
  const [clientType, setClientType] = useState('')
  const [primaryGoal, setPrimaryGoal] = useState('')

  const progress = ((step + 1) / TOTAL_STEPS) * 100

  function finish(settings?: OnboardingSettings) {
    markOnboardingDone(settings)
    onClose()
    navigate('/dashboard')
  }

  function skip() {
    finish({})
  }

  const isFinal = step === TOTAL_STEPS - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 w-full bg-zinc-800">
          <div
            className="h-1 bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            Paso {step + 1} de {TOTAL_STEPS}
          </span>
          {!isFinal && (
            <button
              onClick={skip}
              className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-400 transition-colors"
              aria-label="Saltar configuración"
            >
              <X size={13} />
              <span className="text-xs">Saltar</span>
            </button>
          )}
        </div>

        {/* ── STEP 0: Bienvenida + nombre de agencia ─────────────────────────── */}
        {step === 0 && (
          <div className="px-6 pb-7 pt-2 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-full mb-4">
                <Rocket size={11} className="text-indigo-400" />
                <span className="text-[11px] font-bold text-indigo-400 tracking-wide">Configuración inicial</span>
              </div>
              <h2 className="text-[22px] font-black text-white leading-tight">
                ¡Bienvenido, {firstName}! 👋
              </h2>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                Personaliza tu espacio en 60 segundos para sacarle el máximo partido desde el primer día.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                ¿Cómo se llama tu agencia o negocio?
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ej. Social Media Pro, Estudio Vega…"
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agencyName.trim() && setStep(1)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!agencyName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm bg-indigo-500 hover:bg-indigo-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
            >
              Continuar <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── STEP 1: Tipo de clientes ────────────────────────────────────────── */}
        {step === 1 && (
          <div className="px-6 pb-7 pt-2 space-y-5">
            <div>
              <h2 className="text-xl font-black text-white">¿Con qué tipo de clientes trabajas?</h2>
              <p className="text-zinc-500 text-xs mt-1">
                Ajustaremos ejemplos y benchmarks a tu sector
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CLIENT_TYPES.map(({ value, label, Icon }) => {
                const active = clientType === value
                return (
                  <button
                    key={value}
                    onClick={() => setClientType(value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-indigo-500/15 border-indigo-500/50 text-white'
                        : 'bg-zinc-800/70 border-white/8 text-zinc-400 hover:border-white/20 hover:text-zinc-300'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-indigo-400 flex-shrink-0' : 'text-zinc-600 flex-shrink-0'} />
                    <span className="text-xs font-semibold leading-tight">{label}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!clientType}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm bg-indigo-500 hover:bg-indigo-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
            >
              Continuar <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Objetivo principal ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="px-6 pb-7 pt-2 space-y-5">
            <div>
              <h2 className="text-xl font-black text-white">¿Cuál es tu objetivo principal?</h2>
              <p className="text-zinc-500 text-xs mt-1">
                Te mostramos primero lo que más te interesa
              </p>
            </div>

            <div className="space-y-2">
              {PRIMARY_GOALS.map(({ value, label, desc, Icon }) => {
                const active = primaryGoal === value
                return (
                  <button
                    key={value}
                    onClick={() => setPrimaryGoal(value)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-indigo-500/15 border-indigo-500/50'
                        : 'bg-zinc-800/70 border-white/8 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      active ? 'bg-indigo-500/20' : 'bg-zinc-700/60'
                    }`}>
                      <Icon size={14} className={active ? 'text-indigo-400' : 'text-zinc-500'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold ${active ? 'text-white' : 'text-zinc-300'}`}>{label}</p>
                      <p className="text-xs text-zinc-500 truncate">{desc}</p>
                    </div>
                    {active && <CheckCircle2 size={14} className="text-indigo-400 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!primaryGoal}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm bg-indigo-500 hover:bg-indigo-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
            >
              Continuar <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── STEP 3: Value reveal + CTA ──────────────────────────────────────── */}
        {step === 3 && (() => {
          const val  = GOAL_VALUE[primaryGoal] ?? GOAL_VALUE.campaigns
          const name = agencyName.trim() || firstName
          return (
            <div className="px-6 pb-7 pt-2 space-y-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full mb-3">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                  <span className="text-[11px] font-bold text-emerald-400">Listo, {name} 🎉</span>
                </div>
                <h2 className="text-xl font-black text-white leading-snug">{val.title}</h2>
              </div>

              {/* Stat pill */}
              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <span className="text-sm font-black text-indigo-300">{val.stat}</span>
              </div>

              {/* Value points */}
              <ul className="space-y-2.5">
                {val.points.map(p => (
                  <li key={p} className="flex items-start gap-2.5">
                    <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-300 leading-snug">{p}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-300 leading-snug">
                    1 campaña gratis incluida · sin tarjeta de crédito
                  </span>
                </li>
              </ul>

              {/* Final CTA */}
              <button
                onClick={() => finish({ agencyName: agencyName.trim(), clientType, primaryGoal })}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-white text-sm bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Zap size={15} /> Generar mi primera campaña
              </button>

              <p className="text-center text-[11px] text-zinc-600">
                Únete a 500+ agencias que ya usan Agenciesos
              </p>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
