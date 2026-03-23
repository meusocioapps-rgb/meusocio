'use client'

import Link from 'next/link'
import {
  useDashboardStats,
  useNextAppointment,
  useNotifications,
} from '@/hooks/use-dashboard'
import { useTodayAppointments, useConfirmAppointment } from '@/hooks/use-appointments'
import { useClients } from '@/hooks/use-clients'
import { useFinancialSummary } from '@/hooks/use-finances'
import {
  formatCurrency,
  formatDate,
  formatTime,
  statusLabel,
  statusColor,
  cn,
} from '@/lib/utils'
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Target,
  UserCheck,
  UserMinus,
  ArrowRight,
  Clock,
  Plus,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats()
  const { data: next } = useNextAppointment()
  const { data: todayAppts } = useTodayAppointments()
  const { data: notifications } = useNotifications()
  const { data: summary } = useFinancialSummary()
  const { data: clients } = useClients()
  const confirmMutation = useConfirmAppointment()

  const recurrentCount = clients?.filter((c) => c.is_recurrent).length ?? 0
  const reactivateCount = clients?.filter((c) => c.needs_reactivation).length ?? 0

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-400">
        Carregando...
      </div>
    )
  }

  // Monthly goal progress
  const revenue = stats?.revenue ?? 0
  const monthlyGoal = 5000 // TODO: from settings
  const goalPct = monthlyGoal > 0 ? Math.min((revenue / monthlyGoal) * 100, 100) : 0

  return (
    <div>
      {/* Alertas / Notificações */}
      {notifications && notifications.length > 0 && (
        <div className="mb-4 space-y-2">
          {notifications.slice(0, 3).map((n, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3',
                n.type === 'birthday'
                  ? 'border-pink-200 bg-pink-50'
                  : n.type === 'inactive_client'
                    ? 'border-red-200 bg-red-50'
                    : 'border-orange-200 bg-orange-50'
              )}
            >
              <span className="text-lg">
                {n.type === 'birthday' ? '🎂' : n.type === 'inactive_client' ? '⚠️' : '💰'}
              </span>
              <div className="flex-1">
                <div className={cn(
                  'text-xs font-semibold',
                  n.type === 'birthday' ? 'text-pink-800' : n.type === 'inactive_client' ? 'text-red-800' : 'text-orange-800'
                )}>
                  {n.type === 'birthday'
                    ? `Aniversário de ${n.client_name}`
                    : n.type === 'inactive_client'
                      ? `${n.client_name} está inativo`
                      : `${n.description} vence em ${n.days_until} dias`}
                </div>
                <div className={cn(
                  'text-[10px]',
                  n.type === 'birthday' ? 'text-pink-600' : n.type === 'inactive_client' ? 'text-red-600' : 'text-orange-600'
                )}>
                  {n.days_until === 0
                    ? 'Hoje!'
                    : n.days_until > 0
                      ? `Em ${n.days_until} dias`
                      : `Há ${Math.abs(n.days_until)} dias`}
                </div>
              </div>
              {n.client_id && (
                <Link
                  href={`/clients/${n.client_id}`}
                  className="text-[10px] font-medium text-brand-900"
                >
                  Ver →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Próximo atendimento */}
      {next && next.id && (
        <div className="mb-4 rounded-xl bg-brand-900 p-4 text-white">
          <span className="mb-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
            ⏰ Próximo atendimento — {formatDate(next.scheduled_date)} às{' '}
            {formatTime(next.scheduled_time)}
          </span>
          <div className="text-base font-semibold">{next.client_name}</div>
          <div className="mt-1 text-xs opacity-80">
            {next.service_name} · {formatCurrency(next.estimated_value)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => confirmMutation.mutate(next.id)}
              className="rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/30"
            >
              ✓ Confirmar
            </button>
            {next.client_phone && (
              <a
                href={`https://wa.me/55${next.client_phone.replace(/\D/g, '')}`}
                target="_blank"
                className="rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/30"
              >
                💬 WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="A receber"
          value={formatCurrency(stats?.pending_income ?? 0)}
          icon={<DollarSign size={14} />}
          iconBg="bg-green-100"
          valueColor="text-brand-900"
        />
        <KpiCard
          label="Clientes ativos"
          value={String(stats?.active_clients ?? 0)}
          icon={<Users size={14} />}
          iconBg="bg-blue-100"
        />
        <KpiCard
          label="Hoje"
          value={String(stats?.today_count ?? 0)}
          icon={<Calendar size={14} />}
          iconBg="bg-yellow-100"
          valueColor="text-amber-600"
        />
        <KpiCard
          label="Lucro do mês"
          value={formatCurrency(stats?.profit ?? 0)}
          icon={<TrendingUp size={14} />}
          iconBg="bg-green-100"
          valueColor={(stats?.profit ?? 0) >= 0 ? 'text-brand-900' : 'text-red-600'}
        />
      </div>

      {/* Meta mensal */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-brand-900" />
            <span className="text-[12px] font-semibold">Meta mensal</span>
          </div>
          <span className="text-[11px] text-gray-400">
            {formatCurrency(revenue)} / {formatCurrency(monthlyGoal)}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              goalPct >= 100 ? 'bg-brand-500' : 'bg-brand-900'
            )}
            style={{ width: `${goalPct}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[10px] text-gray-400">
          {goalPct.toFixed(0)}% atingido
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <QuickAction href="/schedule/new" icon={<Plus size={16} />} label="Agendar" />
        <QuickAction href="/finances/pending" icon={<Clock size={16} />} label="Pendências" />
        <QuickAction href="/reports" icon={<TrendingUp size={16} />} label="Relatórios" />
        <QuickAction href="/clients" icon={<Users size={16} />} label="Clientes" />
      </div>

      {/* Grid: Resumo do dia + Financeiro */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Resumo do dia */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold">☀️ Resumo do dia</span>
            <Link href="/schedule" className="text-[11px] font-medium text-brand-900">
              Ver agenda →
            </Link>
          </div>
          {todayAppts && todayAppts.length > 0 ? (
            <div>
              {todayAppts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0"
                >
                  <div>
                    <div className="text-xs font-medium">
                      {formatTime(a.scheduled_time)} · {a.client_name}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {a.service_name}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      statusColor(a.status)
                    )}
                  >
                    {statusLabel(a.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-400">
              Nenhum atendimento hoje
            </div>
          )}
        </div>

        {/* Financeiro resumo */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold">💰 Financeiro</span>
            <Link href="/finances" className="text-[11px] font-medium text-brand-900">
              Detalhar →
            </Link>
          </div>
          <FinBar
            label="Faturamento bruto"
            value={stats?.revenue ?? 0}
            max={stats?.revenue ?? 1}
            color="bg-brand-900"
          />
          <FinBar
            label="Despesas"
            value={stats?.expenses ?? 0}
            max={stats?.revenue ?? 1}
            color="bg-red-500"
          />
          <FinBar
            label="Lucro líquido"
            value={stats?.profit ?? 0}
            max={stats?.revenue ?? 1}
            color="bg-brand-500"
          />
          {summary && (
            <div className="mt-2 border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400">Pendente</span>
                <span className="font-semibold text-amber-600">
                  {formatCurrency(summary.income_pending)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Painel de clientes */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <UserCheck size={18} className="text-green-600" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">{recurrentCount}</div>
            <div className="text-[10px] text-gray-400">Clientes recorrentes</div>
          </div>
          <Link href="/clients" className="text-gray-300">
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <UserMinus size={18} className="text-red-500" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">{reactivateCount}</div>
            <div className="text-[10px] text-gray-400">Para reativar</div>
          </div>
          <Link href="/clients" className="text-gray-300">
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3 text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900"
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}

function KpiCard({
  label,
  value,
  icon,
  iconBg,
  valueColor = 'text-gray-900',
}: {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  valueColor?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-400">{label}</span>
        <div
          className={cn(
            'flex h-[26px] w-[26px] items-center justify-center rounded-lg',
            iconBg
          )}
        >
          {icon}
        </div>
      </div>
      <div className={cn('text-xl font-semibold tracking-tight', valueColor)}>
        {value}
      </div>
    </div>
  )
}

function FinBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? Math.min(Math.abs(value) / max, 1) * 100 : 0
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">{label}</span>
        <span
          className={cn(
            'text-xs font-semibold',
            value >= 0 ? 'text-brand-900' : 'text-red-600'
          )}
        >
          {formatCurrency(value)}
        </span>
      </div>
      <div className="h-[5px] overflow-hidden rounded bg-gray-100">
        <div
          className={cn('h-full rounded', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
