import { useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-end sm:items-center justify-center sm:p-4">
        <div className={cn(
          'relative w-full bg-surface-container-lowest shadow-xl',
          'rounded-t-2xl sm:rounded-2xl',
          sizes[size]
        )}>
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 bg-outline-variant/50 rounded-full" />
          </div>
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <h2 className="text-base font-semibold text-on-surface">{title}</h2>
              <button onClick={onClose} className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          )}
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  )
}
