import { useState } from 'react'
import { Sparkles, Copy, RefreshCw, Check, Hash, Loader2 } from 'lucide-react'
import Header from '../components/Layout/Header'
import type { ContentRequest, Platform, ContentTone, ContentType } from '../types'

const platforms: { value: Platform; label: string; color: string }[] = [
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'twitter', label: 'X / Twitter', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { value: 'tiktok', label: 'TikTok', color: 'bg-black/10 text-gray-800 border-gray-200' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-100 text-red-700 border-red-200' },
]

const tones: ContentTone[] = ['profesional', 'casual', 'humorístico', 'inspiracional', 'urgente', 'educativo']
const contentTypes: ContentType[] = ['post', 'story', 'reel', 'carrusel', 'artículo', 'anuncio']

const mockGenerate = (req: ContentRequest): string[] => [
  `¡${req.brand} lo vuelve a hacer! 🚀\n\n${req.topic} — una oportunidad que no puedes dejar pasar. Estamos redefiniendo los estándares de la industria con soluciones que realmente marcan la diferencia.\n\n¿Listo para dar el siguiente paso? ${req.callToAction || 'Descúbrelo ahora.'}\n\n#${req.brand.replace(/\s/g, '')} #${req.keywords.split(',')[0]?.trim().replace(/\s/g, '') || 'marketing'} #innovación`,
  `Hoy hablamos de ${req.topic.toLowerCase()}. 💡\n\nEn ${req.brand} creemos que el éxito no es casualidad — es el resultado de estrategia, creatividad y compromiso constante.\n\nSigue leyendo para descubrir cómo podemos ayudarte.\n\n${req.callToAction || 'Contáctanos.'}\n\n#${req.keywords.split(',').map(k => k.trim().replace(/\s/g, '')).join(' #')}`,
  `${req.topic} — así de simple, así de poderoso. ✨\n\nDesde ${req.brand}, te traemos contenido que inspira, conecta y convierte. Porque sabemos que cada palabra cuenta y cada publicación es una oportunidad.\n\n${req.callToAction || 'Únete a la comunidad.'}\n\n#contenido #${req.brand.replace(/\s/g, '').toLowerCase()} #resultados`,
]

export default function ContentGenerator() {
  const [form, setForm] = useState<ContentRequest>({
    platform: 'instagram',
    tone: 'profesional',
    contentType: 'post',
    topic: '',
    brand: '',
    keywords: '',
    callToAction: '',
  })
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  const set = (key: keyof ContentRequest, val: string) =>
    setForm((f) => ({ ...f, [key]: val }))

  const generate = async () => {
    if (!form.topic || !form.brand) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1400))
    setResults(mockGenerate(form))
    setLoading(false)
  }

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  const selectedPlatform = platforms.find((p) => p.value === form.platform)

  return (
    <div className="flex-1">
      <Header
        title="Generador de Contenido"
        subtitle="Crea copys y captions optimizados con inteligencia artificial"
      />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Sparkles size={18} className="text-indigo-500" />
              <h2 className="section-title">Configuración</h2>
            </div>

            {/* Platform selector */}
            <div>
              <label className="label">Plataforma</label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => set('platform', p.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.platform === p.value
                        ? 'ring-2 ring-indigo-500 ' + p.color
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tono</label>
                <select
                  className="select"
                  value={form.tone}
                  onChange={(e) => set('tone', e.target.value)}
                >
                  {tones.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tipo de contenido</label>
                <select
                  className="select"
                  value={form.contentType}
                  onChange={(e) => set('contentType', e.target.value)}
                >
                  {contentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand & Topic */}
            <div>
              <label className="label">Marca / Cliente *</label>
              <input
                className="input"
                placeholder="ej. Nike España"
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Tema o producto *</label>
              <input
                className="input"
                placeholder="ej. Lanzamiento de nuevas zapatillas running"
                value={form.topic}
                onChange={(e) => set('topic', e.target.value)}
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="label">
                Palabras clave <span className="text-gray-400 font-normal">(separadas por comas)</span>
              </label>
              <input
                className="input"
                placeholder="ej. running, deporte, rendimiento"
                value={form.keywords}
                onChange={(e) => set('keywords', e.target.value)}
              />
            </div>

            {/* CTA */}
            <div>
              <label className="label">
                Call to Action <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                className="input"
                placeholder="ej. Compra ahora con 20% descuento"
                value={form.callToAction}
                onChange={(e) => set('callToAction', e.target.value)}
              />
            </div>

            <button
              className="btn-primary w-full justify-center py-3"
              onClick={generate}
              disabled={loading || !form.topic || !form.brand}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Generando...</>
              ) : (
                <><Sparkles size={16} /> Generar contenido</>
              )}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {results.length === 0 && !loading && (
              <div className="card p-10 flex flex-col items-center justify-center text-center h-full min-h-64">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Sparkles size={24} className="text-indigo-400" />
                </div>
                <p className="font-medium text-gray-700 mb-1">Listo para generar</p>
                <p className="text-sm text-gray-400">
                  Completa el formulario y haz clic en "Generar contenido"
                </p>
              </div>
            )}

            {results.map((text, idx) => (
              <div key={idx} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Versión {idx + 1}</span>
                    <span className={`badge border ${selectedPlatform?.color}`}>
                      {selectedPlatform?.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn-ghost text-xs py-1 px-2"
                      onClick={() => setResults(mockGenerate(form))}
                    >
                      <RefreshCw size={13} />
                    </button>
                    <button
                      className={`btn-ghost text-xs py-1 px-2 ${
                        copied === idx ? 'text-emerald-600' : ''
                      }`}
                      onClick={() => copyText(text, idx)}
                    >
                      {copied === idx ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                  {text}
                </pre>
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
                  {text.match(/#\w+/g)?.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-0.5 text-xs text-indigo-500">
                      <Hash size={10} />
                      {tag.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
