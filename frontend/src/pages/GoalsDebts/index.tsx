import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/store/ui'
import { TabBar } from '@/components/primitives/TabBar'
import { GoalsTab } from './GoalsTab'
import { DebtsTab } from './DebtsTab'

export function GoalsDebtsPage() {
  const { t } = useTranslation()
  const { activeTab, setActiveTab } = useUiStore()
  const tab = activeTab['goals-debts'] ?? 'goals'

  const tabs = [
    { id: 'goals', label: t('goalsDebts.tabs.goals'), icon: 'flag' },
    { id: 'debts', label: t('goalsDebts.tabs.debts'), icon: 'credit_card' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">{t('goalsDebts.title')}</h1>
        <p className="text-sm text-on-surface-variant mt-1">{t('goalsDebts.subtitle')}</p>
      </div>
      <TabBar tabs={tabs} active={tab} onChange={id => setActiveTab('goals-debts', id)} className="mb-8" />
      {tab === 'goals' && <GoalsTab />}
      {tab === 'debts' && <DebtsTab />}
    </div>
  )
}
