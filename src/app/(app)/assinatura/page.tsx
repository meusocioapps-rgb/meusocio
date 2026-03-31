'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useSubscription } from '@/hooks/use-profile'
import { Check, CreditCard, Shield, PartyPopper, XCircle, Loader2, Settings } from 'lucide-react'

function AssinaturaContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const canceled = searchParams.get('canceled') === 'true'
  const { data: subscription, isLoading } = useSubscription()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erro ao criar sessao de pagamento')
      }
    } catch {
      alert('Erro de conexao. Tente novamente.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erro ao abrir portal')
      }
    } catch {
      alert('Erro de conexao. Tente novamente.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const isActive = subscription?.status === 'active'
  const isTrialing = subscription?.status === 'trialing'
  const hasStripeCustomer = !!subscription?.stripe_customer_id

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Success message */}
      {success && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <PartyPopper size={20} className="mt-0.5 shrink-0 text-green-600" />
          <div>
            <h3 className="text-sm font-semibold text-green-800">Pagamento confirmado!</h3>
            <p className="mt-0.5 text-xs text-green-600">
              Sua assinatura foi ativada com sucesso. Aproveite o Meu Socio!
            </p>
          </div>
        </div>
      )}

      {/* Canceled message */}
      {canceled && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <XCircle size={20} className="mt-0.5 shrink-0 text-yellow-600" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">Pagamento cancelado</h3>
            <p className="mt-0.5 text-xs text-yellow-600">
              Voce pode tentar novamente quando quiser.
            </p>
          </div>
        </div>
      )}

      {/* Current plan status */}
      {isActive && (
        <div className="mb-4 rounded-xl border border-green-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <Check size={16} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Plano Pro Ativo</h3>
                <p className="text-[11px] text-gray-400">
                  Renova em {formatDate(subscription?.current_period_end ?? null)}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-semibold text-green-700">
              Ativo
            </span>
          </div>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <Settings size={13} />
            {portalLoading ? 'Abrindo...' : 'Gerenciar assinatura'}
          </button>
        </div>
      )}

      {/* Trial status */}
      {isTrialing && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="text-sm font-semibold text-yellow-800">Periodo de teste</h3>
          <p className="mt-0.5 text-xs text-yellow-600">
            Seu trial termina em {formatDate(subscription?.trial_ends_at ?? null)}. Assine para continuar usando.
          </p>
        </div>
      )}

      {/* Plan card — show if not active */}
      {!isActive && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-center mb-5">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
              <CreditCard size={24} className="text-brand-900" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Meu Socio Pro</h2>
            <div className="mt-1">
              <span className="text-3xl font-bold text-gray-900">R$ 39,90</span>
              <span className="text-sm text-gray-500">/mes</span>
            </div>
          </div>

          <div className="mb-5 space-y-2.5">
            {[
              'Clientes ilimitados',
              'Agendamentos ilimitados',
              'Controle financeiro completo',
              'Relatorios e visao geral',
              'Exportacao de dados (CSV)',
              'Campos personalizados',
              'Suporte prioritario',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-[13px] text-gray-700">
                <Check size={15} className="text-green-600 shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full rounded-xl bg-brand-900 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {checkoutLoading ? 'Redirecionando para pagamento...' : 'Assinar agora'}
          </button>

          {hasStripeCustomer && (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <Settings size={13} />
              {portalLoading ? 'Abrindo...' : 'Gerenciar assinatura existente'}
            </button>
          )}

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
            <Shield size={11} />
            Pagamento seguro via Stripe. Cancele quando quiser.
          </div>
        </div>
      )}
    </div>
  )
}

export default function AssinaturaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    }>
      <AssinaturaContent />
    </Suspense>
  )
}
