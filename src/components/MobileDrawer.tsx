'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useUI } from '@/lib/store'

const drawerLinks = [
  { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
  { href: '/clients', label: 'Clientes', emoji: '👥' },
  { href: '/schedule', label: 'Agenda', emoji: '📅' },
  { href: '/schedule/new', label: 'Novo Atendimento', emoji: '➕' },
  { href: '/finances', label: 'Receitas', emoji: '💵' },
  { href: '/finances/expenses', label: 'Despesas', emoji: '💸' },
  { href: '/settings', label: 'Configuracoes', emoji: '⚙️' },
]

export function MobileDrawer() {
  const { drawerOpen, closeDrawer } = useUI()

  return (
    <>
      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[98] bg-black/50 md:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 top-0 z-[99] flex w-[280px] flex-col bg-brand-900 transition-transform duration-200 md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
          <div className="text-base font-semibold text-white">Meu Socio</div>
          <button
            onClick={closeDrawer}
            className="text-white/60 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {drawerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeDrawer}
              className="flex items-center gap-3 px-4 py-3 text-sm text-brand-300/75 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="text-base">{link.emoji}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
