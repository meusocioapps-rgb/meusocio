'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Calendar, DollarSign, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/schedule/new', label: 'Novo', icon: PlusCircle, accent: true },
  { href: '/schedule', label: 'Agenda', icon: Calendar },
  { href: '/finances', label: 'Finanças', icon: DollarSign },
]

export function BottomTabs() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = tab.href === pathname || (tab.href !== '/schedule/new' && pathname.startsWith(tab.href + '/'))
          const Icon = tab.icon

          if (tab.accent) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 py-2 px-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-white shadow-md">
                  <Icon size={20} />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 min-w-[60px]',
                isActive ? 'text-brand-900' : 'text-gray-400'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
