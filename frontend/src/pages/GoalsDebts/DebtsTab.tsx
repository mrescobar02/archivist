import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebts, useCreateDebt, useUpdateDebt, useDeleteDebt, useDebtPayments, useCreateDebtPayment } from '@/hooks/useDebts'
import { useCreateFixedExpense } from '@/hooks/useFixedExpenses'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Modal } from '@/components/primitives/Modal'
import { Input } from '@/components/primitives/Input'
import { Textarea } from '@/components/primitives/Textarea'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { Amount } from '@/components/primitives/Amount'
import { Badge } from '@/components/primitives/Badge'
import { CardShimmer } from '@/components/feedback/LoadingShimmer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatDate, formatCurrency } from '@/lib/format'
import type { Debt } from '@/types'

interface DebtForm {
  name: string; creditor: string; total_amount: string; remaining_balance: string
  interest_rate: string; minimum_payment: string; cut_date: string; payment_due_day: string
}
const emptyDebt: DebtForm = {
  name: '', creditor: '', total_amount: '', remaining_balance: '',
  interest_rate: '0', minimum_payment: '0', cut_date: '', payment_due_day: '',
}

interface PaymentForm { amount: string; date: string; note: string }
const emptyPayment: PaymentForm = { amount: '', date: new Date().toISOString().slice(0, 10), note: '' }

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function DebtPaymentsModal({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  const { t } = useTranslation()
  const { data: payments, isLoading } = useDebtPayments(debt.id)
  const createPayment = useCreateDebtPayment()
  const [form, setForm] = useState<PaymentForm>(emptyPayment)

  const handleSubmit = () => {
    createPayment.mutate({ debt_id: debt.id, data: { amount: Number(form.amount), date: form.date, note: form.note } },
      { onSuccess: () => setForm(emptyPayment) })
  }

  const f = (k: keyof PaymentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Modal open onClose={onClose} title={t('goalsDebts.debts.paymentsFor', { name: debt.name })} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs text-on-surface-variant uppercase tracking-wider mb-3">{t('goalsDebts.debts.logPayment')}</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('common.amount')} type="number" min="0" step="0.01" value={form.amount} onChange={f('amount')} />
              <Input label={t('common.date')} type="date" value={form.date} onChange={f('date')} />
            </div>
            <Textarea label={t('common.description')} value={form.note} onChange={f('note')} rows={2} />
            <Button className="w-full" loading={createPayment.isPending} onClick={handleSubmit}>{t('goalsDebts.debts.logPayment')}</Button>
          </div>
        </div>
        <div>
          <h4 className="text-xs text-on-surface-variant uppercase tracking-wider mb-3">{t('goalsDebts.debts.history')}</h4>
          {isLoading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 animate-pulse bg-surface-container rounded" />)}</div>
            : !payments?.length ? <p className="text-sm text-on-surface-variant">{t('goalsDebts.debts.noPayments')}</p>
            : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {payments.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-outline-variant/20 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-on-surface">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(p.date)}</p>
                    </div>
                    {p.note && <p className="text-xs text-on-surface-variant max-w-[8rem] truncate">{p.note}</p>}
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </Modal>
  )
}

export function DebtsTab() {
  const { t } = useTranslation()
  const { data: debts, isLoading, error, refetch } = useDebts()
  const createDebt = useCreateDebt()
  const updateDebt = useUpdateDebt()
  const deleteDebt = useDeleteDebt()
  const createFixedExpense = useCreateFixedExpense()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)
  const [form, setForm] = useState<DebtForm>(emptyDebt)
  const [paymentsDebt, setPaymentsDebt] = useState<Debt | null>(null)

  const openCreate = () => { setEditing(null); setForm(emptyDebt); setOpen(true) }
  const openEdit = (d: Debt) => {
    setEditing(d)
    setForm({
      name: d.name, creditor: d.creditor || '', total_amount: String(d.total_amount),
      remaining_balance: String(d.remaining_balance), interest_rate: String(d.interest_rate || 0),
      minimum_payment: String(d.minimum_payment || 0),
      cut_date: d.cut_date ? String(d.cut_date) : '',
      payment_due_day: d.payment_due_day ? String(d.payment_due_day) : '',
    })
    setOpen(true)
  }

  const handleSubmit = () => {
    const payload = {
      name: form.name, creditor: form.creditor,
      total_amount: Number(form.total_amount), remaining_balance: Number(form.remaining_balance),
      interest_rate: Number(form.interest_rate), minimum_payment: Number(form.minimum_payment),
      cut_date: form.cut_date ? Number(form.cut_date) : null,
      payment_due_day: form.payment_due_day ? Number(form.payment_due_day) : null,
    }
    if (editing) {
      updateDebt.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) })
    } else {
      createDebt.mutate(payload, { onSuccess: () => setOpen(false) })
    }
  }

  const handleCreateReminder = (d: Debt) => {
    if (!d.payment_due_day || !d.minimum_payment) return
    createFixedExpense.mutate({
      name: `${t('goalsDebts.debts.paymentOf')} ${d.name}`,
      amount: d.minimum_payment,
      payment_day: d.payment_due_day,
      frequency: 'monthly',
      renewal_date: null,
      last_paid: null,
      is_active: true,
      category_id: null,
      account_id: null,
    })
  }

  const f = (k: keyof DebtForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 2 }).map((_, i) => <CardShimmer key={i} />)}
    </div>
  )
  if (error) return <ErrorState onRetry={() => refetch()} />

  const totalDebt = debts?.reduce((s, d) => s + d.remaining_balance, 0) ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t('goalsDebts.debts.totalRemaining')}</p>
          <Amount value={totalDebt} negative size="xl" />
        </div>
        <Button size="sm" onClick={openCreate}>
          <span className="material-symbols-outlined text-sm">add</span> {t('goalsDebts.debts.addDebt')}
        </Button>
      </div>

      {!debts?.length ? (
        <div className="text-center py-16 text-on-surface-variant text-sm">{t('goalsDebts.debts.noDebts')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debts.map(d => {
            const paid = d.total_amount - d.remaining_balance
            const pct = d.total_amount > 0 ? (paid / d.total_amount) * 100 : 0
            return (
              <Card key={d.id} className="group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-on-surface">{d.name}</p>
                    {d.creditor && <p className="text-xs text-on-surface-variant">{d.creditor}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(d)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onClick={() => deleteDebt.mutate(d.id)} className="p-1 rounded text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-xs text-on-surface-variant">{t('goalsDebts.debts.remaining')}</p>
                    <Amount value={d.remaining_balance} negative />
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">{t('goalsDebts.debts.minPayment')}</p>
                    <span className="font-medium">{formatCurrency(d.minimum_payment || 0)}</span>
                  </div>
                  {d.interest_rate ? (
                    <div>
                      <p className="text-xs text-on-surface-variant">{t('goalsDebts.debts.interest')}</p>
                      <Badge variant="warning">{d.interest_rate}%</Badge>
                    </div>
                  ) : null}
                </div>

                {/* Billing cycle info */}
                {(d.cut_date || d.payment_due_day) && (
                  <div className="flex flex-wrap gap-3 mb-3 p-2 rounded-lg bg-surface-container text-xs">
                    {d.cut_date && (
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        {t('goalsDebts.debts.cutDate')}: <span className="font-medium text-on-surface">{t('goalsDebts.debts.dayOfMonth', { day: ordinal(d.cut_date) })}</span>
                      </div>
                    )}
                    {d.payment_due_day && (
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">payment</span>
                        {t('goalsDebts.debts.paymentDue')}: <span className="font-medium text-on-surface">{t('goalsDebts.debts.dayOfMonth', { day: ordinal(d.payment_due_day) })}</span>
                      </div>
                    )}
                  </div>
                )}

                <ProgressBar value={pct} color={pct >= 100 ? 'success' : 'default'} />
                <div className="flex justify-between mt-1.5 flex-wrap gap-2">
                  <p className="text-xs text-on-surface-variant">{pct.toFixed(0)}% {t('goalsDebts.debts.pctPaid')}</p>
                  <div className="flex gap-3">
                    {d.payment_due_day && d.minimum_payment > 0 && (
                      <button
                        onClick={() => handleCreateReminder(d)}
                        className="text-xs text-tertiary hover:underline flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-sm">notifications_active</span>
                        {t('goalsDebts.debts.createReminder')}
                      </button>
                    )}
                    <button onClick={() => setPaymentsDebt(d)} className="text-xs text-tertiary hover:underline">
                      {t('goalsDebts.debts.logPaymentAction')}
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {paymentsDebt && <DebtPaymentsModal debt={paymentsDebt} onClose={() => setPaymentsDebt(null)} />}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('goalsDebts.debts.editTitle') : t('goalsDebts.debts.addTitle')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('goalsDebts.debts.debtName')} value={form.name} onChange={f('name')} placeholder={t('goalsDebts.debts.egCarLoan')} />
            <Input label={t('goalsDebts.debts.creditor')} value={form.creditor} onChange={f('creditor')} placeholder={t('goalsDebts.debts.egBankName')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('goalsDebts.debts.totalAmount')} type="number" min="0" step="0.01" value={form.total_amount} onChange={f('total_amount')} />
            <Input label={t('goalsDebts.debts.remainingBalance')} type="number" min="0" step="0.01" value={form.remaining_balance} onChange={f('remaining_balance')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('goalsDebts.debts.interestRate')} type="number" min="0" step="0.01" value={form.interest_rate} onChange={f('interest_rate')} />
            <Input label={t('goalsDebts.debts.minimumPayment')} type="number" min="0" step="0.01" value={form.minimum_payment} onChange={f('minimum_payment')} />
          </div>
          <div className="border-t border-outline-variant/20 pt-3">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-3">{t('goalsDebts.debts.billingCycle')}</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('goalsDebts.debts.cutDateLabel')}
                type="number" min="1" max="31"
                value={form.cut_date} onChange={f('cut_date')}
                placeholder={t('goalsDebts.debts.dayPlaceholder')}
              />
              <Input
                label={t('goalsDebts.debts.paymentDueLabel')}
                type="number" min="1" max="31"
                value={form.payment_due_day} onChange={f('payment_due_day')}
                placeholder={t('goalsDebts.debts.dayPlaceholder')}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={createDebt.isPending || updateDebt.isPending} onClick={handleSubmit}>
              {editing ? t('common.saveChanges') : t('goalsDebts.debts.addDebt')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
