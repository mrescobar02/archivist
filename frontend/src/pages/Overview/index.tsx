import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/store/ui'
import { TabBar } from '@/components/primitives/TabBar'
import { DashboardTab } from './DashboardTab'
import { IncomeTab } from './IncomeTab'
import { ExpensesTab } from './ExpensesTab'

export function OverviewPage() {
  const { t } = useTranslation()
  const { activeTab, setActiveTab } = useUiStore()
  const tab = activeTab['overview'] ?? 'dashboard'

  const tabs = [
    { id: 'dashboard', label: t('overview.tabs.dashboard'), icon: 'dashboard' },
    { id: 'income', label: t('overview.tabs.income'), icon: 'arrow_downward' },
    { id: 'expenses', label: t('overview.tabs.expenses'), icon: 'arrow_upward' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">{t('overview.title')}</h1>
        <p className="text-sm text-on-surface-variant mt-1">{t('overview.subtitle')}</p>
      </div>
      <TabBar tabs={tabs} active={tab} onChange={id => setActiveTab('overview', id)} className="mb-8" />
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'income' && <IncomeTab />}
      {tab === 'expenses' && <ExpensesTab />}
    </div>
  )
}
