import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Toast } from '@/components/primitives/Toast'
import { CelebrationModal } from '@/components/feedback/CelebrationModal'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
      <Toast />
      <CelebrationModal />
    </div>
  )
}
