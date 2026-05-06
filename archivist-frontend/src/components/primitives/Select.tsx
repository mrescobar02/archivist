import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string | number; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface',
          'focus:outline-none focus:ring-1 focus:ring-tertiary focus:border-tertiary appearance-none',
          error && 'border-error',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'
