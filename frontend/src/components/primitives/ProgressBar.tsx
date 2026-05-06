import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  color?: 'default' | 'success' | 'error' | 'tertiary'
}

const colors = {
  default: 'bg-on-surface',
  success: 'bg-soft-green',
  error: 'bg-error',
  tertiary: 'bg-tertiary',
}

export function ProgressBar({ value, max = 100, className, color = 'default' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('w-full h-2 bg-surface-container rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', colors[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
