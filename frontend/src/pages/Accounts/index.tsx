import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/store/ui'
import { TabBar } from '@/components/primitives/TabBar'
import { AccountsTab } from './AccountsTab'
import { TransfersTab } from './TransfersTab'

export function AccountsPage() {
  const { t } = useTranslation()
  const { activeTab, setActiveTab } = useUiStore()
  const tab = activeTab['accounts'] ?? 'accounts'

  const tabs = [
    { id: 'accounts', label: t('accounts.tabs.accounts'), icon: 'account_balance' },
    { id: 'transfers', label: t('accounts.tabs.transfers'), icon: 'swap_horiz' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">{t('accounts.title')}</h1>
        <p className="text-sm text-on-surface-variant mt-1">{t('accounts.subtitle')}</p>
      </div>
      <TabBar tabs={tabs} active={tab} onChange={id => setActiveTab('accounts', id)} className="mb-8" />
      {tab === 'accounts' && <AccountsTab />}
      {tab === 'transfers' && <TransfersTab />}
    </div>
  )
}
