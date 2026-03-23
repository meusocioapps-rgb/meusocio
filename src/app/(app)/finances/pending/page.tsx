'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  usePendingEntries,
  useUpdateEntryStatus,
  useFinancialSummary,
} from '@/hooks/use-finances'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { ArrowLeft, Check, Clock, AlertCircle } from 'lucide-react'
import { toast } from '@/components/Toast'

type Tab = 'receivable' | 'payable'

export default function PendingPage() {
  const [tab, setTab] = useState<Tab>('receivable')
  const { data: entries, isLoading } = usePendingEntries()
  const { data: summary } = useFinancialSummary()
  const updateStatus = useUpdateEntryStatus()

  const receivables = (entries ?? []).filter((e) => e.type === 'income')
  const payables = (entries ?? []).filter((e) => e.type === 'expense')
  const current = tab === 'receivable' ? receivables : payables

  const totalReceivable = receivables.reduce((sum, e) => sum + e.amount, 0)
  const totalPayable = payables.reduce((sum, e) => sum + e.amount, 0)

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

  return (
    <div className="mx-auto max-w-2xl">
      {/* Voltar */}
      <Link
        href="/finances"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-brand-900"
      >
        <ArrowLeft size={14} />
        Voltar para finanças
      </Link>

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
            <Clock size={12} className="text-amber-500" />
            A RECEBER
          </div>
          <div className="mt-1 text-xl font-semibold text-amber-600">
            {formatCurrency(totalReceivable)}
          </div>
          <div className="mt-0.5 text-[10px] text-gray-400">
            {receivables.length} pendente{receivables.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
            <Clock size={12} className="text-red-500" />
            A PAGAR
          </div>
          <div className="mt-1 text-xl font-semibold text-red-600">
            {formatCurrency(totalPayable)}
          </div>
          <div className="mt-0.5 text-[10px] text-gray-400">
            {payables.length} pendente{payables.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
        <button
          onClick={() => setTab('receivable')}
          className={cn(
            'flex-1 rounded-lg py-2 text-xs font-medium transition-colors',
            tab === 'receivable'
              ? 'bg-brand-900 text-white'
              : 'text-gray-500 hover:bg-gray-50'
          )}
        >
          A Receber ({receivables.length})
        </button>
        <button
          onClick={() => setTab('payable')}
          className={cn(
            'flex-1 rounded-lg py-2 text-xs font-medium transition-colors',
            tab === 'payable'
              ? 'bg-brand-900 text-white'
              : 'text-gray-500 hover:bg-gray-50'
          )}
        >
          A Pagar ({payables.length})
        </button>
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : current.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-2 text-3xl">
              {tab === 'receivable' ? '💰' : '💸'}
            </div>
            <p className="text-[13px] text-gray-400">
              {tab === 'receivable'
                ? 'Nenhum valor a receber'
                : 'Nenhum valor a pagar'}
            </p>
          </div>
        ) : (
          current.map((entry) => {
            const overdue = isOverdue(entry.entry_date)
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0"
              >
                {/* Status indicator */}
                <div
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                    overdue
                      ? 'bg-red-100'
                      : tab === 'receivable'
                        ? 'bg-amber-100'
                        : 'bg-orange-100'
                  )}
                >
                  {overdue ? (
                    <AlertCircle size={14} className="text-red-500" />
                  ) : (
                    <Clock size={14} className={tab === 'receivable' ? 'text-amber-500' : 'text-orange-500'} />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium">
                      {entry.description}
                    </span>
                    {overdue && (
                      <span className="flex-shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-semibold text-red-600">
                        Vencido
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatDate(entry.entry_date)}
                    {entry.client_name && ` · ${entry.client_name}`}
                    {entry.service_name && ` · ${entry.service_name}`}
                  </div>
                </div>

                {/* Valor + ação */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      tab === 'receivable' ? 'text-amber-600' : 'text-red-600'
                    )}
                  >
                    {formatCurrency(entry.amount)}
                  </span>
                  <button
                    onClick={() => handleMarkPaid(entry.id)}
                    disabled={updateStatus.isPending}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-green-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                    title="Marcar como pago"
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Resumo do mês */}
      {summary && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-[13px] font-semibold">Resumo do mês</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Receita recebida</span>
              <span className="font-semibold text-brand-900">
                {formatCurrency(summary.income_paid)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Receita pendente</span>
              <span className="font-semibold text-amber-600">
                {formatCurrency(summary.income_pending)}
              </span>
            </div>
            <div className="my-1 h-px bg-gray-100" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Total despesas</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(summary.expenses_total)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">CMV (custo produtos)</span>
              <span className="font-medium text-gray-600">
                {formatCurrency(summary.expenses_cmv)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Despesas fixas</span>
              <span className="font-medium text-gray-600">
                {formatCurrency(summary.fixed_expenses)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
