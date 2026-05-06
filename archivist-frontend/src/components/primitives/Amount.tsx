import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

interface AmountProps {
  value: number
  positive?: boolean
  negative?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-2xl font-bold' }

export function Amount({ value, positive, negative, className, size = 'md' }: AmountProps) {
  const isPositive = positive || (!negative && value > 0)
  const isNegative = negative || (!positive && value < 0)

  return (
    <span className={cn(
      'font-medium tabular-nums',
      isPositive && 'text-soft-green',
      isNegative && 'text-error',
      !isPositive && !isNegative && 'text-on-surface',
      sizes[size],
      className
    )}>
      {formatCurrency(Math.abs(value))}
    </span>
  )
}
