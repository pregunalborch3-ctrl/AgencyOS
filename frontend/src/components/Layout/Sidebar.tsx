import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Rocket, Settings, LogOut, Clock,
  Globe2, Crosshair, Map, Flame, Layers, Zap,
  ShieldCheck, FileText, Cookie, MoreHorizontal, X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

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
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const { t }            = useTranslation()
  const { pathname }     = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const initials = user ? getInitials(user.name) : 'AG'
  const gradient = GRADIENTS[(user?.name?.charCodeAt(0) ?? 0) % GRADIENTS.length]

  const NAV_MAIN = [
    { path: '/dashboard', icon: Rocket,   label: t('nav.campaign'), mobileLabel: t('nav.campaign_short') },
    { path: '/historial', icon: Clock,    label: t('nav.history'),  mobileLabel: t('nav.history_short')  },
    { path: '/settings',  icon: Settings, label: t('nav.settings'), mobileLabel: t('nav.settings_short') },
  ]

  const NAV_TOOLS = [
    { path: '/frameworks/mercado',      icon: Globe2,    label: t('nav.market')       },
    { path: '/frameworks/competencia',  icon: Crosshair, label: t('nav.competition')  },
    { path: '/frameworks/distribucion', icon: Map,       label: t('nav.distribution') },
    { path: '/frameworks/contenido',    icon: Flame,     label: t('nav.content')      },
    { path: '/frameworks/escalado',     icon: Layers,    label: t('nav.scaling')      },
  ]

  const NAV_LEGAL = [
    { path: '/privacy', icon: ShieldCheck, label: t('nav.privacy')  },
    { path: '/terms',   icon: FileText,    label: t('nav.terms')    },
    { path: '/cookies', icon: Cookie,      label: t('nav.cookies')  },
  ]

  const isMoreActive = [...NAV_TOOLS, ...NAV_LEGAL].some(
    item => pathname === item.path || pathname.startsWith(item.path + '/')
  )

  const handleMoreNav = (path: string) => {
    setMoreOpen(false)
    navigate(path)
  }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-[60px] bg-zinc-950 border-r border-white/5 flex-col items-center py-4 gap-2 overflow-y-auto">
        <button
          onClick={() => navigate('/home')}
          title={t('nav.home')}
          className="w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-1 flex-shrink-0 transition-colors cursor-pointer"
        >
          <Zap size={15} className="text-white" />
        </button>

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
          {NAV_LEGAL.map(item => <NavItem key={item.path} {...item} />)}
        </nav>

        <div className="flex flex-col items-center gap-2 mt-auto pt-2">
          <button
            onClick={() => { logout(); navigate('/login', { replace: true }) }}
            title={t('nav.logout')}
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-400/8 transition-all"
          >
            <LogOut size={16} />
            <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-white/8 text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
              {t('nav.logout')}
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
        <Link to="/home" className="flex flex-col items-center justify-center gap-1 flex-1 py-2 min-w-0">
          <Zap size={20} className={pathname === '/home' ? 'text-indigo-400' : 'text-zinc-600'} />
          <span className={`text-[9px] font-semibold ${pathname === '/home' ? 'text-indigo-400' : 'text-zinc-600'}`}>
            {t('nav.home')}
          </span>
        </Link>
        {NAV_MAIN.map(item => (
          <BottomNavItem key={item.path} path={item.path} icon={item.icon} label={item.mobileLabel} />
        ))}
        {/* More button — opens slide-up drawer with Tools + Legal */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-2 min-w-0"
        >
          <MoreHorizontal size={20} className={isMoreActive ? 'text-indigo-400' : 'text-zinc-600'} />
          <span className={`text-[9px] font-semibold ${isMoreActive ? 'text-indigo-400' : 'text-zinc-600'}`}>
            Más
          </span>
        </button>
      </nav>

      {/* ── Mobile "Más" drawer ───────────────────────────────────────────── */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          {/* Sheet */}
          <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-zinc-900 rounded-t-2xl border-t border-white/8 pb-safe">
            {/* Handle + close */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Menú</span>
              <button onClick={() => setMoreOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-4 pb-6 space-y-4">
              {/* Tools section */}
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2">Tools</p>
                <div className="space-y-1">
                  {NAV_TOOLS.map(item => {
                    const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleMoreNav(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                          isActive
                            ? 'bg-indigo-500/15 text-indigo-400'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                        }`}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Legal section */}
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2">Legal</p>
                <div className="space-y-1">
                  {NAV_LEGAL.map(item => {
                    const isActive = pathname === item.path
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleMoreNav(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                          isActive
                            ? 'bg-indigo-500/15 text-indigo-400'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                        }`}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => { setMoreOpen(false); logout(); navigate('/login', { replace: true }) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/8 transition-all text-left"
              >
                <LogOut size={16} />
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
