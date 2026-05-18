import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Toast } from '@/components/primitives/Toast'
import { CelebrationModal } from '@/components/feedback/CelebrationModal'
import { OnboardingTour } from '@/components/feedback/OnboardingTour'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
      <Toast />
      <CelebrationModal />
      <OnboardingTour />
    </div>
  )
}
