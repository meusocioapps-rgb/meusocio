'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, Clock, AlertTriangle, CheckCircle, XCircle, Users } from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  business_name: string | null
  email: string | null
  created_at: string
}

interface Subscription {
  user_id: string
  plan: string | null
  status: string
  trial_ends_at: string | null
  paid_until: string | null
  price: number | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string | null
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusBadge(s: string) {
  switch (s) {
    case 'active': return { label: 'Ativo', color: 'bg-green-100 text-green-700', Icon: CheckCircle }
    case 'trial': case 'trialing': return { label: 'Trial', color: 'bg-yellow-100 text-yellow-700', Icon: Clock }
    case 'past_due': return { label: 'Pendente', color: 'bg-orange-100 text-orange-700', Icon: AlertTriangle }
    case 'cancelled': return { label: 'Cancelado', color: 'bg-red-100 text-red-700', Icon: XCircle }
    default: return { label: s, color: 'bg-gray-100 text-gray-600', Icon: CreditCard }
  }
}

export default function AdminSubscriptionsPage() {
  const supabase = createClient()

  const { data: profiles } = useQuery({
    queryKey: ['admin', 'sub-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, business_name, email, created_at').order('created_at', { ascending: false })
      return (data ?? []) as Profile[]
    },
  })

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin', 'sub-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscriptions').select('*')
      if (error) return []
      return data as Subscription[]
    },
  })

  // Merge profiles with subscriptions
  const merged = useMemo(() => {
    const subMap = new Map((subscriptions ?? []).map((s) => [s.user_id, s]))
    return (profiles ?? []).map((p) => ({
      ...p,
      subscription: subMap.get(p.id) ?? null,
    }))
  }, [profiles, subscriptions])

  const stats = useMemo(() => {
    const subs = subscriptions ?? []
    return {
      total: (profiles ?? []).length,
      active: subs.filter((s) => s.status === 'active').length,
      trial: subs.filter((s) => s.status === 'trial' || s.status === 'trialing').length,
      pastDue: subs.filter((s) => s.status === 'past_due').length,
      cancelled: subs.filter((s) => s.status === 'cancelled').length,
      mrr: subs.filter((s) => s.status === 'active').reduce((sum, s) => sum + (s.price ?? 0), 0),
      noSub: (profiles ?? []).length - subs.length,
    }
  }, [profiles, subscriptions])

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-900 border-t-transparent" /></div>
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Assinaturas</h1>
        <p className="text-sm text-gray-500">Gestao de planos e pagamentos</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-gray-900' },
          { label: 'Ativos', value: stats.active, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Trial', value: stats.trial, icon: Clock, color: 'text-yellow-600' },
          { label: 'Sem plano', value: stats.noSub, icon: CreditCard, color: 'text-gray-400' },
          { label: 'Pendente', value: stats.pastDue, icon: AlertTriangle, color: 'text-orange-600' },
          { label: 'MRR', value: fmtCurrency(stats.mrr), icon: CreditCard, color: 'text-brand-900' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-1.5">
              <s.icon size={13} className={s.color} />
              <span className="text-[10px] font-medium uppercase text-gray-400">{s.label}</span>
            </div>
            <p className={`mt-1 text-lg font-bold ${s.color}`}>{typeof s.value === 'number' ? s.value : s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Trial ate</th>
              <th className="px-4 py-3 font-medium">Pago ate</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {merged.map((u) => {
              const sub = u.subscription
              const badge = statusBadge(sub?.status ?? 'none')
              return (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{u.business_name || u.full_name || '—'}</p>
                    <p className="text-[10px] text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.color}`}>
                      <badge.Icon size={10} /> {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{sub?.plan ?? 'Sem plano'}</td>
                  <td className="px-4 py-3 text-gray-500">{sub?.price ? fmtCurrency(sub.price) : '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{fmtDate(sub?.trial_ends_at ?? null)}</td>
                  <td className="px-4 py-3 text-gray-400">{fmtDate(sub?.paid_until ?? null)}</td>
                  <td className="px-4 py-3 text-gray-400">{fmtDate(u.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
