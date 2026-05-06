import { cn } from '@/lib/utils'

interface LoadingShimmerProps {
  rows?: number
  className?: string
}

export function LoadingShimmer({ rows = 3, className }: LoadingShimmerProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex gap-4 items-center">
          <div className="h-10 w-10 rounded-lg bg-surface-container flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-surface-container rounded w-3/4" />
            <div className="h-3 bg-surface-container rounded w-1/2" />
          </div>
          <div className="h-4 bg-surface-container rounded w-20" />
        </div>
      ))}
    </div>
  )
}

export function CardShimmer({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-6', className)}>
      <div className="h-4 bg-surface-container rounded w-1/3 mb-4" />
      <div className="h-8 bg-surface-container rounded w-1/2 mb-2" />
      <div className="h-3 bg-surface-container rounded w-2/3" />
    </div>
  )
}
