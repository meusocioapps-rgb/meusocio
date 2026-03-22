'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Calendar,
  Menu,
} from 'lucide-react'
import { useUI } from '@/lib/store'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/schedule/new', label: 'Novo', icon: PlusCircle },
  { href: '/schedule', label: 'Agenda', icon: Calendar },
  { href: '#more', label: 'Mais', icon: Menu },
]

export function BottomTabs() {
  const pathname = usePathname()
  const openDrawer = useUI((s) => s.openDrawer)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-brand-900 md:hidden"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const isMore = tab.href === '#more'
          const isActive = !isMore && pathname.startsWith(tab.href)
          const Icon = tab.icon

          if (isMore) {
            return (
              <button
                key="more"
                onClick={openDrawer}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] text-brand-300/70 transition-colors hover:text-white"
              >
                <Icon size={20} />
                {tab.label}
              </button>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-brand-300/70 hover:text-white'
              )}
            >
              <Icon size={20} />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
