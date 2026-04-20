import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Rocket, Settings, LogOut, Clock, LayoutDashboard,
  Globe2, Crosshair, Map, Flame, Layers, Zap, X,
  ShieldCheck, FileText, Cookie,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const NAV_MAIN = [
  { path: '/home',      icon: LayoutDashboard, label: 'Inicio',          mobileLabel: 'Inicio'    },
  { path: '/dashboard', icon: Rocket,          label: 'Generar campaña', mobileLabel: 'Campaña'   },
  { path: '/historial', icon: Clock,           label: 'Historial',       mobileLabel: 'Historial' },
  { path: '/settings',  icon: Settings,        label: 'Configuración',   mobileLabel: 'Ajustes'   },
]

const NAV_TOOLS = [
  { path: '/frameworks/mercado',      icon: Globe2,     label: 'Análisis de Mercado'      },
  { path: '/frameworks/competencia',  icon: Crosshair,  label: 'Mapa de Competencia'      },
  { path: '/frameworks/distribucion', icon: Map,        label: 'Plan de Distribución'     },
  { path: '/frameworks/contenido',    icon: Flame,      label: 'Motor de Contenido Viral' },
  { path: '/frameworks/escalado',     icon: Layers,     label: 'Roadmap de Escalado'      },
]

// ─── Desktop nav item (sidebar) ───────────────────────────────────────────────
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

// ─── Mobile bottom bar item ───────────────────────────────────────────────────
function BottomNavItem({ path, icon: Icon, label }: { path: string; icon: React.ElementType; label: string }) {
  const { pathname } = useLocation()
  const isActive = pathname === path || pathname.startsWith(path + '/')
  return (
    <Link to={path} className="flex flex-col items-center justify-center gap-1 flex-1 py-2 min-w-0">
      <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-zinc-600'} />
      <span className={`text-[9px] font-semibold truncate ${isActive ? 'text-indigo-400' : 'text-zinc-600'}`}>
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
  const { user, logout }    = useAuth()
  const navigate            = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const initials  = user ? getInitials(user.name) : 'AG'
  const gradient  = GRADIENTS[(user?.name?.charCodeAt(0) ?? 0) % GRADIENTS.length]

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-[60px] bg-zinc-950 border-r border-white/5 flex-col items-center py-4 gap-2 overflow-y-auto">
        {/* Brand logo — links to /home */}
        <Link to="/home" title="Inicio" className="w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-1 flex-shrink-0 transition-colors">
          <Zap size={15} className="text-white" />
        </Link>

        <nav className="flex flex-col items-center gap-1.5">
          {NAV_MAIN.map(item => <NavItem key={item.path} {...item} />)}
        </nav>

        <div className="w-6 h-px bg-white/8 my-1" />
        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest select-none">tools</span>

        <nav className="flex flex-col items-center gap-1.5">
          {NAV_TOOLS.map(item => <NavItem key={item.path} {...item} />)}
        </nav>

        <div className="w-6 h-px bg-white/8 my-1" />
        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest select-none">legal</span>
        <nav className="flex flex-col items-center gap-1.5">
          <NavItem path="/privacy" icon={ShieldCheck} label="Política de Privacidad" />
          <NavItem path="/terms"   icon={FileText}    label="Términos y Condiciones" />
          <NavItem path="/cookies" icon={Cookie}      label="Política de Cookies"    />
        </nav>

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

      {/* ── Mobile bottom navigation bar ─────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-zinc-950 border-t border-white/5 flex items-stretch safe-area-pb">
        {NAV_MAIN.map(item => (
          <BottomNavItem key={item.path} path={item.path} icon={item.icon} label={item.mobileLabel} />
        ))}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-2 min-w-0"
        >
          <Zap size={20} className="text-zinc-600" />
          <span className="text-[9px] font-semibold text-zinc-600">Tools</span>
        </button>
      </nav>

      {/* ── Tools drawer overlay (mobile) ─────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="md:hidden fixed bottom-[57px] inset-x-0 z-50 bg-zinc-900 border-t border-white/8 rounded-t-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Herramientas</p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-3 space-y-1">
              {NAV_TOOLS.map(item => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/8 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-indigo-400" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-300">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
