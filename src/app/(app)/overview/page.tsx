'use client'

import { useState, useMemo } from 'react'
import {
  Calendar,
  DollarSign,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Users,
  Repeat,
  Star,
} from 'lucide-react'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { useFinancialSummary, useFinancialEntries } from '@/hooks/use-finances'
import { useClients } from '@/hooks/use-clients'
import { useAppointmentsByRange } from '@/hooks/use-appointments'
import { formatCurrency, cn, getCurrentMonth } from '@/lib/utils'

const PANEL_OPTIONS = [
  { key: 'agendamentos', label: 'Agendamentos' },
  { key: 'faturamento', label: 'Faturamento' },
  { key: 'servicos', label: 'Serviços mais vendidos' },
  { key: 'presenca', label: 'Taxa de presença' },
  { key: 'lucro', label: 'Lucro por serviço' },
  { key: 'novos_retorno', label: 'Novos vs retorno' },
  { key: 'dias', label: 'Dias mais movimentados' },
  { key: 'upsells', label: 'Upsells realizados' },
] as const

type PanelKey = (typeof PANEL_OPTIONS)[number]['key']

const DEFAULT_ACTIVE: PanelKey[] = ['agendamentos', 'faturamento', 'servicos', 'presenca']

export default function OverviewPage() {
  const [activePanels, setActivePanels] = useState<PanelKey[]>(DEFAULT_ACTIVE)

  const { data: stats } = useDashboardStats()
  const { data: summary } = useFinancialSummary()
  const { data: clients } = useClients()

  const currentMonth = getCurrentMonth()
  const monthStart = currentMonth + '-01'
  const [y, mo] = currentMonth.split('-').map(Number)
  const monthEnd = `${currentMonth}-${String(new Date(y, mo, 0).getDate()).padStart(2, '0')}`
  const { data: monthAppointments } = useAppointmentsByRange(monthStart, monthEnd)

  // Previous month for comparison
  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStr = prevMonth.toISOString().slice(0, 7)
  const { data: prevEntries } = useFinancialEntries(prevMonthStr)

  const togglePanel = (key: PanelKey) => {
    setActivePanels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  // Computed data
  const completedAppointments = useMemo(
    () => monthAppointments?.filter((a) => a.status === 'completed') ?? [],
    [monthAppointments]
  )

  const totalAppointments = monthAppointments?.length ?? 0
  const completedCount = completedAppointments.length
  const presenceRate = totalAppointments > 0 ? Math.round((completedCount / totalAppointments) * 100) : 0

  const revenue = summary?.income_paid ?? 0
  const ticketMedio = completedCount > 0 ? revenue / completedCount : 0

  // Service counts
  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    monthAppointments?.forEach((a) => {
      if (a.status === 'completed' || a.status === 'confirmed' || a.status === 'scheduled') {
        counts[a.service_name] = (counts[a.service_name] || 0) + 1
      }
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [monthAppointments])

  const maxServiceCount = serviceCounts.length > 0 ? serviceCounts[0][1] : 1

  // New vs returning clients
  const newClients = clients?.filter((c) => c.activity_status === 'new')?.length ?? 0
  const totalClients = clients?.length ?? 1
  const returningClients = totalClients - newClients
  const returningPct = totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : 0
  const newPct = 100 - returningPct

  // Faturamento by month (last 4 months)
  const monthlyRevenue = useMemo(() => {
    const months: { label: string; value: number }[] = []
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      // Current month uses summary, others are approximate
      if (i === 0) {
        months.push({ label, value: revenue })
      } else {
        // We only have prev month entries
        if (i === 1 && prevEntries) {
          const prevRevenue = prevEntries
            .filter((e) => e.type === 'income' && e.status === 'paid')
            .reduce((sum, e) => sum + e.amount, 0)
          months.push({ label, value: prevRevenue })
        } else {
          months.push({ label, value: 0 })
        }
      }
    }
    return months
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenue, prevEntries])

  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((m) => m.value), 1)

  // Day-of-week distribution
  const dayDistribution = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const counts = [0, 0, 0, 0, 0, 0, 0]
    monthAppointments?.forEach((a) => {
      const d = new Date(a.scheduled_date + 'T12:00:00')
      counts[d.getDay()]++
    })
    return days.map((label, i) => ({ label, count: counts[i] }))
  }, [monthAppointments])

  const maxDayCount = Math.max(...dayDistribution.map((d) => d.count), 1)

  // Upsells
  const upsells = useMemo(
    () => monthAppointments?.filter((a) => a.upsell_service) ?? [],
    [monthAppointments]
  )
  const upsellTotal = upsells.reduce((sum, a) => sum + (a.upsell_value || 0), 0)

  // Revenue comparison
  const prevMonthRevenue = useMemo(() => {
    if (!prevEntries) return 0
    return prevEntries
      .filter((e) => e.type === 'income' && e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0)
  }, [prevEntries])

  const revenueChange =
    prevMonthRevenue > 0 ? Math.round(((revenue - prevMonthRevenue) / prevMonthRevenue) * 100) : 0

  // Format compact currency
  const formatCompact = (val: number) => {
    if (val >= 1000) return `R$${(val / 1000).toFixed(1)}k`
    return formatCurrency(val)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Toggle chips */}
      <div className="mb-5">
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Personalizar painéis
        </p>
        <div className="flex flex-wrap gap-2">
          {PANEL_OPTIONS.map((opt) => {
            const isActive = activePanels.includes(opt.key)
            return (
              <button
                key={opt.key}
                onClick={() => togglePanel(opt.key)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors',
                  isActive
                    ? 'bg-brand-900 text-white'
                    : 'border border-gray-300 text-gray-500 hover:border-gray-400'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Panels grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Agendamentos */}
        {activePanels.includes('agendamentos') && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Agendamentos</span>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold">{totalAppointments}</span>
              {totalAppointments > 0 && (
                <span className="mb-1 text-[12px] font-semibold text-green-600">
                  +{completedCount} realizados
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-gray-400">este mês</p>
          </div>
        )}

        {/* Faturamento */}
        {activePanels.includes('faturamento') && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 text-gray-400">
              <DollarSign size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Faturamento</span>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold">{formatCompact(revenue)}</span>
              {revenueChange !== 0 && (
                <span
                  className={cn(
                    'mb-1 text-[12px] font-semibold',
                    revenueChange > 0 ? 'text-green-600' : 'text-red-500'
                  )}
                >
                  {revenueChange > 0 ? '+' : ''}
                  {revenueChange}%
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-gray-400">receita paga no mês</p>
          </div>
        )}

        {/* Taxa de presença */}
        {activePanels.includes('presenca') && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Taxa de presença
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold">{presenceRate}%</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              {completedCount} realizados de {totalAppointments}
            </p>
          </div>
        )}

        {/* Ticket médio */}
        {activePanels.includes('lucro') && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 text-gray-400">
              <TrendingUp size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Ticket médio</span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold">{formatCurrency(ticketMedio)}</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">por atendimento realizado</p>
          </div>
        )}

        {/* Faturamento por mês */}
        {activePanels.includes('faturamento') && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 sm:col-span-2">
            <div className="flex items-center gap-2 text-gray-400">
              <BarChart3 size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Faturamento por mês
              </span>
            </div>
            <div className="mt-4 flex items-end gap-3">
              {monthlyRevenue.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-gray-500">
                    {m.value > 0 ? formatCompact(m.value) : '—'}
                  </span>
                  <div
                    className="w-full rounded-md bg-brand-900"
                    style={{
                      height: `${Math.max((m.value / maxMonthlyRevenue) * 100, 4)}px`,
                      minHeight: '4px',
                    }}
                  />
                  <span className="text-[10px] font-medium text-gray-400">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Serviços mais realizados */}
        {activePanels.includes('servicos') && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 sm:col-span-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Star size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Serviços mais realizados
              </span>
            </div>
            <div className="mt-4 space-y-2.5">
              {serviceCounts.length === 0 && (
                <p className="text-[11px] text-gray-400">Nenhum atendimento este mês</p>
              )}
              {serviceCounts.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[12px] font-medium">{name}</span>
                    <span className="text-[11px] font-semibold text-gray-500">{count}x</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-brand-900"
                      style={{ width: `${(count / maxServiceCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Novos vs Retorno */}
        {activePanels.includes('novos_retorno') && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 sm:col-span-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Users size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Novos vs Retorno
              </span>
            </div>
            <div className="mt-4">
              <div className="flex h-6 overflow-hidden rounded-full">
                <div
                  className="bg-brand-900 transition-all"
                  style={{ width: `${returningPct}%` }}
                />
                <div
                  className="bg-brand-200 transition-all"
                  style={{ width: `${newPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-900" />
                  <span className="text-gray-600">Retorno {returningPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-200" />
                  <span className="text-gray-600">Novos {newPct}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dias mais movimentados */}
        {activePanels.includes('dias') && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 sm:col-span-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Dias mais movimentados
              </span>
            </div>
            <div className="mt-4 flex items-end gap-2">
              {dayDistribution.map((d) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-gray-500">
                    {d.count > 0 ? d.count : ''}
                  </span>
                  <div
                    className="w-full rounded-md bg-brand-900"
                    style={{
                      height: `${Math.max((d.count / maxDayCount) * 60, 4)}px`,
                      minHeight: '4px',
                    }}
                  />
                  <span className="text-[10px] font-medium text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upsells realizados */}
        {activePanels.includes('upsells') && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 text-gray-400">
              <Repeat size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Upsells realizados
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold">{upsells.length}</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              {upsellTotal > 0 ? `Total: ${formatCurrency(upsellTotal)}` : 'nenhum upsell este mês'}
            </p>
          </div>
        )}
      </div>

      {activePanels.length === 0 && (
        <div className="py-16 text-center text-[13px] text-gray-400">
          Selecione pelo menos um painel acima para visualizar
        </div>
      )}
    </div>
  )
}
