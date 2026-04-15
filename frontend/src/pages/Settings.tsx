import { useState } from 'react'
import {
  ShieldCheck, Check, CheckCircle2, XCircle,
  AlertTriangle, Loader2, RefreshCw,
  Lock, Building2, Globe, Zap,
  CreditCard, Crown, AlertCircle, Sparkles,
} from 'lucide-react'
import Header from '../components/Layout/Header'
import { useSubscription } from '../contexts/SubscriptionContext'

// ─── Types ────────────────────────────────────────────────────────────────────
type SettingsSection = 'general' | 'seguridad' | 'facturacion'

interface AgencyConfig {
  name: string; email: string; website: string
  currency: string; timezone: string; language: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const AGENCY_KEY = 'agencyos_agency_config'

const defaultAgency: AgencyConfig = {
  name: 'Mi Agencia', email: '', website: '',
  currency: 'EUR', timezone: 'Europe/Madrid', language: 'es',
}

// ─── General Section ──────────────────────────────────────────────────────────
function GeneralSection() {
  const [form, setForm] = useState<AgencyConfig>(() => {
    try { return JSON.parse(localStorage.getItem(AGENCY_KEY) || 'null') ?? defaultAgency }
    catch { return defaultAgency }
  })
  const [saved, setSaved] = useState(false)
  const set = (k: keyof AgencyConfig, v: string) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    localStorage.setItem(AGENCY_KEY, JSON.stringify(form))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="card p-6 space-y-5">
      <h3 className="section-title">Información de la agencia</h3>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="label">Nombre de la agencia</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Email de contacto</label>
          <input className="input" type="email" placeholder="hola@miagencia.com" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Sitio web</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8" placeholder="https://miagencia.com" value={form.website} onChange={e => set('website', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Moneda</label>
          <select className="select" value={form.currency} onChange={e => set('currency', e.target.value)}>
            {['EUR','USD','MXN','COP','ARS'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Zona horaria</label>
          <select className="select" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
            {['Europe/Madrid','America/Mexico_City','America/Bogota','America/Buenos_Aires','America/New_York'].map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Idioma</label>
          <select className="select" value={form.language} onChange={e => set('language', e.target.value)}>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </div>
      </div>
      <button className={`btn-primary ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`} onClick={save}>
        {saved ? <><Check size={15} /> Guardado</> : 'Guardar cambios'}
      </button>
    </div>
  )
}

// ─── Security Section ─────────────────────────────────────────────────────────
function SecuritySection() {
  const tips = [
    { icon: <RefreshCw size={15} />, title: 'Rota tus contraseñas regularmente',   desc: 'Cambia tu contraseña cada 90 días como medida preventiva.' },
    { icon: <Lock size={15} />,      title: 'No compartas tus credenciales',        desc: 'Cada miembro del equipo debe tener su propia cuenta.' },
    { icon: <ShieldCheck size={15}/>, title: 'Verifica los accesos activos',        desc: 'Revisa periódicamente qué dispositivos tienen sesión iniciada.' },
    { icon: <AlertTriangle size={15}/>, title: 'Datos almacenados localmente',      desc: 'Algunas preferencias se guardan en tu navegador (localStorage).' },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="section-title mb-5">Buenas prácticas de seguridad</h3>
        <div className="grid grid-cols-2 gap-4">
          {tips.map((t, i) => (
            <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">{t.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-800 mb-0.5">{t.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Datos almacenados localmente</h3>
        <div className="space-y-2">
          {[
            { key: AGENCY_KEY, label: 'Datos de la agencia', sensitive: false },
          ].map(item => {
            const exists = Boolean(localStorage.getItem(item.key))
            return (
              <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${exists ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                {exists && (
                  <button
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                    onClick={() => { localStorage.removeItem(item.key); window.location.reload() }}
                  >
                    Borrar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Billing Section ──────────────────────────────────────────────────────────
function BillingSection() {
  const { subscription, isActive, isLoading, subscribe, openPortal, cancel, reactivate } = useSubscription()
  const [canceling,     setCanceling]     = useState(false)
  const [reactivating,  setReactivating]  = useState(false)
  const [subscribing,   setSubscribing]   = useState(false)
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
    active:             { label: 'Activa',          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    trialing:           { label: 'Prueba gratuita', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    canceled:           { label: 'Cancelada',       cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    past_due:           { label: 'Pago vencido',    cls: 'bg-red-50 text-red-700 border-red-200' },
    incomplete:         { label: 'Incompleta',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    incomplete_expired: { label: 'Expirada',        cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    unpaid:             { label: 'Sin pago',        cls: 'bg-red-50 text-red-700 border-red-200' },
    paused:             { label: 'Pausada',         cls: 'bg-amber-50 text-amber-700 border-amber-200' },
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
            {subscribing
              ? <><Loader2 size={16} className="animate-spin" /> Redirigiendo...</>
              : <><Sparkles size={16} /> Empezar prueba gratuita</>
            }
          </button>
          <p className="text-xs text-gray-400 mt-3">Cancela cuando quieras · Pago seguro con Stripe</p>
        </div>
      </div>
    </div>
  )

  const status    = statusLabel[subscription.status] ?? { label: subscription.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
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

          {subscription.cancelAtPeriodEnd && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Tu suscripción se cancelará el {periodEnd.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">Después de esta fecha perderás el acceso a todas las herramientas Pro.</p>
              </div>
            </div>
          )}

          {subscription.status === 'past_due' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Hay un problema con tu pago</p>
                <p className="text-xs text-red-600 mt-0.5">Actualiza tu método de pago para mantener el acceso.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn-secondary flex-1 justify-center py-2.5" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading
                ? <><Loader2 size={15} className="animate-spin" /> Abriendo...</>
                : <><CreditCard size={15} /> Gestionar suscripción</>
              }
            </button>
            {isActive && (
              subscription.cancelAtPeriodEnd ? (
                <button className="btn-primary flex-1 justify-center py-2.5" onClick={handleReactivate} disabled={reactivating}>
                  {reactivating
                    ? <><Loader2 size={15} className="animate-spin" /> Reactivando...</>
                    : <><Zap size={15} /> Reactivar plan</>
                  }
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
              Haz clic de nuevo para confirmar ·{' '}
              <button className="text-indigo-500 font-medium" onClick={() => setConfirmCancel(false)}>Cancelar</button>
            </p>
          )}
        </div>
      </div>

      {/* Features included */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-500" /> Incluido en tu plan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Generador de campañas ilimitado',
            'Copies, hooks, guiones y estructura de funnel',
            'Variantes agresivo, conversión y TikTok',
            'Historial completo de campañas generadas',
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

// ─── Section nav ──────────────────────────────────────────────────────────────
function SectionNav({ active, onChange }: { active: SettingsSection; onChange: (s: SettingsSection) => void }) {
  const items: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: 'general',     label: 'General',     icon: <Building2 size={16} /> },
    { id: 'seguridad',   label: 'Seguridad',   icon: <ShieldCheck size={16} /> },
    { id: 'facturacion', label: 'Facturación', icon: <CreditCard size={16} /> },
  ]
  return (
    <nav className="space-y-1">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
            active === item.id
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
              : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
          }`}
        >
          {item.icon}{item.label}
        </button>
      ))}
    </nav>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const [section, setSection] = useState<SettingsSection>('general')

  const subtitles: Record<SettingsSection, string> = {
    general:     'Configura los datos de tu agencia',
    seguridad:   'Gestiona la seguridad de tus credenciales',
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
            {section === 'general'     && <GeneralSection />}
            {section === 'seguridad'   && <SecuritySection />}
            {section === 'facturacion' && <BillingSection />}
          </div>
        </div>
      </div>
    </div>
  )
}
