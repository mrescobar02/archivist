import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  adminFetchAllNotifications,
  adminCreateNotification,
  adminToggleNotification,
  adminDeleteNotification,
} from '@/hooks/useNotifications'
import type { SystemNotification, NotificationType } from '@/types'

const TYPE_STYLES: Record<NotificationType, { bg: string; icon: string; iconColor: string; label: string }> = {
  info:    { bg: 'bg-blue-50 border-blue-100',       icon: 'info',         iconColor: 'text-blue-500',    label: 'Info' },
  success: { bg: 'bg-emerald-50 border-emerald-100', icon: 'check_circle', iconColor: 'text-emerald-500', label: 'Success' },
  warning: { bg: 'bg-amber-50 border-amber-100',     icon: 'warning',      iconColor: 'text-amber-500',   label: 'Warning' },
}

function NotificationPreview({ title, body, type }: { title: string; body: string; type: NotificationType }) {
  const style = TYPE_STYLES[type]
  return (
    <div className={cn('border rounded-xl p-3.5', style.bg)}>
      <div className="flex items-start gap-2.5">
        <span className={cn('material-symbols-outlined text-[20px] mt-0.5 flex-shrink-0', style.iconColor)}>
          {style.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface leading-snug">
            {title || <span className="opacity-40 italic">Título de la notificación</span>}
          </p>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            {body || <span className="opacity-40 italic">Descripción de la notificación...</span>}
          </p>
          <p className="text-[10px] text-on-surface-variant/60 mt-2">
            {new Date().toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}

export function AdminNotificationsPage() {
  const { i18n } = useTranslation()
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<NotificationType>('info')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try { setNotifications(await adminFetchAllNotifications()) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    setError(null)
    try {
      await adminCreateNotification({ title: title.trim(), body: body.trim(), type })
      setTitle('')
      setBody('')
      setType('info')
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (n: SystemNotification) => {
    try {
      await adminToggleNotification(n.id, !n.is_active)
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta notificación?')) return
    try {
      await adminDeleteNotification(id)
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Admin — Notificaciones</h1>
        <p className="text-sm text-on-surface-variant mt-1">Crea y gestiona mensajes del sistema para todos los usuarios.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Form */}
        <form onSubmit={handleCreate} className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-on-surface">Nueva notificación</h2>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Tipo</label>
            <div className="flex gap-2">
              {(Object.keys(TYPE_STYLES) as NotificationType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors',
                    type === t
                      ? cn(TYPE_STYLES[t].bg, 'border-current', TYPE_STYLES[t].iconColor)
                      : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                  )}
                >
                  <span className={cn('material-symbols-outlined text-base', type === t ? TYPE_STYLES[t].iconColor : '')}>
                    {TYPE_STYLES[t].icon}
                  </span>
                  {TYPE_STYLES[t].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Título</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ej. Nueva feature: Reportes mejorados"
              className="w-full text-sm border border-outline-variant/30 rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Descripción</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Describe la actualización o nueva feature..."
              rows={3}
              className="w-full text-sm border border-outline-variant/30 rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:border-primary transition-colors resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving || !title.trim() || !body.trim()}
            className="w-full py-2.5 rounded-lg bg-on-surface text-surface-container-lowest text-sm font-medium hover:bg-on-surface/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Publicando...' : 'Publicar notificación'}
          </button>
        </form>

        {/* Preview */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-on-surface">Preview</h2>
          <p className="text-xs text-on-surface-variant">Así verá el usuario la notificación:</p>
          <NotificationPreview title={title} body={body} type={type} />
        </div>
      </div>

      {/* Existing notifications */}
      <div>
        <h2 className="text-sm font-semibold text-on-surface mb-3">Notificaciones existentes</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-outline-variant border-t-on-surface rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-8">No hay notificaciones aún.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const style = TYPE_STYLES[n.type]
              return (
                <div key={n.id} className={cn(
                  'border rounded-xl p-3.5 flex items-start gap-3',
                  n.is_active ? style.bg : 'bg-neutral-50 border-neutral-200 opacity-60'
                )}>
                  <span className={cn('material-symbols-outlined text-[20px] mt-0.5 flex-shrink-0', n.is_active ? style.iconColor : 'text-neutral-400')}>
                    {style.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-on-surface truncate">{n.title}</p>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0',
                        n.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'
                      )}>
                        {n.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-on-surface-variant/50 mt-1">
                      {new Date(n.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(n)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-black/5 transition-colors"
                      title={n.is_active ? 'Desactivar' : 'Activar'}
                    >
                      <span className="material-symbols-outlined text-base">
                        {n.is_active ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
