import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import {
  ShieldCheck, Check, CheckCircle2, XCircle,
  AlertTriangle, Loader2, RefreshCw,
  Lock, Building2, Globe, Zap,
  CreditCard, Crown, AlertCircle, Sparkles,
  Plus, Copy, Key, Code2, Upload, X,
} from 'lucide-react'
import Header from '../components/Layout/Header'
import { useSubscription } from '../contexts/SubscriptionContext'

// ─── Types ────────────────────────────────────────────────────────────────────
type SettingsSection = 'general' | 'seguridad' | 'facturacion' | 'api'

interface AgencyConfig {
  name: string; email: string; website: string
  currency: string; timezone: string; language: string
  niche: string
}

interface ApiKeyRecord {
  id: string; name: string; keyPrefix: string
  lastUsed: string | null; createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const AGENCY_KEY = 'agencyos_agency_config'
const LOGO_KEY   = 'agencyos_logo'
const TOKEN_KEY  = 'agencyos_token'

const NICHES = [
  { value: '',             label: '— Selecciona un nicho —' },
  { value: 'moda',         label: 'Moda y lifestyle' },
  { value: 'ecommerce',    label: 'E-commerce' },
  { value: 'fitness',      label: 'Fitness y salud' },
  { value: 'gastronomia',  label: 'Gastronomía y restauración' },
  { value: 'tecnologia',   label: 'Tecnología y SaaS' },
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'educacion',    label: 'Educación y cursos' },
  { value: 'belleza',      label: 'Belleza y cosmética' },
  { value: 'viajes',       label: 'Viajes y turismo' },
  { value: 'servicios',    label: 'Servicios profesionales' },
  { value: 'marketing',    label: 'Marketing y agencias' },
  { value: 'otro',         label: 'Otro' },
]

const defaultAgency: AgencyConfig = {
  name: 'Mi Agencia', email: '', website: '',
  currency: 'EUR', timezone: 'Europe/Madrid', language: 'es',
  niche: '',
}

