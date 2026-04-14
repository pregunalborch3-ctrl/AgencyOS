import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Video,
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { es } from 'date-fns/locale'
import Header from '../components/Layout/Header'
import type { CalendarPost, Platform, PostStatus } from '../types'

const platformConfig: Record<Platform, { label: string; color: string; bg: string }> = {
  instagram: { label: 'Instagram', color: 'text-pink-600', bg: 'bg-pink-500' },
  facebook: { label: 'Facebook', color: 'text-blue-600', bg: 'bg-blue-500' },
  twitter: { label: 'Twitter / X', color: 'text-gray-600', bg: 'bg-gray-700' },
  linkedin: { label: 'LinkedIn', color: 'text-sky-600', bg: 'bg-sky-600' },
  tiktok: { label: 'TikTok', color: 'text-gray-900', bg: 'bg-gray-900' },
  youtube: { label: 'YouTube', color: 'text-red-600', bg: 'bg-red-600' },
}

const statusColors: Record<PostStatus, string> = {
  borrador: 'bg-gray-100 text-gray-600',
  programado: 'bg-indigo-100 text-indigo-700',
  publicado: 'bg-emerald-100 text-emerald-700',
  pausado: 'bg-amber-100 text-amber-700',
}

const initialPosts: CalendarPost[] = [
  {
    id: '1',
    title: 'Lanzamiento campaña verano',
    content: '¡El verano llegó! Descubre nuestra nueva colección...',
    platform: 'instagram',
    status: 'programado',
    scheduledAt: new Date(2026, 3, 15, 10, 0).toISOString(),
    tags: ['verano', 'colección'],
  },
  {
    id: '2',
    title: 'Post corporativo LinkedIn',
    content: 'Nos enorgullece anunciar que hemos alcanzado...',
    platform: 'linkedin',
    status: 'borrador',
    scheduledAt: new Date(2026, 3, 18, 9, 0).toISOString(),
    tags: ['corporativo'],
  },
  {
    id: '3',
    title: 'Reels producto nuevo',
    content: 'Conoce lo nuevo de nuestra línea premium...',
    platform: 'instagram',
    status: 'publicado',
    scheduledAt: new Date(2026, 3, 10, 14, 0).toISOString(),
    tags: ['producto', 'reel'],
  },
]

const emptyPost = (): Omit<CalendarPost, 'id'> => ({
  title: '',
  content: '',
  platform: 'instagram',
  status: 'borrador',
  scheduledAt: new Date().toISOString(),
  tags: [],
})

export default function PublicationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1))
  const [posts, setPosts] = useState<CalendarPost[]>(initialPosts)
  const [showModal, setShowModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [editPost, setEditPost] = useState<Partial<CalendarPost>>(emptyPost())
  const [editingId, setEditingId] = useState<string | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let d = calStart
  while (d <= calEnd) {
    days.push(d)
    d = addDays(d, 1)
  }

  const postsForDay = (day: Date) =>
    posts.filter((p) => isSameDay(new Date(p.scheduledAt), day))

  const openNew = (day: Date) => {
    setSelectedDay(day)
    setEditPost({ ...emptyPost(), scheduledAt: day.toISOString() })
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (post: CalendarPost) => {
    setEditPost(post)
    setEditingId(post.id)
    setShowModal(true)
  }

  const savePost = () => {
    if (!editPost.title) return
    if (editingId) {
      setPosts((p) => p.map((x) => (x.id === editingId ? { ...x, ...editPost } as CalendarPost : x)))
    } else {
      setPosts((p) => [...p, { ...editPost, id: Date.now().toString() } as CalendarPost])
    }
    setShowModal(false)
  }

  const deletePost = (id: string) => setPosts((p) => p.filter((x) => x.id !== id))

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="flex-1">
      <Header
        title="Calendario de Publicación"
        subtitle="Planifica y visualiza toda tu estrategia de contenido"
      />
      <div className="p-6">
        <div className="card overflow-hidden">
          {/* Calendar header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button className="btn-ghost p-1.5" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-40 text-center capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h2>
              <button className="btn-ghost p-1.5" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight size={18} />
              </button>
            </div>
            <button className="btn-primary" onClick={() => openNew(new Date())}>
              <Plus size={16} /> Nuevo post
            </button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDays.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayPosts = postsForDay(day)
              const inMonth = isSameMonth(day, currentDate)
              const todayDay = isToday(day)
              return (
                <div
                  key={idx}
                  className={`min-h-28 p-2 border-b border-r border-gray-50 last:border-r-0 ${
                    !inMonth ? 'bg-gray-50/50' : 'bg-white hover:bg-indigo-50/30 cursor-pointer'
                  } transition-colors`}
                  onClick={() => inMonth && openNew(day)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        todayDay
                          ? 'bg-indigo-500 text-white'
                          : inMonth
                          ? 'text-gray-700'
                          : 'text-gray-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 2).map((post) => (
                      <div
                        key={post.id}
                        className={`text-xs px-2 py-1 rounded-md font-medium truncate cursor-pointer hover:opacity-80 ${
                          platformConfig[post.platform].bg
                        } text-white`}
                        onClick={(e) => { e.stopPropagation(); openEdit(post) }}
                        title={post.title}
                      >
                        {post.title}
                      </div>
                    ))}
                    {dayPosts.length > 2 && (
                      <span className="text-xs text-gray-400 pl-1">+{dayPosts.length - 2} más</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Post list */}
        <div className="mt-6">
          <h2 className="section-title mb-4">Todos los posts</h2>
          <div className="card divide-y divide-gray-50">
            {posts.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No hay posts creados todavía.</p>
            )}
            {posts.map((post) => (
              <div key={post.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${platformConfig[post.platform].bg}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                  <p className="text-xs text-gray-500">
                    {platformConfig[post.platform].label} · {format(new Date(post.scheduledAt), "d MMM, HH:mm", { locale: es })}
                  </p>
                </div>
                <span className={`badge ${statusColors[post.status]}`}>{post.status}</span>
                <button
                  className="btn-ghost p-1 text-gray-400 hover:text-red-500"
                  onClick={() => deletePost(post.id)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar post' : 'Nuevo post'}</h3>
              <button className="btn-ghost p-1" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Título</label>
                <input
                  className="input"
                  placeholder="Título del post"
                  value={editPost.title || ''}
                  onChange={(e) => setEditPost((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Plataforma</label>
                  <select
                    className="select"
                    value={editPost.platform || 'instagram'}
                    onChange={(e) => setEditPost((p) => ({ ...p, platform: e.target.value as Platform }))}
                  >
                    {Object.entries(platformConfig).map(([v, c]) => (
                      <option key={v} value={v}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Estado</label>
                  <select
                    className="select"
                    value={editPost.status || 'borrador'}
                    onChange={(e) => setEditPost((p) => ({ ...p, status: e.target.value as PostStatus }))}
                  >
                    {(['borrador', 'programado', 'publicado', 'pausado'] as PostStatus[]).map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Fecha y hora</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={editPost.scheduledAt ? editPost.scheduledAt.slice(0, 16) : ''}
                  onChange={(e) => setEditPost((p) => ({ ...p, scheduledAt: new Date(e.target.value).toISOString() }))}
                />
              </div>
              <div>
                <label className="label">Contenido</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Texto del post..."
                  value={editPost.content || ''}
                  onChange={(e) => setEditPost((p) => ({ ...p, content: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" onClick={savePost}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
