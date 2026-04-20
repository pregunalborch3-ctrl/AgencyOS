import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <span className="text-sm font-black text-zinc-500">AgencyOS</span>
          <span className="text-xs text-zinc-700">© {year}</span>
        </div>

        {/* Legal links */}
        <nav className="flex items-center gap-6">
          <Link to="/privacy" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Privacidad
          </Link>
          <Link to="/terms" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Términos
          </Link>
          <Link to="/cookies" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Cookies
          </Link>
          <a
            href="mailto:pregunalborch3@gmail.com"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Contacto
          </a>
        </nav>
      </div>
    </footer>
  )
}
