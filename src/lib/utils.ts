// =====================================================
// MEU SOCIO — UTILITARIOS
// =====================================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string): string {
  if (!date) return '—'
  const d = new Date(date + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000)

  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function formatDateFull(date: string): string {
  if (!date) return '—'
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatTime(time: string): string {
  if (!time) return '—'
  return time.slice(0, 5)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    completed: 'Realizado',
    rescheduled: 'Remarcado',
    no_show: 'Faltou',
    cancelled: 'Cancelado',
  }
  return map[status] || status
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    rescheduled: 'bg-blue-100 text-blue-800',
    no_show: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