// ─── General Section ──────────────────────────────────────────────────────────
function GeneralSection() {
  const { t } = useTranslation()
  const [form,        setForm]        = useState<AgencyConfig>(defaultAgency)
  const [saved,       setSaved]       = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const token = () => localStorage.getItem(TOKEN_KEY) ?? ''

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', {
          headers: { Authorization: `Bearer ${token()}` },
        })
        const json = await res.json()
        if (json.success && json.data) {
          setForm({ ...defaultAgency, ...json.data })
          return
        }
      } catch { /* ignore */ }
      try {
        const local = JSON.parse(localStorage.getItem(AGENCY_KEY) || 'null')
        if (local) setForm({ ...defaultAgency, ...local })
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetchSettings().finally(() => setLoading(false))
    // Load logo from localStorage (stored separately, device-specific)
    setLogoPreview(localStorage.getItem(LOGO_KEY) ?? '')
  }, [])

  const set = (k: keyof AgencyConfig, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string
      const img = new Image()
      img.onload = () => {
        const MAX = 150
        const scale = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressed = canvas.toDataURL('image/jpeg', 0.75)
        setLogoPreview(compressed)
        localStorage.setItem(LOGO_KEY, compressed)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const removeLogo = () => {
    setLogoPreview('')
    localStorage.removeItem(LOGO_KEY)
  }

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      })
      localStorage.setItem(AGENCY_KEY, JSON.stringify(form))
      if (form.language !== i18n.language) {
        localStorage.setItem('agencyos_language', form.language)
        await i18n.changeLanguage(form.language)
      }
    } catch { /* ignore */ }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return (
    <div className="card p-6 flex items-center justify-center py-12">
      <Loader2 size={20} className="animate-spin text-indigo-400" />
    </div>
  )

  return (
    <div className="card p-6 space-y-5">
      <h3 className="section-title">{t('settings.general.title')}</h3>

      {/* Logo upload */}
      <div>
        <label className="label">Logo de la agencia</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
            {logoPreview
              ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              : <Upload size={20} className="text-gray-300" />
            }
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <Upload size={13} /> {logoPreview ? 'Cambiar logo' : 'Subir logo'}
            </button>
            {logoPreview && (
              <button
                type="button"
                onClick={removeLogo}
                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <X size={12} /> Eliminar logo
              </button>
            )}
            <p className="text-[11px] text-gray-400">PNG, JPG · Aparece en los PDFs exportados</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        <div>
          <label className="label">{t('settings.general.name')}</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">{t('settings.general.email')}</label>
          <input className="input" type="email" placeholder="hola@miagencia.com" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">{t('settings.general.website')}</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8" placeholder="https://miagencia.com" value={form.website} onChange={e => set('website', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Nicho principal</label>
          <select className="select" value={form.niche} onChange={e => set('niche', e.target.value)}>
            {NICHES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('settings.general.currency')}</label>
          <select className="select" value={form.currency} onChange={e => set('currency', e.target.value)}>
            {['EUR','USD','MXN','COP','ARS'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('settings.general.timezone')}</label>
          <select className="select" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
            {['Europe/Madrid','America/Mexico_City','America/Bogota','America/Buenos_Aires','America/New_York'].map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('settings.general.language')}</label>
          <select className="select" value={form.language} onChange={e => set('language', e.target.value)}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <button className={`btn-primary ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`} onClick={save} disabled={saving}>
        {saving
          ? <><Loader2 size={15} className="animate-spin" /> {t('settings.general.saving')}</>
          : saved
          ? <><Check size={15} /> {t('settings.general.saved')}</>
          : t('settings.general.save')
        }
      </button>
    </div>
  )
}

// ─── Security Section ─────────────────────────────────────────────────────────
function SecuritySection() {
  const { t } = useTranslation()

  const tips = [
    { icon: <RefreshCw size={15} />, title: t('settings.security.tip1_title'), desc: t('settings.security.tip1_desc') },
    { icon: <Lock size={15} />,      title: t('settings.security.tip2_title'), desc: t('settings.security.tip2_desc') },
    { icon: <ShieldCheck size={15}/>, title: t('settings.security.tip3_title'), desc: t('settings.security.tip3_desc') },
    { icon: <AlertTriangle size={15}/>, title: t('settings.security.tip4_title'), desc: t('settings.security.tip4_desc') },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="section-title mb-5">{t('settings.security.title')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">{tip.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-800 mb-0.5">{tip.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">{t('settings.security.data_title')}</h3>
        <div className="space-y-2">
          {[{ key: AGENCY_KEY, label: t('settings.security.agency_data') }].map(item => {
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
                    {t('settings.security.delete')}
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
  const { t } = useTranslation()
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
    active:             { label: t('settings.billing.status_active'),             cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    trialing:           { label: t('settings.billing.status_trialing'),           cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    canceled:           { label: t('settings.billing.status_canceled'),           cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    past_due:           { label: t('settings.billing.status_past_due'),           cls: 'bg-red-50 text-red-700 border-red-200' },
    incomplete:         { label: t('settings.billing.status_incomplete'),         cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    incomplete_expired: { label: t('settings.billing.status_incomplete_expired'), cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    unpaid:             { label: t('settings.billing.status_unpaid'),             cls: 'bg-red-50 text-red-700 border-red-200' },
    paused:             { label: t('settings.billing.status_paused'),             cls: 'bg-amber-50 text-amber-700 border-amber-200' },
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
          <h2 className="text-2xl font-black text-gray-900 mb-2">{t('settings.billing.no_subscription')}</h2>
          <p className="text-gray-500 mb-7 max-w-sm mx-auto leading-relaxed">
            {t('settings.billing.no_subscription_desc')}
          </p>
          <div className="flex items-end justify-center gap-1 mb-6">
            <span className="text-5xl font-black text-gray-900">{t('settings.billing.price')}</span>
            <span className="text-gray-400 text-lg mb-1.5">{t('settings.billing.per_month')}</span>
          </div>
          <button className="btn-primary py-3.5 px-10 text-base font-semibold" onClick={handleSubscribe} disabled={subscribing}>
            {subscribing
              ? <><Loader2 size={16} className="animate-spin" /> {t('settings.billing.redirecting')}</>
              : <><Sparkles size={16} /> {t('settings.billing.start_trial')}</>
            }
          </button>
          <p className="text-xs text-gray-400 mt-3">{t('settings.billing.secure_payment')}</p>
        </div>
      </div>
    </div>
  )

  const status    = statusLabel[subscription.status] ?? { label: subscription.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
  const periodEnd = new Date(subscription.currentPeriodEnd)
  const trialEnd  = subscription.trialEnd ? new Date(subscription.trialEnd) : null
  const locale    = i18n.language === 'en' ? 'en-US' : 'es-ES'

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl gradient-indigo flex items-center justify-center shadow-md shadow-indigo-200">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Agenciosos</p>
                <h3 className="text-lg font-black text-gray-900">{t('settings.billing.plan_name')}</h3>
              </div>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${status.cls}`}>
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{t('settings.billing.price_label')}</p>
              <p className="text-xl font-black text-gray-900">{t('settings.billing.price')}<span className="text-sm font-normal text-gray-400">{t('settings.billing.per_month')}</span></p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">
                {subscription.cancelAtPeriodEnd
                  ? t('settings.billing.access_until')
                  : subscription.status === 'trialing'
                  ? t('settings.billing.trial_until')
                  : t('settings.billing.next_charge')}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {(trialEnd && subscription.status === 'trialing' ? trialEnd : periodEnd)
                  .toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {t('settings.billing.cancel_warning', {
                    date: periodEnd.toLocaleDateString(locale, { day: '2-digit', month: 'long' })
                  })}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">{t('settings.billing.cancel_warning_desc')}</p>
              </div>
            </div>
          )}

          {subscription.status === 'past_due' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">{t('settings.billing.payment_issue')}</p>
                <p className="text-xs text-red-600 mt-0.5">{t('settings.billing.payment_issue_desc')}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn-secondary flex-1 justify-center py-2.5" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading
                ? <><Loader2 size={15} className="animate-spin" /> {t('settings.billing.opening')}</>
                : <><CreditCard size={15} /> {t('settings.billing.manage')}</>
              }
            </button>
            {isActive && (
              subscription.cancelAtPeriodEnd ? (
                <button className="btn-primary flex-1 justify-center py-2.5" onClick={handleReactivate} disabled={reactivating}>
                  {reactivating
                    ? <><Loader2 size={15} className="animate-spin" /> {t('settings.billing.reactivating')}</>
                    : <><Zap size={15} /> {t('settings.billing.reactivate')}</>
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
                    ? <><Loader2 size={15} className="animate-spin" /> {t('settings.billing.canceling')}</>
                    : confirmCancel
                    ? <><XCircle size={15} /> {t('settings.billing.confirm_cancel')}</>
                    : <><XCircle size={15} /> {t('settings.billing.cancel_plan')}</>
                  }
                </button>
              )
            )}
          </div>
          {confirmCancel && !canceling && (
            <p className="text-xs text-gray-400 text-center mt-2">
              {t('settings.billing.cancel_hint')} ·{' '}
              <button className="text-indigo-500 font-medium" onClick={() => setConfirmCancel(false)}>
                {t('settings.billing.cancel_action')}
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-500" /> {t('settings.billing.included_title')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(['feature1','feature2','feature3','feature4','feature5','feature6'] as const).map(k => (
            <div key={k} className="flex items-center gap-2.5 py-1">
              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{t(`settings.billing.${k}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── API Keys Section ─────────────────────────────────────────────────────────
function ApiKeysSection() {
  const { t } = useTranslation()
  const [keys,       setKeys]       = useState<ApiKeyRecord[]>([])
  const [loading,    setLoading]    = useState(true)
  const [newName,    setNewName]    = useState('')
  const [creating,   setCreating]   = useState(false)
  const [newRawKey,  setNewRawKey]  = useState<string | null>(null)
  const [copied,     setCopied]     = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ''}`,
  })

  const load = async () => {
    try {
      const res  = await fetch('/api/apikeys', { headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ''}` } })
      const json = await res.json()
      if (json.success) setKeys(json.data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res  = await fetch('/api/apikeys', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: newName.trim() }) })
      const json = await res.json()
      if (json.success) {
        setNewRawKey(json.data.rawKey)
        setNewName('')
        await load()
      }
    } catch { /* ignore */ }
    setCreating(false)
  }

  const remove = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/apikeys/${id}`, { method: 'DELETE', headers: authHeaders() })
      await load()
    } catch { /* ignore */ }
    setDeletingId(null)
  }

  const copyKey = () => {
    if (!newRawKey) return
    navigator.clipboard.writeText(newRawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-ES', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="section-title mb-1">{t('settings.api.title')}</h3>
        <p className="text-sm text-gray-500 mb-5">{t('settings.api.subtitle')}</p>

        {/* Create form */}
        <div className="flex gap-3 mb-5">
          <input
            className="input flex-1"
            placeholder={t('settings.api.name_placeholder')}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            maxLength={60}
          />
          <button
            className="btn-primary whitespace-nowrap"
            onClick={create}
            disabled={creating || !newName.trim()}
          >
            {creating
              ? <><Loader2 size={15} className="animate-spin" /> {t('settings.api.creating')}</>
              : <><Plus size={15} /> {t('settings.api.create')}</>
            }
          </button>
        </div>

        {/* New key reveal — shown once */}
        {newRawKey && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-amber-800">{t('settings.api.key_warning')}</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono text-gray-800 break-all">
                {newRawKey}
              </code>
              <button onClick={copyKey} className="btn-secondary whitespace-nowrap text-xs py-2 flex-shrink-0">
                {copied
                  ? <><Check size={14} /> {t('settings.api.copied')}</>
                  : <><Copy size={14} /> {t('settings.api.copy')}</>
                }
              </button>
            </div>
            <button onClick={() => { setNewRawKey(null); setCopied(false) }} className="text-xs text-amber-600 hover:text-amber-800 font-medium">
              {t('common.close')} ✕
            </button>
          </div>
        )}

        {/* Keys list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-indigo-400" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8">
            <Key size={28} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">{t('settings.api.no_keys')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('settings.api.no_keys_desc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-semibold text-gray-800 truncate">{k.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{k.keyPrefix}{'•'.repeat(40)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {t('settings.api.created_at')}: {fmtDate(k.createdAt)} · {t('settings.api.last_used')}: {k.lastUsed ? fmtDate(k.lastUsed) : t('settings.api.never')}
                  </p>
                </div>
                <button
                  onClick={() => remove(k.id)}
                  disabled={deletingId === k.id}
                  className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap transition-colors disabled:opacity-50"
                >
                  {deletingId === k.id ? t('settings.api.deleting') : t('settings.api.delete')}
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-3 text-right">{t('settings.api.limit')}</p>
      </div>

      {/* Usage docs */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Code2 size={16} className="text-indigo-500" /> {t('settings.api.docs_title')}
        </h3>
        <p className="text-xs text-gray-500 mb-2">{t('settings.api.docs_header')}</p>
        <pre className="text-xs bg-gray-950 text-emerald-400 rounded-xl p-4 overflow-x-auto mb-4 leading-relaxed">
{`X-API-Key: aos_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
        </pre>
        <p className="text-xs text-gray-500 mb-2">{t('settings.api.docs_endpoint')}</p>
        <pre className="text-xs bg-gray-950 text-sky-400 rounded-xl p-4 overflow-x-auto leading-relaxed">
{`POST /api/campaigns
Content-Type: application/json
X-API-Key: <your-key>

{
  "productName": "My product",
  "niche": "ropa",
  "objective": "ventas"
}`}
        </pre>
      </div>
    </div>
  )
}

// ─── Section nav ──────────────────────────────────────────────────────────────
function SectionNav({ active, onChange }: { active: SettingsSection; onChange: (s: SettingsSection) => void }) {
  const { t } = useTranslation()

  const items: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: 'general',     label: t('settings.nav.general'),  icon: <Building2 size={16} /> },
    { id: 'seguridad',   label: t('settings.nav.security'), icon: <ShieldCheck size={16} /> },
    { id: 'facturacion', label: t('settings.nav.billing'),  icon: <CreditCard size={16} /> },
    { id: 'api',         label: t('settings.nav.api'),      icon: <Key size={16} /> },
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
  const { t } = useTranslation()
  const [section, setSection] = useState<SettingsSection>('general')

  const subtitles: Record<SettingsSection, string> = {
    general:     t('settings.subtitle_general'),
    seguridad:   t('settings.subtitle_security'),
    facturacion: t('settings.subtitle_billing'),
    api:         t('settings.subtitle_api'),
  }

  return (
    <div className="flex-1">
      <Header title={t('settings.title')} subtitle={subtitles[section]} />
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-6">
          <div className="md:col-span-3">
            <div className="card p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3 mt-1">
                {t('settings.section_label')}
              </p>
              <SectionNav active={section} onChange={setSection} />
            </div>
          </div>
          <div className="md:col-span-9">
            {section === 'general'     && <GeneralSection />}
            {section === 'seguridad'   && <SecuritySection />}
            {section === 'facturacion' && <BillingSection />}
            {section === 'api'         && <ApiKeysSection />}
          </div>
        </div>
      </div>
    </div>
  )
}
