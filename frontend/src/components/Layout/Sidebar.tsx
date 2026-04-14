import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Sparkles, CalendarDays, Calculator,
  FileText, BarChart3, Zap, ChevronRight, Settings, LogOut,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { id: 'dashboard',  label: 'Dashboard',                 path: '/',           icon: LayoutDashboard },
  { id: 'content',    label: 'Generador de Contenido',    path: '/content',    icon: Sparkles },
  { id: 'calendar',   label: 'Calendario',                path: '/calendar',   icon: CalendarDays },
  { id: 'budget',     label: 'Calculadora de Presupuesto',path: '/budget',     icon: Calculator },
  { id: 'briefing',   label: 'Plantilla de Briefing',     path: '/briefing',   icon: FileText },
  { id: 'competitor', label: 'Analizador de Competencia', path: '/competitor', icon: BarChart3 },
]
const systemItems = [
  { id: 'settings', label: 'Configuración', path: '/settings', icon: Settings },
]

// Generate a consistent avatar color from name initials
function avatarColor(name: string): string {
  const colors = [
    'from-indigo-500 to-violet-600',
    'from-violet-500 to-purple-600',
    'from-purple-500 to-fuchsia-600',
    'from-fuchsia-500 to-pink-600',
    'from-sky-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function Sidebar() {
  const { pathname }   = useLocation()
  const { user, logout } = useAuth()
  const navigate       = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user ? getInitials(user.name) : 'AG'
  const gradient = user ? avatarColor(user.name) : 'from-indigo-500 to-violet-600'

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl gradient-indigo flex items-center justify-center shadow-md shadow-indigo-200">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">Agency</span>
          <span className="text-lg font-bold text-indigo-500">OS</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
          Herramientas
        </p>
        {navItems.map(item => {
          const Icon     = item.icon
          const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
          return (
            <Link key={item.id} to={item.path}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
              <Icon size={18} />
              <span className="flex-1 leading-tight">{item.label}</span>
              {isActive && <ChevronRight size={14} className="opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* System nav */}
      <div className="px-3 pb-2 space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Sistema
        </p>
        {systemItems.map(item => {
          const Icon     = item.icon
          const isActive = pathname.startsWith(item.path)
          return (
            <Link key={item.id} to={item.path}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
              <Icon size={18} />
              <span className="flex-1 leading-tight">{item.label}</span>
              {isActive && <ChevronRight size={14} className="opacity-70" />}
            </Link>
          )
        })}
      </div>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group">
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {user?.name ?? 'Usuario'}
            </p>
            <p className="text-xs text-gray-400 truncate leading-tight">
              {user?.email ?? ''}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
