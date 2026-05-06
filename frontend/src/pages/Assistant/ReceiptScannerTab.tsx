import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { scanReceipt, createExpense } from '@/services/api'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/primitives/Input'
import { Select } from '@/components/primitives/Select'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { useUiStore } from '@/store/ui'
import { formatCurrency } from '@/lib/format'
import type { ReceiptScan } from '@/types'

interface ExtractedForm { merchant: string; amount: string; date: string; category_id: string; account_id: string }

export function ReceiptScannerTab() {
  const { t } = useTranslation()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()
  const { showToast } = useUiStore()

  const [scanning, setScanning] = useState(false)
  const [scan, setScan] = useState<ReceiptScan | null>(null)
  const [form, setForm] = useState<ExtractedForm>({ merchant: '', amount: '', date: '', category_id: '', account_id: '' })
  const [saving, setSaving] = useState(false)
  const [recentScans, setRecentScans] = useState<ReceiptScan[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setScanning(true)
    setScan(null)
    try {
      const result = await scanReceipt(file)
      setScan(result)
      setForm({
        merchant: result.merchant || '',
        amount: result.amount ? String(result.amount) : '',
        date: result.date || new Date().toISOString().slice(0, 10),
        category_id: result.category_id != null ? String(result.category_id) : '',
        account_id: accounts[0] ? String(accounts[0].id) : '',
      })
      setRecentScans(p => [result, ...p.slice(0, 4)])
    } catch {
      showToast(t('assistant.receipt.noScans'), 'error')
    } finally {
      setScanning(false)
    }
  }

  const handleSaveExpense = async () => {
    if (!form.amount || !form.account_id) return
    setSaving(true)
    try {
      await createExpense({
        amount: Number(form.amount), date: form.date,
        description: form.merchant || t('assistant.receipt.uploadLabel'),
        account_id: Number(form.account_id),
        category_id: form.category_id ? Number(form.category_id) : null,
        expense_type: 'variable',
      })
      showToast(t('overview.expenses.receiptScanned'))
      setScan(null)
    } catch {
      showToast(t('overview.expenses.scanFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof ExtractedForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div>
        <div onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file) }}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-outline-variant rounded-2xl p-12 text-center cursor-pointer hover:border-tertiary hover:bg-tertiary/5 transition-colors">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(file) }} />
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">receipt_long</span>
          <p className="font-medium text-on-surface">{t('assistant.receipt.uploadLabel')}</p>
          <p className="text-sm text-on-surface-variant mt-1">{t('assistant.receipt.dragDrop')}</p>
          <p className="text-xs text-outline mt-2">{t('assistant.receipt.fileTypes')}</p>
        </div>

        {scanning && (
          <Card className="mt-4 flex items-center gap-3">
            <span className="w-5 h-5 border-2 border-tertiary border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-on-surface">{t('assistant.receipt.analyzing')}</p>
              <p className="text-xs text-on-surface-variant">{t('assistant.receipt.analyzingHint')}</p>
            </div>
          </Card>
        )}

        {scan && !scanning && (
          <Card className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-on-surface">{t('assistant.receipt.extractedData')}</h3>
              <Badge variant={scan.status === 'completed' ? 'success' : 'error'}>{scan.status}</Badge>
            </div>
            <div className="space-y-3">
              <Input label={t('assistant.receipt.merchant')} value={form.merchant} onChange={f('merchant')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('common.amount')} type="number" step="0.01" value={form.amount} onChange={f('amount')} />
                <Input label={t('common.date')} type="date" value={form.date} onChange={f('date')} />
              </div>
              <Select label={t('common.category')} value={form.category_id} onChange={f('category_id')}
                placeholder={t('common.selectCategory')}
                options={categories.map(c => ({ value: c.id, label: c.name }))} />
              <Select label={t('common.account')} value={form.account_id} onChange={f('account_id')}
                placeholder={t('common.selectAccount')}
                options={accounts.map(a => ({ value: a.id, label: a.name }))} />
              <Button className="w-full" loading={saving} onClick={handleSaveExpense} disabled={!form.amount || !form.account_id}>
                {t('assistant.receipt.saveAsExpense')}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-on-surface mb-4">{t('assistant.receipt.recentScans')}</h3>
        {recentScans.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-3xl block mb-2">receipt</span>
            {t('assistant.receipt.noScans')}
          </div>
        ) : (
          <div className="space-y-3">
            {recentScans.map((s, i) => (
              <Card key={i} padding="sm" className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">{s.merchant || t('assistant.receipt.unknownMerchant')}</p>
                  <p className="text-xs text-on-surface-variant">{s.date || t('assistant.receipt.noDate')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.amount && <span className="font-semibold text-on-surface">{formatCurrency(s.amount)}</span>}
                  <Badge variant={s.status === 'completed' ? 'success' : 'error'}>{s.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
