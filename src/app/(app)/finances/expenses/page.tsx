'use client'

import { useState } from 'react'
import {
  useFinancialEntries,
  useFixedExpenses,
  useCreateExpense,
} from '@/hooks/use-finances'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, X } from 'lucide-react'
import { toast } from '@/components/Toast'

export default function ExpensesPage() {
  const { data: entries, isLoading } = useFinancialEntries()
  const { data: fixedExpenses } = useFixedExpenses()
  const [showModal, setShowModal] = useState(false)
  const createExpense = useCreateExpense()

  const expenses = (entries ?? []).filter((e) => e.type === 'expense')
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalFixed = (fixedExpenses ?? []).reduce((s, f) => s + f.amount, 0)

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

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="text-[10px] font-medium text-gray-400">Variaveis</div>
          <div className="mt-1 text-base font-semibold text-red-600">
            {formatCurrency(totalExpenses)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="text-[10px] font-medium text-gray-400">Fixas/mes</div>
          <div className="mt-1 text-base font-semibold text-red-600">
            {formatCurrency(totalFixed)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="text-[10px] font-medium text-gray-400">Total</div>
          <div className="mt-1 text-base font-semibold text-red-600">
            {formatCurrency(totalExpenses + totalFixed)}
          </div>
        </div>
      </div>

      {/* Despesas fixas */}
      {fixedExpenses && fixedExpenses.length > 0 && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-[13px] font-semibold">📌 Despesas fixas</h3>
          {fixedExpenses.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between border-b border-gray-50 py-2 last:border-0"
            >
              <div>
                <div className="text-xs font-medium">{f.description}</div>
                <div className="text-[10px] text-gray-400">
                  Vence dia {f.due_day} · {f.category}
                </div>
              </div>
              <span className="text-xs font-semibold text-red-600">
                {formatCurrency(f.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Lancamentos */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[13px] font-semibold">📋 Lancamentos do mes</h3>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Carregando...
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-gray-400">
            Nenhuma despesa registrada
          </div>
        ) : (
          expenses.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-0"
            >
              <div>
                <div className="text-xs font-medium">{e.description}</div>
                <div className="text-[10px] text-gray-400">
                  {formatDate(e.entry_date)}
                  {e.expense_category && ` · ${e.expense_category}`}
                </div>
              </div>
              <span className="text-xs font-semibold text-red-600">
                -{formatCurrency(e.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white md:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-[15px] font-semibold">💸 Nova Despesa</h3>
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
                toast('✅ Despesa registrada!')
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
