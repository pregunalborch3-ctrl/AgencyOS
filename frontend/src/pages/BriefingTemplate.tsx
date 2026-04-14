import { useState } from 'react'
import { FileText, Download, RotateCcw, CheckCircle } from 'lucide-react'
import Header from '../components/Layout/Header'
import type { BriefingForm, ProjectType } from '../types'

const projectTypes: ProjectType[] = ['campaña', 'branding', 'social media', 'evento', 'digital', 'producción', 'otro']

const empty = (): BriefingForm => ({
  id: Date.now().toString(),
  clientName: '',
  brand: '',
  projectName: '',
  projectType: 'campaña',
  objective: '',
  targetAudience: '',
  ageRange: '',
  location: '',
  keyMessage: '',
  tone: '',
  mandatories: '',
  restrictions: '',
  deliverables: '',
  startDate: '',
  endDate: '',
  budget: '',
  competitors: '',
  references: '',
  additionalNotes: '',
  createdAt: new Date().toISOString(),
})

const sections = [
  { id: 'client', title: '1. Información del cliente', icon: '🏢' },
  { id: 'project', title: '2. Proyecto', icon: '📋' },
  { id: 'audience', title: '3. Público objetivo', icon: '🎯' },
  { id: 'message', title: '4. Mensaje y tono', icon: '💬' },
  { id: 'deliverables', title: '5. Entregables y plazos', icon: '📅' },
  { id: 'references', title: '6. Competencia y referencias', icon: '🔍' },
]

export default function BriefingTemplate() {
  const [form, setForm] = useState<BriefingForm>(empty())
  const [activeSection, setActiveSection] = useState('client')
  const [saved, setSaved] = useState(false)

  const set = (key: keyof BriefingForm, val: string) =>
    setForm((f) => ({ ...f, [key]: val }))

  const completeness = () => {
    const required: (keyof BriefingForm)[] = [
      'clientName', 'brand', 'projectName', 'objective',
      'targetAudience', 'keyMessage', 'deliverables', 'startDate',
    ]
    const filled = required.filter((k) => String(form[k]).trim() !== '').length
    return Math.round((filled / required.length) * 100)
  }

  const saveBriefing = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
          {/* Sidebar navigation */}
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

            {sections.map((s) => (
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
              >
                {saved ? <><CheckCircle size={16} /> Guardado</> : <><FileText size={16} /> Guardar briefing</>}
              </button>
              <button className="btn-secondary w-full justify-center" onClick={() => window.print()}>
                <Download size={16} /> Exportar PDF
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
                      onChange={(e) => set('clientName', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Marca *</label>
                    <input className="input" placeholder="ej. Zara Home" value={form.brand}
                      onChange={(e) => set('brand', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Nombre del proyecto *</label>
                    <input className="input" placeholder="ej. Campaña Back to School 2026" value={form.projectName}
                      onChange={(e) => set('projectName', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Tipo de proyecto</label>
                    <select className="select" value={form.projectType}
                      onChange={(e) => set('projectType', e.target.value)}>
                      {projectTypes.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Presupuesto estimado</label>
                    <input className="input" placeholder="ej. €15,000 - €20,000" value={form.budget}
                      onChange={(e) => set('budget', e.target.value)} />
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
                    <textarea className="input resize-none" rows={4} placeholder="¿Qué quiere lograr el cliente? ¿Aumentar ventas, visibilidad, lanzar producto...?"
                      value={form.objective} onChange={(e) => set('objective', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Mensaje clave *</label>
                    <textarea className="input resize-none" rows={3} placeholder="¿Qué mensaje principal debe comunicar la campaña?"
                      value={form.keyMessage} onChange={(e) => set('keyMessage', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Entregables esperados *</label>
                    <textarea className="input resize-none" rows={4} placeholder="ej. 10 posts para Instagram, 5 historias, 2 vídeos Reels, 1 campaña Google Ads..."
                      value={form.deliverables} onChange={(e) => set('deliverables', e.target.value)} />
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
                    <textarea className="input resize-none" rows={4} placeholder="ej. Mujeres profesionales de 28-45 años, urbanas, con poder adquisitivo medio-alto, interesadas en moda y lifestyle..."
                      value={form.targetAudience} onChange={(e) => set('targetAudience', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="label">Rango de edad</label>
                      <input className="input" placeholder="ej. 25-45 años" value={form.ageRange}
                        onChange={(e) => set('ageRange', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Ubicación geográfica</label>
                      <input className="input" placeholder="ej. España, LATAM, Madrid capital" value={form.location}
                        onChange={(e) => set('location', e.target.value)} />
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
                      onChange={(e) => set('tone', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Elementos obligatorios (mandatories)</label>
                    <textarea className="input resize-none" rows={3} placeholder="ej. Siempre incluir el hashtag #MarcaX, el logo debe aparecer en todas las piezas, usar los colores corporativos..."
                      value={form.mandatories} onChange={(e) => set('mandatories', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Restricciones</label>
                    <textarea className="input resize-none" rows={3} placeholder="ej. No mencionar a la competencia, no usar imágenes de menores, no hablar de precios..."
                      value={form.restrictions} onChange={(e) => set('restrictions', e.target.value)} />
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
                        onChange={(e) => set('startDate', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Fecha de entrega</label>
                      <input className="input" type="date" value={form.endDate}
                        onChange={(e) => set('endDate', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Descripción completa de entregables *</label>
                    <textarea className="input resize-none" rows={6}
                      placeholder="Lista detallada de todo lo que debe entregarse al cliente..."
                      value={form.deliverables} onChange={(e) => set('deliverables', e.target.value)} />
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
                    <textarea className="input resize-none" rows={3} placeholder="ej. Marca X (fuerte en Instagram), Marca Y (líder en SEO), Marca Z (presencia en TikTok)..."
                      value={form.competitors} onChange={(e) => set('competitors', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Referencias o inspiración</label>
                    <textarea className="input resize-none" rows={3} placeholder="ej. Campaña Nike 2025, estilo visual de Apple, tono de comunicación de Patagonia..."
                      value={form.references} onChange={(e) => set('references', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Notas adicionales</label>
                    <textarea className="input resize-none" rows={4} placeholder="Cualquier otra información relevante para el equipo creativo..."
                      value={form.additionalNotes} onChange={(e) => set('additionalNotes', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
              <button
                className="btn-secondary"
                disabled={sections[0].id === activeSection}
                onClick={() => {
                  const idx = sections.findIndex((s) => s.id === activeSection)
                  if (idx > 0) setActiveSection(sections[idx - 1].id)
                }}
              >
                Anterior
              </button>
              <button
                className="btn-primary"
                disabled={sections[sections.length - 1].id === activeSection}
                onClick={() => {
                  const idx = sections.findIndex((s) => s.id === activeSection)
                  if (idx < sections.length - 1) setActiveSection(sections[idx + 1].id)
                }}
              >
                Siguiente sección
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
