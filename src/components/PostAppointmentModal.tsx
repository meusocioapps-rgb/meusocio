'use client'

import { useState } from 'react'
import { useCreateAppointment } from '@/hooks/use-appointments'
import { useServices } from '@/hooks/use-services'
import { formatCurrency } from '@/lib/utils'
import type { AppointmentWithClient } from '@/lib/types'
import { toast } from '@/components/Toast'
import { cn } from '@/lib/utils'

interface PostAppointmentModalProps {
  appointment: AppointmentWithClient
  isFreeReturn: boolean
  onClose: () => void
}

export function PostAppointmentModal({
  appointment: appt,
  isFreeReturn,
  onClose,
}: PostAppointmentModalProps) {
  const [returnDate, setReturnDate] = useState('')
  const [returnTime, setReturnTime] = useState('')
  const [returnServiceId, setReturnServiceId] = useState(appt.service_id || '')
  const [returnServiceName, setReturnServiceName] = useState(appt.service_name)
  const [returnValue, setReturnValue] = useState(appt.estimated_value)
  const [isReturnFree, setIsReturnFree] = useState(false)
  const [materialCost, setMaterialCost] = useState(0)

  const { data: services } = useServices()
  const createAppointment = useCreateAppointment()

  const handleScheduleReturn = async () => {
    if (!returnDate || !returnTime) {
      toast('Preencha data e horário do retorno')
      return
    }

    try {
      const returnNotes = isReturnFree
        ? `Retorno gratuito${materialCost > 0 ? ` | CMV: R$${materialCost.toFixed(2)}` : ''}`
        : undefined

      await createAppointment.mutateAsync({
        client_id: appt.client_id,
        service_id: returnServiceId || undefined,
        service_name: returnServiceName,
        scheduled_date: returnDate,
        scheduled_time: returnTime,
        estimated_value: isReturnFree ? 0 : returnValue,
        is_free_return: isReturnFree,
        notes: returnNotes,
      })
      toast('✅ Retorno agendado!')
      onClose()
    } catch {
      toast('Erro ao agendar retorno')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white md:rounded-2xl">
        {/* Header - Sucesso */}
        <div className="border-b border-gray-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="text-3xl">✅</div>
            <div>
              <h3 className="text-[15px] font-semibold">
                Atendimento finalizado!
              </h3>
              <p className="text-[13px] text-gray-500">{appt.client_name}</p>
              {!isFreeReturn && (
                <p className="text-xs text-brand-900 font-medium">
                  +{formatCurrency(appt.final_value ?? appt.estimated_value)} registrado
                </p>
              )}
              {isFreeReturn && (
                <p className="text-xs text-gray-400">Retorno gratuito — sem receita</p>
              )}
            </div>
          </div>
        </div>

        {/* Agendar retorno */}
        <div className="p-5">
          <div className="mb-3 text-[13px] font-semibold">
            📅 Agendar próximo retorno?
          </div>
          <p className="mb-4 text-[11px] text-gray-400">
            Opcional — agende já o próximo atendimento desse cliente.
          </p>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">
                Data
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">
                Horário
              </label>
              <input
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">
              Serviço
            </label>
            <select
              value={returnServiceId}
              onChange={(e) => {
                setReturnServiceId(e.target.value)
                const svc = services?.find((s) => s.id === e.target.value)
                if (svc) {
                  setReturnServiceName(svc.name)
                  setReturnValue(svc.price)
                }
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none"
            >
              {services?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatCurrency(s.price)}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle retorno gratuito */}
          <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5">
            <div>
              <div className="text-[13px] font-medium">Retorno gratuito</div>
              <div className="text-[10px] text-gray-400">Cortesia, sem cobrar</div>
            </div>
            <button
              onClick={() => setIsReturnFree(!isReturnFree)}
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors',
                isReturnFree ? 'bg-brand-500' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left]',
                  isReturnFree ? 'left-[18px]' : 'left-0.5'
                )}
              />
            </button>
          </div>

          {/* CMV para retorno gratuito */}
          {isReturnFree && (
            <div className="mb-4">
              <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">
                Custo de material - CMV (opcional)
              </label>
              <input
                type="number"
                value={materialCost || ''}
                onChange={(e) => setMaterialCost(Number(e.target.value))}
                placeholder="R$ 0,00"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                Registre o custo interno dos materiais utilizados.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600"
          >
            Fechar sem agendar
          </button>
          {returnDate && returnTime && (
            <button
              onClick={handleScheduleReturn}
              disabled={createAppointment.isPending}
              className="flex-1 rounded-lg bg-brand-900 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {createAppointment.isPending ? 'Agendando...' : 'Agendar retorno'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
