import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Rocket, BarChart2, Layers, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const STEPS = [
  {
    icon: Rocket,
    color: 'from-indigo-500 to-violet-600',
    title: 'Genera campañas completas en segundos',
    description: 'Describe tu producto, elige nicho y objetivo. La IA generará 15 variaciones de copy con diferentes tonos (urgente, emocional, racional…), hooks y guiones de vídeo listos para lanzar.',
    cta: 'Entendido',
    highlights: ['15 variaciones de copy', 'Hooks para captar atención', 'Guiones UGC y Before/After'],
  },
  {
    icon: BarChart2,
    color: 'from-violet-500 to-purple-600',
    title: 'Analiza tus campañas de Meta',
    description: 'Sube el CSV exportado desde Meta Ads Manager y obtén en segundos: qué campañas funcionan, qué métricas están por debajo del benchmark y recomendaciones concretas para presentar al cliente.',
    cta: 'Siguiente',
    highlights: ['Análisis de CTR, CPC, ROAS', 'Campañas ganadoras vs perdedoras', 'Resumen ejecutivo para el cliente'],
  },
  {
    icon: Layers,
    color: 'from-purple-500 to-fuchsia-600',
    title: 'Frameworks estratégicos de crecimiento',
    description: 'Accede a 5 frameworks potentes: análisis de mercado, mapa de competencia, plan de distribución, generador de contenido viral y roadmap de escalado. Todo con IA aplicada a tu negocio.',
    cta: 'Siguiente',
    highlights: ['Análisis de mercado', 'Estrategia de contenido viral', 'Roadmap de escalado'],
  },
  {
    icon: CheckCircle2,
    color: 'from-emerald-500 to-teal-600',
    title: '¡Todo listo para empezar!',
    description: 'Tienes una campaña gratuita esperándote. Sin tarjeta de crédito. Lanza tu primera campaña ahora y descubre el nivel de detalle que la IA puede generar para tu producto.',
    cta: 'Generar mi primera campaña',
    highlights: ['1 campaña gratis incluida', 'Sin tarjeta de crédito', 'Resultados en menos de 2 minutos'],
    isFinal: true,
  },
]

interface Props {
  onClose: () => void
}

export default function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const navigate        = useNavigate()
  const { markOnboardingDone } = useAuth()
  const current         = STEPS[step]
  const Icon            = current.icon
  const isFinal         = 'isFinal' in current && current.isFinal === true

  function advance() {
    if (isFinal) {
      markOnboardingDone()
      onClose()
      navigate('/dashboard')
    } else {
      setStep(s => s + 1)
    }
  }

  function skip() {
    markOnboardingDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Skip */}
        {!isFinal && (
          <button
            onClick={skip}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* Header gradient */}
        <div className={`h-2 w-full bg-gradient-to-r ${current.color}`} />

        {/* Step progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-5 pb-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === step ? 'w-6 h-1.5 bg-indigo-400' : i < step ? 'w-1.5 h-1.5 bg-indigo-600' : 'w-1.5 h-1.5 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${current.color} mb-5 shadow-lg`}>
            <Icon size={26} className="text-white" />
          </div>

          <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">{current.description}</p>

          {/* Highlights */}
          <ul className="space-y-2 mb-6">
            {current.highlights.map(h => (
              <li key={h} className="flex items-center gap-2.5 text-sm text-zinc-300">
                <CheckCircle2 size={14} className="text-indigo-400 flex-shrink-0" />
                {h}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={advance}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white text-sm transition-all bg-gradient-to-r ${current.color} hover:opacity-90 shadow-lg`}
          >
            {current.cta}
            {!isFinal && <ArrowRight size={15} />}
          </button>

          {/* Skip link */}
          {!isFinal && (
            <button onClick={skip} className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-3">
              Saltar tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
