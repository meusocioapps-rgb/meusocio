'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Calendar,
  PlusCircle,
  DollarSign,
  TrendingDown,
  CreditCard,
  FileText,
  User,
  Settings,
  HelpCircle,
  Shield,
  X,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useUI } from '@/lib/store'
import { useProfile } from '@/hooks/use-profile'

const ADMIN_EMAIL = 'meusocio.apps@gmail.com'

const baseSections = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/overview', label: 'Overview', icon: BarChart3 },
      { href: '/clients', label: 'Clientes', icon: Users },
      { href: '/schedule', label: 'Agenda', icon: Calendar },
      { href: '/schedule/new', label: 'Novo Atendimento', icon: PlusCircle },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { href: '/finances', label: 'Receitas', icon: DollarSign },
      { href: '/finances/expenses', label: 'Despesas', icon: TrendingDown },
      { href: '/finances/pending', label: 'A Receber/Pagar', icon: CreditCard },
      { href: '/reports', label: 'Relatorio', icon: FileText },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { drawerOpen, closeDrawer } = useUI()
  const { data: profile } = useProfile()

  const isAdmin = profile?.email === ADMIN_EMAIL

  const sections = [
    ...baseSections,
    {
      title: 'Conta',
      items: [
        ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
        { href: '/profile', label: 'Perfil', icon: User },
        { href: '/settings', label: 'Configuracoes', icon: Settings },
        { href: '/support', label: 'Ajuda', icon: HelpCircle },
      ],
    },
  ]

  const profileName = profile?.business_name || profile?.full_name || 'Meu Socio'
  const initials = getInitials(profileName)

  const handleLinkClick = () => {
    // Close drawer on mobile when navigating
    closeDrawer()
  }

  return (
    <>
      {/* Overlay - mobile only */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[98] bg-black/50 md:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Base styles
          'fixed top-0 left-0 bottom-0 z-[99] flex w-[240px] flex-col bg-brand-900 transition-transform duration-200 flex-shrink-0',
          // Mobile: full height with safe area
          'h-[100dvh]',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, static positioning
          'md:static md:translate-x-0 md:h-screen'
        )}
      >
        {/* Header with profile + close button */}
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="36" height="36" viewBox="0 0 50 50" fill="none">
                <circle cx="25" cy="25" r="23" fill="#2D6A4F" stroke="#52B788" strokeWidth="0.8"/>
                <path d="M 11 37 L 11 14 L 25 26 L 39 14 L 39 37" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M 25 26 L 39 14 L 46 7" stroke="#F4A261" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{profileName}</div>
                <div className="text-[10px] text-brand-300/70">Gestao para MEI</div>
              </div>
            </div>
            {/* Close button - mobile only */}
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
          {sections.map((section) => (
            <div key={section.title}>
              <div className="px-4 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-widest text-brand-300/40">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      'flex items-center gap-2.5 border-l-2 px-4 py-2.5 text-[13px] transition-all min-h-[44px]',
                      isActive
                        ? 'border-brand-500 bg-white/10 font-medium text-white'
                        : 'border-transparent text-brand-300/75 hover:bg-white/5 hover:text-white'
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

        {/* Footer with plan badge */}
        <div className="border-t border-white/10 px-4 py-3">
          <span className="inline-block rounded-full bg-brand-500/20 px-2.5 py-0.5 text-[9px] font-semibold text-brand-500">
            PRO
          </span>
          <div className="mt-1 text-[10px] text-brand-300/50">R$39,90/mes</div>
        </div>
      </aside>
    </>
  )
}
