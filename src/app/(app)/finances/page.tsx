'use client'

import { useState } from 'react'
import {
  useFinancialEntries,
  useFinancialSummary,
  useCreateIncome,
} from '@/hooks/use-finances'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, X } from 'lucide-react'
import { toast } from '@/components/Toast'

export default function FinancesPage() {
  const { data: entries, isLoading } = useFinancialEntries()
  const { data: summary } = useFinancialSummary()
  const [showModal, setShowModal] = useState(false)
  const createIncome = useCreateIncome()

  const incomes = (entries ?? []).filter((e) => e.type === 'income')

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold">Receitas</h2>
          <p className="text-[11px] text-gray-400">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
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

      {/* KPIs */}
      {summary && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-[10px] font-medium text-gray-400">
              Total recebido
            </div>
            <div className="mt-1 text-base font-semibold text-brand-900">
              {formatCurrency(summary.income_paid)}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-[10px] font-medium text-gray-400">
              A receber
            </div>
            <div className="mt-1 text-base font-semibold text-amber-600">
              {formatCurrency(summary.income_pending)}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-[10px] font-medium text-gray-400">
              Total geral
            </div>
            <div className="mt-1 text-base font-semibold">
              {formatCurrency(summary.income_total)}
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Carregando...
          </div>
        ) : incomes.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-2 text-3xl">💰</div>
            <p className="text-[13px] text-gray-400">
              Nenhuma receita registrada
            </p>
          </div>
        ) : (
          <div>
            {incomes.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {entry.description}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatDate(entry.entry_date)}
                    {entry.client_name && ` · ${entry.client_name}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-900">
                    {formatCurrency(entry.amount)}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      entry.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    )}
                  >
                    {entry.status === 'paid' ? 'Recebido' : 'A receber'}
                  </span>
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
              <h3 className="text-[15px] font-semibold">💵 Nova Receita</h3>
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
                toast('✅ Receita registrada!')
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
