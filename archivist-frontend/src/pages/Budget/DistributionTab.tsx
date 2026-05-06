import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDistribution, useUpdateDistribution } from '@/hooks/useDistribution'
import { useExpenses } from '@/hooks/useExpenses'
import { useCategories } from '@/hooks/useCategories'
import { useDashboard } from '@/hooks/useDashboard'
import { Button } from '@/components/primitives/Button'
import { LoadingShimmer } from '@/components/feedback/LoadingShimmer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatCurrency, formatLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const PALETTE = [
  '#006498', '#2ECC71', '#F39C12', '#9f403d', '#8E44AD',
  '#1ABC9C', '#E74C3C', '#3498DB', '#F1C40F', '#16A085',
  '#D35400', '#2980B9', '#27AE60', '#C0392B', '#7F8C8D',
]

function colorFor(index: number) { return PALETTE[index % PALETTE.length] }
function toKey(label: string) { return label.trim().toLowerCase().replace(/\s+/g, '_') }

export function DistributionTab() {
  const { t } = useTranslation()
  const { data: distribution, isLoading, error, refetch } = useDistribution()
  const { data: dashboard } = useDashboard()
  const { data: allExpenses } = useExpenses()
  const { data: categories = [] } = useCategories()
  const updateDistribution = useUpdateDistribution()

  const [items, setItems] = useState<{ key: string; label: string; pct: number }[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const monthlyIncome = Number(dashboard?.monthly_income ?? 0)

  useEffect(() => {
    if (distribution) {
      setItems(distribution.map(d => ({
        key: d.category,
        label: formatLabel(d.category),
        pct: Number(d.percentage),
      })))
    }
  }, [distribution])

  const total = items.reduce((s, i) => s + i.pct, 0)
  const remaining = +(100 - total).toFixed(2)
  const valid = Math.abs(total - 100) <= 0.1

  const setPct = (key: string, pct: number) =>
    setItems(prev => prev.map(i => i.key === key ? { ...i, pct: Math.max(0, Math.min(100, pct)) } : i))

  const addItem = () => {
    const label = newLabel.trim()
    if (!label) return
    const key = toKey(label)
    if (items.find(i => i.key === key)) return
    setItems(prev => [...prev, { key, label, pct: 0 }])
    setNewLabel('')
  }

  const removeItem = (key: string) => setItems(prev => prev.filter(i => i.key !== key))

  const handleSave = () => {
    updateDistribution.mutate(items.map(i => ({ category: i.key, percentage: i.pct })))
  }

  const stepMonth = (dir: -1 | 1) => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + dir, 1)
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
  })()

  // Actual spending grouped by normalized category key for the selected month
  const spendingByKey: Record<string, number> = {}
  for (const exp of allExpenses?.filter(e => e.date.startsWith(selectedMonth)) ?? []) {
    const cat = categories.find(c => c.id === exp.category_id)
    const key = cat ? toKey(cat.name) : '__uncategorized__'
    spendingByKey[key] = (spendingByKey[key] ?? 0) + exp.amount
  }

  const totalActual = Object.values(spendingByKey).reduce((s, v) => s + v, 0)
  const uncategorized = spendingByKey['__uncategorized__'] ?? 0

  if (isLoading) return <LoadingShimmer />
  if (error) return <ErrorState onRetry={() => refetch()} />

  const chartData = items.filter(i => i.pct > 0).map((i, idx) => ({
    name: i.label, value: i.pct, color: colorFor(idx),
  }))

  return (
    <div className="space-y-8">
      {/* Editor + Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-on-surface mb-4">{t('budget.distribution.title')}</h3>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const amount = (item.pct / 100) * monthlyIncome
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colorFor(idx) }} />
                      <span className="text-sm font-medium text-on-surface truncate">{item.label}</span>
                      {monthlyIncome > 0 && (
                        <span className="text-xs text-on-surface-variant">{formatCurrency(amount)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="number" min="0" max="100" step="0.5" value={item.pct}
                        onChange={e => setPct(item.key, Number(e.target.value))}
                        className="w-16 text-right rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-tertiary"
                      />
                      <span className="text-sm text-on-surface-variant w-4">%</span>
                      <button onClick={() => removeItem(item.key)}
                        className="p-1 rounded text-outline hover:text-error hover:bg-error/10 transition-colors"
                        title={t('common.delete')}>
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, item.pct)}%`, backgroundColor: colorFor(idx) }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 mt-4">
            <input type="text" value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addItem() }}
              placeholder={t('budget.distribution.egCategory')}
              className="flex-1 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-tertiary"
            />
            <Button size="sm" variant="secondary" onClick={addItem} disabled={!newLabel.trim()}>
              <span className="material-symbols-outlined text-sm">add</span>
              {t('common.add')}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-outline-variant/30">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${valid ? 'text-success' : 'text-error'}`}>
                {t('budget.distribution.total', { pct: total.toFixed(1) })}
              </span>
              {!valid && Math.abs(remaining) > 0.01 && (
                <span className="text-xs text-on-surface-variant">
                  {remaining > 0
                    ? t('budget.distribution.missing', { pct: remaining.toFixed(1) })
                    : t('budget.distribution.exceeds', { pct: Math.abs(remaining).toFixed(1) })}
                </span>
              )}
            </div>
            <Button size="sm" loading={updateDistribution.isPending} onClick={handleSave} disabled={!valid}>
              {t('budget.distribution.save')}
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-on-surface mb-4">{t('budget.distribution.visualization')}</h3>
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" paddingAngle={2}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate">{d.name}: {d.value.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-on-surface-variant">
              {t('budget.distribution.emptyChart')}
            </div>
          )}
        </div>
      </div>

      {/* Budget vs Actual comparison */}
      <div className="border-t border-outline-variant/30 pt-8">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-sm font-semibold text-on-surface">{t('budget.distribution.comparison')}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{t('budget.distribution.comparisonSub')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => stepMonth(-1)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <span className="text-sm font-medium text-on-surface capitalize w-36 text-center">{monthLabel}</span>
            <button onClick={() => stepMonth(1)} className="p-1 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>

        {monthlyIncome === 0 ? (
          <p className="text-sm text-on-surface-variant mt-4">{t('budget.distribution.noIncome')}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-on-surface-variant mt-4">{t('budget.distribution.emptyChart')}</p>
        ) : (
          <div className="mt-5 space-y-4">
            {items.map((item, idx) => {
              const budgetAmt = (item.pct / 100) * monthlyIncome
              const actualAmt = spendingByKey[item.key] ?? 0
              const usedPct = budgetAmt > 0 ? Math.min((actualAmt / budgetAmt) * 100, 100) : 0
              const isOver = actualAmt > budgetAmt
              const diff = budgetAmt - actualAmt
              const color = colorFor(idx)

              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium text-on-surface truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs flex-shrink-0">
                      <span className="text-on-surface-variant">
                        {t('budget.distribution.budget')}: <span className="font-medium text-on-surface">{formatCurrency(budgetAmt)}</span>
                      </span>
                      <span className={cn('font-medium', isOver ? 'text-error' : 'text-on-surface')}>
                        {t('budget.distribution.actual')}: {formatCurrency(actualAmt)}
                      </span>
                      <span className={cn('font-semibold', isOver ? 'text-error' : 'text-success')}>
                        {isOver
                          ? `+${formatCurrency(Math.abs(diff))} ${t('budget.distribution.over')}`
                          : `${formatCurrency(diff)} ${t('budget.distribution.remaining')}`}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', isOver ? 'bg-error' : '')}
                      style={{ width: `${usedPct}%`, backgroundColor: isOver ? undefined : color }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-xs text-on-surface-variant">{usedPct.toFixed(0)}% {t('budget.distribution.actual').toLowerCase()}</span>
                    {isOver && (
                      <span className="text-xs text-error font-medium">{((actualAmt / budgetAmt) * 100).toFixed(0)}%</span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Summary row */}
            <div className="pt-3 mt-2 border-t border-outline-variant/20 flex items-center justify-between text-sm">
              <span className="text-on-surface-variant font-medium">Total</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-on-surface-variant">
                  {t('budget.distribution.budget')}: <span className="font-semibold text-on-surface">{formatCurrency(monthlyIncome)}</span>
                </span>
                <span className={cn('font-semibold', totalActual > monthlyIncome ? 'text-error' : 'text-on-surface')}>
                  {t('budget.distribution.actual')}: {formatCurrency(totalActual)}
                </span>
                <span className={cn('font-semibold', totalActual > monthlyIncome ? 'text-error' : 'text-success')}>
                  {totalActual > monthlyIncome
                    ? `+${formatCurrency(totalActual - monthlyIncome)} ${t('budget.distribution.over')}`
                    : `${formatCurrency(monthlyIncome - totalActual)} ${t('budget.distribution.remaining')}`}
                </span>
              </div>
            </div>

            {uncategorized > 0 && (
              <p className="text-xs text-on-surface-variant">
                * {t('budget.distribution.unmatched')}: {formatCurrency(uncategorized)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
