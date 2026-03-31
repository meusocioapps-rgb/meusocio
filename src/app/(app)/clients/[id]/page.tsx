'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
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
import { ArrowLeft, Phone, Mail, Instagram, ExternalLink, MapPin, Pencil, X, Check } from 'lucide-react'
import { toast } from '@/components/Toast'

const supabase = createSupabaseClient()

type CustomField = {
  id: string
  name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'boolean'
  is_active: boolean
}

type CustomFieldValue = {
  id: string
  client_id: string
  custom_field_id: string
  value: string
}

function useCustomFields() {
  return useQuery({
    queryKey: ['custom_fields'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as CustomField[]
    },
  })
}

function useClientCustomFieldValues(clientId: string) {
  return useQuery({
    queryKey: ['client_custom_field_values', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_custom_field_values')
        .select('*')
        .eq('client_id', clientId)
      if (error) throw error
      return data as CustomFieldValue[]
    },
    enabled: !!clientId,
  })
}

function useUpsertCustomFieldValue(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ custom_field_id, value }: { custom_field_id: string; value: string }) => {
      const { error } = await supabase
        .from('client_custom_field_values')
        .upsert(
          { client_id: clientId, custom_field_id, value },
          { onConflict: 'client_id,custom_field_id' }
        )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_custom_field_values', clientId] })
    },
  })
}

