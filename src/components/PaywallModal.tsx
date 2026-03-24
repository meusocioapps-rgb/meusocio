'use client'

import { useState } from 'react'
import { CreditCard, Check, Shield } from 'lucide-react'

interface PaywallModalProps {
  daysLeft?: number
  isExpired: boolean
}

export function PaywallModal({ daysLeft, isExpired }: PaywallModalProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Erro ao criar sessao de pagamento. Tente novamente.')
      }
    } catch {
      alert('Erro de conexao. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // If not expired and days left, show a dismissible banner
  if (!isExpired && daysLeft !== undefined && daysLeft > 0) {
    return null // Trial still active, no modal needed
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
            <CreditCard size={28} className="text-brand-900" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {isExpired ? 'Seu periodo gratuito terminou' : 'Assine o Meu Socio'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isExpired
              ? 'Para continuar usando o Meu Socio, escolha um plano.'
              : 'Desbloqueie todas as funcionalidades.'}
          </p>
        </div>

        {/* Plan Card */}
        <div className="rounded-xl border-2 border-brand-900 bg-brand-50/50 p-5 mb-5">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-semibold text-brand-900">Plano Pro</span>
            <div>
              <span className="text-2xl font-bold text-gray-900">R$ 39,90</span>
              <span className="text-sm text-gray-500">/mes</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              'Clientes ilimitados',
              'Agendamentos ilimitados',
              'Controle financeiro completo',
              'Relatorios e visao geral',
              'Exportacao de dados (CSV)',
              'Suporte prioritario',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-gray-700">
                <Check size={14} className="text-green-600 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full rounded-xl bg-brand-900 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Redirecionando...' : 'Assinar agora'}
        </button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
          <Shield size={11} />
          Pagamento seguro via Stripe. Cancele quando quiser.
        </div>
      </div>
    </div>
  )
}
