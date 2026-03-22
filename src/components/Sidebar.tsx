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
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const sections = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
    ],
  },
  {
    title: 'Conta',
    items: [
      { href: '/settings', label: 'Configuracoes', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-[220px] flex-col bg-brand-900 h-screen flex-shrink-0">
      {/* Brand */}
      <div className="border-b border-white/10 px-4 py-4">
        <div className="text-base font-semibold text-white">Meu Socio</div>
        <div className="text-[10px] text-brand-300/70">Gestao para MEI</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-4 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-widest text-brand-300/40">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 border-l-2 px-4 py-2 text-xs transition-all',
                    isActive
                      ? 'border-brand-500 bg-white/10 font-medium text-white'
                      : 'border-transparent text-brand-300/75 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon size={14} className="opacity-85" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-3">
        <span className="inline-block rounded-full bg-brand-500/20 px-2 py-0.5 text-[9px] font-semibold text-brand-500">
          PRO
        </span>
        <div className="mt-1 text-[10px] text-brand-300/50">R$39,90/mes</div>
      </div>
    </aside>
  )
}
