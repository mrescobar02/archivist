import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SystemNotification } from '@/types'

async function fetchNotifications(): Promise<{ notifications: SystemNotification[]; readIds: Set<string> }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { notifications: [], readIds: new Set() }

  const [{ data: notifs }, { data: reads }] = await Promise.all([
    supabase
      .from('system_notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_notification_reads')
      .select('notification_id')
      .eq('user_id', user.id),
  ])

  const readIds = new Set((reads ?? []).map((r: { notification_id: string }) => r.notification_id))
  return { notifications: notifs ?? [], readIds }
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 60_000,
    select: (data) => ({
      ...data,
      unreadCount: data.notifications.filter(n => !data.readIds.has(n.id)).length,
    }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || notificationIds.length === 0) return
      await supabase.from('user_notification_reads').upsert(
        notificationIds.map(id => ({ user_id: user.id, notification_id: id })),
        { onConflict: 'user_id,notification_id' }
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

// ─── Admin helpers (only used in /admin/notifications) ────────────────────────

export async function adminFetchAllNotifications(): Promise<SystemNotification[]> {
  const { data } = await supabase
    .from('system_notifications')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function adminCreateNotification(payload: Pick<SystemNotification, 'title' | 'body' | 'type'>): Promise<SystemNotification> {
  const { data, error } = await supabase
    .from('system_notifications')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminToggleNotification(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase
    .from('system_notifications')
    .update({ is_active })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function adminDeleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('system_notifications')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
