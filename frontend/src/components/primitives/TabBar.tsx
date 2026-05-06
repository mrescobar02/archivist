import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: string
}

interface TabBarProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function TabBar({ tabs, active, onChange, className }: TabBarProps) {
  return (
    <div className={cn('flex gap-1 border-b border-outline-variant/30', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
            active === tab.id
              ? 'border-on-surface text-on-surface'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
          )}
        >
          {tab.icon && <span className="material-symbols-outlined text-lg">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
