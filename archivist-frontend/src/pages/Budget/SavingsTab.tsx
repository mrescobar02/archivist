import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSavingsFunds, useContributions, useCreateSavingsFund, useDeleteSavingsFund, useCreateContribution, useDeleteContribution } from '@/hooks/useSavings'
import { useGoals } from '@/hooks/useGoals'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Modal } from '@/components/primitives/Modal'
import { Input } from '@/components/primitives/Input'
import { Select } from '@/components/primitives/Select'
import { CardShimmer } from '@/components/feedback/LoadingShimmer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatCurrency, formatDate } from '@/lib/format'
import type { SavingsFund } from '@/types'

interface FundForm { name: string; goal_id: string }
const emptyFund: FundForm = { name: '', goal_id: '' }

function ContributionsPanel({ fund }: { fund: SavingsFund }) {
  const { t } = useTranslation()
  const { data: contribs } = useContributions(fund.id)
  const createContribution = useCreateContribution()
  const deleteContribution = useDeleteContribution()
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' })

  const handleAdd = () => {
    createContribution.mutate({ fund_id: fund.id, amount: Number(form.amount), date: form.date, note: form.note },
      { onSuccess: () => setForm(p => ({ ...p, amount: '', note: '' })) })
  }

  return (
    <div className="mt-4 pt-4 border-t border-outline-variant/20">
      <div className="flex gap-2 mb-3">
        <input type="number" min="0.01" step="0.01" placeholder={t('common.amount')} value={form.amount}
          onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
          className="flex-1 rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-tertiary" />
        <input type="date" value={form.date}
          onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
          className="rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-tertiary" />
        <Button size="sm" loading={createContribution.isPending} onClick={handleAdd} disabled={!form.amount}>
          {t('common.add')}
        </Button>
      </div>
      {contribs && contribs.length > 0 && (
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {contribs.slice(0, 8).map(c => (
            <div key={c.id} className="flex items-center justify-between text-xs py-1">
              <span className="text-on-surface-variant">{formatDate(c.date)}</span>
              <span className="font-medium text-soft-green">+{formatCurrency(c.amount)}</span>
              <button onClick={() => deleteContribution.mutate(c.id)} className="p-0.5 rounded text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined text-sm">remove_circle</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SavingsTab() {
  const { t } = useTranslation()
  const { data: funds, isLoading, error, refetch } = useSavingsFunds()
  const { data: goals = [] } = useGoals()
  const createFund = useCreateSavingsFund()
  const deleteFund = useDeleteSavingsFund()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FundForm>(emptyFund)
  const [expanded, setExpanded] = useState<number | null>(null)

  const handleCreate = () => {
    createFund.mutate({ name: form.name, goal_id: form.goal_id ? Number(form.goal_id) : null },
      { onSuccess: () => { setOpen(false); setForm(emptyFund) } })
  }

  const f = (k: keyof FundForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => <CardShimmer key={i} />)}
    </div>
  )
  if (error) return <ErrorState onRetry={() => refetch()} />

  const totalSavings = funds?.reduce((s, f) => s + f.amount, 0) ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t('budget.savings.totalSavings')}</p>
          <p className="text-2xl font-bold text-soft-green">{formatCurrency(totalSavings)}</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <span className="material-symbols-outlined text-sm">add</span> {t('budget.savings.newFund')}
        </Button>
      </div>

      {!funds?.length ? (
        <div className="text-center py-16 text-on-surface-variant text-sm">{t('budget.savings.noFunds')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {funds.map(fund => {
            const linkedGoal = goals.find(g => g.id === fund.goal_id)
            const isExpanded = expanded === fund.id
            return (
              <Card key={fund.id} className="group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-on-surface">{fund.name}</p>
                    {linkedGoal && <p className="text-xs text-tertiary">{linkedGoal.icon} {linkedGoal.name}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteFund.mutate(fund.id)} className="p-1 rounded text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
                <p className="text-2xl font-bold text-soft-green">{formatCurrency(fund.amount)}</p>
                <button onClick={() => setExpanded(isExpanded ? null : fund.id)}
                  className="mt-3 text-xs text-tertiary hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                  {isExpanded ? t('budget.savings.hide') : t('budget.savings.manage')} {t('budget.savings.contributions')}
                </button>
                {isExpanded && <ContributionsPanel fund={fund} />}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('budget.savings.addFundTitle')}>
        <div className="space-y-4">
          <Input label={t('budget.savings.fundName')} value={form.name} onChange={f('name')} placeholder={t('budget.savings.egEmergencyFund')} />
          <Select label={t('budget.savings.linkGoal')} value={form.goal_id} onChange={f('goal_id')}
            placeholder={t('budget.savings.noGoal')}
            options={goals.map(g => ({ value: g.id, label: `${g.icon || '🎯'} ${g.name}` }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={createFund.isPending} onClick={handleCreate}>{t('budget.savings.createFund')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
