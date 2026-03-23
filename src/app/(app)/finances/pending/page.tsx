'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  usePendingEntries,
  useUpdateEntryStatus,
  useFinancialSummary,
  useCreateIncome,
  useCreateExpense,
} from '@/hooks/use-finances'
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

  const { data: entries, isLoading } = usePendingEntries()
  const { data: summary } = useFinancialSummary()
  const updateStatus = useUpdateEntryStatus()
  const createIncome = useCreateIncome()
  const createExpense = useCreateExpense()

  const { start: monthStart, end: monthEnd } = getMonthRange(selectedYear, selectedMonth)

  // Filter entries by selected month
  const monthEntries = useMemo(() => {
    if (!entries) return []
    return entries.filter((e) => e.entry_date >= monthStart && e.entry_date <= monthEnd)
  }, [entries, monthStart, monthEnd])

  const receivables = monthEntries.filter((e) => e.type === 'income')
  const payables = monthEntries.filter((e) => e.type === 'expense')

  const totalReceivable = receivables.reduce((sum, e) => sum + e.amount, 0)
  const totalPayable = payables.reduce((sum, e) => sum + e.amount, 0)
  const prevFaturamento = (summary?.income_paid ?? 0) + totalReceivable
  const saldoPrevisto = prevFaturamento - totalPayable - (summary?.expenses_total ?? 0)

  const handleMarkPaid = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'paid' })
      toast('Marcado como pago!')
    } catch {
      toast('Erro ao atualizar')
    }
  }

  const isOverdue = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(dateStr + 'T12:00:00')
    return date < today
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
          <div className="text-[10px] text-gray-400">{receivables.length} pendente{receivables.length !== 1 ? 's' : ''}</div>
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
          <div className="text-[10px] text-gray-400">{payables.length} pendente{payables.length !== 1 ? 's' : ''}</div>
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
          ) : receivables.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13px] text-gray-400">Nenhum valor a receber</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {receivables.map((entry) => {
                const overdue = isOverdue(entry.entry_date)
                return (
                  <div
                    key={entry.id}
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
                        <span className="truncate text-[12px] font-medium">{entry.client_name || entry.description}</span>
                        {overdue && (
                          <span className="flex-shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-semibold text-red-600">
                            Vencido
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {entry.description}
                        {entry.service_name && ` · ${entry.service_name}`}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Vence: {formatDate(entry.entry_date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[13px] font-semibold text-green-600">
                        {formatCurrency(entry.amount)}
                      </span>
                      <button
                        onClick={() => handleMarkPaid(entry.id)}
                        disabled={updateStatus.isPending}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:border-green-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                        title="Marcar como pago"
                      >
                        <Check size={12} />
                      </button>
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
          ) : payables.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13px] text-gray-400">Nenhum valor a pagar</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {payables.map((entry) => {
                const overdue = isOverdue(entry.entry_date)
                return (
                  <div
                    key={entry.id}
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
                        <span className="truncate text-[12px] font-medium">{entry.description}</span>
                        {overdue && (
                          <span className="flex-shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-semibold text-red-600">
                            Vencido
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Vence: {formatDate(entry.entry_date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[13px] font-semibold text-red-600">
                        {formatCurrency(entry.amount)}
                      </span>
                      <button
                        onClick={() => handleMarkPaid(entry.id)}
                        disabled={updateStatus.isPending}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:border-green-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                        title="Marcar como pago"
                      >
                        <Check size={12} />
                      </button>
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
