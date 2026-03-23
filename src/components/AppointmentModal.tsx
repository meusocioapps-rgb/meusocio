'use client'

import { useState, useEffect } from 'react'
import {
  useCompleteAppointment,
  useRescheduleAppointment,
  useUpdateAppointmentStatus,
  useConfirmAppointment,
} from '@/hooks/use-appointments'
import { useServices } from '@/hooks/use-services'
import { formatCurrency, formatTime, formatDate, cn } from '@/lib/utils'
import type { AppointmentWithClient } from '@/lib/types'
import { X } from 'lucide-react'
import { toast } from '@/components/Toast'

type SelectedStatus = 'completed' | 'rescheduled' | 'no_show' | 'cancelled' | null

interface AppointmentModalProps {
  appointment: AppointmentWithClient
  onClose: () => void
  onCompleted?: (result: { isFreeReturn: boolean; nextReturnDate?: string }) => void
}

export function AppointmentModal({
  appointment: appt,
  onClose,
  onCompleted,
}: AppointmentModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<SelectedStatus>(null)
  const [finalValue, setFinalValue] = useState(appt.estimated_value)
  const [editingValue, setEditingValue] = useState(false)
  const [notes, setNotes] = useState(appt.notes || '')
  const [upsellService, setUpsellService] = useState('')
  const [upsellValue, setUpsellValue] = useState(0)

  // Remarcar
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  // Pós-atendimento
  const [isFreeReturn, setIsFreeReturn] = useState(false)
  const [nextReturnDate, setNextReturnDate] = useState('')

  const { data: services } = useServices()
  const completeMutation = useCompleteAppointment()
  const rescheduleMutation = useRescheduleAppointment()
  const statusMutation = useUpdateAppointmentStatus()
  const confirmMutation = useConfirmAppointment()

  const isLoading =
    completeMutation.isPending ||
    rescheduleMutation.isPending ||
    statusMutation.isPending

  useEffect(() => {
    setFinalValue(appt.final_value ?? appt.estimated_value)
  }, [appt])

  const handleSave = async () => {
    if (!selectedStatus) {
      toast('Selecione o status do atendimento')
      return
    }

    try {
      if (selectedStatus === 'completed') {
        await completeMutation.mutateAsync({
          p_appointment_id: appt.id,
          p_final_value: finalValue,
          p_is_free_return: isFreeReturn,
          p_notes: notes || undefined,
          p_upsell_service: upsellService || undefined,
          p_upsell_value: upsellValue || undefined,
        })
        toast('✅ Atendimento finalizado!')
        onCompleted?.({ isFreeReturn, nextReturnDate })
      } else if (selectedStatus === 'rescheduled') {
        if (!newDate || !newTime) {
          toast('Preencha a nova data e horário')
          return
        }
        await rescheduleMutation.mutateAsync({
          p_appointment_id: appt.id,
          p_new_date: newDate,
          p_new_time: newTime,
          p_notes: notes || undefined,
        })
        toast('↺ Atendimento remarcado!')
      } else {
        await statusMutation.mutateAsync({
          p_appointment_id: appt.id,
          p_status: selectedStatus,
          p_notes: notes || undefined,
        })
        toast(
          selectedStatus === 'no_show'
            ? '✗ Marcado como falta'
            : '✕ Atendimento cancelado'
        )
      }
      onClose()
    } catch {
      toast('Erro ao salvar. Tente novamente.')
    }
  }

  const isFinalized = ['completed', 'rescheduled', 'no_show', 'cancelled'].includes(
    appt.status
  )

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white md:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 rounded-t-2xl">
          <h3 className="text-[15px] font-semibold">Detalhes do atendimento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="p-5">
          {/* Info do atendimento */}
          <div className="mb-4 rounded-xl bg-gray-50 p-3">
            <div className="mb-2 flex gap-2">
              <span className="text-sm text-gray-400">👤</span>
              <div>
                <div className="text-[11px] text-gray-400">Cliente</div>
                <div className="text-[13px] font-medium">{appt.client_name}</div>
              </div>
            </div>
            <div className="mb-2 flex gap-2">
              <span className="text-sm text-gray-400">🛠️</span>
              <div>
                <div className="text-[11px] text-gray-400">Serviço</div>
                <div className="text-[13px] font-medium">{appt.service_name}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-sm text-gray-400">⏰</span>
              <div>
                <div className="text-[11px] text-gray-400">Horário</div>
                <div className="text-[13px] font-medium">
                  {formatDate(appt.scheduled_date)} às {formatTime(appt.scheduled_time)}
                </div>
              </div>
            </div>
          </div>

          {/* Valor final */}
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
            <div className="mb-1 text-[11px] text-gray-400">💵 Valor final pago</div>
            <div className="flex items-center gap-3">
              {editingValue ? (
                <input
                  type="number"
                  value={finalValue}
                  onChange={(e) => setFinalValue(Number(e.target.value))}
                  step="0.01"
                  className="w-28 rounded-lg border border-green-200 px-2 py-1 text-base font-semibold text-brand-900 outline-none"
                  autoFocus
                  onBlur={() => setEditingValue(false)}
                />
              ) : (
                <span className="text-base font-semibold text-brand-900">
                  {formatCurrency(finalValue)}
                </span>
              )}
              {!isFinalized && (
                <button
                  onClick={() => setEditingValue(!editingValue)}
                  className="rounded-lg bg-brand-900/10 px-2.5 py-1 text-[11px] font-medium text-brand-900"
                >
                  ✎ Editar
                </button>
              )}
            </div>
          </div>

          {/* Status do atendimento */}
          {!isFinalized && (
            <>
              <div className="mb-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Status do atendimento
                </label>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <StatusButton
                  label="✓ Realizado"
                  selected={selectedStatus === 'completed'}
                  onClick={() => setSelectedStatus('completed')}
                  className="border-green-600 bg-green-100 text-green-700"
                />
                <StatusButton
                  label="↺ Remarcou"
                  selected={selectedStatus === 'rescheduled'}
                  onClick={() => setSelectedStatus('rescheduled')}
                  className="border-blue-600 bg-blue-100 text-blue-700"
                />
                <StatusButton
                  label="✗ Faltou"
                  selected={selectedStatus === 'no_show'}
                  onClick={() => setSelectedStatus('no_show')}
                  className="border-red-600 bg-red-100 text-red-700"
                />
                <StatusButton
                  label="✕ Cancelou"
                  selected={selectedStatus === 'cancelled'}
                  onClick={() => setSelectedStatus('cancelled')}
                  className="border-gray-400 bg-gray-100 text-gray-600"
                />
              </div>
            </>
          )}

          {/* Remarcação */}
          {selectedStatus === 'rescheduled' && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
              <div className="mb-2 text-[11px] font-semibold text-blue-700">
                📅 Novo horário
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">
                    Nova data
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">
                    Novo horário
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Opções pós-realizado */}
          {selectedStatus === 'completed' && (
            <div className="mb-4 space-y-3">
              {/* Retorno gratuito */}
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <div>
                  <div className="text-[13px] font-medium">Retorno gratuito</div>
                  <div className="text-[10px] text-gray-400">
                    Não gera receita no financeiro
                  </div>
                </div>
                <button
                  onClick={() => setIsFreeReturn(!isFreeReturn)}
                  className={cn(
                    'relative h-5 w-9 rounded-full transition-colors',
                    isFreeReturn ? 'bg-brand-500' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left]',
                      isFreeReturn ? 'left-[18px]' : 'left-0.5'
                    )}
                  />
                </button>
              </div>

              {/* Serviço adicional */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Serviço adicional (opcional)
                </label>
                <select
                  value={upsellService}
                  onChange={(e) => {
                    setUpsellService(e.target.value)
                    const svc = services?.find((s) => s.name === e.target.value)
                    if (svc) setUpsellValue(svc.price)
                    else setUpsellValue(0)
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none"
                >
                  <option value="">Nenhum</option>
                  {services?.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} — {formatCurrency(s.price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Próximo retorno */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  📅 Próximo retorno (opcional)
                </label>
                <input
                  type="date"
                  value={nextReturnDate}
                  onChange={(e) => setNextReturnDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
                />
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="mb-4">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre o atendimento..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              readOnly={isFinalized}
            />
          </div>
        </div>

        {/* Footer */}
        {!isFinalized && (
          <div className="sticky bottom-0 flex gap-2 border-t border-gray-200 bg-white px-5 py-3 rounded-b-2xl">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-brand-900 py-2 text-xs font-medium text-brand-900"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !selectedStatus}
              className="flex-1 rounded-lg bg-brand-900 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}

        {/* Footer para já finalizado - só fechar */}
        {isFinalized && (
          <div className="flex gap-2 border-t border-gray-200 px-5 py-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-brand-900 py-2 text-xs font-medium text-white"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusButton({
  label,
  selected,
  onClick,
  className,
}: {
  label: string
  selected: boolean
  onClick: () => void
  className: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-xl border-[1.5px] px-3 py-2.5 text-xs font-medium transition-all',
        selected
          ? cn(className, 'shadow-[0_0_0_3px_rgba(0,0,0,0.08)]')
          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
      )}
    >
      {label}
    </button>
  )
}
