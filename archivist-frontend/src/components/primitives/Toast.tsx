import { useUiStore } from '@/store/ui'
import { cn } from '@/lib/utils'

export function Toast() {
  const { toast } = useUiStore()

  if (!toast) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div className={cn(
        'flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium',
        toast.variant === 'error' ? 'bg-error text-white' : 'bg-on-surface text-surface-container-lowest'
      )}>
        <span className="material-symbols-outlined text-base">
          {toast.variant === 'error' ? 'error' : 'check_circle'}
        </span>
        {toast.message}
      </div>
    </div>
  )
}
