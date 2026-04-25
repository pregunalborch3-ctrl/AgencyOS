import { useState } from 'react'
import { FileText, Download, RotateCcw, CheckCircle, Loader2, FolderOpen, Trash2 } from 'lucide-react'
import Header from '../components/Layout/Header'
import type { BriefingForm, ProjectType } from '../types'

const BASE = '/api'
const TOKEN_KEY = 'agencyos_token'
const token = () => localStorage.getItem(TOKEN_KEY) ?? ''

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(options?.headers ?? {}) },
  })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.error ?? 'Error en la solicitud')
  return json.data as T
}

const projectTypes: ProjectType[] = ['campaña', 'branding', 'social media', 'evento', 'digital', 'producción', 'otro']

const empty = (): BriefingForm => ({
  id: Date.now().toString(),
  clientName: '', brand: '', projectName: '', projectType: 'campaña',
  objective: '', targetAudience: '', ageRange: '', location: '',
  keyMessage: '', tone: '', mandatories: '', restrictions: '',
  deliverables: '', startDate: '', endDate: '', budget: '',
  competitors: '', references: '', additionalNotes: '',
  createdAt: new Date().toISOString(),
})

const sections = [
  { id: 'client',       title: '1. Información del cliente',     icon: '🏢' },
  { id: 'project',      title: '2. Proyecto',                    icon: '📋' },
  { id: 'audience',     title: '3. Público objetivo',            icon: '🎯' },
  { id: 'message',      title: '4. Mensaje y tono',              icon: '💬' },
  { id: 'deliverables', title: '5. Entregables y plazos',        icon: '📅' },
  { id: 'references',   title: '6. Competencia y referencias',   icon: '🔍' },
]

