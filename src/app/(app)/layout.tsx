import { LayoutShell } from '@/components/LayoutShell'
import { ToastProvider } from '@/components/Toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LayoutShell>{children}</LayoutShell>
      <ToastProvider />
    </>
  )
}
