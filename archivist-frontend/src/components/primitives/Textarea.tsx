import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={3}
        className={cn(
          'w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface resize-none',
          'placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-tertiary focus:border-tertiary',
          error && 'border-error',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'
