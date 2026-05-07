import { useState } from 'react'
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
import { LoginPage } from '@/pages/Auth/Login'
import { LandingPage } from '@/pages/Landing'
import { BillingPage } from '@/pages/Billing'
import { useAuth } from '@/hooks/useAuth'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="w-6 h-6 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)

  if (loading) return <LoadingScreen />

  if (!session) {
    if (authMode === null) {
      return (
        <LandingPage
          onGetStarted={() => setAuthMode('register')}
          onSignIn={() => setAuthMode('login')}
        />
      )
    }
    return (
      <LoginPage
        initialMode={authMode}
        onBack={() => setAuthMode(null)}
      />
    )
  }

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
        <Route path="billing" element={<BillingPage />} />
      </Route>
    </Routes>
  )
}
