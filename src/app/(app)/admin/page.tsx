'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  UserCheck,
  Clock,
  Crown,
  Search,
  Mail,
  Bell,
  Shield,
  X,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Profile {
  id: string
  full_name: string | null
  business_name: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string | null
}

type StatusFilter = 'all' | 'active' | 'trial' | 'expired' | 'cancelled'

// ---------------------------------------------------------------------------
// Hook — admin reads ALL profiles
// ---------------------------------------------------------------------------
function useAdminUsers() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function deriveStatus(_profile: Profile): 'trial' | 'active' | 'expired' | 'cancelled' {
  // Placeholder — without a subscriptions table every user is shown as Trial
  return 'trial'
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    trial: 'Trial',
    active: 'Ativo',
    expired: 'Expirado',
    cancelled: 'Cancelado',
  }
  return map[s] ?? s
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    trial: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  return map[s] ?? 'bg-gray-100 text-gray-500'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const { data: users, isLoading, error } = useAdminUsers()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Notification modal state
  const [notifTarget, setNotifTarget] = useState<Profile | null>(null)
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState<'push' | 'email' | 'whatsapp'>('push')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Derived lists
  const enriched = useMemo(
    () => (users ?? []).map((u) => ({ ...u, status: deriveStatus(u) })),
    [users],
  )

  const filtered = useMemo(() => {
    let list = enriched
    if (statusFilter !== 'all') {
      list = list.filter((u) => u.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) =>
          (u.full_name ?? '').toLowerCase().includes(q) ||
          (u.business_name ?? '').toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [enriched, search, statusFilter])

  // KPI counts
  const total = enriched.length
  const activeCount = enriched.filter((u) => u.status === 'active').length
  const trialCount = enriched.filter((u) => u.status === 'trial').length
  const paidCount = enriched.filter((u) => u.status === 'active').length // placeholder

  // Handlers
  function openNotifModal(user: Profile) {
    setNotifTarget(user)
    setNotifMessage('')
    setNotifType('push')
  }

  function sendNotification() {
    setNotifTarget(null)
    setToastMsg('Funcionalidade em desenvolvimento')
    setTimeout(() => setToastMsg(null), 3000)
  }

  // ---------- Render ----------
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-900 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <Shield size={32} className="text-red-400" />
        <p className="text-[13px] font-medium text-gray-700">
          Acesso negado ou erro ao carregar dados
        </p>
        <p className="text-[11px] text-gray-400">
          Somente administradores podem acessar este painel.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-3 py-4 md:px-6 md:py-6">
      {/* Header */}
      <div>
        <h2 className="text-[15px] font-bold text-brand-900 md:text-lg">
          Painel Administrativo
        </h2>
        <p className="text-[11px] text-gray-400">
          {total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total Usuarios', value: total, icon: Users, color: 'text-brand-900' },
          { label: 'Ativos', value: activeCount, icon: UserCheck, color: 'text-green-600' },
          { label: 'Trial', value: trialCount, icon: Clock, color: 'text-yellow-600' },
          { label: 'Pagantes', value: paidCount, icon: Crown, color: 'text-purple-600' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-gray-200 bg-white p-3 md:p-4"
          >
            <div className="flex items-center gap-2">
              <kpi.icon size={16} className={kpi.color} />
              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                {kpi.label}
              </span>
            </div>
            <div className={`mt-1 text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-900"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="trial">Trial</option>
          <option value="expired">Expirados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {/* Users — Desktop Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
              <th className="px-4 py-3 font-medium">Ultimo acesso</th>
              <th className="px-4 py-3 font-medium text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[11px] text-gray-400">
                  Nenhum usuario encontrado
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-[13px] text-gray-800">
                    {u.full_name || u.business_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(u.status)}`}
                    >
                      {statusLabel(u.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">Free</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(u.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openNotifModal(u)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-brand-900"
                        title="Notificar"
                      >
                        <Bell size={13} />
                      </button>
                      <a
                        href={`mailto:${u.email ?? ''}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-brand-900"
                        title="Email"
                      >
                        <Mail size={13} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Users — Mobile Card List */}
      <div className="space-y-2 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-[11px] text-gray-400">
            Nenhum usuario encontrado
          </div>
        ) : (
          filtered.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-gray-200 bg-white p-3"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-gray-800">
                    {u.full_name || u.business_name || '—'}
                  </p>
                  <p className="truncate text-[11px] text-gray-400">{u.email || '—'}</p>
                </div>
                <span
                  className={`ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(u.status)}`}
                >
                  {statusLabel(u.status)}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-400">
                <span>Cadastro: {formatDate(u.created_at)}</span>
                <span>Plano: Free</span>
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <button
                  onClick={() => openNotifModal(u)}
                  className="flex h-8 items-center gap-1 rounded-md border border-gray-200 px-2 text-[11px] text-gray-500 hover:bg-gray-100"
                >
                  <Bell size={12} /> Notificar
                </button>
                <a
                  href={`mailto:${u.email ?? ''}`}
                  className="flex h-8 items-center gap-1 rounded-md border border-gray-200 px-2 text-[11px] text-gray-500 hover:bg-gray-100"
                >
                  <Mail size={12} /> Email
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Modal */}
      {notifTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-gray-800">Enviar Notificacao</h3>
              <button
                onClick={() => setNotifTarget(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-2 text-[11px] text-gray-400">
              Para:{' '}
              <span className="font-medium text-gray-600">
                {notifTarget.full_name || notifTarget.business_name || 'Usuario'}
              </span>
            </p>

            {/* Type selector */}
            <div className="mt-3 flex gap-2">
              {(['push', 'email', 'whatsapp'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNotifType(t)}
                  className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium capitalize ${
                    notifType === t
                      ? 'border-brand-900 bg-brand-900 text-white'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {t === 'push' ? 'Push' : t === 'email' ? 'Email' : 'WhatsApp'}
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Escreva a mensagem..."
              rows={4}
              className="mt-3 w-full rounded-lg border border-gray-200 p-3 text-xs outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
            />

            <button
              onClick={sendNotification}
              className="mt-3 w-full rounded-lg bg-brand-900 py-2.5 text-xs font-semibold text-white hover:bg-brand-800 active:scale-[0.98]"
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 rounded-lg bg-gray-800 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
