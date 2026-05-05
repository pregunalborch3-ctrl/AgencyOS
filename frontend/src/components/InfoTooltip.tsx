import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

export function InfoTooltip({ text, align = 'right' }: { text: string; align?: 'left' | 'right' }) {
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [show])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-700 hover:text-zinc-400 hover:bg-white/6 transition-colors"
        aria-label="Más información"
      >
        <Info size={11} />
      </button>
      {show && (
        <div
          className={`absolute top-full mt-2 w-56 bg-zinc-800 border border-white/10 rounded-xl px-3.5 py-3 text-xs text-zinc-300 leading-relaxed z-50 shadow-2xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {text}
        </div>
      )}
    </div>
  )
}
