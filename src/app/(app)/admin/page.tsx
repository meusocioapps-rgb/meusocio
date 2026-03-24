'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Users,
  UserCheck,
  CreditCard,
  TrendingUp,
  Shield,
  MessageSquare,
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle,
  Bug,
  Lightbulb,
  HelpCircle,
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

interface Subscription {
  user_id: string
  status: string
  plan: string | null
  price: number | null
  trial_ends_at: string | null
  paid_until: string | null
  updated_at: string | null
}

interface Feedback {
  id: string
  user_id: string | null
  user_name: string | null
  user_email: string | null
  type: string
  message: string
  read: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function daysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function feedbackTypeBadge(type: string) {
  switch (type) {
    case 'bug':
      return { label: 'Bug', color: 'bg-red-100 text-red-700', icon: Bug }
    case 'sugestao':
      return { label: 'Sugestao', color: 'bg-blue-100 text-blue-700', icon: Lightbulb }
    default:
      return { label: 'Outro', color: 'bg-gray-100 text-gray-600', icon: HelpCircle }
  }
}

// ---------------------------------------------------------------------------
// Data hooks
// ---------------------------------------------------------------------------
function useAdminDashboard() {
  const supabase = createClient()

  const profiles = useQuery({
    queryKey: ['admin', 'dashboard', 'profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })

  const subscriptions = useQuery({
    queryKey: ['admin', 'dashboard', 'subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
      if (error) {
        console.warn('Subscriptions table not available:', error.message)
        return [] as Subscription[]
      }
      return data as Subscription[]
    },
  })

  const feedbacks = useQuery({
    queryKey: ['admin', 'dashboard', 'feedbacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) {
        console.warn('Feedback table not available:', error.message)
        return [] as Feedback[]
      }
      return data as Feedback[]
    },
  })

  return { profiles, subscriptions, feedbacks }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AdminDashboardPage() {
  const { profiles, subscriptions, feedbacks } = useAdminDashboard()

  const isLoading = profiles.isLoading || subscriptions.isLoading
  const error = profiles.error

  // --- Computed metrics ---
  const metrics = useMemo(() => {
    const users = profiles.data ?? []
    const subs = subscriptions.data ?? []

    const totalUsers = users.length

    // Active in last 7 days (updated_at within last 7 days)
    const sevenDaysAgo = daysAgo(7)
    const activeUsers = users.filter(
      (u) =>
        (u.updated_at && u.updated_at >= sevenDaysAgo) ||
        u.created_at >= sevenDaysAgo
    ).length

    // Paid subscribers (status = 'active' and plan is not null)
    const paidSubscribers = subs.filter(
      (s) => s.status === 'active' && s.plan
    ).length

    // MRR: sum of price for active subscriptions
    const mrr = subs
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + (s.price ?? 0), 0)

    // Trial users
    const trialUsers = subs.filter((s) => s.status === 'trial' || s.status === 'trialing').length

    // Trial to paid conversion rate
    const totalTrialOrActive = subs.filter(
      (s) => s.status === 'active' || s.status === 'trial' || s.status === 'trialing' || s.status === 'cancelled'
    ).length
    const conversionRate = totalTrialOrActive > 0
      ? Math.round((paidSubscribers / totalTrialOrActive) * 100)
      : 0

    // Churn (cancelled subscriptions)
    const cancelledCount = subs.filter((s) => s.status === 'cancelled').length
    const churnRate = totalTrialOrActive > 0
      ? Math.round((cancelledCount / totalTrialOrActive) * 100)
      : 0

    // Past due
    const pastDueCount = subs.filter((s) => s.status === 'past_due').length

    return {
      totalUsers,
      activeUsers,
      paidSubscribers,
      mrr,
      trialUsers,
      conversionRate,
      churnRate,
      cancelledCount,
      pastDueCount,
    }
  }, [profiles.data, subscriptions.data])

  // --- Signup chart data (last 30 days) ---
  const chartData = useMemo(() => {
    const users = profiles.data ?? []
    const days: { date: string; label: string; count: number }[] = []

    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      days.push({
        date: dateStr,
        label: fmtDateShort(d.toISOString()),
        count: 0,
      })
    }

    for (const u of users) {
      const dateStr = u.created_at.slice(0, 10)
      const day = days.find((d) => d.date === dateStr)
      if (day) day.count++
    }

    const maxCount = Math.max(...days.map((d) => d.count), 1)

    return { days, maxCount }
  }, [profiles.data])

  // --- Recent signups (last 10) ---
  const recentSignups = useMemo(() => {
    return (profiles.data ?? []).slice(0, 10)
  }, [profiles.data])

  // --- Loading / Error ---
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Painel Administrativo
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Visao geral da plataforma Meu Socio
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard
            title="Total Usuarios"
            value={metrics.totalUsers.toString()}
            icon={Users}
            color="bg-brand-900"
          />
          <KPICard
            title="Usuarios Ativos"
            value={metrics.activeUsers.toString()}
            subtitle="Ultimos 7 dias"
            icon={UserCheck}
            color="bg-emerald-600"
          />
          <KPICard
            title="Assinantes Pagos"
            value={metrics.paidSubscribers.toString()}
            icon={CreditCard}
            color="bg-violet-600"
          />
          <KPICard
            title="Receita Mensal (MRR)"
            value={fmtCurrency(metrics.mrr)}
            icon={TrendingUp}
            color="bg-amber-600"
          />
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Growth Chart - spans 2 cols */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Novos cadastros
                </h2>
                <p className="text-xs text-gray-500">Ultimos 30 dias</p>
              </div>
              <Activity size={18} className="text-gray-400" />
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-[3px] sm:gap-1" style={{ height: 160 }}>
              {chartData.days.map((day) => {
                const heightPct =
                  chartData.maxCount > 0
                    ? (day.count / chartData.maxCount) * 100
                    : 0
                return (
                  <div
                    key={day.date}
                    className="group relative flex flex-1 flex-col items-center"
                    style={{ height: '100%' }}
                  >
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white shadow group-hover:block">
                      {day.label}: {day.count} {day.count === 1 ? 'usuario' : 'usuarios'}
                    </div>
                    <div className="mt-auto w-full">
                      <div
                        className="w-full rounded-t bg-brand-900 transition-all group-hover:bg-brand-700"
                        style={{
                          height: `${Math.max(heightPct, day.count > 0 ? 4 : 0)}%`,
                          minHeight: day.count > 0 ? 4 : 0,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* X-axis labels (show every 5th) */}
            <div className="mt-2 flex gap-[3px] sm:gap-1">
              {chartData.days.map((day, i) => (
                <div key={day.date} className="flex-1 text-center">
                  {i % 5 === 0 ? (
                    <span className="text-[9px] text-gray-400">{day.label}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Platform Health */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              Saude da Plataforma
            </h2>

            <div className="space-y-4">
              {/* Conversion Rate */}
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle size={14} className="text-green-500" />
                  Taxa de Conversao (Trial → Pago)
                </div>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {metrics.conversionRate}%
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(metrics.conversionRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Churn */}
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlertTriangle size={14} className="text-amber-500" />
                  Taxa de Churn
                </div>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {metrics.churnRate}%
                </p>
                <p className="text-[11px] text-gray-400">
                  {metrics.cancelledCount} cancelamento{metrics.cancelledCount !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Trial users */}
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Activity size={14} className="text-blue-500" />
                  Em Trial
                </div>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {metrics.trialUsers}
                </p>
              </div>

              {/* Past due */}
              {metrics.pastDueCount > 0 && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertTriangle size={14} />
                    Pagamento Pendente
                  </div>
                  <p className="mt-1 text-xl font-bold text-red-700">
                    {metrics.pastDueCount}
                  </p>
                </div>
              )}
            </div>

            <Link
              href="/admin/subscriptions"
              className="mt-4 flex items-center gap-1 text-xs font-medium text-brand-900 hover:underline"
            >
              Ver assinaturas <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Recent Signups */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Cadastros Recentes
              </h2>
              <Link
                href="/admin/users"
                className="flex items-center gap-1 text-xs font-medium text-brand-900 hover:underline"
              >
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-1">
              {recentSignups.length === 0 && (
                <p className="py-6 text-center text-xs text-gray-400">
                  Nenhum usuario cadastrado ainda.
                </p>
              )}
              {recentSignups.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {user.full_name || 'Sem nome'}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user.email || '—'}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-[11px] text-gray-400">
                    {fmtDate(user.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Feedbacks */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Feedbacks Recentes
              </h2>
              <Link
                href="/admin/feedbacks"
                className="flex items-center gap-1 text-xs font-medium text-brand-900 hover:underline"
              >
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-1">
              {(feedbacks.data ?? []).length === 0 && (
                <p className="py-6 text-center text-xs text-gray-400">
                  Nenhum feedback recebido ainda.
                </p>
              )}
              {(feedbacks.data ?? []).map((fb) => {
                const badge = feedbackTypeBadge(fb.type)
                const BadgeIcon = badge.icon
                return (
                  <div
                    key={fb.id}
                    className="rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}
                          >
                            <BadgeIcon size={10} />
                            {badge.label}
                          </span>
                          {!fb.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="line-clamp-2 text-xs text-gray-700">
                          {fb.message}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {fb.user_name || fb.user_email || 'Anonimo'} &middot;{' '}
                          {fmtDate(fb.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<Record<string, unknown>>
  color: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
            {title}
          </p>
          <p className="mt-1.5 truncate text-xl font-bold text-gray-900 sm:text-2xl">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-[10px] text-gray-400">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${color}`}
        >
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  )
}
