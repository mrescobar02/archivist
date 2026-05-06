import { useTranslation } from 'react-i18next'
import { useDashboard } from '@/hooks/useDashboard'
import { Card } from '@/components/primitives/Card'
import { Amount } from '@/components/primitives/Amount'
import { Badge } from '@/components/primitives/Badge'
import { Tooltip } from '@/components/primitives/Tooltip'
import { CardShimmer } from '@/components/feedback/LoadingShimmer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatDate, formatCurrency } from '@/lib/format'

function KpiCard({ label, value, icon, positive, negative, tooltip }: {
  label: string; value: number; icon: string
  positive?: boolean; negative?: boolean; tooltip: string
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-lg text-on-surface-variant">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 mb-1">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">{label}</p>
          <Tooltip text={tooltip} />
        </div>
        <Amount value={value} positive={positive} negative={negative} size="lg" />
      </div>
    </Card>
  )
}

export function DashboardTab() {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = useDashboard()

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardShimmer key={i} />)}
      </div>
    </div>
  )

  if (error) return <ErrorState onRetry={() => refetch()} />
  if (!data) return null

  const allUpcoming = [...data.upcoming_payments, ...data.overdue_payments.map(p => ({ ...p, _overdue: true }))]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label={t('overview.dashboard.income')}
          value={data.monthly_income}
          icon="arrow_downward"
          positive
          tooltip={t('overview.dashboard.tooltips.income')}
        />
        <KpiCard
          label={t('overview.dashboard.expenses')}
          value={data.monthly_expenses}
          icon="arrow_upward"
          negative
          tooltip={t('overview.dashboard.tooltips.expenses')}
        />
        <KpiCard
          label={t('overview.dashboard.netBalance')}
          value={data.monthly_net}
          icon="account_balance_wallet"
          positive={data.monthly_net >= 0}
          negative={data.monthly_net < 0}
          tooltip={t('overview.dashboard.tooltips.netBalance')}
        />
        <KpiCard
          label={t('overview.dashboard.totalBalance')}
          value={data.total_balance}
          icon="account_balance"
          positive={data.total_balance >= 0}
          negative={data.total_balance < 0}
          tooltip={t('overview.dashboard.tooltips.totalBalance')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-on-surface mb-4">{t('overview.dashboard.recentTransactions')}</h3>
          {data.recent_transactions.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">{t('overview.dashboard.noTransactions')}</p>
          ) : (
            <div className="space-y-3">
              {data.recent_transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">
                        {tx.kind === 'income' ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{tx.description}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <Amount value={tx.amount} positive={tx.kind === 'income'} negative={tx.kind === 'expense'} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-on-surface mb-4">{t('overview.dashboard.upcomingPayments')}</h3>
          {allUpcoming.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">{t('overview.dashboard.noUpcomingPayments')}</p>
          ) : (
            <div className="space-y-3">
              {allUpcoming.map((p: any, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{p.name}</p>
                    <p className="text-xs text-on-surface-variant">{t('overview.dashboard.dueOn', { date: formatDate(p.next_due_date) })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p._overdue && <Badge variant="error">{t('overview.dashboard.overdue')}</Badge>}
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(p.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-1 mb-1">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t('overview.dashboard.totalSavings')}</p>
            <Tooltip text={t('overview.dashboard.tooltips.totalSavings')} />
          </div>
          <Amount value={data.savings_total} size="xl" positive />
        </Card>
        <Card>
          <div className="flex items-center gap-1 mb-1">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t('overview.dashboard.totalDebts')}</p>
            <Tooltip text={t('overview.dashboard.tooltips.totalDebts')} />
          </div>
          <Amount value={data.debts_total} size="xl" negative />
        </Card>
      </div>
    </div>
  )
}
