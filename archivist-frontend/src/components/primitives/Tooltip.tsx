import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface TooltipProps {
  text: string
  className?: string
}

export function Tooltip({ text, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, above: true })
  const iconRef = useRef<HTMLButtonElement>(null)

  const show = () => {
    if (!iconRef.current) return
    const r = iconRef.current.getBoundingClientRect()
    const above = r.top > 120
    setPos({
      top: above ? r.top - 8 : r.bottom + 8,
      left: r.left + r.width / 2,
      above,
    })
    setVisible(true)
  }

  useEffect(() => {
    if (!visible) return
    const hide = () => setVisible(false)
    window.addEventListener('scroll', hide, true)
    return () => window.removeEventListener('scroll', hide, true)
  }, [visible])

  return (
    <>
      <button
        ref={iconRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        onFocus={show}
        onBlur={() => setVisible(false)}
        className={cn('inline-flex items-center text-on-surface-variant/50 hover:text-on-surface-variant transition-colors focus:outline-none', className)}
        tabIndex={-1}
        aria-label={text}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
      </button>

      {visible && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            top: pos.above ? pos.top : pos.top,
            left: pos.left,
            transform: pos.above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            zIndex: 9999,
          }}
          className="pointer-events-none"
        >
          <div className="relative bg-on-surface text-surface-container-lowest text-xs rounded-lg px-3 py-2 max-w-[220px] text-center leading-snug shadow-lg">
            {text}
            <span
              className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                [pos.above ? 'top' : 'bottom']: '100%',
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                ...(pos.above
                  ? { borderTop: '5px solid var(--color-on-surface, #1c1b1f)' }
                  : { borderBottom: '5px solid var(--color-on-surface, #1c1b1f)' }),
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
