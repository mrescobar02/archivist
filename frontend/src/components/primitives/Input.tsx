import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface',
          'placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-tertiary focus:border-tertiary',
          error && 'border-error focus:ring-error focus:border-error',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
