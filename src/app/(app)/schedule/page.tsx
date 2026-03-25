'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  useAppointmentsByDate,
  useAppointmentsByRange,
  useConfirmAppointment,
} from '@/hooks/use-appointments'
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
import { AppointmentModal } from '@/components/AppointmentModal'
import { PostAppointmentModal } from '@/components/PostAppointmentModal'
import type { AppointmentWithClient } from '@/lib/types'

type ViewMode = 'day' | 'week' | 'month'

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(getToday())
  const [view, setView] = useState<ViewMode>('day')

  // Modal state
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithClient | null>(null)
  const [postApptData, setPostApptData] = useState<{
    appointment: AppointmentWithClient
    isFreeReturn: boolean
  } | null>(null)

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Agenda</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  view === v
                    ? 'border-brand-900 bg-brand-900 text-white'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                )}
              >
                {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
          <Link
            href="/schedule/new"
            className="flex items-center gap-1 rounded-lg bg-brand-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            <Plus size={14} />
          </Link>
        </div>
      </div>

      {view === 'day' && (
        <DayView
          date={selectedDate}
          onDateChange={setSelectedDate}
          onSelectAppt={setSelectedAppt}
        />
      )}
      {view === 'week' && (
        <WeekView
          date={selectedDate}
          onDateChange={setSelectedDate}
          onSelectAppt={setSelectedAppt}
        />
      )}
      {view === 'month' && (
        <MonthView
          date={selectedDate}
          onDateChange={setSelectedDate}
          onDayClick={(d) => {
            setSelectedDate(d)
            setView('day')
          }}
        />
      )}

      {/* Modal de Atendimento */}
      {selectedAppt && (
        <AppointmentModal
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onCompleted={(result) => {
            setPostApptData({
              appointment: selectedAppt,
              isFreeReturn: result.isFreeReturn,
            })
            setSelectedAppt(null)
          }}
        />
      )}

      {/* Modal Pós-Atendimento */}
      {postApptData && (
        <PostAppointmentModal
          appointment={postApptData.appointment}
          isFreeReturn={postApptData.isFreeReturn}
          onClose={() => setPostApptData(null)}
        />
      )}
    </div>
  )
}

// ─── VIEW: DIA ──────────────────────────────────────
function DayView({
  date,
  onDateChange,
  onSelectAppt,
}: {
  date: string
  onDateChange: (d: string) => void
  onSelectAppt: (a: AppointmentWithClient) => void
}) {
  const { data: appointments, isLoading } = useAppointmentsByDate(date)
  const confirmMutation = useConfirmAppointment()

  const goDay = (offset: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + offset)
    onDateChange(d.toISOString().slice(0, 10))
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() - d.getDay() + i)
    return d.toISOString().slice(0, 10)
  })

  return (
    <>
      {/* Nav de data */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
        <button onClick={() => goDay(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">{formatDateFull(date)}</div>
          <div className="text-[10px] text-gray-400">{date === getToday() ? 'Hoje' : formatDate(date)}</div>
        </div>
        <button onClick={() => goDay(1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Mini calendário semanal */}
      <div className="mb-4 grid grid-cols-7 gap-1">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-gray-400">{d}</div>
        ))}
        {weekDays.map((wd) => {
          const sel = wd === date
          const today = wd === getToday()
          return (
            <button
              key={wd}
              onClick={() => onDateChange(wd)}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg text-[13px] transition-colors',
                today && !sel && 'bg-brand-900 font-semibold text-white',
                sel && 'bg-brand-100 font-semibold text-brand-900',
                !today && !sel && 'hover:bg-gray-100'
              )}
            >
              {new Date(wd + 'T12:00:00').getDate()}
            </button>
          )
        })}
      </div>

      {/* Lista de atendimentos */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : !appointments || appointments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-2 text-3xl">📅</div>
            <p className="text-[13px] text-gray-400">Nenhum atendimento neste dia</p>
            <Link href="/schedule/new" className="mt-3 inline-block rounded-lg bg-brand-900 px-4 py-2 text-xs font-medium text-white">+ Agendar</Link>
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
                onClick={() => onSelectAppt(a)}
                className="flex cursor-pointer items-center gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50 last:border-0"
              >
                <div className="w-11 flex-shrink-0 text-xs font-semibold text-brand-900">
                  {formatTime(a.scheduled_time)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{a.client_name}</div>
                  <div className="text-[11px] text-gray-400">{a.service_name} · {formatCurrency(a.estimated_value)}</div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusColor(a.status))}>
                    {statusLabel(a.status)}
                  </span>
                  {a.status === 'scheduled' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); confirmMutation.mutate(a.id) }}
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
    </>
  )
}

