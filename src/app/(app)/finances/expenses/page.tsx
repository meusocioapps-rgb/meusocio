'use client'

import { useState, useMemo } from 'react'
import {
  useFinancialEntries,
  useFixedExpenses,
  useCreateExpense,
  useUpdateEntryStatus,
} from '@/hooks/use-finances'
import { useAppointmentsByRange } from '@/hooks/use-appointments'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, X, Car, UtensilsCrossed, Check, ChevronLeft, ChevronRight } from 'lucide-react'
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

export default function ExpensesPage() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [showModal, setShowModal] = useState(false)

  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
  const { start: monthStart, end: monthEnd } = getMonthRange(selectedYear, selectedMonth)

  const { data: entries, isLoading } = useFinancialEntries(monthKey)
  const { data: fixedExpenses } = useFixedExpenses()
  const createExpense = useCreateExpense()
  const updateStatus = useUpdateEntryStatus()

  // Daily costs state
  const [transportEnabled, setTransportEnabled] = useState(true)
  const [transportValue, setTransportValue] = useState(20)
  const [foodEnabled, setFoodEnabled] = useState(true)
  const [foodValue, setFoodValue] = useState(25)
  const [excludedDays, setExcludedDays] = useState<Set<string>>(new Set())
  const [dayOverrides, setDayOverrides] = useState<Record<string, { transport?: number; food?: number }>>({})

  const { data: monthAppointments } = useAppointmentsByRange(monthStart, monthEnd)

  // Get unique work days (days with completed appointments)
  const workDays = useMemo(() => {
    if (!monthAppointments) return []
    const completedDates = new Set<string>()
    monthAppointments.forEach((a) => {
      if (a.status === 'completed') {
        completedDates.add(a.scheduled_date)
      }
    })
    return Array.from(completedDates).sort()
  }, [monthAppointments])

  const activeWorkDays = workDays.filter((d) => !excludedDays.has(d))

  const totalTransport = transportEnabled
    ? activeWorkDays.reduce((sum, day) => {
        const override = dayOverrides[day]?.transport
        return sum + (override !== undefined ? override : transportValue)
      }, 0)
    : 0

  const totalFood = foodEnabled
    ? activeWorkDays.reduce((sum, day) => {
        const override = dayOverrides[day]?.food
        return sum + (override !== undefined ? override : foodValue)
      }, 0)
    : 0

  const totalDailyCosts = totalTransport + totalFood

  // All expense entries for this month
  const allExpenseEntries = useMemo(() => {
    return (entries ?? []).filter((e) => e.type === 'expense')
  }, [entries])

  // Paid expenses (financial_entries with status=paid)
  const paidExpenses = useMemo(() => {
    return allExpenseEntries.filter((e) => e.status === 'paid')
  }, [allExpenseEntries])

  // Pending expense entries
  const pendingExpenseEntries = useMemo(() => {
    return allExpenseEntries.filter((e) => e.status === 'pending')
  }, [allExpenseEntries])

  // Determine which fixed expenses have already been paid this month
  // by checking if there's a matching financial_entry with expense_category='fixed' and same description
  const paidFixedDescriptions = useMemo(() => {
    const descriptions = new Set<string>()
    paidExpenses.forEach((e) => {
      if (e.expense_category === 'fixed') {
        descriptions.add(e.description)
      }
    })
    return descriptions
  }, [paidExpenses])

  // Unpaid fixed expenses for the month (not yet recorded as paid entries)
  const unpaidFixedExpenses = useMemo(() => {
    if (!fixedExpenses) return []
    return fixedExpenses.filter((fe) => !paidFixedDescriptions.has(fe.description))
  }, [fixedExpenses, paidFixedDescriptions])

  // KPI calculations
  const totalVariableExpenses = allExpenseEntries
    .filter((e) => e.expense_category !== 'fixed')
    .reduce((s, e) => s + e.amount, 0)

  const totalFixed = (fixedExpenses ?? []).reduce((s, f) => s + f.amount, 0)

  const totalPaidExpenses = paidExpenses.reduce((s, e) => s + e.amount, 0)

  const totalUnpaid = unpaidFixedExpenses.reduce((s, fe) => s + fe.amount, 0) +
    pendingExpenseEntries.reduce((s, e) => s + e.amount, 0)

  const totalAllExpenses = totalPaidExpenses + totalUnpaid + totalDailyCosts

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

  const monthTabs = useMemo(() => {
    const tabs = []
    for (let i = -2; i <= 2; i++) {
      let m = now.getMonth() + i
      let y = now.getFullYear()
      if (m < 0) { m += 12; y -= 1 }
      if (m > 11) { m -= 12; y += 1 }
      tabs.push({ year: y, month: m, label: getMonthLabel(y, m) })
    }
    return tabs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleDay = (day: string) => {
    setExcludedDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const updateDayOverride = (day: string, field: 'transport' | 'food', value: number) => {
    setDayOverrides((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const [showWorkDays, setShowWorkDays] = useState(false)

  // Mark a fixed expense as paid by creating a financial_entry for this month
  const handlePayFixed = async (fe: { description: string; amount: number; due_day: number; category: string }) => {
    try {
      const dueDay = Math.min(fe.due_day, new Date(selectedYear, selectedMonth + 1, 0).getDate())
      const entryDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
      await createExpense.mutateAsync({
        amount: fe.amount,
        description: fe.description,
        entry_date: entryDate,
        expense_category: 'fixed',
      })
      toast('Despesa fixa marcada como paga!')
    } catch {
      toast('Erro ao registrar pagamento')
    }
  }

  // Mark a pending expense entry as paid
  const handlePayEntry = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'paid' })
      toast('Marcado como pago!')
    } catch {
      toast('Erro ao atualizar')
    }
  }

  // Build "A Pagar" list: unpaid fixed expenses + pending entries
  const aPagarList = useMemo(() => {
    const items: Array<{
      id: string
      description: string
      amount: number
      dueDate: string
      itemType: 'fixed' | 'entry'
      category?: string
      due_day?: number
    }> = []

    for (const fe of unpaidFixedExpenses) {
      const dueDay = fe.due_day ?? 1
      const maxDay = new Date(selectedYear, selectedMonth + 1, 0).getDate()
      const clampedDay = Math.min(dueDay, maxDay)
      const dueDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
      items.push({
        id: fe.id,
        description: fe.description,
        amount: fe.amount,
        dueDate,
        itemType: 'fixed',
        category: fe.category,
        due_day: fe.due_day ?? undefined,
      })
    }

    for (const e of pendingExpenseEntries) {
      items.push({
        id: e.id,
        description: e.description,
        amount: e.amount,
        dueDate: e.entry_date,
        itemType: 'entry',
      })
    }

    items.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return items
  }, [unpaidFixedExpenses, pendingExpenseEntries, selectedYear, selectedMonth])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Despesas</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 rounded-lg bg-brand-900 px-3 py-2 text-xs font-medium text-white"
        >
          <Plus size={14} />
          Nova despesa
        </button>
      </div>

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
          <div className="text-[10px] font-medium text-gray-400">Variaveis</div>
          <div className="mt-1 text-base font-semibold text-red-600">
            {formatCurrency(totalVariableExpenses)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="text-[10px] font-medium text-gray-400">Fixas/mes</div>
          <div className="mt-1 text-base font-semibold text-red-600">
            {formatCurrency(totalFixed)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="text-[10px] font-medium text-gray-400">Custos diarios</div>
          <div className="mt-1 text-base font-semibold text-red-600">
            {formatCurrency(totalDailyCosts)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="text-[10px] font-medium text-gray-400">Despesas Totais</div>
          <div className="mt-1 text-base font-semibold text-red-600">
            {formatCurrency(totalAllExpenses)}
          </div>
        </div>
      </div>

      {/* Custos Diarios */}
      <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Custos Diarios
        </h3>
        <div className="space-y-3">
          {/* Deslocamento */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTransportEnabled(!transportEnabled)}
              className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${transportEnabled ? 'bg-brand-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] ${transportEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
            <Car size={16} className="flex-shrink-0 text-gray-500" />
            <div className="flex-1">
              <div className="text-[13px] font-medium">Deslocamento</div>
              <div className="text-[10px] text-gray-400">Valor diario</div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400">R$</span>
              <input
                type="number"
                step="0.01"
                value={transportValue}
                onChange={(e) => setTransportValue(Number(e.target.value))}
                disabled={!transportEnabled}
                className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs outline-none disabled:bg-gray-50 disabled:text-gray-300"
              />
            </div>
          </div>

          {/* Alimentacao */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFoodEnabled(!foodEnabled)}
              className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${foodEnabled ? 'bg-brand-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] ${foodEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
            <UtensilsCrossed size={16} className="flex-shrink-0 text-gray-500" />
            <div className="flex-1">
              <div className="text-[13px] font-medium">Alimentacao</div>
              <div className="text-[10px] text-gray-400">Valor diario</div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400">R$</span>
              <input
                type="number"
                step="0.01"
                value={foodValue}
                onChange={(e) => setFoodValue(Number(e.target.value))}
                disabled={!foodEnabled}
                className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs outline-none disabled:bg-gray-50 disabled:text-gray-300"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-gray-500">Dias trabalhados no mes:</span>
              <span className="font-semibold">{activeWorkDays.length}</span>
            </div>
            {transportEnabled && (
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Total deslocamento ({activeWorkDays.length} x R${transportValue.toFixed(2)})</span>
                <span className="font-medium text-red-600">{formatCurrency(totalTransport)}</span>
              </div>
            )}
            {foodEnabled && (
              <div className="mt-0.5 flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Total alimentacao ({activeWorkDays.length} x R${foodValue.toFixed(2)})</span>
                <span className="font-medium text-red-600">{formatCurrency(totalFood)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-gray-200 pt-1 text-[12px]">
              <span className="font-medium text-gray-600">Total custos diarios</span>
              <span className="font-semibold text-red-600">{formatCurrency(totalDailyCosts)}</span>
            </div>
          </div>

          {/* Work days list toggle */}
          {workDays.length > 0 && (
            <div>
              <button
                onClick={() => setShowWorkDays(!showWorkDays)}
                className="text-[11px] font-medium text-brand-900 hover:underline"
              >
                {showWorkDays ? 'Ocultar dias trabalhados' : `Ver dias trabalhados (${workDays.length})`}
              </button>
              {showWorkDays && (
                <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {workDays.map((day) => {
                    const excluded = excludedDays.has(day)
                    const override = dayOverrides[day]
                    return (
                      <div
                        key={day}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${excluded ? 'bg-gray-50 text-gray-300 line-through' : 'bg-white'}`}
                      >
                        <input
                          type="checkbox"
                          checked={!excluded}
                          onChange={() => toggleDay(day)}
                          className="h-3.5 w-3.5 rounded accent-brand-500"
                        />
                        <span className="flex-1 font-medium">{formatDate(day)}</span>
                        {!excluded && transportEnabled && (
                          <input
                            type="number"
                            step="0.01"
                            value={override?.transport !== undefined ? override.transport : transportValue}
                            onChange={(e) => updateDayOverride(day, 'transport', Number(e.target.value))}
                            className="w-14 rounded border border-gray-200 px-1 py-0.5 text-center text-[10px] outline-none"
                            title="Deslocamento"
                          />
                        )}
                        {!excluded && foodEnabled && (
                          <input
                            type="number"
                            step="0.01"
                            value={override?.food !== undefined ? override.food : foodValue}
                            onChange={(e) => updateDayOverride(day, 'food', Number(e.target.value))}
                            className="w-14 rounded border border-gray-200 px-1 py-0.5 text-center text-[10px] outline-none"
                            title="Alimentacao"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* A Pagar section */}
      <section className="mb-4 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[13px] font-semibold text-red-700">
            A Pagar
            {aPagarList.length > 0 && (
              <span className="ml-2 text-[10px] font-normal text-gray-400">
                {aPagarList.length} pendente{aPagarList.length !== 1 ? 's' : ''} · {formatCurrency(totalUnpaid)}
              </span>
            )}
          </h3>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : aPagarList.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-gray-400">
            Nenhuma despesa pendente
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {aPagarList.map((item) => (
              <div
                key={`${item.itemType}-${item.id}`}
                className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12px] font-medium">{item.description}</span>
                    {item.itemType === 'fixed' && (
                      <span className="flex-shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[8px] font-semibold text-gray-500">
                        Fixo
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Vence: {formatDate(item.dueDate)}
                    {item.category && ` · ${item.category}`}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-[13px] font-semibold text-red-600">
                    {formatCurrency(item.amount)}
                  </span>
                  <button
                    onClick={() => {
                      if (item.itemType === 'fixed') {
                        handlePayFixed({
                          description: item.description,
                          amount: item.amount,
                          due_day: item.due_day ?? 1,
                          category: item.category ?? '',
                        })
                      } else {
                        handlePayEntry(item.id)
                      }
                    }}
                    disabled={createExpense.isPending || updateStatus.isPending}
                    className="flex h-7 items-center gap-1 rounded-lg border border-gray-200 px-2 text-[10px] font-medium text-gray-500 hover:border-green-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                    title="Marcar como pago"
                  >
                    <Check size={12} />
                    Pagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pagas section */}
      <section className="mb-4 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[13px] font-semibold text-green-700">
            Pagas
            {paidExpenses.length > 0 && (
              <span className="ml-2 text-[10px] font-normal text-gray-400">
                {paidExpenses.length} despesa{paidExpenses.length !== 1 ? 's' : ''} · {formatCurrency(totalPaidExpenses)}
              </span>
            )}
          </h3>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : paidExpenses.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-gray-400">
            Nenhuma despesa paga neste mes
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {paidExpenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12px] font-medium">{e.description}</span>
                    {e.expense_category === 'fixed' && (
                      <span className="flex-shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[8px] font-semibold text-gray-500">
                        Fixo
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatDate(e.entry_date)}
                    {e.expense_category && ` · ${e.expense_category}`}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-[13px] font-semibold text-red-600">
                    -{formatCurrency(e.amount)}
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <Check size={12} className="text-green-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-[15px] font-semibold">Nova Despesa</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400">
                <X size={22} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                await createExpense.mutateAsync({
                  amount: Number(fd.get('amount')),
                  description: fd.get('description') as string,
                  entry_date: fd.get('date') as string,
                  expense_category: fd.get('category') as 'variable' | 'fixed' | 'cmv',
                })
                setShowModal(false)
                toast('Despesa registrada!')
              }}
              className="p-5"
            >
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Data</label>
                  <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" required />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Valor (R$) *</label>
                  <input name="amount" type="number" step="0.01" placeholder="0.00" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" required />
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Descricao *</label>
                <input name="description" type="text" placeholder="Ex: Material, DAS..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" required />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Tipo</label>
                <select name="category" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none">
                  <option value="variable">Variavel</option>
                  <option value="fixed">Fixa</option>
                  <option value="cmv">CMV</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-brand-900 py-2 text-xs font-medium text-brand-900">Cancelar</button>
                <button type="submit" disabled={createExpense.isPending} className="flex-1 rounded-lg bg-brand-900 py-2 text-xs font-medium text-white disabled:opacity-50">
                  {createExpense.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
