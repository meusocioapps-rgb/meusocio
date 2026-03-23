'use client'

import { useState, useMemo } from 'react'
import {
  useFinancialEntries,
  useCreateIncome,
  useUpdateEntryStatus,
} from '@/hooks/use-finances'
import { useAppointmentsByRange } from '@/hooks/use-appointments'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, X, Check, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from '@/components/Toast'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function getMonthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month]} ${year}`
}

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export default function FinancesPage() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [showModal, setShowModal] = useState(false)

  const { start: monthStart, end: monthEnd } = getMonthRange(selectedYear, selectedMonth)
  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  // Data hooks
  const { data: entries, isLoading } = useFinancialEntries(monthKey)
  const { data: appointments, isLoading: loadingAppointments } = useAppointmentsByRange(monthStart, monthEnd)
  const createIncome = useCreateIncome()
  const updateStatus = useUpdateEntryStatus()

  // Paid income entries
  const paidIncomes = useMemo(() => {
    if (!entries) return []
    return entries.filter((e) => e.type === 'income' && e.status === 'paid')
  }, [entries])

  // Pending income entries
  const pendingIncomes = useMemo(() => {
    if (!entries) return []
    return entries.filter((e) => e.type === 'income' && e.status === 'pending')
  }, [entries])

  // Scheduled/confirmed appointments for the month
  const scheduledAppointments = useMemo(() => {
    if (!appointments) return []
    return appointments.filter(
      (a) => a.status === 'scheduled' || a.status === 'confirmed'
    )
  }, [appointments])

  // KPI calculations
  const totalReceived = paidIncomes.reduce((sum, e) => sum + e.amount, 0)

  const totalPendingEntries = pendingIncomes.reduce((sum, e) => sum + e.amount, 0)
  const totalScheduledAppts = scheduledAppointments.reduce(
    (sum, a) => sum + (a.estimated_value || 0),
    0
  )
  const totalToReceive = totalPendingEntries + totalScheduledAppts

  const totalGeneral = totalReceived + totalToReceive

  // Month navigation
  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  // Quick month tabs: current and 2 previous
  const monthTabs = useMemo(() => {
    const tabs = []
    for (let i = 0; i < 3; i++) {
      let m = now.getMonth() - i
      let y = now.getFullYear()
      if (m < 0) { m += 12; y -= 1 }
      tabs.push({ year: y, month: m, label: getMonthLabel(y, m) })
    }
    return tabs
  }, [])

  const handleMarkReceived = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'paid' })
      toast('Marcado como recebido!')
    } catch {
      toast('Erro ao atualizar')
    }
  }

  const loading = isLoading || loadingAppointments

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold">Receitas</h2>
          <p className="text-[11px] text-gray-400">
            {getMonthLabel(selectedYear, selectedMonth)}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 rounded-lg bg-brand-900 px-3 py-2 text-xs font-medium text-white"
        >
          <Plus size={14} />
          Nova receita
        </button>
      </div>

      {/* Month selector */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={goToPrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex flex-1 gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
          {monthTabs.map((t) => (
            <button
              key={`${t.year}-${t.month}`}
              onClick={() => { setSelectedYear(t.year); setSelectedMonth(t.month) }}
              className={cn(
                'flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                selectedYear === t.year && selectedMonth === t.month
                  ? 'bg-brand-900 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={goToNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="text-[10px] font-medium text-gray-400">
            Total recebido
          </div>
          <div className="mt-1 text-base font-semibold text-brand-900">
            {formatCurrency(totalReceived)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="text-[10px] font-medium text-gray-400">
            A receber
          </div>
          <div className="mt-1 text-base font-semibold text-amber-600">
            {formatCurrency(totalToReceive)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="text-[10px] font-medium text-gray-400">
            Total geral
          </div>
          <div className="mt-1 text-base font-semibold">
            {formatCurrency(totalGeneral)}
          </div>
        </div>
      </div>

      {/* Section: Recebido */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[13px] font-semibold text-green-700">
            Recebido
          </h3>
          <p className="text-[10px] text-gray-400">
            {paidIncomes.length} entrada{paidIncomes.length !== 1 ? 's' : ''} · {formatCurrency(totalReceived)}
          </p>
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Carregando...
          </div>
        ) : paidIncomes.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-gray-400">
              Nenhuma receita recebida neste mes
            </p>
          </div>
        ) : (
          <div>
            {paidIncomes.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">
                    {entry.description}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatDate(entry.entry_date)}
                    {entry.client_name && ` · ${entry.client_name}`}
                    {entry.service_name && ` · ${entry.service_name}`}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold text-brand-900">
                    {formatCurrency(entry.amount)}
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    Recebido
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Previsto / A Receber */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[13px] font-semibold text-amber-700">
            Previsto / A Receber
          </h3>
          <p className="text-[10px] text-gray-400">
            {scheduledAppointments.length + pendingIncomes.length} item{(scheduledAppointments.length + pendingIncomes.length) !== 1 ? 's' : ''} · {formatCurrency(totalToReceive)}
          </p>
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Carregando...
          </div>
        ) : scheduledAppointments.length === 0 && pendingIncomes.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-gray-400">
              Nenhuma receita prevista neste mes
            </p>
          </div>
        ) : (
          <div>
            {/* Scheduled/confirmed appointments */}
            {scheduledAppointments.map((appt) => (
              <div
                key={`appt-${appt.id}`}
                className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Clock size={13} className="text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12px] font-medium">
                      {appt.client_name}
                    </span>
                    <span className="flex-shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[8px] font-semibold text-blue-600">
                      Agendamento
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {appt.service_name}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatDate(appt.scheduled_date)}
                    {appt.scheduled_time ? ` as ${appt.scheduled_time.slice(0, 5)}` : ''}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-[13px] font-semibold text-amber-600">
                    {formatCurrency(appt.estimated_value)}
                  </span>
                </div>
              </div>
            ))}

            {/* Pending income entries */}
            {pendingIncomes.map((entry) => (
              <div
                key={`entry-${entry.id}`}
                className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <Clock size={13} className="text-yellow-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium">
                    {entry.description}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatDate(entry.entry_date)}
                    {entry.client_name && ` · ${entry.client_name}`}
                    {entry.service_name && ` · ${entry.service_name}`}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-[13px] font-semibold text-amber-600">
                    {formatCurrency(entry.amount)}
                  </span>
                  <button
                    onClick={() => handleMarkReceived(entry.id)}
                    disabled={updateStatus.isPending}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:border-green-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                    title="Marcar como recebido"
                  >
                    <Check size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nova Receita */}
      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-[15px] font-semibold">Nova Receita</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400"
              >
                <X size={22} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                await createIncome.mutateAsync({
                  amount: Number(fd.get('amount')),
                  description: fd.get('description') as string,
                  entry_date: fd.get('date') as string,
                  client_name: (fd.get('client') as string) || undefined,
                  status: fd.get('status') as 'paid' | 'pending',
                })
                setShowModal(false)
                toast('Receita registrada!')
              }}
              className="p-5"
            >
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Data
                  </label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Valor (R$) *
                  </label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none"
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Descricao *
                </label>
                <input
                  name="description"
                  type="text"
                  placeholder="Ex: Manutencao eletrica"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Cliente
                </label>
                <input
                  name="client"
                  type="text"
                  placeholder="Nome do cliente (opcional)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </label>
                <select
                  name="status"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none"
                >
                  <option value="paid">Recebido</option>
                  <option value="pending">A receber</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-brand-900 py-2 text-xs font-medium text-brand-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createIncome.isPending}
                  className="flex-1 rounded-lg bg-brand-900 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  {createIncome.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
