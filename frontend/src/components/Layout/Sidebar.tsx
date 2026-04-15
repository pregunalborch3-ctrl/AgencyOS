import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Zap, Settings, LogOut, ChevronRight, Rocket } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { id: 'inicio',    label: 'Inicio',                  path: '/dashboard', icon: Home },
  { id: 'campaigns', label: 'Generador de Campañas',   path: '/campaigns', icon: Rocket },
]
const systemItems = [
  { id: 'settings', label: 'Configuración', path: '/settings', icon: Settings },
]

function avatarColor(name: string): string {
  const colors = [
    'from-indigo-500 to-violet-600',
    'from-violet-500 to-purple-600',
    'from-purple-500 to-fuchsia-600',
    'from-fuchsia-500 to-pink-600',
    'from-sky-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

export default function Sidebar() {
  const { pathname }       = useLocation()
  const { user, logout }   = useAuth()
  const navigate           = useNavigate()

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }
  const initials  = user ? getInitials(user.name) : 'AG'
  const gradient  = user ? avatarColor(user.name)  : 'from-indigo-500 to-violet-600'

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-zinc-950 border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-white">Agency</span>
          <span className="text-lg font-bold text-indigo-400">OS</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-3">
          Sistema
        </p>
        {navItems.map(item => {
          const Icon     = item.icon
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={17} />
              <span className="flex-1 leading-tight">{item.label}</span>
              {isActive && <ChevronRight size={13} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* System nav */}
      <div className="px-3 pb-2 space-y-1">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">
          Cuenta
        </p>
        {systemItems.map(item => {
          const Icon     = item.icon
          const isActive = pathname.startsWith(item.path)
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={17} />
              <span className="flex-1 leading-tight">{item.label}</span>
              {isActive && <ChevronRight size={13} className="opacity-60" />}
            </Link>
          )
        })}
      </div>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {user?.name ?? 'Usuario'}
            </p>
            <p className="text-xs text-zinc-500 truncate leading-tight">
              {user?.email ?? ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
