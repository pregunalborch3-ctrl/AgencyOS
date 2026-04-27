import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Eye, EyeOff, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react'

function PasswordStrength({ password }: { password: string }) {
  const criteria = [
    { label: 'Mínimo 8 caracteres',           ok: password.length >= 8         },
    { label: 'Al menos una letra mayúscula',   ok: /[A-Z]/.test(password)       },
    { label: 'Al menos una letra minúscula',   ok: /[a-z]/.test(password)       },
    { label: 'Al menos un número o símbolo',   ok: /[\d\W]/.test(password)      },
  ]
  const score = criteria.filter(c => c.ok).length
  const color = score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-amber-500' : score === 3 ? 'bg-yellow-400' : 'bg-emerald-500'

  if (!password) return null

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1 h-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`flex-1 rounded-full transition-colors ${i < score ? color : 'bg-zinc-700'}`} />
        ))}
      </div>
      <div className="space-y-0.5">
        {criteria.map(c => (
          <p key={c.label} className={`text-xs ${c.ok ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {c.ok ? '✓' : '○'} {c.label}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const token           = searchParams.get('token') ?? ''

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw,          setShowPw]          = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [done,            setDone]            = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">Enlace inválido</h1>
          <p className="text-zinc-400 text-sm">Este enlace no es válido o ha caducado.</p>
          <Link to="/forgot-password" className="inline-block text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('La contraseña debe tener mínimo 8 caracteres.'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password, confirmPassword }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Error al restablecer la contraseña.')
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-white">Contraseña actualizada</h1>
              <p className="text-zinc-400 text-sm">
                Tu contraseña ha sido restablecida correctamente.<br />
                Redirigiendo al inicio de sesión…
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <KeyRound size={22} className="text-indigo-400" />
                </div>
                <h1 className="text-xl font-bold text-white">Nueva contraseña</h1>
                <p className="text-zinc-400 text-sm mt-1">
                  Elige una contraseña segura para tu cuenta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null) }}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(null) }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Guardando…' : 'Establecer nueva contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