const SOURCE_OPTIONS = [
  'Indicacao',
  'Instagram',
  'Google',
  'Passante',
  'Tráfego pago',
  'Redes sociais',
  'Outro',
]

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: client, isLoading } = useClient(id)
  const { data: history } = useClientHistory(id)
  const { data: appointments } = useClientAppointments(id)
  const { data: customFields } = useCustomFields()
  const { data: customFieldValues } = useClientCustomFieldValues(id)
  const updateClient = useUpdateClient()
  const upsertCustomFieldValue = useUpsertCustomFieldValue(id)

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    instagram: '',
    birth_date: '',
    source: '',
    address: '',
    notes: '',
  })
  const [customFieldForm, setCustomFieldForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name ?? '',
        phone: client.phone ?? '',
        email: client.email ?? '',
        instagram: client.instagram ?? '',
        birth_date: client.birth_date ?? '',
        source: client.source ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      })
    }
  }, [client])

  useEffect(() => {
    if (customFieldValues) {
      const map: Record<string, string> = {}
      customFieldValues.forEach((v) => {
        map[v.custom_field_id] = v.value
      })
      setCustomFieldForm(map)
    }
  }, [customFieldValues])

  const handleSave = async () => {
    try {
      await updateClient.mutateAsync({
        id,
        name: form.name.trim() || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        instagram: form.instagram || undefined,
        birth_date: form.birth_date || undefined,
        source: form.source || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
      })

      // Save custom field values
      const saves = Object.entries(customFieldForm).map(([custom_field_id, value]) =>
        upsertCustomFieldValue.mutateAsync({ custom_field_id, value })
      )
      await Promise.all(saves)

      toast('✅ Cliente atualizado!')
      setIsEditing(false)
    } catch {
      toast('Erro ao salvar. Tente novamente.')
    }
  }

  const handleCancel = () => {
    if (client) {
      setForm({
        name: client.name ?? '',
        phone: client.phone ?? '',
        email: client.email ?? '',
        instagram: client.instagram ?? '',
        birth_date: client.birth_date ?? '',
        source: client.source ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      })
    }
    if (customFieldValues) {
      const map: Record<string, string> = {}
      customFieldValues.forEach((v) => {
        map[v.custom_field_id] = v.value
      })
      setCustomFieldForm(map)
    }
    setIsEditing(false)
  }

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

  const isSaving = updateClient.isPending || upsertCustomFieldValue.isPending

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
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-900">
            {getInitials(isEditing ? form.name : client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="flex-1 rounded-lg border border-brand-900 px-3 py-1.5 text-[15px] font-semibold outline-none focus:ring-2 focus:ring-brand-900/20"
                  placeholder="Nome completo"
                  autoFocus
                />
              ) : (
                <>
                  <h2 className="text-lg font-semibold">{client.name}</h2>
                  <span className="text-xs text-gray-400">{client.code}</span>
                </>
              )}
            </div>

            {!isEditing && (
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
            )}

            {/* Contato (view mode) */}
            {!isEditing && (
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
            )}
          </div>
        </div>

        {/* Botões de ação rápida */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          {!isEditing ? (
            <>
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
              <button
                onClick={() => setIsEditing(true)}
                className="ml-auto flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
              >
                <Pencil size={12} />
                Editar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-[11px] font-medium text-gray-600"
              >
                <X size={12} />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.name.trim()}
                className="flex items-center gap-1 rounded-lg bg-brand-900 px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
              >
                <Check size={12} />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Formulário de edição */}
      {isEditing && (
        <div className="mb-4 rounded-xl border border-brand-900/20 bg-white p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-gray-700">✏️ Editar informações</h3>

          <div className="space-y-3">
            {/* Phone + Instagram */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Instagram
                </label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                  placeholder="@usuario"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                E-mail
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              />
            </div>

            {/* Birth date + Source */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  🎂 Data de nascimento
                </label>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Origem
                </label>
                <select
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
                >
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Endereço
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Rua, número, bairro..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Observações
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Preferências, alergias, anotações..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900 resize-none"
              />
            </div>

            {/* Custom fields */}
            {customFields && customFields.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Ficha do cliente
                </div>
                <div className="space-y-3">
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {field.name}
                      </label>
                      {field.field_type === 'boolean' ? (
                        <select
                          value={customFieldForm[field.id] ?? ''}
                          onChange={(e) =>
                            setCustomFieldForm((f) => ({ ...f, [field.id]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
                        >
                          <option value="">—</option>
                          <option value="true">Sim</option>
                          <option value="false">Não</option>
                        </select>
                      ) : field.field_type === 'date' ? (
                        <input
                          type="date"
                          value={customFieldForm[field.id] ?? ''}
                          onChange={(e) =>
                            setCustomFieldForm((f) => ({ ...f, [field.id]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
                        />
                      ) : field.field_type === 'number' ? (
                        <input
                          type="number"
                          value={customFieldForm[field.id] ?? ''}
                          onChange={(e) =>
                            setCustomFieldForm((f) => ({ ...f, [field.id]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
                        />
                      ) : (
                        <input
                          type="text"
                          value={customFieldForm[field.id] ?? ''}
                          onChange={(e) =>
                            setCustomFieldForm((f) => ({ ...f, [field.id]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save / Cancel buttons (bottom of form) */}
          <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
            <button
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !form.name.trim()}
              className="flex-1 rounded-lg bg-brand-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      )}

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

      {/* Custom field values (view mode) */}
      {!isEditing && customFields && customFields.length > 0 && customFieldValues && customFieldValues.length > 0 && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-[13px] font-semibold">🗂️ Ficha do cliente</h3>
          <div className="space-y-2">
            {customFields.map((field) => {
              const val = customFieldValues.find((v) => v.custom_field_id === field.id)
              if (!val || !val.value) return null
              let displayValue = val.value
              if (field.field_type === 'boolean') {
                displayValue = val.value === 'true' ? 'Sim' : 'Não'
              } else if (field.field_type === 'date') {
                try {
                  displayValue = new Date(val.value + 'T12:00:00').toLocaleDateString('pt-BR')
                } catch {
                  displayValue = val.value
                }
              }
              return (
                <div key={field.id} className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{field.name}</span>
                  <span className="text-[12px] font-medium text-gray-700">{displayValue}</span>
                </div>
              )
            })}
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
      {!isEditing && client.notes && (
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
