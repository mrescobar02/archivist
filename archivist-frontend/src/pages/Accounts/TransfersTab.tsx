import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransfers, useCreateTransfer } from '@/hooks/useTransfers'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/primitives/Input'
import { Select } from '@/components/primitives/Select'
import { Textarea } from '@/components/primitives/Textarea'
import { Amount } from '@/components/primitives/Amount'
import { LoadingShimmer } from '@/components/feedback/LoadingShimmer'
import { formatDate, formatCurrency } from '@/lib/format'

interface TransferForm { from_account_id: string; to_account_id: string; amount: string; date: string; note: string }
const empty: TransferForm = { from_account_id: '', to_account_id: '', amount: '', date: new Date().toISOString().slice(0, 10), note: '' }

export function TransfersTab() {
  const { t } = useTranslation()
  const { data: accounts = [] } = useAccounts()
  const { data: transfers, isLoading } = useTransfers()
  const createTransfer = useCreateTransfer()
  const [form, setForm] = useState<TransferForm>(empty)

  const handleSubmit = () => {
    createTransfer.mutate({
      from_account_id: Number(form.from_account_id),
      to_account_id: Number(form.to_account_id),
      amount: Number(form.amount),
      date: form.date,
      note: form.note,
    }, { onSuccess: () => setForm(empty) })
  }

  const f = (k: keyof TransferForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card className="xl:col-span-1">
        <h3 className="text-sm font-semibold text-on-surface mb-4">{t('accounts.transfers.newTransfer')}</h3>
        <div className="space-y-4">
          <Select label={t('accounts.transfers.fromAccount')} value={form.from_account_id} onChange={f('from_account_id')}
            placeholder={t('common.selectAccount')}
            options={accounts.map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance)})` }))} />
          <Select label={t('accounts.transfers.toAccount')} value={form.to_account_id} onChange={f('to_account_id')}
            placeholder={t('common.selectAccount')}
            options={accounts.filter(a => String(a.id) !== form.from_account_id).map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance)})` }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.amount')} type="number" min="0.01" step="0.01" value={form.amount} onChange={f('amount')} />
            <Input label={t('common.date')} type="date" value={form.date} onChange={f('date')} />
          </div>
          <Textarea label={t('accounts.transfers.note')} value={form.note} onChange={f('note')} rows={2} />
          <Button className="w-full" loading={createTransfer.isPending} onClick={handleSubmit}
            disabled={!form.from_account_id || !form.to_account_id || !form.amount}>
            {t('accounts.transfers.transferFunds')}
          </Button>
        </div>
      </Card>

      <div className="xl:col-span-2">
        <h3 className="text-sm font-semibold text-on-surface mb-4">{t('accounts.transfers.history')}</h3>
        {isLoading ? <LoadingShimmer /> : !transfers?.length ? (
          <div className="text-center py-16 text-on-surface-variant text-sm">{t('accounts.transfers.noTransfers')}</div>
        ) : (
          <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">{t('common.date')}</th>
                  <th className="text-left px-4 py-3">{t('accounts.transfers.from')}</th>
                  <th className="text-left px-4 py-3">{t('accounts.transfers.to')}</th>
                  <th className="text-right px-4 py-3">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {transfers.map(tr => {
                  const from = accounts.find(a => a.id === tr.from_account_id)
                  const to = accounts.find(a => a.id === tr.to_account_id)
                  return (
                    <tr key={tr.id} className="hover:bg-surface-container-low/50">
                      <td className="px-4 py-3 text-on-surface-variant">{formatDate(tr.date)}</td>
                      <td className="px-4 py-3 text-on-surface">{from?.name || '—'}</td>
                      <td className="px-4 py-3 text-on-surface">{to?.name || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(tr.amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
