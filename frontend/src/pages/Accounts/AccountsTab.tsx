import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/useAccounts'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useGoalContributions, useCreateGoalContribution, useDeleteGoalContribution } from '@/hooks/useGoals'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Modal } from '@/components/primitives/Modal'
import { Input } from '@/components/primitives/Input'
import { Select } from '@/components/primitives/Select'
import { Amount } from '@/components/primitives/Amount'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { CardShimmer } from '@/components/feedback/LoadingShimmer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Account, Goal } from '@/types'

const accountTypeIcons: Record<string, string> = {
  checking: 'account_balance',
  savings: 'savings',
  cash: 'payments',
  investment: 'trending_up',
}
const accountTypes = ['checking', 'savings', 'cash', 'investment']

interface AccountForm { name: string; type: string; initial_balance: string }
const emptyAccount: AccountForm = { name: '', type: 'checking', initial_balance: '0' }

interface GoalForm { name: string; target_amount: string; target_date: string; icon: string }
const emptyGoal: GoalForm = { name: '', target_amount: '', target_date: '', icon: '🎯' }

function GoalContributionsModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { t } = useTranslation()
  const { data: contribs, isLoading } = useGoalContributions(goal.id)
  const createContribution = useCreateGoalContribution()
  const deleteContribution = useDeleteGoalContribution()
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10) })

  const handleAdd = () => {
    if (!form.amount) return
    createContribution.mutate(
      { goal_id: goal.id, data: { amount: Number(form.amount), date: form.date } },
      { onSuccess: () => setForm(p => ({ ...p, amount: '' })) }
    )
  }

  return (
    <Modal open onClose={onClose} title={t('fondos.contributionsFor', { name: goal.name })} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs text-on-surface-variant uppercase tracking-wider mb-3">
            {t('fondos.addContribution')}
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('common.amount')} type="number" min="0.01" step="0.01" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
              <Input label={t('common.date')} type="date" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <Button className="w-full" loading={createContribution.isPending} onClick={handleAdd} disabled={!form.amount}>
              {t('common.add')}
            </Button>
          </div>
        </div>
        <div>
          <h4 className="text-xs text-on-surface-variant uppercase tracking-wider mb-3">
            {t('fondos.contributionHistory')}
          </h4>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 animate-pulse bg-surface-container rounded" />)}</div>
          ) : !contribs?.length ? (
            <p className="text-sm text-on-surface-variant">{t('fondos.noContributions')}</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {contribs.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-outline-variant/20 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-soft-green">+{formatCurrency(c.amount)}</p>
                    <p className="text-xs text-on-surface-variant">{formatDate(c.date)}</p>
                  </div>
                  <button
                    onClick={() => deleteContribution.mutate({ goal_id: goal.id, contribution_id: c.id })}
                    className="p-1 rounded text-on-surface-variant hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export function AccountsTab() {
  const { t } = useTranslation()

  // Accounts
  const { data: accounts, isLoading: loadingAccounts, error: errorAccounts, refetch } = useAccounts()
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccount)

  // Goals
  const { data: goals, isLoading: loadingGoals } = useGoals()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [goalForm, setGoalForm] = useState<GoalForm>(emptyGoal)
  const [contributionsGoal, setContributionsGoal] = useState<Goal | null>(null)

  // Account handlers
  const openCreateAccount = () => { setEditingAccount(null); setAccountForm(emptyAccount); setAccountModalOpen(true) }
  const openEditAccount = (acc: Account) => {
    setEditingAccount(acc)
    setAccountForm({ name: acc.name, type: acc.type, initial_balance: String(acc.initial_balance) })
    setAccountModalOpen(true)
  }
  const handleSubmitAccount = () => {
    const payload = { name: accountForm.name, type: accountForm.type as Account['type'], initial_balance: Number(accountForm.initial_balance) }
    if (editingAccount) {
      updateAccount.mutate({ id: editingAccount.id, data: payload }, { onSuccess: () => setAccountModalOpen(false) })
    } else {
      createAccount.mutate(payload, { onSuccess: () => setAccountModalOpen(false) })
    }
  }

  // Goal handlers
  const openCreateGoal = () => { setEditingGoal(null); setGoalForm(emptyGoal); setGoalModalOpen(true) }
  const openEditGoal = (g: Goal) => {
    setEditingGoal(g)
    setGoalForm({ name: g.name, target_amount: String(g.target_amount), target_date: g.target_date || '', icon: g.icon || '🎯' })
    setGoalModalOpen(true)
  }
  const handleSubmitGoal = () => {
    const base = { name: goalForm.name, target_amount: Number(goalForm.target_amount), target_date: goalForm.target_date || null, icon: goalForm.icon }
    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, data: { ...base, current_amount: editingGoal.current_amount } }, { onSuccess: () => setGoalModalOpen(false) })
    } else {
      createGoal.mutate(base, { onSuccess: () => setGoalModalOpen(false) })
    }
  }

  const af = (k: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAccountForm(p => ({ ...p, [k]: e.target.value }))

  const gf = (k: keyof GoalForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setGoalForm(p => ({ ...p, [k]: e.target.value }))

  if (loadingAccounts || loadingGoals) return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <CardShimmer key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 2 }).map((_, i) => <CardShimmer key={i} />)}
      </div>
    </div>
  )
  if (errorAccounts) return <ErrorState onRetry={() => refetch()} />

  const totalBalance = accounts?.reduce((s, a) => s + Number(a.balance), 0) ?? 0
  const totalGoals = goals?.reduce((s, g) => s + g.current_amount, 0) ?? 0

  return (
    <div className="space-y-10">

      {/* ── Accounts section ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t('accounts.totalBalance')}</p>
            <Amount value={totalBalance} size="xl" positive={totalBalance >= 0} />
          </div>
          <Button size="sm" onClick={openCreateAccount}>
            <span className="material-symbols-outlined text-sm">add</span>
            {t('accounts.addAccount')}
          </Button>
        </div>

        {!accounts?.length ? (
          <div className="text-center py-12 text-on-surface-variant text-sm">{t('accounts.noAccounts')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map(acc => (
              <Card key={acc.id} className="group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">
                        {accountTypeIcons[acc.type] || 'account_balance'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{acc.name}</p>
                      <p className="text-xs text-on-surface-variant capitalize">
                        {t(`accounts.types.${acc.type}` as any, acc.type)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditAccount(acc)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onClick={() => deleteAccount.mutate(acc.id)} className="p-1 rounded text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
                <Amount value={Number(acc.balance)} size="xl" positive={Number(acc.balance) >= 0} />
                <p className="text-xs text-on-surface-variant mt-1">
                  {t('accounts.initialBalance', { amount: formatCurrency(Number(acc.initial_balance)) })}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Divider ── */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-outline-variant/30" />
        <div className="flex items-center gap-2 text-xs text-on-surface-variant uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">flag</span>
          {t('fondos.savingsGoals')}
        </div>
        <div className="flex-1 h-px bg-outline-variant/30" />
      </div>

      {/* ── Goals section ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t('fondos.totalSavingsGoals')}</p>
            <p className="text-2xl font-bold text-soft-green">{formatCurrency(totalGoals)}</p>
          </div>
          <Button size="sm" onClick={openCreateGoal}>
            <span className="material-symbols-outlined text-sm">add</span>
            {t('goalsDebts.goals.newGoal')}
          </Button>
        </div>

        {!goals?.length ? (
          <div className="text-center py-12 text-on-surface-variant text-sm">{t('fondos.noSavingsGoals')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {goals.map(g => {
              const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
              const done = pct >= 100
              return (
                <Card key={g.id} className="group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl flex-shrink-0">{g.icon || '🎯'}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-on-surface truncate">{g.name}</p>
                        {g.target_date && (
                          <p className="text-xs text-on-surface-variant flex items-center gap-0.5 mt-0.5">
                            <span className="material-symbols-outlined text-xs">event</span>
                            {formatDate(g.target_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEditGoal(g)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => deleteGoal.mutate(g.id)} className="p-1 rounded text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-2xl font-bold text-soft-green">{formatCurrency(g.current_amount)}</p>

                  {g.target_amount > 0 && (
                    <div className="mt-2">
                      <ProgressBar value={pct} color={done ? 'success' : 'default'} />
                      <div className="flex justify-between mt-1 text-xs text-on-surface-variant">
                        <span>{pct.toFixed(0)}%</span>
                        <span>{formatCurrency(g.target_amount)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setContributionsGoal(g)}
                    className="mt-3 text-xs text-tertiary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">savings</span>
                    {t('budget.savings.manage')} {t('budget.savings.contributions')}
                  </button>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Goal contributions modal */}
      {contributionsGoal && (
        <GoalContributionsModal goal={contributionsGoal} onClose={() => setContributionsGoal(null)} />
      )}

      {/* Account modal */}
      <Modal open={accountModalOpen} onClose={() => setAccountModalOpen(false)}
        title={editingAccount ? t('accounts.editTitle') : t('accounts.addAccount')}>
        <div className="space-y-4">
          <Input label={t('accounts.accountName')} value={accountForm.name} onChange={af('name')} placeholder={t('accounts.egChase')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('common.type')} value={accountForm.type} onChange={af('type')}
              options={accountTypes.map(tp => ({ value: tp, label: t(`accounts.types.${tp}` as any, tp) }))} />
            <Input label={t('accounts.initialBalanceLabel')} type="number" step="0.01"
              value={accountForm.initial_balance} onChange={af('initial_balance')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAccountModalOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={createAccount.isPending || updateAccount.isPending} onClick={handleSubmitAccount}>
              {editingAccount ? t('common.saveChanges') : t('accounts.addAccount')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Goal modal */}
      <Modal open={goalModalOpen} onClose={() => setGoalModalOpen(false)}
        title={editingGoal ? t('goalsDebts.goals.editTitle') : t('goalsDebts.goals.createTitle')}>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Input label={t('goalsDebts.goals.icon')} value={goalForm.icon} onChange={gf('icon')} className="col-span-1 text-center text-xl" />
            <div className="col-span-3">
              <Input label={t('goalsDebts.goals.goalName')} value={goalForm.name} onChange={gf('name')} placeholder={t('goalsDebts.goals.egEmergencyFund')} />
            </div>
          </div>
          <Input label={t('goalsDebts.goals.targetAmount')} type="number" min="0" step="0.01" value={goalForm.target_amount} onChange={gf('target_amount')} />
          <Input label={t('goalsDebts.goals.targetDate')} type="date" value={goalForm.target_date} onChange={gf('target_date')} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setGoalModalOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={createGoal.isPending || updateGoal.isPending} onClick={handleSubmitGoal}>
              {editingGoal ? t('common.saveChanges') : t('goalsDebts.goals.createGoal')}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
