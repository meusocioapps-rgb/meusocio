'use client'

import { useState, useMemo } from 'react'
import {
  useFinancialEntries,
  useFinancialSummary,
  useFixedExpenses,
} from '@/hooks/use-finances'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { useClients } from '@/hooks/use-clients'
import { formatCurrency, cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export default function ReportsPage() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const { data: entries } = useFinancialEntries(month)
  const { data: summary } = useFinancialSummary()
  const { data: stats } = useDashboardStats()
  const { data: fixedExpenses } = useFixedExpenses()
  const { data: clients } = useClients()

  // Cálculos derivados
  const incomes = (entries ?? []).filter((e) => e.type === 'income')
  const expenses = (entries ?? []).filter((e) => e.type === 'expense')

  const totalIncome = incomes.reduce((s, e) => s + e.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const profit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0

  // Receitas por serviço
  const byService = useMemo(() => {
    const map = new Map<string, number>()
    incomes.forEach((e) => {
      const key = e.service_name || e.description || 'Outros'
      map.set(key, (map.get(key) || 0) + e.amount)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [incomes])

  // Despesas por categoria
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    expenses.forEach((e) => {
      const key =
        e.expense_category === 'cmv'
          ? 'CMV (Produtos)'
          : e.expense_category === 'fixed'
            ? 'Fixas'
            : e.expense_category === 'daily_cost'
              ? 'Custo diário'
              : 'Variáveis'
      map.set(key, (map.get(key) || 0) + e.amount)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [expenses])

  // Receitas por cliente
  const byClient = useMemo(() => {
    const map = new Map<string, number>()
    incomes.forEach((e) => {
      const key = e.client_name || 'Sem cliente'
      map.set(key, (map.get(key) || 0) + e.amount)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [incomes])

  // Despesas fixas totais
  const fixedTotal = (fixedExpenses ?? []).reduce((s, e) => s + e.amount, 0)

  // Métricas de clientes
  const totalClients = clients?.length ?? 0
  const recurrentClients = clients?.filter((c) => c.is_recurrent).length ?? 0
  const reactivateClients = clients?.filter((c) => c.needs_reactivation).length ?? 0

  // Meta
  const goal = stats?.revenue !== undefined ? (summary?.income_total ?? 0) : 0
  const monthlyGoal = 5000 // Placeholder — ideally from settings

  const monthLabel = new Date(month + '-15').toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  // Max value for bar charts
  const maxService = byService.length > 0 ? byService[0][1] : 1
  const maxClient = byClient.length > 0 ? byClient[0][1] : 1

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold">Relatório Financeiro</h2>
          <p className="text-[11px] capitalize text-gray-400">{monthLabel}</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] outline-none"
        />
      </div>

      {/* KPIs principais */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Receita"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp size={14} />}
          color="text-brand-900"
          bg="bg-brand-100"
        />
        <KpiCard
          label="Despesas"
          value={formatCurrency(totalExpenses)}
          icon={<TrendingDown size={14} />}
          color="text-red-600"
          bg="bg-red-100"
        />
        <KpiCard
          label="Lucro"
          value={formatCurrency(profit)}
          icon={<DollarSign size={14} />}
          color={profit >= 0 ? 'text-brand-900' : 'text-red-600'}
          bg={profit >= 0 ? 'bg-green-100' : 'bg-red-100'}
          subtitle={`${profitMargin.toFixed(0)}% margem`}
        />
        <KpiCard
          label="Atendimentos"
          value={String(stats?.completed_count ?? 0)}
          icon={<Calendar size={14} />}
          color="text-blue-600"
          bg="bg-blue-100"
          subtitle={`${stats?.today_count ?? 0} hoje`}
        />
      </div>

      {/* Barra de progresso meta */}
      {summary && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-brand-900" />
              <span className="text-[13px] font-semibold">Meta mensal</span>
            </div>
            <span className="text-[11px] text-gray-400">
              {formatCurrency(totalIncome)} / {formatCurrency(monthlyGoal)}
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                totalIncome >= monthlyGoal ? 'bg-brand-500' : 'bg-brand-900'
              )}
              style={{
                width: `${Math.min((totalIncome / monthlyGoal) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="mt-1 text-right text-[10px] text-gray-400">
            {((totalIncome / monthlyGoal) * 100).toFixed(0)}% atingido
          </div>
        </div>
      )}

      {/* Grid: Receitas por serviço + Despesas por categoria */}
      <div className="mb-4 grid gap-4 md:grid-cols-2">
        {/* Receitas por serviço */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <BarChart3 size={14} className="text-brand-900" />
            <h3 className="text-[13px] font-semibold">Receita por serviço</h3>
          </div>
          <div className="p-4">
            {byService.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">Sem dados</p>
            ) : (
              <div className="space-y-2.5">
                {byService.map(([name, value]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[11px] font-medium">{name}</span>
                      <span className="text-[11px] font-semibold text-brand-900">
                        {formatCurrency(value)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${(value / maxService) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Despesas por categoria */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <PieChart size={14} className="text-red-500" />
            <h3 className="text-[13px] font-semibold">Despesas por categoria</h3>
          </div>
          <div className="p-4">
            {byCategory.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {byCategory.map(([name, value]) => {
                  const pct = totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(0) : '0'
                  const colors: Record<string, string> = {
                    'CMV (Produtos)': 'bg-orange-500',
                    Fixas: 'bg-blue-500',
                    'Custo diário': 'bg-purple-500',
                    Variáveis: 'bg-red-500',
                  }
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-3 w-3 flex-shrink-0 rounded-sm',
                          colors[name] || 'bg-gray-400'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium">{name}</span>
                          <span className="text-[11px] font-semibold text-gray-600">
                            {formatCurrency(value)}
                          </span>
                        </div>
                        <div className="text-[9px] text-gray-400">{pct}% do total</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Despesas fixas */}
            {fixedTotal > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Despesas fixas mensais</span>
                  <span className="font-semibold text-gray-600">
                    {formatCurrency(fixedTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top clientes */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <Users size={14} className="text-brand-900" />
          <h3 className="text-[13px] font-semibold">Top clientes do mês</h3>
        </div>
        <div className="p-4">
          {byClient.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {byClient.map(([name, value], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-5 text-right text-[11px] font-semibold text-gray-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[12px] font-medium">{name}</span>
                      <span className="text-[11px] font-semibold text-brand-900">
                        {formatCurrency(value)}
                      </span>
                    </div>
                    <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-brand-300"
                        style={{ width: `${(value / maxClient) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumo de clientes */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <div className="text-[10px] font-medium text-gray-400">Total clientes</div>
          <div className="mt-1 text-xl font-semibold">{totalClients}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <div className="text-[10px] font-medium text-gray-400">Recorrentes</div>
          <div className="mt-1 text-xl font-semibold text-brand-900">
            {recurrentClients}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <div className="text-[10px] font-medium text-gray-400">Para reativar</div>
          <div className="mt-1 text-xl font-semibold text-red-500">
            {reactivateClients}
          </div>
        </div>
      </div>

      {/* DRE Simplificado */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[13px] font-semibold">DRE Simplificado</h3>
        </div>
        <div className="p-4 space-y-2">
          <DreRow
            label="(+) Receita Bruta"
            value={totalIncome}
            bold
            icon={<ArrowUpRight size={12} className="text-brand-500" />}
          />
          <DreRow
            label="(-) CMV / Custo dos Serviços"
            value={-(summary?.expenses_cmv ?? 0)}
            sub
          />
          <div className="h-px bg-gray-100" />
          <DreRow
            label="(=) Lucro Bruto"
            value={totalIncome - (summary?.expenses_cmv ?? 0)}
            bold
          />
          <DreRow
            label="(-) Despesas Fixas"
            value={-fixedTotal}
            sub
          />
          <DreRow
            label="(-) Despesas Variáveis"
            value={-(totalExpenses - (summary?.expenses_cmv ?? 0) - fixedTotal)}
            sub
          />
          <div className="h-px bg-gray-200" />
          <DreRow
            label="(=) Resultado Líquido"
            value={profit}
            bold
            highlight
            icon={
              profit >= 0 ? (
                <ArrowUpRight size={12} className="text-brand-500" />
              ) : (
                <ArrowDownRight size={12} className="text-red-500" />
              )
            }
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
  color,
  bg,
  subtitle,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  bg: string
  subtitle?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-lg', bg, color)}>
          {icon}
        </div>
        <span className="text-[10px] font-medium text-gray-400">{label}</span>
      </div>
      <div className={cn('mt-2 text-lg font-semibold', color)}>{value}</div>
      {subtitle && (
        <div className="text-[10px] text-gray-400">{subtitle}</div>
      )}
    </div>
  )
}

function DreRow({
  label,
  value,
  bold,
  sub,
  highlight,
  icon,
}: {
  label: string
  value: number
  bold?: boolean
  sub?: boolean
  highlight?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        sub && 'pl-3',
        highlight && 'rounded-lg bg-gray-50 px-3 py-2'
      )}
    >
      <span
        className={cn(
          'text-[12px]',
          bold ? 'font-semibold' : 'text-gray-500',
          sub && 'text-[11px]'
        )}
      >
        {label}
      </span>
      <div className="flex items-center gap-1">
        {icon}
        <span
          className={cn(
            'text-[12px]',
            bold ? 'font-semibold' : 'font-medium',
            value >= 0 ? 'text-gray-800' : 'text-red-600',
            highlight && (value >= 0 ? 'text-brand-900 text-sm' : 'text-red-600 text-sm')
          )}
        >
          {formatCurrency(Math.abs(value))}
          {value < 0 && ' (-)'}
        </span>
      </div>
    </div>
  )
}
