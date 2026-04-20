import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Rocket, Settings, LogOut, Clock, LayoutDashboard, Globe2, Crosshair, Map, Flame, Layers } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const NAV_MAIN = [
  { path: '/home',      icon: LayoutDashboard, label: 'Inicio'          },
  { path: '/dashboard', icon: Rocket,          label: 'Generar campaña' },
  { path: '/historial', icon: Clock,           label: 'Historial'       },
  { path: '/settings',  icon: Settings,        label: 'Configuración'   },
]

const NAV_TOOLS = [
  { path: '/frameworks/mercado',      icon: Globe2,     label: 'Análisis de Mercado'       },
  { path: '/frameworks/competencia',  icon: Crosshair,  label: 'Mapa de Competencia'       },
  { path: '/frameworks/distribucion', icon: Map,        label: 'Plan de Distribución'      },
  { path: '/frameworks/contenido',    icon: Flame,      label: 'Motor de Contenido Viral'  },
  { path: '/frameworks/escalado',     icon: Layers,     label: 'Roadmap de Escalado'       },
]

function NavItem({ path, icon: Icon, label }: { path: string; icon: React.ElementType; label: string }) {
  const { pathname } = useLocation()
  const isActive = pathname === path || pathname.startsWith(path + '/')
  return (
    <Link
      to={path}
      title={label}
      className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
        isActive
          ? 'bg-indigo-500 shadow-lg shadow-indigo-500/25'
          : 'text-zinc-600 hover:bg-white/5 hover:text-zinc-300'
      }`}
    >
      <Icon size={18} className={isActive ? 'text-white' : ''} />
      <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-white/8 text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
        {label}
      </span>
    </Link>
  )
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}
const GRADIENTS = [
  'from-indigo-500 to-violet-600', 'from-violet-500 to-purple-600',
  'from-purple-500 to-fuchsia-600', 'from-sky-500 to-indigo-600',
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const initials         = user ? getInitials(user.name) : 'AG'
  const gradient         = GRADIENTS[(user?.name?.charCodeAt(0) ?? 0) % GRADIENTS.length]

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-[60px] bg-zinc-950 border-r border-white/5 flex flex-col items-center py-4 gap-2 overflow-y-auto">
      {/* Main nav */}
      <nav className="flex flex-col items-center gap-1.5">
        {NAV_MAIN.map(item => <NavItem key={item.path} {...item} />)}
      </nav>

      {/* Divider + Herramientas label */}
      <div className="w-6 h-px bg-white/8 my-1" />
      <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest rotate-0 select-none">
        tools
      </span>

      {/* Tools nav */}
      <nav className="flex flex-col items-center gap-1.5">
        {NAV_TOOLS.map(item => <NavItem key={item.path} {...item} />)}
      </nav>

      {/* User + logout */}
      <div className="flex flex-col items-center gap-2 mt-auto pt-2">
        <button
          onClick={() => { logout(); navigate('/login', { replace: true }) }}
          title="Cerrar sesión"
          className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-400/8 transition-all"
        >
          <LogOut size={16} />
          <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-white/8 text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
            Cerrar sesión
          </span>
        </button>
        <div
          title={user?.name ?? ''}
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm cursor-default`}
        >
          <span className="text-[11px] font-bold text-white">{initials}</span>
        </div>
      </div>
    </aside>
  )
}
