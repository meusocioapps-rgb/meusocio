import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { BottomTabs } from '@/components/BottomTabs'
import { MobileDrawer } from '@/components/MobileDrawer'
import { ToastProvider } from '@/components/Toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden md:flex-row">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:p-5 md:pb-5">
          {children}
        </div>
      </main>
      <BottomTabs />
      <MobileDrawer />
      <ToastProvider />
    </div>
  )
}
