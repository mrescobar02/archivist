import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIncomes, useCreateIncome, useUpdateIncome, useDeleteIncome } from '@/hooks/useIncomes'
import { useAccounts } from '@/hooks/useAccounts'
import { Button } from '@/components/primitives/Button'
import { Modal } from '@/components/primitives/Modal'
import { Input } from '@/components/primitives/Input'
import { Select } from '@/components/primitives/Select'
import { Amount } from '@/components/primitives/Amount'
import { LoadingShimmer } from '@/components/feedback/LoadingShimmer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatDate } from '@/lib/format'
import type { Income } from '@/types'

interface IncomeForm { amount: string; date: string; description: string; account_id: string; source: string; type: string }
const empty: IncomeForm = { amount: '', date: new Date().toISOString().slice(0, 10), description: '', account_id: '', source: '', type: 'salary' }
const incomeTypes = ['salary', 'freelance', 'investment', 'rental', 'business', 'gift', 'other']

export function IncomeTab() {
  const { t } = useTranslation()
  const { data: incomes, isLoading, error, refetch } = useIncomes()
  const { data: accounts = [] } = useAccounts()
  const createIncome = useCreateIncome()
  const updateIncome = useUpdateIncome()
  const deleteIncome = useDeleteIncome()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)
  const [form, setForm] = useState<IncomeForm>(empty)

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (inc: Income) => {
    setEditing(inc)
    setForm({ amount: String(inc.amount), date: inc.date, description: inc.description || '', account_id: String(inc.account_id), source: inc.source || '', type: inc.type })
    setOpen(true)
  }

  const handleSubmit = () => {
    const payload = { amount: Number(form.amount), date: form.date, description: form.description, account_id: Number(form.account_id), source: form.source, type: form.type }
    if (editing) {
      updateIncome.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) })
    } else {
      createIncome.mutate(payload, { onSuccess: () => setOpen(false) })
    }
  }

  const f = (k: keyof IncomeForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  if (isLoading) return <LoadingShimmer />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-on-surface-variant">{t('overview.income.records', { count: incomes?.length ?? 0 })}</p>
        <Button size="sm" onClick={openCreate}>
          <span className="material-symbols-outlined text-sm">add</span> {t('overview.income.addIncome')}
        </Button>
      </div>

      {!incomes?.length ? (
        <div className="text-center py-16 text-on-surface-variant text-sm">{t('overview.income.noIncome')}</div>
      ) : (
        <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(100vh-18rem)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">{t('common.date')}</th>
                <th className="text-left px-4 py-3">{t('common.description')}</th>
                <th className="text-left px-4 py-3">{t('common.type')}</th>
                <th className="text-left px-4 py-3">{t('common.account')}</th>
                <th className="text-right px-4 py-3">{t('common.amount')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {incomes.map(inc => (
                <tr key={inc.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-4 py-3 text-on-surface-variant">{formatDate(inc.date)}</td>
                  <td className="px-4 py-3 font-medium text-on-surface">{inc.description || '—'}</td>
                  <td className="px-4 py-3 capitalize text-on-surface-variant">{inc.type}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{accounts.find(a => a.id === inc.account_id)?.name || '—'}</td>
                  <td className="px-4 py-3 text-right"><Amount value={inc.amount} positive /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(inc)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => deleteIncome.mutate(inc.id)} className="p-1 rounded text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('overview.income.editTitle') : t('overview.income.addTitle')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.amount')} type="number" min="0" step="0.01" value={form.amount} onChange={f('amount')} />
            <Input label={t('common.date')} type="date" value={form.date} onChange={f('date')} />
          </div>
          <Input label={t('common.description')} value={form.description} onChange={f('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('common.type')} value={form.type} onChange={f('type')}
              options={incomeTypes.map(tp => ({ value: tp, label: tp.charAt(0).toUpperCase() + tp.slice(1) }))} />
            <Select label={t('common.account')} value={form.account_id} onChange={f('account_id')}
              placeholder={t('common.selectAccount')}
              options={accounts.map(a => ({ value: a.id, label: a.name }))} />
          </div>
          <Input label={t('overview.income.source')} value={form.source} onChange={f('source')} placeholder={t('overview.income.egEmployer')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={createIncome.isPending || updateIncome.isPending} onClick={handleSubmit}>
              {editing ? t('common.saveChanges') : t('overview.income.addIncome')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
