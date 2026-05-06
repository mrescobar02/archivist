import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/store/ui'
import { TabBar } from '@/components/primitives/TabBar'
import { DistributionTab } from './DistributionTab'
import { SavingsTab } from './SavingsTab'

export function BudgetPage() {
  const { t } = useTranslation()
  const { activeTab, setActiveTab } = useUiStore()
  const tab = activeTab['budget'] ?? 'distribution'

  const tabs = [
    { id: 'distribution', label: t('budget.tabs.distribution'), icon: 'pie_chart' },
    { id: 'savings', label: t('budget.tabs.savings'), icon: 'savings' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">{t('budget.title')}</h1>
        <p className="text-sm text-on-surface-variant mt-1">{t('budget.subtitle')}</p>
      </div>
      <TabBar tabs={tabs} active={tab} onChange={id => setActiveTab('budget', id)} className="mb-8" />
      {tab === 'distribution' && <DistributionTab />}
      {tab === 'savings' && <SavingsTab />}
    </div>
  )
}
