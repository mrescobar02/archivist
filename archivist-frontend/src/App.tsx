import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { OverviewPage } from '@/pages/Overview'
import { FondosPage } from '@/pages/Fondos'
import { ReportsPage } from '@/pages/Reports'
import { AssistantPage } from '@/pages/Assistant'
import { ProfilePage } from '@/pages/Profile'
import { RemindersPage } from '@/pages/Reminders'
import { JournalPage } from '@/pages/Journal'
import RewardsPage from '@/pages/Rewards'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="fondos" element={<FondosPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="rewards" element={<RewardsPage />} />
      </Route>
    </Routes>
  )
}
