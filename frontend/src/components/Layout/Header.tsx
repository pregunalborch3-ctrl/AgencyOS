import { Bell } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur border-b border-white/5 px-4 py-5 md:px-8 md:py-6 flex items-center justify-between">
      <div>
        <p className="text-zinc-500 text-sm">Configuración</p>
        <h1 className="text-2xl font-black text-white mt-0.5">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center justify-center w-9 h-9 rounded-xl text-zinc-600 hover:bg-white/5 hover:text-zinc-300 transition-all relative">
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
