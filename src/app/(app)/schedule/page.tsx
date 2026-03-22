'use client'

import { useState } from 'react'
import { useAppointmentsByDate, useConfirmAppointment } from '@/hooks/use-appointments'
import {
  formatTime,
  formatCurrency,
  formatDate,
  formatDateFull,
  statusLabel,
  statusColor,
  getToday,
  cn,
} from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(getToday())
  const { data: appointments, isLoading } = useAppointmentsByDate(selectedDate)
  const confirmMutation = useConfirmAppointment()

  const goDay = (offset: number) => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + offset)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  // Gerar dias da semana ao redor da data selecionada
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate + 'T12:00:00')
    const dayOfWeek = d.getDay()
    d.setDate(d.getDate() - dayOfWeek + i)
    return d.toISOString().slice(0, 10)
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Agenda</h2>
        <Link
          href="/schedule/new"
          className="flex items-center gap-1 rounded-lg bg-brand-900 px-3 py-2 text-xs font-medium text-white"
        >
          <Plus size={14} />
          Novo
        </Link>
      </div>

      {/* Navegacao de data */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
        <button
          onClick={() => goDay(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">
            {formatDateFull(selectedDate)}
          </div>
          <div className="text-[10px] text-gray-400">
            {selectedDate === getToday() ? 'Hoje' : formatDate(selectedDate)}
          </div>
        </div>
        <button
          onClick={() => goDay(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Mini calendario semanal */}
      <div className="mb-4 grid grid-cols-7 gap-1">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-semibold text-gray-400"
          >
            {day}
          </div>
        ))}
        {weekDays.map((date) => {
          const isSelected = date === selectedDate
          const isToday = date === getToday()
          const dayNum = new Date(date + 'T12:00:00').getDate()

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg text-[13px] transition-colors',
                isToday && !isSelected && 'bg-brand-900 font-semibold text-white',
                isSelected && 'bg-brand-100 font-semibold text-brand-900',
                !isToday && !isSelected && 'hover:bg-gray-100'
              )}
            >
              {dayNum}
            </button>
          )
        })}
      </div>

      {/* Lista de atendimentos */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Carregando...
          </div>
        ) : !appointments || appointments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-2 text-3xl">📅</div>
            <p className="text-[13px] text-gray-400">
              Nenhum atendimento neste dia
            </p>
            <Link
              href="/schedule/new"
              className="mt-3 inline-block rounded-lg bg-brand-900 px-4 py-2 text-xs font-medium text-white"
            >
              + Agendar
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-100 px-4 py-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {appointments.length} atendimento{appointments.length > 1 ? 's' : ''}
              </span>
            </div>
            {appointments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0"
              >
                <div className="w-11 flex-shrink-0 text-xs font-semibold text-brand-900">
                  {formatTime(a.scheduled_time)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">
                    {a.client_name}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {a.service_name} · {formatCurrency(a.estimated_value)}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      statusColor(a.status)
                    )}
                  >
                    {statusLabel(a.status)}
                  </span>
                  {a.status === 'scheduled' && (
                    <button
                      onClick={() => confirmMutation.mutate(a.id)}
                      className="rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
