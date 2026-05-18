import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useExpenses'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/primitives/Button'
import { Modal } from '@/components/primitives/Modal'
import { Input } from '@/components/primitives/Input'
import { Select } from '@/components/primitives/Select'
import { Badge } from '@/components/primitives/Badge'
import { Tooltip } from '@/components/primitives/Tooltip'
import { Amount } from '@/components/primitives/Amount'
import { LoadingShimmer } from '@/components/feedback/LoadingShimmer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatDate } from '@/lib/format'
import { analyzeReceiptBase64 } from '@/services/api'
import { useUiStore } from '@/store/ui'
import { cn } from '@/lib/utils'
import type { Expense } from '@/types'

interface ExpenseForm {
  amount: string; date: string; description: string
  account_id: string; category_id: string; expense_type: string
}
const empty: ExpenseForm = {
  amount: '', date: new Date().toISOString().slice(0, 10),
  description: '', account_id: '', category_id: '', expense_type: 'variable'
}

async function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve({ base64: result.split(',')[1], mediaType: file.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ExpensesTab() {
  const { t } = useTranslation()
  const { data: expenses, isLoading, error, refetch } = useExpenses()
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()
  const { showToast } = useUiStore()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseForm>(empty)
  const [activeCat, setActiveCat] = useState<number | null>(null)
  const [scanning, setScanning] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'month'>('all')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  // Receipt scan preview state
  const [scanPreview, setScanPreview] = useState<{ imageUrl: string; form: ExpenseForm } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (exp: Expense) => {
    setEditing(exp)
    setForm({
      amount: String(exp.amount), date: exp.date,
      description: exp.description || '', account_id: String(exp.account_id),
      category_id: String(exp.category_id || ''), expense_type: exp.expense_type
    })
    setOpen(true)
  }

  const handleSubmit = () => {
    const payload = {
      amount: Number(form.amount), date: form.date, description: form.description,
      account_id: Number(form.account_id),
      category_id: form.category_id ? Number(form.category_id) : null,
      expense_type: form.expense_type as 'fixed' | 'variable'
    }
    if (editing) {
      updateExpense.mutate({ id: editing.id, data: payload }, { onSuccess: () => setOpen(false) })
    } else {
      createExpense.mutate(payload, { onSuccess: () => setOpen(false) })
    }
  }

  const handleScan = async (file: File) => {
    setScanning(true)
    const imageUrl = URL.createObjectURL(file)
    try {
      const { base64, mediaType } = await fileToBase64(file)
      const result = await analyzeReceiptBase64(base64, mediaType)
      setScanPreview({
        imageUrl,
        form: {
          amount: result.amount != null ? String(result.amount) : '',
          date: result.date || new Date().toISOString().slice(0, 10),
          description: result.merchant || '',
          account_id: accounts[0] ? String(accounts[0].id) : '',
          category_id: result.category_id != null ? String(result.category_id) : '',
          expense_type: 'variable',
        },
      })
    } catch {
      URL.revokeObjectURL(imageUrl)
      showToast(t('overview.expenses.scanFailed'), 'error')
    } finally {
      setScanning(false)
    }
  }

  const handleScanConfirm = () => {
    if (!scanPreview) return
    const p = scanPreview.form
    createExpense.mutate(
      {
        amount: Number(p.amount),
        date: p.date,
        description: p.description,
        account_id: Number(p.account_id),
        category_id: p.category_id ? Number(p.category_id) : null,
        expense_type: p.expense_type as 'fixed' | 'variable',
      },
      {
        onSuccess: () => {
          URL.revokeObjectURL(scanPreview.imageUrl)
          setScanPreview(null)
          showToast(t('overview.expenses.receiptScanned'))
        },
      }
    )
  }

  const handleScanDiscard = () => {
    if (scanPreview) URL.revokeObjectURL(scanPreview.imageUrl)
    setScanPreview(null)
  }

  const sf = (k: keyof ExpenseForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setScanPreview(prev => prev ? { ...prev, form: { ...prev.form, [k]: e.target.value } } : null)

  const f = (k: keyof ExpenseForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const stepMonth = (dir: -1 | 1) => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + dir, 1)
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
  })()

  const byView = viewMode === 'month'
    ? expenses?.filter(e => e.date.startsWith(selectedMonth))
    : expenses
  const usedCategoryIds = [...new Set(byView?.map(e => e.category_id).filter(Boolean))]
  const usedCategories = categories.filter(c => usedCategoryIds.includes(c.id))
  const filtered = activeCat === null ? byView : byView?.filter(e => e.category_id === activeCat)

  if (isLoading) return <LoadingShimmer />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-on-surface-variant">{t('overview.expenses.count', { count: filtered?.length ?? 0 })}</p>
          <div className="flex rounded-lg overflow-hidden border border-outline-variant/40 text-xs font-medium">
            <button
              onClick={() => setViewMode('all')}
              className={cn(
                'px-3 py-1.5 transition-colors',
                viewMode === 'all'
                  ? 'bg-on-surface text-surface-container-lowest'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'
              )}
            >
              {t('overview.expenses.viewAll')}
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-3 py-1.5 transition-colors border-l border-outline-variant/40',
                viewMode === 'month'
                  ? 'bg-on-surface text-surface-container-lowest'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'
              )}
            >
              {t('overview.expenses.viewMonth')}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const file = e.target.files?.[0]; if (file) handleScan(file); e.target.value = '' }} />
          <Button size="sm" variant="secondary" loading={scanning} onClick={() => fileRef.current?.click()}>
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            {t('overview.expenses.scanReceipt')}
          </Button>
          <Button size="sm" onClick={openCreate}>
            <span className="material-symbols-outlined text-sm">add</span>
            {t('overview.expenses.addExpense')}
          </Button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={() => stepMonth(-1)}
            className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          <span className="text-sm font-medium text-on-surface capitalize w-36 text-center">{monthLabel}</span>
          <button
            onClick={() => stepMonth(1)}
            className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      )}

      {usedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveCat(null)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              activeCat === null
                ? 'bg-on-surface text-surface-container-lowest'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'
            )}
          >
            {t('common.all')}
          </button>
          {usedCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                activeCat === cat.id
                  ? 'bg-on-surface text-surface-container-lowest'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'
              )}
            >
              <span className="material-symbols-outlined text-sm">{cat.icon}</span>
              {t(`categories.names.${cat.name}`, cat.name)}
            </button>
          ))}
        </div>
      )}

      {!filtered?.length ? (
        <div className="text-center py-16 text-on-surface-variant text-sm">
          {activeCat
            ? t('overview.expenses.noExpenses')
            : viewMode === 'month'
              ? t('overview.expenses.noExpensesMonth')
              : t('overview.expenses.noExpensesYet')}
        </div>
      ) : (
        <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(100vh-22rem)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="hidden sm:table-cell text-left px-4 py-3">{t('common.date')}</th>
                <th className="text-left px-4 py-3">{t('common.description')}</th>
                <th className="text-left px-4 py-3">{t('common.category')}</th>
                <th className="hidden sm:table-cell text-left px-4 py-3">{t('common.type')}</th>
                <th className="text-right px-4 py-3">{t('common.amount')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.map(exp => {
                const cat = categories.find(c => c.id === Number(exp.category_id))
                return (
                  <tr key={exp.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="hidden sm:table-cell px-4 py-3 text-on-surface-variant">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3 font-medium text-on-surface">{exp.description || '—'}</td>
                    <td className="px-4 py-3">
                      {cat
                        ? <span className="text-xs text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                            {t(`categories.names.${cat.name}`, cat.name)}
                          </span>
                        : <span className="text-xs text-outline">—</span>}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <Badge variant={exp.expense_type === 'fixed' ? 'info' : 'default'}>
                        {t(`common.${exp.expense_type}`, exp.expense_type)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right"><Amount value={exp.amount} negative /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(exp)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onClick={() => deleteExpense.mutate(exp.id)} className="p-1 rounded text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Regular create / edit modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('overview.expenses.editTitle') : t('overview.expenses.addTitle')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.amount')} type="number" min="0" step="0.01" value={form.amount} onChange={f('amount')} />
            <Input label={t('common.date')} type="date" value={form.date} onChange={f('date')} />
          </div>
          <Input label={t('common.description')} value={form.description} onChange={f('description')} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">{t('common.category')}</label>
                <Tooltip text={t('overview.expenses.categoryTooltip')} />
              </div>
              <Select value={form.category_id} onChange={f('category_id')}
                placeholder={t('common.selectCategory')}
                options={categories.map(c => ({ value: String(c.id), label: t(`categories.names.${c.name}`, c.name) }))} />
            </div>
            <Select label={t('common.account')} value={form.account_id} onChange={f('account_id')}
              placeholder={t('common.selectAccount')}
              options={accounts.map(a => ({ value: String(a.id), label: a.name }))} />
          </div>
          <Select label={t('common.type')} value={form.expense_type} onChange={f('expense_type')}
            options={[{ value: 'fixed', label: t('common.fixed') }, { value: 'variable', label: t('common.variable') }]} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" loading={createExpense.isPending || updateExpense.isPending} onClick={handleSubmit}>
              {editing ? t('common.saveChanges') : t('overview.expenses.addExpense')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Receipt scan preview modal */}
      <Modal
        open={!!scanPreview}
        onClose={handleScanDiscard}
        title={t('overview.expenses.receiptPreviewTitle')}
      >
        {scanPreview && (
          <div className="space-y-4">
            {/* Receipt image preview */}
            <div className="relative rounded-xl overflow-hidden bg-surface-container">
              <img
                src={scanPreview.imageUrl}
                alt={t('overview.expenses.receiptPreviewTitle')}
                className="w-full max-h-56 object-contain"
              />
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center gap-1 bg-tertiary/90 text-white text-xs font-medium px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  {t('overview.expenses.receiptDetectedBadge')}
                </span>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input label={t('common.amount')} type="number" min="0" step="0.01"
                value={scanPreview.form.amount} onChange={sf('amount')} />
              <Input label={t('common.date')} type="date"
                value={scanPreview.form.date} onChange={sf('date')} />
            </div>
            <Input label={t('common.description')}
              value={scanPreview.form.description} onChange={sf('description')} />
            <div className="grid grid-cols-2 gap-4">
              <Select label={t('common.category')} value={scanPreview.form.category_id}
                onChange={sf('category_id')} placeholder={t('common.selectCategory')}
                options={categories.map(c => ({ value: String(c.id), label: t(`categories.names.${c.name}`, c.name) }))} />
              <Select label={t('common.account')} value={scanPreview.form.account_id}
                onChange={sf('account_id')} placeholder={t('common.selectAccount')}
                options={accounts.map(a => ({ value: String(a.id), label: a.name }))} />
            </div>
            <Select label={t('common.type')} value={scanPreview.form.expense_type}
              onChange={sf('expense_type')}
              options={[{ value: 'variable', label: t('common.variable') }, { value: 'fixed', label: t('common.fixed') }]} />

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={handleScanDiscard}>
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1"
                loading={createExpense.isPending}
                disabled={!scanPreview.form.amount || !scanPreview.form.account_id}
                onClick={handleScanConfirm}
              >
                <span className="material-symbols-outlined text-sm">add</span>
                {t('overview.expenses.addExpense')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
