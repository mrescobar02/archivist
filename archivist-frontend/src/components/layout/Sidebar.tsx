import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useRewards } from '@/hooks/useRewards'

export function Sidebar() {
  const { t } = useTranslation()
  const { data: rewards } = useRewards()
  const unseenCount = rewards?.unseen_count ?? 0

  const navItems = [
    { to: '/', icon: 'dashboard', label: t('nav.overview'), end: true },
    { to: '/fondos', icon: 'account_balance_wallet', label: t('nav.fondos') },
    { to: '/reminders', icon: 'notifications', label: t('nav.reminders') },
    { to: '/journal', icon: 'menu_book', label: t('nav.journal') },
    { to: '/reports', icon: 'analytics', label: t('nav.reports') },
    { to: '/assistant', icon: 'auto_awesome', label: t('nav.assistant') },
  ]

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 bg-neutral-50 flex flex-col py-6 overflow-y-auto">
      <div className="px-5 mb-8">
        <h1 className="text-lg font-bold text-on-surface tracking-tight">{t('app.name')}</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">{t('app.tagline')}</p>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
              isActive
                ? 'bg-white shadow-sm text-on-surface font-medium'
                : 'text-on-surface-variant hover:bg-neutral-200/50 hover:text-on-surface'
            )}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 mt-2 border-t border-outline/10 pt-2 space-y-0.5">
        <NavLink
          to="/rewards"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
            isActive
              ? 'bg-white shadow-sm text-on-surface font-medium'
              : 'text-on-surface-variant hover:bg-neutral-200/50 hover:text-on-surface'
          )}
        >
          <span className="relative">
            <span className="material-symbols-outlined text-xl">card_giftcard</span>
            {unseenCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unseenCount > 9 ? '9+' : unseenCount}
              </span>
            )}
          </span>
          {t('nav.rewards')}
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
            isActive
              ? 'bg-white shadow-sm text-on-surface font-medium'
              : 'text-on-surface-variant hover:bg-neutral-200/50 hover:text-on-surface'
          )}
        >
          <span className="material-symbols-outlined text-xl">manage_accounts</span>
          {t('nav.profile')}
        </NavLink>
      </div>
      <div className="px-5 mt-3">
        <p className="text-xs text-outline">{t('app.localOnly')}</p>
      </div>
    </aside>
  )
}
