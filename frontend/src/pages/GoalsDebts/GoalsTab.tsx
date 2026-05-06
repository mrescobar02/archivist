import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Modal } from '@/components/primitives/Modal'
import { Input } from '@/components/primitives/Input'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { Amount } from '@/components/primitives/Amount'
import { CardShimmer } from '@/components/feedback/LoadingShimmer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatDate, formatCurrency } from '@/lib/format'
import type { Goal } from '@/types'

interface GoalForm { name: string; target_amount: string; current_amount: string; target_date: string; icon: string }
const empty: GoalForm = { name: '', target_amount: '', current_amount: '0', target_date: '', icon: '🎯' }

export function GoalsTab() {
  const { t } = useTranslation()
  const { data: goals, isLoading, error, refetch } = useGoals()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalForm>(empty)

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (g: Goal) => {
    setEditing(g)
    setForm({ name: g.name, target_amount: String(g.target_amount), current_amount: String(g.current_amount), target_date: g.target_date || '', icon: g.icon || '🎯' })
    setOpen(true)
  }

  const handleSubmit = () => {
    const payload = { name: form.name, target_amount: Number(form.target_amount), current_amount: Number(form.current_amount), target_date: form.target_date || null, icon: form.icon }
    if (editing) {
      updateGoal.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) })
    } else {
      createGoal.mutate(payload, { onSuccess: () => setOpen(false) })
    }
  }

  const f = (k: keyof GoalForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => <CardShimmer key={i} />)}
    </div>
  )
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-on-surface-variant">{t('goalsDebts.goals.count', { count: goals?.length ?? 0 })}</p>
        <Button size="sm" onClick={openCreate}>
          <span className="material-symbols-outlined text-sm">add</span> {t('goalsDebts.goals.newGoal')}
        </Button>
      </div>

      {!goals?.length ? (
        <div className="text-center py-16 text-on-surface-variant text-sm">{t('goalsDebts.goals.noGoals')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map(g => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
            const done = pct >= 100
            return (
              <Card key={g.id} className="group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{g.icon || '🎯'}</span>
                    <div>
                      <p className="font-semibold text-on-surface">{g.name}</p>
                      {g.target_date && <p className="text-xs text-on-surface-variant">{t('goalsDebts.goals.target', { date: formatDate(g.target_date) })}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(g)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onClick={() => deleteGoal.mutate(g.id)} className="p-1 rounded text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-on-surface">{formatCurrency(g.current_amount)}</span>
                    <span className="text-on-surface-variant">{formatCurrency(g.target_amount)}</span>
                  </div>
                  <ProgressBar value={pct} color={done ? 'success' : 'default'} />
                  <p className="text-xs text-on-surface-variant mt-1.5">{pct.toFixed(0)}% {t('goalsDebts.goals.achieved')}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('goalsDebts.goals.editTitle') : t('goalsDebts.goals.createTitle')}>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Input label={t('goalsDebts.goals.icon')} value={form.icon} onChange={f('icon')} className="col-span-1 text-center text-xl" />
            <div className="col-span-3"><Input label={t('goalsDebts.goals.goalName')} value={form.name} onChange={f('name')} placeholder={t('goalsDebts.goals.egEmergencyFund')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('goalsDebts.goals.targetAmount')} type="number" min="0" step="0.01" value={form.target_amount} onChange={f('target_amount')} />
            <Input label={t('goalsDebts.goals.currentAmount')} type="number" min="0" step="0.01" value={form.current_amount} onChange={f('current_amount')} />
          </div>
          <Input label={t('goalsDebts.goals.targetDate')} type="date" value={form.target_date} onChange={f('target_date')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={createGoal.isPending || updateGoal.isPending} onClick={handleSubmit}>
              {editing ? t('common.saveChanges') : t('goalsDebts.goals.createGoal')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
