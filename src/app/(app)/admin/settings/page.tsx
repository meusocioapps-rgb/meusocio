'use client'

import { useState } from 'react'
import { toast } from '@/components/Toast'
import { Settings, Key, Globe, CreditCard, Shield } from 'lucide-react'

export default function AdminSettingsPage() {
  const [stripeKey, setStripeKey] = useState('')

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Configuracoes da Plataforma</h1>
        <p className="text-sm text-gray-500">Ajustes gerais do sistema Meu Socio</p>
      </div>

      <div className="space-y-4">
        {/* Stripe Config */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-brand-900" />
            <h3 className="text-sm font-semibold text-gray-800">Stripe (Pagamentos)</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Configure as chaves do Stripe para ativar cobranças recorrentes.
            As chaves devem ser adicionadas nas variaveis de ambiente da Vercel.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <Key size={13} className="text-gray-400" />
              <span className="text-xs text-gray-500">STRIPE_SECRET_KEY</span>
              <span className="ml-auto text-[10px] text-green-600 font-medium">
                {process.env.NEXT_PUBLIC_STRIPE_KEY ? 'Configurada' : 'Pendente'}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <Key size={13} className="text-gray-400" />
              <span className="text-xs text-gray-500">STRIPE_PRICE_ID</span>
              <span className="ml-auto text-[10px] text-orange-600 font-medium">Configurar na Vercel</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <Key size={13} className="text-gray-400" />
              <span className="text-xs text-gray-500">STRIPE_WEBHOOK_SECRET</span>
              <span className="ml-auto text-[10px] text-orange-600 font-medium">Configurar na Vercel</span>
            </div>
          </div>
        </div>

        {/* Platform Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-brand-900" />
            <h3 className="text-sm font-semibold text-gray-800">Plataforma</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-500">Versao</span>
              <span className="font-medium text-gray-800">1.0.0</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-500">Plano base</span>
              <span className="font-medium text-gray-800">R$ 39,90/mes</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-500">Periodo de teste</span>
              <span className="font-medium text-gray-800">7 dias</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-500">Admin</span>
              <span className="font-medium text-gray-800">meusocio.apps@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-brand-900" />
            <h3 className="text-sm font-semibold text-gray-800">Seguranca</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-500">RLS (Row Level Security)</span>
              <span className="font-medium text-green-600">Ativo</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-500">LGPD Compliance</span>
              <span className="font-medium text-green-600">Ativo</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-500">Cookie Consent</span>
              <span className="font-medium text-green-600">Ativo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
