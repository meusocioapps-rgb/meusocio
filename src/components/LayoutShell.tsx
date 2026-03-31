'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '@/components/Sidebar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { TopBar } from '@/components/TopBar'
import { BottomTabs } from '@/components/BottomTabs'
import { MobileDrawer } from '@/components/MobileDrawer'
import { PaywallModal } from '@/components/PaywallModal'
import { useProfile, useSubscription } from '@/hooks/use-profile'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'meusocio.apps@gmail.com'

function useAuthEmail() {
  return useQuery({
    queryKey: ['auth-email'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      return user?.email ?? null
    },
    staleTime: Infinity,
    retry: 1,
  })
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { data: profile } = useProfile()
  const { data: authEmail, isLoading: emailLoading } = useAuthEmail()
  const { data: subscription } = useSubscription()
  const pathname = usePathname()
  const router = useRouter()

  const isLoading = emailLoading
  const isAdmin = authEmail === ADMIN_EMAIL || profile?.email === ADMIN_EMAIL
  const isAdminRoute = pathname.startsWith('/admin')

  // Check trial/subscription status
  const isTrialExpired = (() => {
    if (!subscription) return false
    if (subscription.status === 'active') return false
    if (subscription.status === 'free') return false
    if (subscription.status === 'trialing' && subscription.trial_ends_at) {
      return new Date(subscription.trial_ends_at) < new Date()
    }
    if (subscription.status === 'cancelled' || subscription.status === 'past_due') return true
    // Default: check if trial_ends_at has passed
    if (subscription.trial_ends_at) {
      return new Date(subscription.trial_ends_at) < new Date()
    }
    return false
  })()

  const daysLeft = (() => {
    if (!subscription?.trial_ends_at) return undefined
    const diff = new Date(subscription.trial_ends_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })()

  // Pages that should NOT be blocked by paywall
  const paywallExemptPages = ['/assinatura', '/profile', '/feedback', '/support', '/export']
  const isExemptPage = paywallExemptPages.some((p) => pathname.startsWith(p))

  const showPaywall = !isAdmin && isTrialExpired && !isExemptPage

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
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:p-5 md:pb-5">
          {children}
        </div>
      </main>
      <BottomTabs />
      <MobileDrawer />
      {showPaywall && <PaywallModal isExpired={true} daysLeft={daysLeft} />}
    </div>
  )
}
