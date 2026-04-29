import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const FEATURES = [
  'Generador de contenido con IA',
  'Calendario de publicación inteligente',
  'Calculadora de presupuestos profesional',
  'Análisis de competencia en tiempo real',
  'Publicación directa en Instagram',
]

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = (location.state as { from?: string })?.from ?? '/home'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Field-level errors
  const [emailErr, setEmailErr] = useState('')
  const [pwErr,    setPwErr]    = useState('')

  function validate(): boolean {
    let ok = true
    setEmailErr(''); setPwErr('')
    if (!email.trim()) { setEmailErr('El email es obligatorio.'); ok = false }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErr('Introduce un email válido.'); ok = false }
    if (!password) { setPwErr('La contraseña es obligatoria.'); ok = false }
    return ok
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setError(null); setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[48%] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 left-1/4 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">Agenciesos</span>
        </div>

        {/* Hero copy */}
        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight">
              La plataforma que tu agencia<br />
              <span className="text-indigo-200">siempre necesitó.</span>
            </h1>
            <p className="mt-4 text-indigo-200 text-lg leading-relaxed">
              Todo lo que necesitas para gestionar clientes, crear contenido y escalar tu agencia — en un solo lugar.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-indigo-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
                <span className="text-sm font-medium">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="relative bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10">
          <p className="text-white/90 text-sm leading-relaxed italic">
            "Agenciesos nos ahorró 12 horas semanales en gestión. El ROI fue inmediato."
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-8 h-8 rounded-full bg-indigo-400/60 flex items-center justify-center">
              <span className="text-xs font-bold text-white">ML</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">María López</p>
              <p className="text-xs text-indigo-300">CEO · Creativa Studio Madrid</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl gradient-indigo flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-xl font-black text-gray-900">Agency<span className="text-indigo-500">OS</span></span>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900">Bienvenido de nuevo</h2>
            <p className="text-gray-500 mt-1.5">Inicia sesión para continuar en tu agencia.</p>
          </div>

          {/* Registered success banner */}
          {location.state && (location.state as { registered?: boolean }).registered && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-5">
              <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-700">¡Cuenta creada! Ya puedes iniciar sesión.</p>
            </div>
          )}

          {/* Global error */}
          {error && (
            <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5">
              <span className="text-red-500 text-lg leading-none mt-0.5">⚠</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email" autoComplete="email" placeholder="tu@agencia.com"
                value={email} onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                className={`input ${emailErr ? 'border-red-300 ring-1 ring-red-200' : ''}`}
              />
              {emailErr && <p className="text-xs text-red-500 mt-1.5">{emailErr}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Contraseña</label>
                <Link to="/forgot-password" className="text-xs text-indigo-500 hover:text-indigo-400 font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="••••••••"
                  value={password} onChange={e => { setPassword(e.target.value); setPwErr('') }}
                  className={`input pr-10 ${pwErr ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwErr && <p className="text-xs text-red-500 mt-1.5">{pwErr}</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Iniciando sesión...</>
                : <><span>Iniciar sesión</span><ArrowRight size={17} /></>
              }
            </button>

            {/* Legal notice */}
            <p className="text-center text-xs text-gray-400 leading-relaxed mt-3">
              Al continuar aceptas nuestros{' '}
              <Link to="/terms" className="text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors">
                Términos y Condiciones
              </Link>
              {' '}y nuestra{' '}
              <Link to="/privacy" className="text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors">
                Política de Privacidad
              </Link>
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-indigo-500 font-semibold hover:text-indigo-700 transition-colors">
              Créala gratis →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
