import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Rocket, Settings, LogOut, Clock, CalendarDays,
  Globe2, Crosshair, Layers, Zap,
  MoreHorizontal, X, BarChart2, Lock, Wand2, Home,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePlan, type PlanTier } from '../../hooks/usePlan'

// ─── Desktop nav item ─────────────────────────────────────────────────────────
function NavItem({ path, icon: Icon, label, locked }: { path: string; icon: React.ElementType; label: string; locked?: boolean }) {
  const { pathname } = useLocation()
  const isActive = pathname === path || pathname.startsWith(path + '/')
  return (
    <Link
      to={path}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
        isActive
          ? 'bg-indigo-500/15 text-indigo-400'
          : locked
          ? 'text-zinc-700 hover:bg-white/5 hover:text-zinc-600'
          : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
      }`}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="truncate">{label}</span>
      {locked && !isActive && <Lock size={9} className="text-zinc-700 ml-auto flex-shrink-0" />}
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
  const { hasAccess }    = usePlan()

  const initials = user ? getInitials(user.name) : 'AG'
  const gradient = GRADIENTS[(user?.name?.charCodeAt(0) ?? 0) % GRADIENTS.length]

  const NAV_MAIN = [
    { path: '/home',          icon: Home,         label: 'Inicio',          mobileLabel: 'Inicio'                },
    { path: '/dashboard',     icon: Rocket,       label: t('nav.campaign'), mobileLabel: t('nav.campaign_short') },
    { path: '/content-tools', icon: Wand2,        label: 'Herramientas IA', mobileLabel: 'IA'                   },
    { path: '/calendar',      icon: CalendarDays, label: t('nav.calendar'), mobileLabel: t('nav.calendar_short') },
    { path: '/historial',     icon: Clock,        label: t('nav.history'),  mobileLabel: t('nav.history_short')  },
    { path: '/settings',      icon: Settings,     label: t('nav.settings'), mobileLabel: t('nav.settings_short') },
  ]

  const proLocked = !hasAccess('pro')
  const NAV_TOOLS: { path: string; icon: React.ElementType; label: string; requiredTier?: PlanTier }[] = [
    { path: '/meta-analysis',           icon: BarChart2, label: 'Meta Análisis'                        },
    { path: '/frameworks/mercado',     icon: Globe2,    label: t('nav.market'),      requiredTier: 'pro' },
    { path: '/frameworks/competencia', icon: Crosshair, label: t('nav.competition'), requiredTier: 'pro' },
    { path: '/frameworks/escalado',    icon: Layers,    label: t('nav.scaling'),     requiredTier: 'pro' },
  ]

  const isMoreActive = NAV_TOOLS.some(
    item => pathname === item.path || pathname.startsWith(item.path + '/')
  )

  const handleMoreNav = (path: string) => { setMoreOpen(false); navigate(path) }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-[210px] bg-zinc-950 border-r border-white/5 flex-col py-4 overflow-y-auto">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 mb-5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-sm font-black text-white">AgenciesOS</span>
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV_MAIN.map(item => <NavItem key={item.path} path={item.path} icon={item.icon} label={item.label} />)}
        </nav>

        {/* Tools */}
        <div className="px-4 mt-4 mb-1">
          <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Herramientas</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV_TOOLS.map(item => (
            <NavItem
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              locked={item.requiredTier === 'pro' && proLocked}
            />
          ))}
        </nav>

        {/* Bottom: logout + user + legal */}
        <div className="mt-auto border-t border-white/5 pt-3 px-2 space-y-0.5">
          <button
            onClick={() => { logout(); navigate('/login', { replace: true }) }}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-xl text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-400/8 transition-all"
          >
            <LogOut size={15} />
            {t('nav.logout')}
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center`}>
              <span className="text-[9px] font-bold text-white">{initials}</span>
            </div>
            <span className="text-[13px] text-zinc-500 truncate">{user?.name ?? ''}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 px-3 py-1.5">
            <Link to="/privacy" className="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors">Privacidad</Link>
            <span className="text-zinc-800 text-[10px]">·</span>
            <Link to="/terms"   className="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors">Términos</Link>
            <span className="text-zinc-800 text-[10px]">·</span>
            <Link to="/cookies" className="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors">Cookies</Link>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom bar ─────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-zinc-950 border-t border-white/5 flex items-stretch safe-area-pb">
        {NAV_MAIN.map(item => (
          <BottomNavItem key={item.path} path={item.path} icon={item.icon} label={item.mobileLabel} />
        ))}
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
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-zinc-900 rounded-t-2xl border-t border-white/8 pb-safe">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Menú</span>
              <button onClick={() => setMoreOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-4 pb-6 space-y-4">
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2">Tools</p>
                <div className="space-y-1">
                  {NAV_TOOLS.map(item => {
                    const isActive   = pathname === item.path || pathname.startsWith(item.path + '/')
                    const itemLocked = item.requiredTier === 'pro' && proLocked
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleMoreNav(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                          isActive    ? 'bg-indigo-500/15 text-indigo-400'
                          : itemLocked ? 'text-zinc-600 hover:bg-white/5'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                        }`}
                      >
                        <item.icon size={16} />
                        <span className="flex-1">{item.label}</span>
                        {itemLocked && <Lock size={11} className="text-zinc-600 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <button
                onClick={() => { setMoreOpen(false); logout(); navigate('/login', { replace: true }) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/8 transition-all text-left"
              >
                <LogOut size={16} />
                {t('nav.logout')}
              </button>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Link to="/privacy" onClick={() => setMoreOpen(false)} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">Privacidad</Link>
                <span className="text-zinc-700 text-[11px]">·</span>
                <Link to="/terms"   onClick={() => setMoreOpen(false)} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">Términos</Link>
                <span className="text-zinc-700 text-[11px]">·</span>
                <Link to="/cookies" onClick={() => setMoreOpen(false)} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
