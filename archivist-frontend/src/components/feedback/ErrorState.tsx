interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <span className="material-symbols-outlined text-4xl text-error">error_outline</span>
      <p className="text-sm text-on-surface-variant">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium text-tertiary hover:underline">
          Try again
        </button>
      )}
    </div>
  )
}
