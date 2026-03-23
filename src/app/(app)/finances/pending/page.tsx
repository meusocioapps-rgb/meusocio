'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  usePendingEntries,
  useUpdateEntryStatus,
  useFinancialSummary,
  useCreateIncome,
  useCreateExpense,
  useFixedExpenses,
  useFinancialEntries,
} from '@/hooks/use-finances'
import { useAppointmentsByRange } from '@/hooks/use-appointments'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { ArrowLeft, Check, Clock, AlertCircle, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
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

type ModalType = 'receivable' | 'payable' | null

export default function PendingPage() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [showModal, setShowModal] = useState<ModalType>(null)

  const { start: monthStart, end: monthEnd } = getMonthRange(selectedYear, selectedMonth)
  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  // Data hooks
  const { data: appointments, isLoading: loadingAppointments } = useAppointmentsByRange(monthStart, monthEnd)
  const { data: fixedExpenses, isLoading: loadingFixed } = useFixedExpenses()
  const { data: pendingEntries } = usePendingEntries()
  const { data: monthEntries } = useFinancialEntries(monthKey)
  const { data: summary } = useFinancialSummary()
  const updateStatus = useUpdateEntryStatus()
  const createIncome = useCreateIncome()
  const createExpense = useCreateExpense()

  const isLoading = loadingAppointments || loadingFixed

  // 1. "A Receber" = scheduled/confirmed appointments for the selected month
  const receivableAppointments = useMemo(() => {
    if (!appointments) return []
    return appointments.filter(
      (a) => a.status === 'scheduled' || a.status === 'confirmed'
    )
  }, [appointments])

  const totalReceivable = receivableAppointments.reduce(
    (sum, a) => sum + (a.estimated_value || 0),
    0
  )

  // Income already paid this month
  const incomePaid = useMemo(() => {
    if (!monthEntries) return 0
    return monthEntries
      .filter((e) => e.type === 'income' && e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0)
  }, [monthEntries])

  // 2. "Prev. Faturamento" = paid income + A Receber
  const prevFaturamento = incomePaid + totalReceivable

  // 3. "A Pagar" = fixed expenses where due_day hasn't passed yet + pending expense entries this month
  const today = now.getDate()
  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth()

  const unpaidFixedExpenses = useMemo(() => {
    if (!fixedExpenses) return []
    // For current month: show fixed expenses where due_day >= today (not yet due)
    // For future months: show all fixed expenses
    // For past months: show none (already passed)
    if (selectedYear < now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth < now.getMonth())) {
      return [] // past month
    }
    if (isCurrentMonth) {
      return fixedExpenses.filter((fe) => (fe.due_day ?? 0) >= today)
    }
    // future month - show all
    return fixedExpenses
  }, [fixedExpenses, selectedYear, selectedMonth, isCurrentMonth, today])

  const pendingExpenseEntries = useMemo(() => {
    if (!monthEntries) return []
    return monthEntries.filter(
      (e) => e.type === 'expense' && e.status === 'pending'
    )
  }, [monthEntries])

  const totalFixedUnpaid = unpaidFixedExpenses.reduce(
    (sum, fe) => sum + fe.amount,
    0
  )
  const totalPendingExpenses = pendingExpenseEntries.reduce(
    (sum, e) => sum + e.amount,
    0
  )
  const totalPayable = totalFixedUnpaid + totalPendingExpenses

  // Total expenses already paid this month
  const expensesPaid = useMemo(() => {
    if (!monthEntries) return 0
    return monthEntries
      .filter((e) => e.type === 'expense' && e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0)
  }, [monthEntries])

  // 4. "Saldo Previsto" = Prev. Faturamento - (paid expenses + A Pagar)
  const saldoPrevisto = prevFaturamento - expensesPaid - totalPayable

  // Combine payables list: unpaid fixed expenses + pending expense entries
  const payablesList = useMemo(() => {
    const items: Array<{
      id: string
      description: string
      amount: number
      dueDate: string
      type: 'fixed' | 'entry'
    }> = []

    for (const fe of unpaidFixedExpenses) {
      const dueDay = fe.due_day ?? 1
      const dueDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
      items.push({
        id: fe.id,
        description: fe.description,
        amount: fe.amount,
        dueDate,
        type: 'fixed',
      })
    }

    for (const e of pendingExpenseEntries) {
      items.push({
        id: e.id,
        description: e.description,
        amount: e.amount,
        dueDate: e.entry_date,
        type: 'entry',
      })
    }

    items.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return items
  }, [unpaidFixedExpenses, pendingExpenseEntries, selectedYear, selectedMonth])

  const handleMarkPaid = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'paid' })
      toast('Marcado como pago!')
    } catch {
      toast('Erro ao atualizar')
    }
  }

  const isOverdue = (dateStr: string) => {
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const date = new Date(dateStr + 'T12:00:00')
    return date < todayDate
  }

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

  return (
    <div className="mx-auto max-w-4xl">
      {/* Voltar */}
      <Link
        href="/finances"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-brand-900"
      >
        <ArrowLeft size={14} />
        Voltar para financas
      </Link>

      {/* Month selector */}
      <div className="mb-4 flex items-center gap-2">
        <button onClick={goToPrevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
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
        <button onClick={goToNextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            A RECEBER
          </div>
          <div className="mt-1 text-lg font-semibold text-green-600">
            {formatCurrency(totalReceivable)}
          </div>
          <div className="text-[10px] text-gray-400">{receivableAppointments.length} agendamento{receivableAppointments.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            PREV. FATURAMENTO
          </div>
          <div className="mt-1 text-lg font-semibold text-blue-600">
            {formatCurrency(prevFaturamento)}
          </div>
          <div className="text-[10px] text-gray-400">Recebido + pendente</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            A PAGAR
          </div>
          <div className="mt-1 text-lg font-semibold text-red-600">
            {formatCurrency(totalPayable)}
          </div>
          <div className="text-[10px] text-gray-400">{payablesList.length} pendente{payablesList.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
            <div className="h-2 w-2 rounded-full bg-gray-700" />
            SALDO PREVISTO
          </div>
          <div className={cn('mt-1 text-lg font-semibold', saldoPrevisto >= 0 ? 'text-gray-800' : 'text-red-600')}>
            {formatCurrency(saldoPrevisto)}
          </div>
          <div className="text-[10px] text-gray-400">Receita - despesas</div>
        </div>
      </div>

      {/* Side-by-side layout */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* A Receber */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-[13px] font-semibold text-green-700">A Receber</h3>
            <button
              onClick={() => setShowModal('receivable')}
              className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-[10px] font-medium text-white"
            >
              <Plus size={12} />
              Lancar
            </button>
          </div>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-gray-400">Carregando...</div>
          ) : receivableAppointments.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13px] text-gray-400">Nenhum valor a receber</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {receivableAppointments.map((appt) => {
                const overdue = isOverdue(appt.scheduled_date)
                return (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0"
                  >
                    <div
                      className={cn(
                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                        overdue ? 'bg-red-100' : 'bg-green-100'
                      )}
                    >
                      {overdue ? (
                        <AlertCircle size={13} className="text-red-500" />
                      ) : (
                        <Clock size={13} className="text-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[12px] font-medium">{appt.client_name}</span>
                        {overdue && (
                          <span className="flex-shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-semibold text-red-600">
                            Vencido
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {appt.service_name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {formatDate(appt.scheduled_date)} {appt.scheduled_time ? `as ${appt.scheduled_time.slice(0, 5)}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[13px] font-semibold text-green-600">
                        {formatCurrency(appt.estimated_value)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* A Pagar */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-[13px] font-semibold text-red-700">A Pagar</h3>
            <button
              onClick={() => setShowModal('payable')}
              className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[10px] font-medium text-white"
            >
              <Plus size={12} />
              Lancar
            </button>
          </div>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-gray-400">Carregando...</div>
          ) : payablesList.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13px] text-gray-400">Nenhum valor a pagar</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {payablesList.map((item) => {
                const overdue = isOverdue(item.dueDate)
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0"
                  >
                    <div
                      className={cn(
                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                        overdue ? 'bg-red-100' : 'bg-orange-100'
                      )}
                    >
                      {overdue ? (
                        <AlertCircle size={13} className="text-red-500" />
                      ) : (
                        <Clock size={13} className="text-orange-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[12px] font-medium">{item.description}</span>
                        {item.type === 'fixed' && (
                          <span className="flex-shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[8px] font-semibold text-gray-500">
                            Fixo
                          </span>
                        )}
                        {overdue && (
                          <span className="flex-shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-semibold text-red-600">
                            Vencido
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Vence: {formatDate(item.dueDate)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[13px] font-semibold text-red-600">
                        {formatCurrency(item.amount)}
                      </span>
                      {item.type === 'entry' && (
                        <button
                          onClick={() => handleMarkPaid(item.id)}
                          disabled={updateStatus.isPending}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:border-green-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                          title="Marcar como pago"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Lancar */}
      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(null)}
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-[15px] font-semibold">
                {showModal === 'receivable' ? 'Lancar a Receber' : 'Lancar a Pagar'}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-gray-400">
                <X size={22} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const amount = Number(fd.get('amount'))
                const description = fd.get('description') as string
                const entryDate = fd.get('date') as string

                if (showModal === 'receivable') {
                  await createIncome.mutateAsync({
                    amount,
                    description,
                    entry_date: entryDate,
                    client_name: (fd.get('client_name') as string) || undefined,
                    service_name: (fd.get('service_name') as string) || undefined,
                    status: 'pending',
                  })
                } else {
                  await createExpense.mutateAsync({
                    amount,
                    description,
                    entry_date: entryDate,
                    expense_category: 'variable',
                  })
                }
                setShowModal(null)
                toast('Lancamento criado!')
              }}
              className="p-5"
            >
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Data de vencimento</label>
                  <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" required />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Valor (R$) *</label>
                  <input name="amount" type="number" step="0.01" placeholder="0.00" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" required />
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Descricao *</label>
                <input name="description" type="text" placeholder={showModal === 'receivable' ? 'Ex: Servico prestado...' : 'Ex: Aluguel, material...'} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" required />
              </div>
              {showModal === 'receivable' && (
                <>
                  <div className="mb-3">
                    <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Cliente</label>
                    <input name="client_name" type="text" placeholder="Nome do cliente" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
                  </div>
                  <div className="mb-3">
                    <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Servico</label>
                    <input name="service_name" type="text" placeholder="Nome do servico" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 rounded-lg border border-brand-900 py-2 text-xs font-medium text-brand-900">Cancelar</button>
                <button
                  type="submit"
                  disabled={createIncome.isPending || createExpense.isPending}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-xs font-medium text-white disabled:opacity-50',
                    showModal === 'receivable' ? 'bg-green-600' : 'bg-red-600'
                  )}
                >
                  {(createIncome.isPending || createExpense.isPending) ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