// ─── VIEW: SEMANA ───────────────────────────────────
function WeekView({
  date,
  onDateChange,
  onSelectAppt,
}: {
  date: string
  onDateChange: (d: string) => void
  onSelectAppt: (a: AppointmentWithClient) => void
}) {
  const baseDate = new Date(date + 'T12:00:00')
  const startOfWeek = new Date(baseDate)
  startOfWeek.setDate(baseDate.getDate() - baseDate.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const startStr = startOfWeek.toISOString().slice(0, 10)
  const endStr = endOfWeek.toISOString().slice(0, 10)

  const { data: appointments } = useAppointmentsByRange(startStr, endStr)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

  const goWeek = (offset: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + offset * 7)
    onDateChange(d.toISOString().slice(0, 10))
  }

  const apptsByDateAndHour = useMemo(() => {
    const map: Record<string, AppointmentWithClient[]> = {}
    appointments?.forEach((a) => {
      const hour = a.scheduled_time.slice(0, 2) + ':00'
      const key = `${a.scheduled_date}_${hour}`
      if (!map[key]) map[key] = []
      map[key].push(a)
    })
    return map
  }, [appointments])

  return (
    <>
      {/* Nav */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
        <button onClick={() => goWeek(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-semibold">
          {formatDate(startStr)} — {formatDate(endStr)}
        </div>
        <button onClick={() => goWeek(1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grid semanal */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <div className="min-w-[600px]">
          {/* Header dias */}
          <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-gray-200">
            <div className="p-2" />
            {weekDays.map((wd, i) => {
              const isToday = wd === getToday()
              const dayNum = new Date(wd + 'T12:00:00').getDate()
              return (
                <div
                  key={wd}
                  className={cn(
                    'border-l border-gray-100 p-2 text-center cursor-pointer hover:bg-gray-50',
                    isToday && 'bg-brand-50'
                  )}
                  onClick={() => onDateChange(wd)}
                >
                  <div className="text-[10px] font-semibold text-gray-400">{dayNames[i]}</div>
                  <div className={cn(
                    'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                    isToday ? 'bg-brand-900 text-white' : 'text-gray-700'
                  )}>
                    {dayNum}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time slots */}
          {timeSlots.map((slot) => (
            <div key={slot} className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-gray-50 last:border-0">
              <div className="flex items-start justify-center p-1.5 text-[10px] font-medium text-gray-400">
                {slot.slice(0, 5)}
              </div>
              {weekDays.map((wd) => {
                const key = `${wd}_${slot}`
                const appts = apptsByDateAndHour[key] || []
                return (
                  <div key={key} className="min-h-[56px] border-l border-gray-50 p-0.5">
                    {appts.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => onSelectAppt(a)}
                        className={cn(
                          'mb-0.5 w-full rounded-md px-1.5 py-1.5 text-left transition-all hover:shadow-sm',
                          a.status === 'confirmed' || a.status === 'completed'
                            ? 'bg-green-100 text-green-800 border-l-2 border-green-500'
                            : a.status === 'cancelled' || a.status === 'no_show'
                              ? 'bg-red-50 text-red-600 border-l-2 border-red-400'
                              : 'bg-blue-50 text-blue-700 border-l-2 border-blue-400'
                        )}
                      >
                        <div className="text-[10px] font-semibold truncate">{a.client_name}</div>
                        <div className="text-[8px] opacity-70 truncate">{a.service_name}</div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── VIEW: MÊS ──────────────────────────────────────
function MonthView({
  date,
  onDateChange,
  onDayClick,
}: {
  date: string
  onDateChange: (d: string) => void
  onDayClick: (d: string) => void
}) {
  const [displayMonth, setDisplayMonth] = useState(() => {
    const d = new Date(date + 'T12:00:00')
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const year = displayMonth.year
  const month = displayMonth.month

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startStr = firstDay.toISOString().slice(0, 10)
  const endStr = lastDay.toISOString().slice(0, 10)

  const { data: appointments } = useAppointmentsByRange(startStr, endStr)

  const apptCountByDate = useMemo(() => {
    const map: Record<string, number> = {}
    appointments?.forEach((a) => {
      map[a.scheduled_date] = (map[a.scheduled_date] || 0) + 1
    })
    return map
  }, [appointments])

  const goMonth = (offset: number) => {
    setDisplayMonth((prev) => {
      const d = new Date(prev.year, prev.month + offset, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  // Gerar grid do calendário
  const calDays: (string | null)[] = []
  // Dias vazios antes do primeiro dia
  for (let i = 0; i < firstDay.getDay(); i++) calDays.push(null)
  // Dias do mês
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calDays.push(dateStr)
  }

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

  // Atendimentos de hoje (para mostrar abaixo do calendário)
  const todayAppts = appointments?.filter((a) => a.scheduled_date === getToday()) || []

  return (
    <>
      {/* Nav */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
        <button onClick={() => goMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-semibold">{monthNames[month]} {year}</div>
        <button onClick={() => goMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendário mensal */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calDays.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} className="h-10" />
            const dayNum = new Date(d + 'T12:00:00').getDate()
            const isToday = d === getToday()
            const count = apptCountByDate[d] || 0
            return (
              <button
                key={d}
                onClick={() => onDayClick(d)}
                className={cn(
                  'relative flex h-10 flex-col items-center justify-center rounded-lg text-[13px] transition-colors',
                  isToday ? 'bg-brand-900 font-semibold text-white' : 'hover:bg-brand-50'
                )}
              >
                {dayNum}
                {count > 0 && (
                  <span className={cn(
                    'absolute bottom-1 h-1 w-1 rounded-full',
                    isToday ? 'bg-white' : 'bg-brand-500'
                  )} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Atendimentos de hoje */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Hoje · {todayAppts.length} atendimento{todayAppts.length !== 1 ? 's' : ''}
          </span>
        </div>
        {todayAppts.length > 0 ? (
          todayAppts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0">
              <div className="w-11 flex-shrink-0 text-xs font-semibold text-brand-900">
                {formatTime(a.scheduled_time)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{a.client_name}</div>
                <div className="text-[11px] text-gray-400">{a.service_name}</div>
              </div>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusColor(a.status))}>
                {statusLabel(a.status)}
              </span>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-gray-400">Nenhum atendimento hoje</div>
        )}
      </div>
    </>
  )
}
