export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value + (value.length === 10 ? 'T00:00:00' : '')) : value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelative(value: string): string {
  const d = new Date(value + (value.length === 10 ? 'T00:00:00' : ''))
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0) return `In ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
