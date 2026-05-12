import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

export function InfoTooltip({
  text,
  align = 'right',
  prominent = false,
}: {
  text: string
  align?: 'left' | 'right'
  prominent?: boolean
}) {
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
        className={
          prominent
            ? 'w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 hover:text-indigo-300 hover:border-indigo-400/50 transition-all shadow-md'
            : 'w-5 h-5 rounded-full flex items-center justify-center text-zinc-700 hover:text-zinc-400 hover:bg-white/6 transition-colors'
        }
        aria-label="Más información"
      >
        <Info size={prominent ? 15 : 11} />
      </button>
      {show && (
        <div
          className={`absolute top-full mt-2 bg-zinc-800 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-zinc-300 leading-relaxed z-50 shadow-2xl ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${prominent ? 'w-72' : 'w-56'}`}
        >
          {text}
        </div>
      )}
    </div>
  )
}
