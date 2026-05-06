import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFixedExpenses, useUpdateFixedExpense, useCreateFixedExpense, useDeleteFixedExpense } from '@/hooks/useFixedExpenses'
import { useQuery } from '@tanstack/react-query'
import * as api from '@/services/api'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Badge } from '@/components/primitives/Badge'
import { Modal } from '@/components/primitives/Modal'
import { Input } from '@/components/primitives/Input'
import { Select } from '@/components/primitives/Select'
import { CardShimmer } from '@/components/feedback/LoadingShimmer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatDate, formatCurrency } from '@/lib/format'
import type { FixedExpense } from '@/types'

interface FixedExpenseForm { name: string; amount: string; payment_day: string; frequency: string; renewal_date: string; is_active: boolean }
const emptyForm: FixedExpenseForm = { name: '', amount: '', payment_day: '1', frequency: 'monthly', renewal_date: '', is_active: true }

function urgencyColor(days: number): 'error' | 'warning' | 'default' {
  if (days < 0) return 'error'
  if (days <= 3) return 'warning'
  return 'default'
}

export function RemindersPage() {
  const { t } = useTranslation()

  const urgencyLabel = (days: number) => {
    if (days < 0) return t('reminders.overdueBy', { days: Math.abs(days) })
    if (days === 0) return t('reminders.dueToday')
    if (days === 1) return t('reminders.dueTomorrow')
    return t('reminders.dueInDays', { days })
  }

  const { data: allFixed, isLoading: loadingAll, error: errorAll, refetch: refetchAll } = useFixedExpenses()
  const { data: upcoming30, isLoading: loadingUpcoming, refetch: refetchUpcoming } = useQuery({
    queryKey: ['fixed-expenses-upcoming-30'],
    queryFn: () => api.getUpcomingFixedExpenses(30),
  })
  const updateFixed = useUpdateFixedExpense()
  const createFixed = useCreateFixedExpense()
  const deleteFixed = useDeleteFixedExpense()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FixedExpense | null>(null)
  const [form, setForm] = useState<FixedExpenseForm>(emptyForm)

  const refetch = () => { refetchAll(); refetchUpcoming() }

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (fe: FixedExpense) => {
    setEditing(fe)
    setForm({ name: fe.name, amount: String(fe.amount), payment_day: String(fe.payment_day), frequency: fe.frequency, renewal_date: fe.renewal_date ?? '', is_active: fe.is_active })
    setOpen(true)
  }

  const markPaid = (id: number) => {
    const today = new Date().toISOString().slice(0, 10)
    updateFixed.mutate({ id, data: { last_paid: today } }, { onSuccess: refetch })
  }

  const handleSubmit = () => {
    const payload = { name: form.name, amount: Number(form.amount), payment_day: Number(form.payment_day), frequency: form.frequency as 'monthly' | 'weekly' | 'yearly', renewal_date: form.renewal_date || null, is_active: form.is_active, category_id: null, last_paid: null, account_id: null }
    if (editing) {
      updateFixed.mutate({ id: editing.id, data: payload }, { onSuccess: () => { setOpen(false); refetch() } })
    } else {
      createFixed.mutate(payload, { onSuccess: () => { setOpen(false); refetch() } })
    }
  }

  const f = (k: keyof FixedExpenseForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const freqLabel = (freq: string) => {
    if (freq === 'monthly') return t('common.monthly')
    if (freq === 'yearly') return t('common.yearly')
    return t('common.weekly')
  }

  if (loadingAll || loadingUpcoming) return (
    <div className="p-8 space-y-4">{Array.from({ length: 4 }).map((_, i) => <CardShimmer key={i} />)}</div>
  )
  if (errorAll) return <ErrorState onRetry={refetch} />

  const overdue = upcoming30?.overdue ?? []
  const soon = (upcoming30?.upcoming ?? []).filter(p => p.days_until_due <= 7)
  const later = (upcoming30?.upcoming ?? []).filter(p => p.days_until_due > 7)
  const inactive = (allFixed ?? []).filter(fe => !fe.is_active)
  const totalMonthly = (allFixed ?? []).filter(fe => fe.is_active && fe.frequency === 'monthly').reduce((sum, fe) => sum + fe.amount, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t('reminders.title')}</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('reminders.subtitle', { total: formatCurrency(totalMonthly) })}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <span className="material-symbols-outlined text-sm">add</span> {t('reminders.addService')}
        </Button>
      </div>

      {overdue.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-error mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">warning</span>
            {t('reminders.overdue', { count: overdue.length })}
          </h3>
          <div className="space-y-2">
            {overdue.map(p => (
              <Card key={p.id} className="border border-error/20 bg-error/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-base text-error">payment</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{p.name}</p>
                      <p className="text-xs text-error">{urgencyLabel(p.days_until_due)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(p.amount)}</span>
                    <Button size="sm" variant="secondary" onClick={() => markPaid(p.id)} loading={updateFixed.isPending}>
                      {t('reminders.markPaid')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {soon.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {t('reminders.soon', { count: soon.length })}
          </h3>
          <div className="space-y-2">
            {soon.map(p => (
              <Card key={p.id} className="group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-base text-on-surface-variant">event</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{p.name}</p>
                      <p className="text-xs text-on-surface-variant">{urgencyLabel(p.days_until_due)} · {formatDate(p.next_due_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={urgencyColor(p.days_until_due)}>{urgencyLabel(p.days_until_due)}</Badge>
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(p.amount)}</span>
                    <Button size="sm" variant="secondary" onClick={() => markPaid(p.id)} loading={updateFixed.isPending}>
                      {t('reminders.paid')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {later.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            {t('reminders.later', { count: later.length })}
          </h3>
          <div className="space-y-2">
            {later.map(p => (
              <Card key={p.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-base text-on-surface-variant">subscriptions</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{p.name}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(p.next_due_date)} · {urgencyLabel(p.days_until_due)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(p.amount)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {overdue.length === 0 && soon.length === 0 && later.length === 0 && (
        <Card className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">check_circle</span>
          <p className="text-sm font-medium text-on-surface">{t('reminders.allGood')}</p>
          <p className="text-xs text-on-surface-variant mt-1">{t('reminders.noUpcoming')}</p>
          {allFixed?.length === 0 && (
            <Button size="sm" className="mt-4" onClick={openCreate}>{t('reminders.addFirst')}</Button>
          )}
        </Card>
      )}

      {(allFixed?.filter(fe => fe.is_active) ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">list</span>
            {t('reminders.allActive')}
          </h3>
          <div className="space-y-2">
            {(allFixed ?? []).filter(fe => fe.is_active).map(fe => (
              <Card key={fe.id} className="group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{fe.name}</p>
                    <p className="text-xs text-on-surface-variant capitalize">
                      {freqLabel(fe.frequency)}
                      {fe.renewal_date && ` · ${t('reminders.renewal', { date: formatDate(fe.renewal_date) })}`}
                      {fe.last_paid && ` · ${t('reminders.lastPaid', { date: formatDate(fe.last_paid) })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-medium tabular-nums mr-2">{formatCurrency(fe.amount)}</span>
                    <button onClick={() => openEdit(fe)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onClick={() => deleteFixed.mutate(fe.id, { onSuccess: refetch })} className="p-1 rounded text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                  <span className="text-sm font-medium tabular-nums group-hover:hidden">{formatCurrency(fe.amount)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">{t('reminders.inactive')}</h3>
          <div className="space-y-2">
            {inactive.map(fe => (
              <Card key={fe.id} className="opacity-50 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-on-surface line-through">{fe.name}</p>
                    <p className="text-xs text-on-surface-variant">{formatCurrency(fe.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => updateFixed.mutate({ id: fe.id, data: { is_active: true } }, { onSuccess: refetch })}>
                      {t('reminders.reactivate')}
                    </Button>
                    <button onClick={() => deleteFixed.mutate(fe.id, { onSuccess: refetch })} className="p-1 rounded text-on-surface-variant hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('reminders.editTitle') : t('reminders.addTitle')}>
        <div className="space-y-4">
          <Input label={t('reminders.serviceName')} value={form.name} onChange={f('name')} placeholder={t('reminders.egService')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.amount')} type="number" min="0" step="0.01" value={form.amount} onChange={f('amount')} />
            <Input label={t('reminders.paymentDay')} type="number" min="1" max="31" value={form.payment_day} onChange={f('payment_day')} />
          </div>
          <Select label={t('reminders.frequency')} value={form.frequency} onChange={f('frequency')}
            options={[
              { value: 'monthly', label: t('common.monthly') },
              { value: 'weekly', label: t('common.weekly') },
              { value: 'yearly', label: t('common.yearly') },
            ]} />
          <Input label={t('reminders.renewalDate')} type="date" value={form.renewal_date} onChange={f('renewal_date')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={createFixed.isPending || updateFixed.isPending} onClick={handleSubmit}>
              {editing ? t('common.saveChanges') : t('reminders.addService')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
