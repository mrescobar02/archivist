import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl bg-surface-container-lowest border border-outline-variant/30', paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'