export default function BriefingTemplate() {
  const [form,          setForm]          = useState<BriefingForm>(empty())
  const [activeSection, setActiveSection] = useState('client')
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [savedList,     setSavedList]     = useState<BriefingForm[]>([])
  const [showList,      setShowList]      = useState(false)
  const [loadingList,   setLoadingList]   = useState(false)

  const set = (key: keyof BriefingForm, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  const completeness = () => {
    const required: (keyof BriefingForm)[] = [
      'clientName', 'brand', 'projectName', 'objective',
      'targetAudience', 'keyMessage', 'deliverables', 'startDate',
    ]
    const filled = required.filter(k => String(form[k]).trim() !== '').length
    return Math.round((filled / required.length) * 100)
  }

  const saveBriefing = async () => {
    if (!form.clientName || !form.projectName) return
    setSaving(true)
    try {
      const isNew = !form.id || form.id === empty().id || form.id === Date.now().toString()
      if (isNew || !savedList.find(b => b.id === form.id)) {
        const saved = await apiFetch<BriefingForm>('/briefing', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        setForm(f => ({ ...f, id: saved.id }))
      } else {
        await apiFetch<BriefingForm>(`/briefing/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // silently ignore save errors
    } finally {
      setSaving(false)
    }
  }

  const loadBriefings = async () => {
    setLoadingList(true)
    try {
      const list = await apiFetch<BriefingForm[]>('/briefing')
      setSavedList(list)
      setShowList(true)
    } catch {
      // silently ignore
    } finally {
      setLoadingList(false)
    }
  }

  const loadBriefing = (b: BriefingForm) => {
    setForm(b)
    setShowList(false)
    setActiveSection('client')
  }

  const deleteBriefing = async (id: string) => {
    try {
      await apiFetch(`/briefing/${id}`, { method: 'DELETE' })
      setSavedList(l => l.filter(b => b.id !== id))
      if (form.id === id) setForm(empty())
    } catch {
      // silently ignore
    }
  }

  const exportPDF = () => {
    import('../lib/exportUtils').then(({ downloadPDF }) => {
      const body = `
        <h2>Información del cliente</h2>
        <div class="card card-accent">
          <p><strong>Cliente:</strong> ${form.clientName}</p>
          <p><strong>Marca:</strong> ${form.brand}</p>
          <p><strong>Proyecto:</strong> ${form.projectName} (${form.projectType})</p>
          ${form.budget ? `<p><strong>Presupuesto:</strong> ${form.budget}</p>` : ''}
        </div>
        ${form.objective ? `<h2>Objetivo</h2><div class="card"><p>${form.objective}</p></div>` : ''}
        ${form.targetAudience ? `<h2>Público objetivo</h2><div class="card"><p>${form.targetAudience}</p>${form.ageRange ? `<p><strong>Edad:</strong> ${form.ageRange}</p>` : ''}${form.location ? `<p><strong>Ubicación:</strong> ${form.location}</p>` : ''}</div>` : ''}
        ${form.keyMessage ? `<h2>Mensaje clave</h2><div class="card"><p>${form.keyMessage}</p></div>` : ''}
        ${form.tone ? `<h2>Tono de comunicación</h2><div class="card"><p>${form.tone}</p></div>` : ''}
        ${form.deliverables ? `<h2>Entregables</h2><div class="card"><p>${form.deliverables}</p></div>` : ''}
        ${(form.startDate || form.endDate) ? `<h2>Fechas</h2><div class="card"><p>${form.startDate ? `Inicio: ${form.startDate}` : ''} ${form.endDate ? `· Entrega: ${form.endDate}` : ''}</p></div>` : ''}
        ${form.competitors ? `<h2>Competidores</h2><div class="card"><p>${form.competitors}</p></div>` : ''}
        ${form.additionalNotes ? `<h2>Notas adicionales</h2><div class="card"><p>${form.additionalNotes}</p></div>` : ''}
      `
      downloadPDF(
        `Briefing — ${form.projectName || 'Sin título'}`,
        `${form.clientName} · ${new Date().toLocaleDateString('es-ES')}`,
        body,
      )
    })
  }

  const pct = completeness()

  return (
    <div className="flex-1">
      <Header
        title="Plantilla de Briefing"
        subtitle="Recoge toda la información de tu cliente de forma estructurada"
      />
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3 space-y-2">
            {/* Progress */}
            <div className="card p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Completado</span>
                <span className="text-xs font-bold text-indigo-600">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeSection === s.id
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <span>{s.icon}</span>
                <span className="leading-tight">{s.title}</span>
              </button>
            ))}

            <div className="pt-4 space-y-2">
              <button
                className={`btn-primary w-full justify-center ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                onClick={saveBriefing}
                disabled={saving || !form.clientName || !form.projectName}
              >
                {saving
                  ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                  : saved
                  ? <><CheckCircle size={16} /> Guardado</>
                  : <><FileText size={16} /> Guardar briefing</>
                }
              </button>
              <button className="btn-secondary w-full justify-center" onClick={exportPDF}>
                <Download size={16} /> Exportar PDF
              </button>
              <button className="btn-secondary w-full justify-center" onClick={loadBriefings} disabled={loadingList}>
                {loadingList
                  ? <><Loader2 size={14} className="animate-spin" /> Cargando...</>
                  : <><FolderOpen size={14} /> Mis briefings</>
                }
              </button>
              <button className="btn-ghost w-full justify-center text-gray-500" onClick={() => setForm(empty())}>
                <RotateCcw size={14} /> Limpiar
              </button>
            </div>
          </div>

          {/* Form content */}
          <div className="col-span-9 card p-7">
            {activeSection === 'client' && (
              <div>
                <h2 className="section-title mb-5">Información del cliente</h2>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="label">Nombre del cliente / empresa *</label>
                    <input className="input" placeholder="ej. Grupo Inditex" value={form.clientName}
                      onChange={e => set('clientName', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Marca *</label>
                    <input className="input" placeholder="ej. Zara Home" value={form.brand}
                      onChange={e => set('brand', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Nombre del proyecto *</label>
                    <input className="input" placeholder="ej. Campaña Back to School 2026" value={form.projectName}
                      onChange={e => set('projectName', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Tipo de proyecto</label>
                    <select className="select" value={form.projectType}
                      onChange={e => set('projectType', e.target.value)}>
                      {projectTypes.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Presupuesto estimado</label>
                    <input className="input" placeholder="ej. €15,000 - €20,000" value={form.budget}
                      onChange={e => set('budget', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'project' && (
              <div>
                <h2 className="section-title mb-5">Descripción del proyecto</h2>
                <div className="space-y-5">
                  <div>
                    <label className="label">Objetivo principal de la campaña *</label>
                    <textarea className="input resize-none" rows={4} placeholder="¿Qué quiere lograr el cliente?"
                      value={form.objective} onChange={e => set('objective', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Mensaje clave *</label>
                    <textarea className="input resize-none" rows={3} placeholder="¿Qué mensaje principal debe comunicar la campaña?"
                      value={form.keyMessage} onChange={e => set('keyMessage', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Entregables esperados *</label>
                    <textarea className="input resize-none" rows={4} placeholder="ej. 10 posts para Instagram, 5 historias, 2 vídeos Reels..."
                      value={form.deliverables} onChange={e => set('deliverables', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'audience' && (
              <div>
                <h2 className="section-title mb-5">Público objetivo</h2>
                <div className="space-y-5">
                  <div>
                    <label className="label">Descripción del público objetivo *</label>
                    <textarea className="input resize-none" rows={4} placeholder="ej. Mujeres profesionales de 28-45 años, urbanas..."
                      value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="label">Rango de edad</label>
                      <input className="input" placeholder="ej. 25-45 años" value={form.ageRange}
                        onChange={e => set('ageRange', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Ubicación geográfica</label>
                      <input className="input" placeholder="ej. España, LATAM, Madrid capital" value={form.location}
                        onChange={e => set('location', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'message' && (
              <div>
                <h2 className="section-title mb-5">Mensaje y tono</h2>
                <div className="space-y-5">
                  <div>
                    <label className="label">Tono de comunicación</label>
                    <input className="input" placeholder="ej. Cercano, moderno, inspirador, no agresivo" value={form.tone}
                      onChange={e => set('tone', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Elementos obligatorios (mandatories)</label>
                    <textarea className="input resize-none" rows={3} placeholder="ej. Siempre incluir el hashtag #MarcaX, el logo debe aparecer..."
                      value={form.mandatories} onChange={e => set('mandatories', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Restricciones</label>
                    <textarea className="input resize-none" rows={3} placeholder="ej. No mencionar a la competencia, no usar imágenes de menores..."
                      value={form.restrictions} onChange={e => set('restrictions', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'deliverables' && (
              <div>
                <h2 className="section-title mb-5">Entregables y plazos</h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="label">Fecha de inicio *</label>
                      <input className="input" type="date" value={form.startDate}
                        onChange={e => set('startDate', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Fecha de entrega</label>
                      <input className="input" type="date" value={form.endDate}
                        onChange={e => set('endDate', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Descripción completa de entregables *</label>
                    <textarea className="input resize-none" rows={6}
                      placeholder="Lista detallada de todo lo que debe entregarse al cliente..."
                      value={form.deliverables} onChange={e => set('deliverables', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'references' && (
              <div>
                <h2 className="section-title mb-5">Competencia y referencias</h2>
                <div className="space-y-5">
                  <div>
                    <label className="label">Competidores principales</label>
                    <textarea className="input resize-none" rows={3} placeholder="ej. Marca X (fuerte en Instagram), Marca Y (líder en SEO)..."
                      value={form.competitors} onChange={e => set('competitors', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Referencias o inspiración</label>
                    <textarea className="input resize-none" rows={3} placeholder="ej. Campaña Nike 2025, estilo visual de Apple..."
                      value={form.references} onChange={e => set('references', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Notas adicionales</label>
                    <textarea className="input resize-none" rows={4} placeholder="Cualquier otra información relevante para el equipo creativo..."
                      value={form.additionalNotes} onChange={e => set('additionalNotes', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
              <button
                className="btn-secondary"
                disabled={sections[0].id === activeSection}
                onClick={() => {
                  const idx = sections.findIndex(s => s.id === activeSection)
                  if (idx > 0) setActiveSection(sections[idx - 1].id)
                }}
              >Anterior</button>
              <button
                className="btn-primary"
                disabled={sections[sections.length - 1].id === activeSection}
                onClick={() => {
                  const idx = sections.findIndex(s => s.id === activeSection)
                  if (idx < sections.length - 1) setActiveSection(sections[idx + 1].id)
                }}
              >Siguiente sección</button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved briefings modal */}
      {showList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Mis briefings guardados</h3>
              <button className="btn-ghost p-1 text-gray-500" onClick={() => setShowList(false)}>✕</button>
            </div>
            {savedList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No tienes briefings guardados aún.</p>
            ) : (
              <div className="space-y-2">
                {savedList.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadBriefing(b)}>
                      <p className="text-sm font-medium text-gray-900 truncate">{b.projectName}</p>
                      <p className="text-xs text-gray-500">{b.clientName} · {new Date(b.createdAt).toLocaleDateString('es-ES')}</p>
                    </div>
                    <button
                      className="ml-3 text-gray-300 hover:text-red-500 transition-colors p-1"
                      onClick={() => deleteBriefing(b.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
