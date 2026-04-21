import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Minus, Globe, X } from 'lucide-react'
import Header from '../components/Layout/Header'
import type { Competitor, SocialMetrics, Platform } from '../types'

const platformLabels: Record<Platform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n)

const mockCompetitors: Competitor[] = [
  {
    id: '1',
    name: 'Competitor Alpha',
    website: 'https://alpha.com',
    description: 'Agencia líder en digital marketing con fuerte presencia en Instagram y LinkedIn.',
    metrics: [
      { platform: 'instagram', followers: 125000, engagementRate: 4.2, postsPerWeek: 5, avgLikes: 5250, avgComments: 210 },
      { platform: 'linkedin', followers: 28000, engagementRate: 2.8, postsPerWeek: 3, avgLikes: 784, avgComments: 56 },
    ],
    strengths: ['Gran comunidad en Instagram', 'Contenido de alta calidad', 'Respuesta rápida'],
    weaknesses: ['Poca presencia en TikTok', 'Sin estrategia de video corto'],
    opportunities: ['Mercado B2B sin explotar', 'Potencial en newsletters'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Competitor Beta',
    website: 'https://beta.com',
    description: 'Especialistas en redes sociales para marcas de lujo y lifestyle.',
    metrics: [
      { platform: 'instagram', followers: 89000, engagementRate: 6.1, postsPerWeek: 7, avgLikes: 5429, avgComments: 320 },
      { platform: 'tiktok', followers: 210000, engagementRate: 8.4, postsPerWeek: 10, avgLikes: 17640, avgComments: 890 },
    ],
    strengths: ['Alto engagement en TikTok', 'Viral frecuentemente', 'Estética cuidada'],
    weaknesses: ['Menor reach en LinkedIn', 'Bajo número de followers en Facebook'],
    opportunities: ['Expansion a YouTube Shorts', 'Colaboraciones con influencers mid-tier'],
    createdAt: new Date().toISOString(),
  },
]

const emptyCompetitor = (): Omit<Competitor, 'id' | 'createdAt'> => ({
  name: '',
  website: '',
  description: '',
  metrics: [{ platform: 'instagram', followers: 0, engagementRate: 0, postsPerWeek: 0, avgLikes: 0, avgComments: 0 }],
  strengths: [''],
  weaknesses: [''],
  opportunities: [''],
})

export default function CompetitorAnalyzer() {
  const [competitors, setCompetitors] = useState<Competitor[]>(mockCompetitors)
  const [showModal, setShowModal] = useState(false)
  const [newComp, setNewComp] = useState(emptyCompetitor())
  const [selected, setSelected] = useState<string[]>(mockCompetitors.map((c) => c.id))

  const addCompetitor = () => {
    if (!newComp.name) return
    const comp: Competitor = { ...newComp, id: Date.now().toString(), createdAt: new Date().toISOString() }
    setCompetitors((c) => [...c, comp])
    setSelected((s) => [...s, comp.id])
    setShowModal(false)
    setNewComp(emptyCompetitor())
  }

  const removeCompetitor = (id: string) => {
    setCompetitors((c) => c.filter((x) => x.id !== id))
    setSelected((s) => s.filter((x) => x !== id))
  }

  const toggleSelect = (id: string) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }

  const selectedComps = competitors.filter((c) => selected.includes(c.id))

  const getMetric = (comp: Competitor, platform: Platform, field: keyof SocialMetrics) => {
    const m = comp.metrics.find((x) => x.platform === platform)
    return m ? m[field] : null
  }

  const allPlatforms = [...new Set(competitors.flatMap((c) => c.metrics.map((m) => m.platform)))]

  const totalFollowers = (comp: Competitor) => comp.metrics.reduce((s, m) => s + m.followers, 0)
  const avgEngagement = (comp: Competitor) => {
    if (comp.metrics.length === 0) return 0
    return comp.metrics.reduce((s, m) => s + m.engagementRate, 0) / comp.metrics.length
  }

  return (
    <div className="flex-1">
      <Header
        title="Analizador de Competencia"
        subtitle="Monitoriza y compara el rendimiento de tus competidores"
      />
      <div className="p-6 space-y-6">
        {/* Competitors list */}
        <div className="flex items-center justify-between">
          <h2 className="section-title">Competidores monitorizados</h2>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Añadir competidor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((comp) => (
            <div
              key={comp.id}
              className={`card p-5 cursor-pointer transition-all ${
                selected.includes(comp.id) ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:shadow-md'
              }`}
              onClick={() => toggleSelect(comp.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{comp.name}</h3>
                  <a
                    href={comp.website}
                    className="text-xs text-indigo-500 flex items-center gap-1 mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe size={10} /> {comp.website.replace('https://', '')}
                  </a>
                </div>
                <button
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  onClick={(e) => { e.stopPropagation(); removeCompetitor(comp.id) }}
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{comp.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{fmtNum(totalFollowers(comp))}</p>
                  <p className="text-xs text-gray-500">Total seguidores</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-indigo-600">{avgEngagement(comp).toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Eng. promedio</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {comp.metrics.map((m) => (
                  <span key={m.platform} className="badge bg-gray-100 text-gray-600 text-xs">
                    {platformLabels[m.platform]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        {selectedComps.length >= 2 && (
          <div>
            <h2 className="section-title mb-4">Comparativa por plataforma</h2>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Plataforma / Métrica
                      </th>
                      {selectedComps.map((comp) => (
                        <th key={comp.id} className="text-center px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          {comp.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allPlatforms.map((platform) => (
                      <>
                        <tr key={`${platform}-header`} className="bg-indigo-50/60">
                          <td colSpan={selectedComps.length + 1} className="px-5 py-2 text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                            {platformLabels[platform]}
                          </td>
                        </tr>
                        {(['followers', 'engagementRate', 'postsPerWeek', 'avgLikes'] as (keyof SocialMetrics)[]).map((field) => {
                          const values = selectedComps.map((c) => getMetric(c, platform, field) as number | null)
                          const max = Math.max(...values.filter((v): v is number => v !== null))
                          return (
                            <tr key={`${platform}-${field}`} className="hover:bg-gray-50">
                              <td className="px-5 py-3 text-gray-600 capitalize">
                                {({ followers: 'Seguidores', engagementRate: 'Engagement (%)', postsPerWeek: 'Posts/semana', avgLikes: 'Likes promedio' } as Record<string, string>)[field]}
                              </td>
                              {selectedComps.map((comp) => {
                                const val = getMetric(comp, platform, field) as number | null
                                const isMax = val !== null && val === max && max > 0
                                return (
                                  <td key={comp.id} className="text-center px-4 py-3">
                                    {val !== null ? (
                                      <span className={`font-medium ${isMax ? 'text-emerald-600' : 'text-gray-700'}`}>
                                        {field === 'engagementRate' ? `${val}%` : fmtNum(val)}
                                        {isMax && <TrendingUp size={12} className="inline ml-1" />}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SWOT comparison */}
        {selectedComps.length > 0 && (
          <div>
            <h2 className="section-title mb-4">Análisis SWOT</h2>
            <div className={`grid gap-6 ${selectedComps.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {selectedComps.map((comp) => (
                <div key={comp.id} className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">{comp.name}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                        <TrendingUp size={12} /> Fortalezas
                      </p>
                      <ul className="space-y-1">
                        {comp.strengths.filter(Boolean).map((s, i) => (
                          <li key={i} className="text-xs text-emerald-800">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-red-700 uppercase mb-2 flex items-center gap-1">
                        <TrendingDown size={12} /> Debilidades
                      </p>
                      <ul className="space-y-1">
                        {comp.weaknesses.filter(Boolean).map((s, i) => (
                          <li key={i} className="text-xs text-red-800">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-span-2 bg-amber-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-700 uppercase mb-2 flex items-center gap-1">
                        <Minus size={12} /> Oportunidades para nosotros
                      </p>
                      <ul className="space-y-1">
                        {comp.opportunities.filter(Boolean).map((s, i) => (
                          <li key={i} className="text-xs text-amber-800">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add competitor modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Añadir competidor</h3>
              <button className="btn-ghost p-1" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input className="input" placeholder="ej. Agencia XYZ" value={newComp.name}
                  onChange={(e) => setNewComp((c) => ({ ...c, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Sitio web</label>
                <input className="input" placeholder="https://..." value={newComp.website}
                  onChange={(e) => setNewComp((c) => ({ ...c, website: e.target.value }))} />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea className="input resize-none" rows={2} value={newComp.description}
                  onChange={(e) => setNewComp((c) => ({ ...c, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Plataforma principal</label>
                <select className="select" value={newComp.metrics[0]?.platform || 'instagram'}
                  onChange={(e) => setNewComp((c) => ({
                    ...c,
                    metrics: [{ ...c.metrics[0], platform: e.target.value as Platform }],
                  }))}>
                  {Object.entries(platformLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Seguidores</label>
                  <input className="input" type="number" value={newComp.metrics[0]?.followers || 0}
                    onChange={(e) => setNewComp((c) => ({
                      ...c, metrics: [{ ...c.metrics[0], followers: Number(e.target.value) }],
                    }))} />
                </div>
                <div>
                  <label className="label">Engagement (%)</label>
                  <input className="input" type="number" step="0.1" value={newComp.metrics[0]?.engagementRate || 0}
                    onChange={(e) => setNewComp((c) => ({
                      ...c, metrics: [{ ...c.metrics[0], engagementRate: Number(e.target.value) }],
                    }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" onClick={addCompetitor}>
                <Plus size={16} /> Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
