'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { TopBar } from '@/components/TopBar'
import { BottomTabs } from '@/components/BottomTabs'
import { MobileDrawer } from '@/components/MobileDrawer'
import { useProfile } from '@/hooks/use-profile'

const ADMIN_EMAIL = 'meusocio.apps@gmail.com'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useProfile()
  const pathname = usePathname()
  const router = useRouter()

  const isAdmin = profile?.email === ADMIN_EMAIL
  const isAdminRoute = pathname.startsWith('/admin')

  // Redirect admin to /admin on first load if they hit /dashboard
  useEffect(() => {
    if (!isLoading && isAdmin && pathname === '/dashboard') {
      router.replace('/admin')
    }
  }, [isAdmin, isLoading, pathname, router])

  // Redirect non-admin away from /admin routes
  useEffect(() => {
    if (!isLoading && !isAdmin && isAdminRoute) {
      router.replace('/dashboard')
    }
  }, [isAdmin, isLoading, isAdminRoute, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-900 border-t-transparent" />
      </div>
    )
  }

  // Admin layout
  if (isAdmin) {
    return (
      <div className="flex h-screen overflow-hidden md:flex-row">
        <AdminSidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-5 md:p-6 md:pb-6">
            {children}
          </div>
        </main>
      </div>
    )
  }

  // Regular user layout
  return (
    <div className="flex h-screen overflow-hidden md:flex-row">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-4 pb-5 md:p-5 md:pb-5">
          {children}
        </div>
      </main>
      <BottomTabs />
      <MobileDrawer />
    </div>
  )
}
