import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useRewards } from '@/hooks/useRewards'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { InboxPanel } from '@/components/InboxPanel'

const primaryItems = [
  { to: '/', icon: 'dashboard', labelKey: 'nav.overview', end: true },
  { to: '/fondos', icon: 'account_balance_wallet', labelKey: 'nav.fondos' },
  { to: '/reminders', icon: 'notifications', labelKey: 'nav.reminders' },
  { to: '/assistant', icon: 'auto_awesome', labelKey: 'nav.assistant' },
]

const moreItems = [
  { to: '/journal', icon: 'menu_book', labelKey: 'nav.journal' },
  { to: '/reports', icon: 'analytics', labelKey: 'nav.reports' },
  { to: '/rewards', icon: 'card_giftcard', labelKey: 'nav.rewards' },
  { to: '/profile', icon: 'manage_accounts', labelKey: 'nav.profile' },
]

const INBOX_ITEM = { icon: 'inbox', labelKey: 'inbox.title' }

export function BottomNav() {
  const { t } = useTranslation()
  const { data: rewards } = useRewards()
  const { data: inboxData } = useNotifications()
  const { signOut } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const [inboxOpen, setInboxOpen] = useState(false)
  const unseenCount = rewards?.unseen_count ?? 0
  const unreadCount = inboxData?.unreadCount ?? 0

  return (
    <>
      <InboxPanel open={inboxOpen} onClose={() => setInboxOpen(false)} />

      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute bottom-16 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/20 rounded-t-2xl shadow-2xl px-4 pt-4 pb-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-8 h-1 bg-outline-variant/50 rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-4 gap-1">
              {moreItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) => cn(
                    'flex flex-col items-center gap-1 py-3 rounded-xl transition-colors',
                    isActive ? 'bg-tertiary/10 text-tertiary' : 'text-on-surface-variant hover:bg-surface-container'
                  )}
                >
                  <span className="relative">
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    {item.to === '/rewards' && unseenCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {unseenCount > 9 ? '9+' : unseenCount}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium leading-tight text-center">{t(item.labelKey)}</span>
                </NavLink>
              ))}
              {/* Inbox button */}
              <button
                onClick={() => { setMoreOpen(false); setInboxOpen(true) }}
                className="flex flex-col items-center gap-1 py-3 rounded-xl transition-colors text-on-surface-variant hover:bg-surface-container"
              >
                <span className="relative">
                  <span className="material-symbols-outlined text-[22px]">{INBOX_ITEM.icon}</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium leading-tight text-center">{t(INBOX_ITEM.labelKey)}</span>
              </button>
            </div>
            <button
              onClick={() => { setMoreOpen(false); signOut() }}
              className="w-full flex items-center justify-center gap-2 mt-2 pt-3 pb-1 border-t border-outline/10 text-sm text-red-500"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              {t('nav.signOut')}
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20">
        <div className="flex items-stretch h-16">
          {primaryItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => moreOpen && setMoreOpen(false)}
              className={({ isActive }) => cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                isActive ? 'text-tertiary' : 'text-on-surface-variant'
              )}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(o => !o)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              moreOpen ? 'text-tertiary' : 'text-on-surface-variant'
            )}
          >
            <span className="relative">
              <span className="material-symbols-outlined text-[22px]">more_horiz</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{t('nav.more')}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
