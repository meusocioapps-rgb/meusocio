'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  useClient,
  useClientHistory,
  useClientAppointments,
  useUpdateClient,
} from '@/hooks/use-clients'
import {
  formatCurrency,
  formatDate,
  formatTime,
  getInitials,
  statusLabel,
  statusColor,
  cn,
} from '@/lib/utils'
import { ArrowLeft, Phone, Mail, Instagram, ExternalLink, MapPin } from 'lucide-react'
import { toast } from '@/components/Toast'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: client, isLoading } = useClient(id)
  const { data: history } = useClientHistory(id)
  const { data: appointments } = useClientAppointments(id)
  const updateClient = useUpdateClient()

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">Carregando...</div>
    )
  }

  if (!client) {
    return (
      <div className="py-20 text-center">
        <div className="mb-2 text-3xl">😕</div>
        <p className="text-sm text-gray-400">Cliente não encontrado</p>
        <Link
          href="/clients"
          className="mt-3 inline-block text-xs font-medium text-brand-900"
        >
          ← Voltar para clientes
        </Link>
      </div>
    )
  }

  const eventIcon: Record<string, string> = {
    completed: '✅',
    rescheduled: '↺',
    no_show: '✗',
    cancelled: '✕',
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Voltar */}
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-brand-900"
      >
        <ArrowLeft size={14} />
        Voltar para clientes
      </Link>

      {/* Header do cliente */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-900">
            {getInitials(client.name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{client.name}</h2>
              <span className="text-xs text-gray-400">{client.code}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {client.is_recurrent && (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-medium text-green-700">
                  ⭐ Recorrente
                </span>
              )}
              {client.needs_reactivation && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-medium text-red-700">
                  ⚠️ Reativar
                </span>
              )}
              {!client.is_recurrent && !client.needs_reactivation && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-500">
                  {client.activity_status === 'new' ? 'Novo' : 'Ativo'}
                </span>
              )}
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-medium text-blue-700">
                {client.source}
              </span>
            </div>

            {/* Contato */}
            <div className="mt-3 flex flex-wrap gap-2">
              {client.phone && (
                <a
                  href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Phone size={12} />
                  {client.phone}
                </a>
              )}
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Mail size={12} />
                  {client.email}
                </a>
              )}
              {client.instagram && (
                <a
                  href={`https://instagram.com/${client.instagram.replace('@', '')}`}
                  target="_blank"
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Instagram size={12} />
                  {client.instagram}
                </a>
              )}
              {client.address && (
                <span className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-medium text-gray-600">
                  <MapPin size={12} />
                  {client.address}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botões de ação rápida */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <Link
            href="/schedule/new"
            className="rounded-lg bg-brand-900 px-3 py-1.5 text-[11px] font-medium text-white"
          >
            + Agendar atendimento
          </Link>
          {client.phone && (
            <a
              href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
              target="_blank"
              className="flex items-center gap-1 rounded-lg border border-brand-900 px-3 py-1.5 text-[11px] font-medium text-brand-900"
            >
              💬 WhatsApp
              <ExternalLink size={10} />
            </a>
          )}
          {client.needs_reactivation && (
            <button
              onClick={async () => {
                await updateClient.mutateAsync({
                  id: client.id,
                  is_removed_from_reactivation: true,
                })
                toast('Removido da lista de reativação')
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-[11px] font-medium text-gray-500"
            >
              Remover da lista
            </button>
          )}
        </div>
      </div>

      {/* Stats em grid */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <div className="text-[10px] font-medium text-gray-400">Total de visitas</div>
          <div className="mt-1 text-xl font-semibold">{client.total_visits}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <div className="text-[10px] font-medium text-gray-400">Total gasto</div>
          <div className="mt-1 text-xl font-semibold text-brand-900">
            {formatCurrency(client.total_spent)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <div className="text-[10px] font-medium text-gray-400">Última visita</div>
          <div className="mt-1 text-base font-semibold">
            {client.last_visit ? formatDate(client.last_visit) : '—'}
          </div>
        </div>
      </div>

      {/* Aniversário */}
      {client.birth_date && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <span className="text-lg">🎂</span>
          <div>
            <div className="text-[13px] font-medium">Aniversário</div>
            <div className="text-[11px] text-gray-400">
              {new Date(client.birth_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
              })}
            </div>
          </div>
        </div>
      )}

      {/* Histórico de atendimentos */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[13px] font-semibold">📋 Histórico de atendimentos</h3>
        </div>

        {appointments && appointments.length > 0 ? (
          appointments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">
                  {formatDate(a.scheduled_date)} às {formatTime(a.scheduled_time)}
                </div>
                <div className="text-[11px] text-gray-400">{a.service_name}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold">
                  {a.is_free_return
                    ? 'Cortesia'
                    : formatCurrency(a.final_value ?? a.estimated_value)}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    statusColor(a.status)
                  )}
                >
                  {statusLabel(a.status)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-gray-400">
            Nenhum atendimento registrado
          </div>
        )}
      </div>

      {/* Timeline de eventos */}
      {history && history.length > 0 && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-[13px] font-semibold">🕐 Linha do tempo</h3>
          </div>
          <div className="px-4 py-2">
            {history.map((h) => (
              <div key={h.id} className="flex gap-3 border-b border-gray-50 py-2.5 last:border-0">
                <span className="text-sm">{eventIcon[h.event_type] || '📝'}</span>
                <div className="flex-1">
                  <div className="text-xs font-medium">
                    {h.event_type === 'completed'
                      ? 'Atendimento realizado'
                      : h.event_type === 'rescheduled'
                        ? 'Atendimento remarcado'
                        : h.event_type === 'no_show'
                          ? 'Faltou'
                          : h.event_type === 'cancelled'
                            ? 'Cancelou'
                            : h.event_type}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {formatDate(h.event_date)}
                    {h.service_name && ` · ${h.service_name}`}
                    {h.value && ` · ${formatCurrency(h.value)}`}
                  </div>
                  {h.notes && (
                    <div className="mt-0.5 text-[10px] text-gray-400 italic">
                      &quot;{h.notes}&quot;
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {client.notes && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-[13px] font-semibold">📝 Observações</h3>
          <p className="text-xs text-gray-500 leading-relaxed">{client.notes}</p>
        </div>
      )}

      {/* Info do cadastro */}
      <div className="text-center text-[10px] text-gray-400 pb-4">
        Cadastrado em {formatDate(client.created_at?.slice(0, 10))}
      </div>
    </div>
  )
}
