import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  className?: string
}

const variants = {
  default: 'bg-surface-container text-on-surface-variant',
  success: 'bg-soft-green/10 text-soft-green',
  error: 'bg-error/10 text-error',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-tertiary/10 text-tertiary',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
