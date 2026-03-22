'use client'

import {
  useDashboardStats,
  useNextAppointment,
  useNotifications,
} from '@/hooks/use-dashboard'
import { useTodayAppointments, useConfirmAppointment } from '@/hooks/use-appointments'
import {
  formatCurrency,
  formatDate,
  formatTime,
  statusLabel,
  statusColor,
  cn,
} from '@/lib/utils'
import { DollarSign, Users, Calendar, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats()
  const { data: next } = useNextAppointment()
  const { data: todayAppts } = useTodayAppointments()
  const { data: notifications } = useNotifications()
  const confirmMutation = useConfirmAppointment()

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-400">
        Carregando...
      </div>
    )
  }

  return (
    <div>
      {/* Alertas / Notificacoes */}
      {notifications && notifications.length > 0 && (
        <div className="mb-4 space-y-2">
          {notifications.slice(0, 3).map((n, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3"
            >
              <span className="text-lg">
                {n.type === 'birthday' ? '🎂' : '⚠️'}
              </span>
              <div className="flex-1">
                <div className="text-xs font-semibold text-orange-800">
                  {n.type === 'birthday'
                    ? `Aniversario de ${n.client_name}`
                    : `${n.description} vence em ${n.days_until} dias`}
                </div>
                <div className="text-[10px] text-orange-600">
                  {n.days_until === 0
                    ? 'Hoje!'
                    : `Em ${n.days_until} dias`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proximo atendimento */}
      {next && next.id && (
        <div className="mb-4 rounded-xl bg-brand-900 p-4 text-white">
          <span className="mb-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
            ⏰ Proximo atendimento — {formatDate(next.scheduled_date)} as{' '}
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
            <button className="rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/30">
              ↺ Remarcar
            </button>
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
          label="Lucro do mes"
          value={formatCurrency(stats?.profit ?? 0)}
          icon={<TrendingUp size={14} />}
          iconBg="bg-green-100"
          valueColor={(stats?.profit ?? 0) >= 0 ? 'text-brand-900' : 'text-red-600'}
        />
      </div>

      {/* Grid: Resumo do dia + Financeiro */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Resumo do dia */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold">☀️ Resumo do dia</span>
            <a href="/schedule" className="text-[11px] font-medium text-brand-900">
              Ver agenda →
            </a>
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
            <a href="/finances" className="text-[11px] font-medium text-brand-900">
              Detalhar →
            </a>
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
            label="Lucro liquido"
            value={stats?.profit ?? 0}
            max={stats?.revenue ?? 1}
            color="bg-brand-500"
          />
        </div>
      </div>
    </div>
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
