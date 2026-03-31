'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUI } from '@/lib/store'
import { useLogout } from '@/hooks/use-profile'

const adminSections = [
  {
    title: 'Plataforma',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/users', label: 'Usuários', icon: Users },
      { href: '/admin/feedbacks', label: 'Feedbacks', icon: MessageSquare },
      { href: '/admin/subscriptions', label: 'Assinaturas', icon: CreditCard },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/admin/settings', label: 'Configurações', icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { drawerOpen, closeDrawer } = useUI()
  const logout = useLogout()

  const handleLinkClick = () => closeDrawer()

  return (
    <>
      {drawerOpen && (
        <div className="fixed inset-0 z-[98] bg-black/50 md:hidden" onClick={closeDrawer} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-[99] flex w-[240px] flex-col bg-gray-900 transition-transform duration-200 flex-shrink-0',
          'h-[100dvh]',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0 md:h-screen'
        )}
      >
        {/* Header */}
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="36" height="36" viewBox="0 0 50 50" fill="none">
                <circle cx="25" cy="25" r="23" fill="#2D6A4F" stroke="#52B788" strokeWidth="0.8"/>
                <path d="M 11 37 L 11 14 L 25 26 L 39 14 L 39 37" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M 25 26 L 39 14 L 46 7" stroke="#F4A261" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">Meu Sócio</div>
                <div className="text-[10px] text-orange-400 font-medium">Painel Admin</div>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white md:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1 scrollbar-thin">
          {adminSections.map((section) => (
            <div key={section.title}>
              <div className="px-4 pb-0.5 pt-3 text-[9px] font-semibold uppercase tracking-widest text-gray-500">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                const isExactAdmin = item.href === '/admin' && pathname === '/admin'
                const active = isActive || isExactAdmin
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      'flex items-center gap-2.5 border-l-2 px-4 py-2.5 text-[13px] transition-all min-h-[44px]',
                      active
                        ? 'border-orange-400 bg-white/10 font-medium text-white'
                        : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon size={16} className="opacity-85 flex-shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-4 py-3">
          <button
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[12px] text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>
    </>
  )
}
