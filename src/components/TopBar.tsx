'use client'

import { usePathname } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'
import { useUI } from '@/lib/store'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clientes',
  '/schedule': 'Agenda',
  '/schedule/new': 'Novo Atendimento',
  '/finances': 'Receitas',
  '/finances/expenses': 'Despesas',
  '/settings': 'Configuracoes',
}

export function TopBar() {
  const pathname = usePathname()
  const openDrawer = useUI((s) => s.openDrawer)

  const title = titles[pathname] || 'Meu Socio'
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="sticky top-0 z-40 flex min-h-[56px] items-center justify-between border-b border-gray-200 bg-white px-4 md:px-5">
      <div className="flex items-center gap-2.5">
        <button
          onClick={openDrawer}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-lg md:hidden"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold">{title}</h1>
          <p className="mt-0.5 hidden text-[11px] text-gray-400 md:block">
            {today}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <Bell size={16} />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-[11px] font-semibold text-white">
          MS
        </div>
      </div>
    </header>
  )
}
