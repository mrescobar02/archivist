import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useIncomes } from '@/hooks/useIncomes'
import { useExpenses } from '@/hooks/useExpenses'
import { useSavingsFunds } from '@/hooks/useSavings'
import { streamReportAnalysis, getSavedAnalysis, saveAnalysis } from '@/services/api'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { CardShimmer } from '@/components/feedback/LoadingShimmer'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
  ComposedChart, ReferenceLine,
} from 'recharts'

function groupByMonth(items: { date: string; amount: number }[], key: string) {
  const map: Record<string, number> = {}
  items.forEach(item => {
    const month = item.date.slice(0, 7)
    map[month] = (map[month] ?? 0) + item.amount
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ month, [key]: value }))
}

// Render **bold** markers and newlines from AI text
function MarkdownText({ text, className }: { text: string; className?: string }) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={i} className="font-semibold text-on-surface">{seg.slice(2, -2)}</strong>
        }
        return seg.split('\n').map((line, j, arr) => (
          <span key={`${i}-${j}`}>{line}{j < arr.length - 1 ? <br /> : null}</span>
        ))
      })}
    </span>
  )
}

export function ReportsPage() {
  const { t } = useTranslation()
  const { data: incomes = [], isLoading: loadingI } = useIncomes()
  const { data: expenses = [], isLoading: loadingE } = useExpenses()
  const { data: funds = [] } = useSavingsFunds()

  const [analysisText, setAnalysisText] = useState('')
  const [analysisDate, setAnalysisDate] = useState<string | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState(false)
  const abortRef = useRef<boolean>(false)

  useEffect(() => {
    getSavedAnalysis().then(saved => {
      if (saved) {
        setAnalysisText(saved.text)
        setAnalysisDate(saved.created_at)
      }
    })
  }, [])

  const incomeByMonth = useMemo(() => groupByMonth(incomes, 'income'), [incomes])
  const expenseByMonth = useMemo(() => groupByMonth(expenses, 'expenses'), [expenses])

  const combinedByMonth = useMemo(() => {
    const months = new Set([...incomeByMonth.map(d => d.month), ...expenseByMonth.map(d => d.month)])
    return Array.from(months).sort().map(month => ({
      month,
      income: incomeByMonth.find(d => d.month === month)?.income ?? 0,
      expenses: expenseByMonth.find(d => d.month === month)?.expenses ?? 0,
    }))
  }, [incomeByMonth, expenseByMonth])

  const netByMonth = useMemo(() =>
    combinedByMonth.map(d => ({ month: d.month, net: (d.income as number) - (d.expenses as number) })),
    [combinedByMonth]
  )

  const totalSavings = funds.reduce((s, f) => s + f.amount, 0)

  // Projection: use avg of last 6 months net
  const projectionData = useMemo(() => {
    if (netByMonth.length === 0) return null
    const slice = netByMonth.slice(-6)
    const avgNet = slice.reduce((s, d) => s + d.net, 0) / slice.length
    const today = new Date()
    const todayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const points = Array.from({ length: 13 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return {
        month,
        savings: +(totalSavings + avgNet * i).toFixed(2),
        isCurrent: i === 0,
      }
    })
    return { points, avgNet, todayMonth, target: totalSavings + avgNet * 12 }
  }, [netByMonth, totalSavings])

  const generateAnalysis = useCallback(async () => {
    abortRef.current = false
    setAnalysisText('')
    setAnalysisDate(null)
    setAnalysisError(false)
    setAnalysisLoading(true)
    let fullText = ''
    try {
      for await (const chunk of streamReportAnalysis()) {
        if (abortRef.current) break
        fullText += chunk
        setAnalysisText(fullText)
      }
      if (fullText && !abortRef.current) {
        const saved = await saveAnalysis(fullText)
        setAnalysisDate(saved.created_at)
      }
    } catch {
      setAnalysisError(true)
    } finally {
      setAnalysisLoading(false)
    }
  }, [])

  if (loadingI || loadingE) return (
    <div className="p-4 sm:p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => <CardShimmer key={i} className="h-64" />)}
    </div>
  )

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-on-surface">{t('reports.title')}</h1>
        <p className="text-sm text-on-surface-variant mt-1">{t('reports.subtitle')}</p>
      </div>

      {/* Existing charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-on-surface mb-4">{t('reports.incomeVsExpenses')}</h3>
          {combinedByMonth.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-on-surface-variant">{t('reports.noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={combinedByMonth} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#adb3b4" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="income" name={t('reports.income')} fill="#2ECC71" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name={t('reports.expenses')} fill="#9f403d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-on-surface mb-4">{t('reports.netBalanceTrend')}</h3>
          {netByMonth.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-on-surface-variant">{t('reports.noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={netByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#adb3b4" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <ReferenceLine y={0} stroke="#adb3b4" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="net" name={t('reports.netBalanceTrend')} stroke="#006498" fill="#006498" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-on-surface mb-4">{t('reports.monthlyIncomeTrend')}</h3>
          {incomeByMonth.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-on-surface-variant">{t('reports.noIncomeData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={incomeByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#adb3b4" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="income" name={t('reports.income')} stroke="#2ECC71" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-on-surface mb-4">{t('reports.savingsOverview')}</h3>
          <div className="flex flex-col justify-center h-52">
            {funds.length === 0 ? (
              <p className="text-center text-sm text-on-surface-variant">{t('reports.noSavings')}</p>
            ) : (
              <div className="space-y-3">
                {funds.map(f => (
                  <div key={f.id} className="flex items-center justify-between">
                    <p className="text-sm font-medium text-on-surface">{f.name}</p>
                    <p className="text-sm font-semibold text-soft-green">{formatCurrency(f.amount)}</p>
                  </div>
                ))}
                <div className="pt-3 border-t border-outline-variant/30 flex justify-between">
                  <p className="text-sm font-bold text-on-surface">{t('reports.total')}</p>
                  <p className="text-sm font-bold text-soft-green">{formatCurrency(totalSavings)}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 12-month savings projection */}
      <Card>
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-sm font-semibold text-on-surface">{t('reports.projection')}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{t('reports.projectionSub')}</p>
          </div>
        </div>

        {!projectionData ? (
          <div className="h-52 flex items-center justify-center text-sm text-on-surface-variant mt-4">
            {t('reports.projectionNoData')}
          </div>
        ) : (
          <>
            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4 mt-4 mb-6">
              <div className="rounded-xl bg-surface-container px-4 py-3">
                <p className="text-xs text-on-surface-variant mb-0.5">{t('reports.projectionCurrent')}</p>
                <p className="text-base font-bold text-on-surface">{formatCurrency(totalSavings)}</p>
              </div>
              <div className="rounded-xl bg-surface-container px-4 py-3">
                <p className="text-xs text-on-surface-variant mb-0.5">{t('reports.projectionAvgNet')}</p>
                <p className={cn('text-base font-bold', projectionData.avgNet >= 0 ? 'text-success' : 'text-error')}>
                  {projectionData.avgNet >= 0 ? '+' : ''}{formatCurrency(projectionData.avgNet)}
                </p>
              </div>
              <div className="rounded-xl bg-surface-container px-4 py-3">
                <p className="text-xs text-on-surface-variant mb-0.5">{t('reports.projectionTarget')}</p>
                <p className={cn('text-base font-bold', projectionData.target >= totalSavings ? 'text-success' : 'text-error')}>
                  {formatCurrency(projectionData.target)}
                </p>
              </div>
            </div>

            {/* Projection chart */}
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={projectionData.points}>
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006498" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#006498" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#adb3b4" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <ReferenceLine
                  x={projectionData.todayMonth}
                  stroke="#adb3b4"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{ value: 'Hoy', position: 'top', fontSize: 10, fill: '#adb3b4' }}
                />
                <Area
                  type="monotone"
                  dataKey="savings"
                  stroke="#006498"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  fill="url(#savingsGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#006498' }}
                  name={t('reports.projectionTarget')}
                />
              </ComposedChart>
            </ResponsiveContainer>

            <p className="text-xs text-on-surface-variant mt-3 text-center">
              {projectionData.avgNet >= 0
                ? `${t('reports.projectionPositive')} ${formatCurrency(projectionData.target - totalSavings)} en 12 meses`
                : `${t('reports.projectionNegative')} ${formatCurrency(Math.abs(projectionData.target - totalSavings))} en 12 meses`}
            </p>
          </>
        )}
      </Card>

      {/* AI Financial Analysis */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-on-surface">{t('reports.analysis')}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{t('reports.analysisSub')}</p>
            {analysisDate && !analysisLoading && (
              <p className="text-xs text-tertiary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">schedule</span>
                {t('reports.analysisDate', {
                  date: new Date(analysisDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
                  time: new Date(analysisDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                  defaultValue: `Generado el ${new Date(analysisDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} a las ${new Date(analysisDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
                })}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            loading={analysisLoading}
            onClick={generateAnalysis}
          >
            <span className="material-symbols-outlined text-sm">
              {analysisText ? 'refresh' : 'auto_awesome'}
            </span>
            {analysisText ? t('reports.analysisRefresh') : t('reports.analysisGenerate')}
          </Button>
        </div>

        {analysisError && (
          <p className="text-sm text-error">{t('reports.analysisError')}</p>
        )}

        {!analysisText && !analysisLoading && !analysisError && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-on-surface-variant">
            <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-tertiary">analytics</span>
            </div>
            <p className="text-sm">{t('reports.analysisEmpty')}</p>
          </div>
        )}

        {analysisLoading && !analysisText && (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 bg-surface-container rounded-full" style={{ width: `${75 + (i % 3) * 10}%` }} />
            ))}
          </div>
        )}

        {analysisText && (
          <div className="text-sm text-on-surface-variant leading-relaxed space-y-1">
            <MarkdownText text={analysisText} />
            {analysisLoading && (
              <span className="inline-flex gap-1 ml-1 align-middle">
                <span className="w-1 h-1 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
