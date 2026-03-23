'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell, Menu, X, Gift, AlertTriangle, UserMinus, CreditCard } from 'lucide-react'
import { useUI } from '@/lib/store'
import { useNotifications } from '@/hooks/use-dashboard'
import { formatCurrency } from '@/lib/utils'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clientes',
  '/schedule': 'Agenda',
  '/schedule/new': 'Novo Atendimento',
  '/finances': 'Receitas',
  '/finances/expenses': 'Despesas',
  '/finances/pending': 'A Receber / Pagar',
  '/reports': 'Relatórios',
  '/export': 'Exportar Dados',
  '/settings': 'Configurações',
  '/overview': 'Overview',
  '/profile': 'Meu Perfil',
  '/support': 'Ajuda',
}

export function TopBar() {
  const pathname = usePathname()
  const openDrawer = useUI((s) => s.openDrawer)
  const [showNotifications, setShowNotifications] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const { data: notifications } = useNotifications()
  const count = notifications?.length ?? 0

  const title = titles[pathname] || 'Meu Sócio'
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // Close panel on outside click
  useEffect(() => {
    if (!showNotifications) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifications])

  const getIcon = (type: string) => {
    switch (type) {
      case 'birthday':
        return <Gift size={14} className="text-pink-500" />
      case 'fixed_expense':
        return <CreditCard size={14} className="text-orange-500" />
      case 'inactive_client':
        return <UserMinus size={14} className="text-red-500" />
      default:
        return <AlertTriangle size={14} className="text-yellow-500" />
    }
  }

  const getTitle = (n: { type: string; client_name?: string; description?: string }) => {
    switch (n.type) {
      case 'birthday':
        return `🎂 ${n.client_name}`
      case 'fixed_expense':
        return `💰 ${n.description}`
      case 'inactive_client':
        return `⚠️ ${n.client_name}`
      default:
        return n.description || 'Notificação'
    }
  }

  const getSubtitle = (n: { type: string; days_until: number; amount?: number }) => {
    switch (n.type) {
      case 'birthday':
        if (n.days_until === 0) return 'Faz aniversário hoje!'
        if (n.days_until === 1) return 'Faz aniversário amanhã!'
        return `Aniversário em ${n.days_until} dias`
      case 'fixed_expense':
        return n.days_until === 0
          ? `Vence hoje · ${formatCurrency(n.amount ?? 0)}`
          : n.days_until < 0
            ? `Venceu há ${Math.abs(n.days_until)} dias · ${formatCurrency(n.amount ?? 0)}`
            : `Vence em ${n.days_until} dias · ${formatCurrency(n.amount ?? 0)}`
      case 'inactive_client':
        return `Inativo há ${Math.abs(n.days_until)} dias`
      default:
        return ''
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'birthday':
        return 'bg-pink-100'
      case 'fixed_expense':
        return 'bg-orange-100'
      case 'inactive_client':
        return 'bg-red-100'
      default:
        return 'bg-gray-100'
    }
  }

  return (
    <header className="sticky top-0 z-40 flex min-h-[56px] items-center justify-between border-b border-gray-200 bg-white px-3 md:px-5">
      <div className="flex items-center gap-2">
        <button
          onClick={openDrawer}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-lg active:bg-gray-100 md:hidden"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold">{title}</h1>
          <p className="mt-0.5 hidden text-[11px] text-gray-400 md:block">
            {today}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white"
          >
            <Bell size={16} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {/* Notification panel */}
          {showNotifications && (
            <div className="absolute right-0 top-10 w-80 rounded-xl border border-gray-200 bg-white shadow-xl md:w-96">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-[13px] font-semibold">
                  Notificações {count > 0 && `(${count})`}
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Panel body */}
              <div className="max-h-[400px] overflow-y-auto">
                {count === 0 ? (
                  <div className="py-10 text-center">
                    <div className="mb-2 text-2xl">🔔</div>
                    <p className="text-xs text-gray-400">
                      Nenhuma notificação no momento
                    </p>
                  </div>
                ) : (
                  notifications?.map((n, i) => (
                    <div
                      key={`${n.type}-${n.client_id || n.description}-${i}`}
                      className="flex items-start gap-3 border-b border-gray-50 px-4 py-3 last:border-0 hover:bg-gray-50"
                    >
                      <div
                        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${getBadgeColor(n.type)}`}
                      >
                        {getIcon(n.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-medium leading-tight">
                          {getTitle(n)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-400">
                          {getSubtitle(n)}
                        </div>
                      </div>
                      {/* Action link for clients */}
                      {n.client_id && (
                        <Link
                          href={`/clients/${n.client_id}`}
                          onClick={() => setShowNotifications(false)}
                          className="mt-1 flex-shrink-0 text-[10px] font-medium text-brand-900 hover:underline"
                        >
                          Ver
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Panel footer */}
              {count > 0 && (
                <div className="border-t border-gray-100 px-4 py-2.5 text-center">
                  <Link
                    href="/settings"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-medium text-gray-400 hover:text-gray-600"
                  >
                    Configurar notificações →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center"
        >
          <svg width="32" height="32" viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="25" r="23" fill="#2D6A4F" stroke="#52B788" strokeWidth="0.8"/>
            <path d="M 11 37 L 11 14 L 25 26" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M 25 26 L 39 14" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M 25 26 L 39 14 L 46 7" stroke="#F4A261" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </Link>
      </div>
    </header>
  )
}
