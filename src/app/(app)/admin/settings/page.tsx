'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/Toast'
import { Settings, Key, Globe, CreditCard, Shield, Lock, Eye, EyeOff } from 'lucide-react'

export default function AdminSettingsPage() {
  const [stripeKey, setStripeKey] = useState('')

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Configurações da Plataforma</h1>
        <p className="text-sm text-gray-500">Ajustes gerais do sistema Meu Sócio</p>
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
            As chaves devem ser adicionadas nas variáveis de ambiente da Vercel.
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
              <span className="text-gray-500">Versão</span>
              <span className="font-medium text-gray-800">1.0.0</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-500">Plano base</span>
              <span className="font-medium text-gray-800">R$ 39,90/mês</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-500">Período de teste</span>
              <span className="font-medium text-gray-800">7 dias</span>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-500">Admin</span>
              <span className="font-medium text-gray-800">meusocio.apps@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Alterar senha */}
        <AdminPasswordSection />

        {/* Security */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-brand-900" />
            <h3 className="text-sm font-semibold text-gray-800">Segurança</h3>
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

function AdminPasswordSection() {
  const [open, setOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()

  const handleChange = async () => {
    setError('')
    setSuccess('')
    if (!newPassword.trim()) { setError('Informe a nova senha.'); return }
    if (newPassword.length < 6) { setError('Mínimo 6 caracteres.'); return }
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem.'); return }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (err) {
      setError(`Erro: ${err.message}`)
    } else {
      setSuccess('Senha alterada com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => { setOpen(false); setSuccess('') }, 2000)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-5 py-4">
        <Lock size={16} className="text-brand-900" />
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-gray-800">Alterar senha</div>
          <div className="text-xs text-gray-500">Redefina sua senha de acesso</div>
        </div>
        <span className="text-gray-300">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Nova senha</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-9 text-[13px] outline-none focus:border-brand-900"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Confirmar</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
            />
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">{error}</div>}
          {success && <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-700">{success}</div>}
          <button onClick={handleChange} disabled={loading} className="w-full rounded-lg bg-brand-900 py-2.5 text-xs font-medium text-white disabled:opacity-50">
            {loading ? 'Alterando...' : 'Alterar senha'}
          </button>
        </div>
      )}
    </div>
  )
}
