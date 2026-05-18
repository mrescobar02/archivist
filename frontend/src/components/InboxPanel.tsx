import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useNotifications, useMarkAllRead } from '@/hooks/useNotifications'
import type { SystemNotification, NotificationType } from '@/types'

const TYPE_STYLES: Record<NotificationType, { bg: string; icon: string; iconColor: string }> = {
  info:    { bg: 'bg-blue-50 border-blue-100',    icon: 'info',             iconColor: 'text-blue-500' },
  success: { bg: 'bg-emerald-50 border-emerald-100', icon: 'check_circle', iconColor: 'text-emerald-500' },
  warning: { bg: 'bg-amber-50 border-amber-100',  icon: 'warning',          iconColor: 'text-amber-500' },
}

function NotificationCard({ n, isRead }: { n: SystemNotification; isRead: boolean }) {
  const { i18n } = useTranslation()
  const style = TYPE_STYLES[n.type]
  return (
    <div className={cn(
      'relative border rounded-xl p-3.5 transition-opacity',
      style.bg,
      isRead && 'opacity-60'
    )}>
      {!isRead && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500" />
      )}
      <div className="flex items-start gap-2.5">
        <span className={cn('material-symbols-outlined text-[20px] mt-0.5 flex-shrink-0', style.iconColor)}>
          {style.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface leading-snug">{n.title}</p>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{n.body}</p>
          <p className="text-[10px] text-on-surface-variant/60 mt-2">
            {new Date(n.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}

interface InboxPanelProps {
  open: boolean
  onClose: () => void
}

export function InboxPanel({ open, onClose }: InboxPanelProps) {
  const { t } = useTranslation()
  const { data } = useNotifications()
  const markAllRead = useMarkAllRead()

  // Mark all as read when panel opens
  useEffect(() => {
    if (!open || !data) return
    const unreadIds = data.notifications
      .filter(n => !data.readIds.has(n.id))
      .map(n => n.id)
    if (unreadIds.length > 0) markAllRead.mutate(unreadIds)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const notifications = data?.notifications ?? []

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — slides from right on desktop, bottom sheet on mobile */}
      <div className={cn(
        'fixed z-50 bg-surface-container-lowest shadow-2xl flex flex-col',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 rounded-t-2xl max-h-[80dvh]',
        // Desktop: right panel
        'md:inset-x-auto md:right-4 md:top-4 md:bottom-4 md:w-80 md:rounded-2xl',
      )}>
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 bg-outline-variant/50 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-on-surface-variant">inbox</span>
            <h2 className="text-sm font-semibold text-on-surface">{t('inbox.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-3 opacity-40">inbox</span>
              <p className="text-sm">{t('inbox.empty')}</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationCard key={n.id} n={n} isRead={data?.readIds.has(n.id) ?? false} />
            ))
          )}
        </div>
      </div>
    </>
  )
}
