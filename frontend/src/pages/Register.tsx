import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Zap, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../contexts/SubscriptionContext'

const PLAN_PRICE_IDS: Record<string, string> = {
  starter:    import.meta.env.VITE_STRIPE_PRICE_ID_STARTER    ?? '',
  pro:        import.meta.env.VITE_STRIPE_PRICE_ID_PRO        ?? '',
  enterprise: import.meta.env.VITE_STRIPE_PRICE_ID_ENTERPRISE ?? '',
}

// ─── Password strength ────────────────────────────────────────────────────────
interface Criterion { label: string; test: (pw: string) => boolean }
const CRITERIA: Criterion[] = [
  { label: 'Mínimo 8 caracteres',           test: pw => pw.length >= 8 },
  { label: 'Una letra mayúscula',            test: pw => /[A-Z]/.test(pw) },
  { label: 'Un número',                      test: pw => /[0-9]/.test(pw) },
  { label: 'Un carácter especial (!@#$...)', test: pw => /[^A-Za-z0-9]/.test(pw) },
]
const STRENGTH_LABELS = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500']
const STRENGTH_TEXT   = ['', 'text-red-500', 'text-orange-500', 'text-amber-500', 'text-emerald-600']

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const score = CRITERIA.filter(c => c.test(password)).length
  return (
    <div className="mt-3 space-y-2.5">
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? STRENGTH_COLORS[score] : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <span className={`text-xs font-semibold w-14 text-right ${STRENGTH_TEXT[score]}`}>
          {STRENGTH_LABELS[score]}
        </span>
      </div>
      {/* Criteria list */}
      <div className="grid grid-cols-2 gap-1">
        {CRITERIA.map(c => {
          const met = c.test(password)
          return (
            <div key={c.label} className="flex items-center gap-1.5">
              {met
                ? <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                : <XCircle     size={11} className="text-gray-300 flex-shrink-0" />}
              <span className={`text-xs ${met ? 'text-gray-600' : 'text-gray-400'}`}>{c.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const FEATURES = [
  'Generador de contenido con IA',
  'Calendario de publicación inteligente',
  'Calculadora de presupuestos profesional',
  'Análisis de competencia en tiempo real',
  'Publicación directa en Instagram',
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { subscribe } = useSubscription()

  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [terms,       setTerms]       = useState(false)
  const [showPw,      setShowPw]      = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Field errors
  const [nameErr,    setNameErr]    = useState('')
  const [emailErr,   setEmailErr]   = useState('')
  const [pwErr,      setPwErr]      = useState('')
  const [confirmErr, setConfirmErr] = useState('')
  const [termsErr,   setTermsErr]   = useState('')

  const passwordScore = CRITERIA.filter(c => c.test(password)).length

  function validate(): boolean {
    let ok = true
    setNameErr(''); setEmailErr(''); setPwErr(''); setConfirmErr(''); setTermsErr('')

    if (!name.trim() || name.trim().length < 2) {
      setNameErr('Introduce tu nombre completo (mínimo 2 caracteres).')
      ok = false
    }
    if (!email.trim()) {
      setEmailErr('El email es obligatorio.')
      ok = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr('Introduce un email válido.')
      ok = false
    }
    if (passwordScore < 4) {
      setPwErr('La contraseña no cumple todos los requisitos de seguridad.')
      ok = false
    }
    if (!confirm) {
      setConfirmErr('Confirma tu contraseña.')
      ok = false
    } else if (password !== confirm) {
      setConfirmErr('Las contraseñas no coinciden.')
      ok = false
    }
    if (!terms) {
      setTermsErr('Debes aceptar los términos para continuar.')
      ok = false
    }
    return ok
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setError(null); setLoading(true)
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, confirm)
      const plan = searchParams.get('plan')
      const priceId = plan ? PLAN_PRICE_IDS[plan] : undefined
      if (priceId && plan !== 'starter') {
        await subscribe(priceId)
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[48%] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 relative overflow-hidden flex-col justify-between p-12">
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
              Empieza gratis.<br />
              <span className="text-indigo-200">Escala sin límites.</span>
            </h1>
            <p className="mt-4 text-indigo-200 text-lg leading-relaxed">
              Únete a cientos de agencias que ya gestionan sus clientes con Agenciesos.
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

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-4">
          {[
            { n: '500+', label: 'Agencias activas' },
            { n: '12h',  label: 'Ahorradas/semana' },
            { n: '4.9★', label: 'Valoración media' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black text-white">{s.n}</p>
              <p className="text-xs text-indigo-300 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 bg-white overflow-y-auto py-8">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl gradient-indigo flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-xl font-black text-gray-900">Agency<span className="text-indigo-500">OS</span></span>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-7">
            <h2 className="text-3xl font-black text-gray-900">Crear cuenta</h2>
            <p className="text-gray-500 mt-1.5">Empieza a usar Agenciesos hoy, sin tarjeta de crédito.</p>
          </div>

          {/* Global error */}
          {error && (
            <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5">
              <span className="text-red-500 text-lg leading-none mt-0.5">⚠</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label className="label">Nombre completo</label>
              <input
                type="text" autoComplete="name" placeholder="Ana García"
                value={name} onChange={e => { setName(e.target.value); setNameErr('') }}
                className={`input ${nameErr ? 'border-red-300 ring-1 ring-red-200' : ''}`}
              />
              {nameErr && <p className="text-xs text-red-500 mt-1.5">{nameErr}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email de trabajo</label>
              <input
                type="email" autoComplete="email" placeholder="ana@agencia.com"
                value={email} onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                className={`input ${emailErr ? 'border-red-300 ring-1 ring-red-200' : ''}`}
              />
              {emailErr && <p className="text-xs text-red-500 mt-1.5">{emailErr}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={password} onChange={e => { setPassword(e.target.value); setPwErr('') }}
                  className={`input pr-10 ${pwErr ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
              {pwErr && <p className="text-xs text-red-500 mt-1.5">{pwErr}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="label">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  value={confirm} onChange={e => { setConfirm(e.target.value); setConfirmErr('') }}
                  className={`input pr-10 ${confirmErr ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Match indicator */}
              {confirm && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {password === confirm
                    ? <><CheckCircle2 size={12} className="text-emerald-500" /><span className="text-xs text-emerald-600">Las contraseñas coinciden</span></>
                    : <><XCircle size={12} className="text-red-400" /><span className="text-xs text-red-500">No coinciden</span></>
                  }
                </div>
              )}
              {confirmErr && <p className="text-xs text-red-500 mt-1">{confirmErr}</p>}
            </div>

            {/* Terms */}
            <div>
              <div className="flex items-start gap-2.5 mt-1">
                <input id="terms" type="checkbox" checked={terms}
                  onChange={e => { setTerms(e.target.checked); setTermsErr('') }}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer flex-shrink-0" />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none leading-relaxed">
                  Acepto los{' '}
                  <Link to="/terms" onClick={e => e.stopPropagation()} className="text-indigo-500 font-medium hover:underline">
                    Términos y Condiciones
                  </Link>
                  {' '}y la{' '}
                  <Link to="/privacy" onClick={e => e.stopPropagation()} className="text-indigo-500 font-medium hover:underline">
                    Política de Privacidad
                  </Link>
                </label>
              </div>
              {termsErr && <p className="text-xs text-red-500 mt-1.5 pl-6">{termsErr}</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-1">
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Creando cuenta...</>
                : <><span>Crear mi cuenta</span><ArrowRight size={17} /></>
              }
            </button>

            {/* Legal notice */}
            <p className="text-center text-xs text-gray-400 leading-relaxed mt-3">
              Al continuar aceptas nuestros{' '}
              <Link to="/terms" onClick={e => e.stopPropagation()} className="text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors">
                Términos y Condiciones
              </Link>
              {' '}y nuestra{' '}
              <Link to="/privacy" onClick={e => e.stopPropagation()} className="text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors">
                Política de Privacidad
              </Link>
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-500 font-semibold hover:text-indigo-700 transition-colors">
              Iniciar sesión →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
