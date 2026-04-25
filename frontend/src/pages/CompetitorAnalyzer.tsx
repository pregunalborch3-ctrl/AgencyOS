import { useState, useEffect } from 'react'
import { Plus, Globe, X, Trash2, TrendingUp, TrendingDown, Lightbulb, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Header from '../components/Layout/Header'

const BASE = '/api'
const TOKEN_KEY = 'agencyos_token'
const token = () => localStorage.getItem(TOKEN_KEY) ?? ''

interface CompetitorNote {
  description: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
}

interface Competitor {
  id: string
  name: string
  url: string | null
  notes: string | null
  createdAt: string
}

function parseNotes(raw: string | null): CompetitorNote {
  if (!raw) return { description: '', strengths: [''], weaknesses: [''], opportunities: [''] }
  try {
    return JSON.parse(raw) as CompetitorNote
  } catch {
    return { description: raw, strengths: [''], weaknesses: [''], opportunities: [''] }
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(options?.headers ?? {}) },
  })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.error ?? 'Error en la solicitud')
  return json.data as T
}

function emptyForm() {
  return { name: '', url: '', description: '', strengths: [''], weaknesses: [''], opportunities: [''] }
}

export default function CompetitorAnalyzer() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [form,        setForm]        = useState(emptyForm())
  const [editId,      setEditId]      = useState<string | null>(null)
  const [selected,    setSelected]    = useState<string[]>([])

  useEffect(() => {
    apiFetch<Competitor[]>('/competitor')
      .then(data => { setCompetitors(data); setSelected(data.map(c => c.id)) })
      .catch(() => toast.error('No se pudieron cargar los competidores.'))
      .finally(() => setLoading(false))
  }, [])

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setShowModal(true) }
  const openEdit = (c: Competitor) => {
    const n = parseNotes(c.notes)
    setForm({ name: c.name, url: c.url ?? '', description: n.description, strengths: n.strengths.length ? n.strengths : [''], weaknesses: n.weaknesses.length ? n.weaknesses : [''], opportunities: n.opportunities.length ? n.opportunities : [''] })
    setEditId(c.id)
    setShowModal(true)
  }

  const saveCompetitor = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio.'); return }
    setSaving(true)
    const notes = JSON.stringify({
      description: form.description,
      strengths:   form.strengths.filter(Boolean),
      weaknesses:  form.weaknesses.filter(Boolean),
      opportunities: form.opportunities.filter(Boolean),
    })
    try {
      if (editId) {
        const updated = await apiFetch<Competitor>(`/competitor/${editId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: form.name, url: form.url || null, notes }),
        })
        setCompetitors(cs => cs.map(c => c.id === editId ? updated : c))
        toast.success('Competidor actualizado.')
      } else {
        const created = await apiFetch<Competitor>('/competitor', {
          method: 'POST',
          body: JSON.stringify({ name: form.name, url: form.url || null, notes }),
        })
        setCompetitors(cs => [created, ...cs])
        setSelected(s => [...s, created.id])
        toast.success('Competidor añadido.')
      }
      setShowModal(false)
    } catch {
      toast.error('No se pudo guardar el competidor.')
    } finally {
      setSaving(false)
    }
  }

  const deleteCompetitor = async (id: string) => {
    try {
      await apiFetch(`/competitor/${id}`, { method: 'DELETE' })
      setCompetitors(cs => cs.filter(c => c.id !== id))
      setSelected(s => s.filter(x => x !== id))
      toast.success('Competidor eliminado.')
    } catch {
      toast.error('No se pudo eliminar.')
    }
  }

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const selectedComps = competitors.filter(c => selected.includes(c.id))

  const setListItem = (field: 'strengths' | 'weaknesses' | 'opportunities', idx: number, val: string) =>
    setForm(f => ({ ...f, [field]: f[field].map((v, i) => i === idx ? val : v) }))

  const addListItem = (field: 'strengths' | 'weaknesses' | 'opportunities') =>
    setForm(f => ({ ...f, [field]: [...f[field], ''] }))

  const removeListItem = (field: 'strengths' | 'weaknesses' | 'opportunities', idx: number) =>
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) || [''] }))

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-indigo-400" />
    </div>
  )

  return (
    <div className="flex-1">
      <Header
        title="Analizador de Competencia"
        subtitle="Monitoriza y compara el rendimiento de tus competidores"
      />
      <div className="p-6 space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="section-title">Competidores monitorizados</h2>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Añadir competidor
          </button>
        </div>

        {competitors.length === 0 ? (
          <div className="card p-12 text-center">
            <TrendingUp size={32} className="text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-600 mb-2">Sin competidores aún</h3>
            <p className="text-sm text-gray-400 mb-5">Añade tus primeros competidores para empezar el análisis.</p>
            <button className="btn-primary mx-auto" onClick={openAdd}><Plus size={16} /> Añadir competidor</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.map(comp => {
              const n = parseNotes(comp.notes)
              return (
                <div
                  key={comp.id}
                  className={`card p-5 cursor-pointer transition-all ${selected.includes(comp.id) ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:shadow-md'}`}
                  onClick={() => toggleSelect(comp.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{comp.name}</h3>
                      {comp.url && (
                        <a href={comp.url} className="text-xs text-indigo-500 flex items-center gap-1 mt-0.5"
                          onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer">
                          <Globe size={10} /> {comp.url.replace(/https?:\/\//, '').split('/')[0]}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button className="text-gray-300 hover:text-indigo-500 transition-colors p-1" onClick={e => { e.stopPropagation(); openEdit(comp) }}>
                        ✏️
                      </button>
                      <button className="text-gray-300 hover:text-red-500 transition-colors p-1" onClick={e => { e.stopPropagation(); deleteCompetitor(comp.id) }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  {n.description && <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{n.description}</p>}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <p className="font-bold text-emerald-700">{n.strengths.filter(Boolean).length}</p>
                      <p className="text-emerald-600">Fortalezas</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="font-bold text-red-700">{n.weaknesses.filter(Boolean).length}</p>
                      <p className="text-red-600">Debilidades</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="font-bold text-amber-700">{n.opportunities.filter(Boolean).length}</p>
                      <p className="text-amber-600">Oportunidades</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SWOT comparison */}
        {selectedComps.length > 0 && (
          <div>
            <h2 className="section-title mb-4">Análisis SWOT</h2>
            <div className={`grid gap-6 ${selectedComps.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {selectedComps.map(comp => {
                const n = parseNotes(comp.notes)
                return (
                  <div key={comp.id} className="card p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">{comp.name}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                          <TrendingUp size={12} /> Fortalezas
                        </p>
                        <ul className="space-y-1">
                          {n.strengths.filter(Boolean).map((s, i) => <li key={i} className="text-xs text-emerald-800">• {s}</li>)}
                          {n.strengths.filter(Boolean).length === 0 && <li className="text-xs text-gray-400 italic">Sin datos</li>}
                        </ul>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-red-700 uppercase mb-2 flex items-center gap-1">
                          <TrendingDown size={12} /> Debilidades
                        </p>
                        <ul className="space-y-1">
                          {n.weaknesses.filter(Boolean).map((s, i) => <li key={i} className="text-xs text-red-800">• {s}</li>)}
                          {n.weaknesses.filter(Boolean).length === 0 && <li className="text-xs text-gray-400 italic">Sin datos</li>}
                        </ul>
                      </div>
                      <div className="col-span-2 bg-amber-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-700 uppercase mb-2 flex items-center gap-1">
                          <Lightbulb size={12} /> Oportunidades para nosotros
                        </p>
                        <ul className="space-y-1">
                          {n.opportunities.filter(Boolean).map((s, i) => <li key={i} className="text-xs text-amber-800">• {s}</li>)}
                          {n.opportunities.filter(Boolean).length === 0 && <li className="text-xs text-gray-400 italic">Sin datos</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">{editId ? 'Editar competidor' : 'Añadir competidor'}</h3>
              <button className="btn-ghost p-1" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input className="input" placeholder="ej. Agencia XYZ" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Sitio web</label>
                <input className="input" placeholder="https://..." value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea className="input resize-none" rows={2} placeholder="Qué hacen, en qué se especializan..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {(['strengths', 'weaknesses', 'opportunities'] as const).map(field => (
                <div key={field}>
                  <label className="label flex items-center gap-1.5">
                    {field === 'strengths' ? '✅ Fortalezas' : field === 'weaknesses' ? '❌ Debilidades' : '💡 Oportunidades para nosotros'}
                  </label>
                  {form[field].map((val, idx) => (
                    <div key={idx} className="flex gap-2 mb-1.5">
                      <input className="input flex-1" placeholder="Escribe aquí..." value={val}
                        onChange={e => setListItem(field, idx, e.target.value)} />
                      {form[field].length > 1 && (
                        <button className="text-gray-300 hover:text-red-500 p-1" onClick={() => removeListItem(field, idx)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1" onClick={() => addListItem(field)}>
                    + Añadir
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" onClick={saveCompetitor} disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Plus size={16} /> {editId ? 'Guardar cambios' : 'Añadir'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
