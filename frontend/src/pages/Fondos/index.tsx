import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/store/ui'
import { TabBar } from '@/components/primitives/TabBar'
import { AccountsTab } from '@/pages/Accounts/AccountsTab'
import { TransfersTab } from '@/pages/Accounts/TransfersTab'
import { DistributionTab } from '@/pages/Budget/DistributionTab'
import { DebtsTab } from '@/pages/GoalsDebts/DebtsTab'

export function FondosPage() {
  const { t } = useTranslation()
  const { activeTab, setActiveTab } = useUiStore()
  const tab = activeTab['fondos'] ?? 'accounts'

  const tabs = [
    { id: 'accounts',      label: t('fondos.tabs.accounts'),      icon: 'account_balance' },
    { id: 'transfers',     label: t('fondos.tabs.transfers'),      icon: 'swap_horiz' },
    { id: 'distribution',  label: t('fondos.tabs.distribution'),   icon: 'pie_chart' },
    { id: 'debts',         label: t('fondos.tabs.debts'),          icon: 'credit_card' },
  ]

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">{t('fondos.title')}</h1>
        <p className="text-sm text-on-surface-variant mt-1">{t('fondos.subtitle')}</p>
      </div>
      <TabBar tabs={tabs} active={tab} onChange={id => setActiveTab('fondos', id)} className="mb-8" />
      {tab === 'accounts'     && <AccountsTab />}
      {tab === 'transfers'    && <TransfersTab />}
      {tab === 'distribution' && <DistributionTab />}
      {tab === 'debts'        && <DebtsTab />}
    </div>
  )
}
