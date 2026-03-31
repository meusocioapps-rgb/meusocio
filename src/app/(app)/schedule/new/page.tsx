'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClients, useCreateClient } from '@/hooks/use-clients'
import { useServices } from '@/hooks/use-services'
import { useCreateAppointment } from '@/hooks/use-appointments'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency, getToday, getInitials } from '@/lib/utils'
import { toast } from '@/components/Toast'
import { WhatsAppConfirmModal } from '@/components/WhatsAppConfirmModal'
import { Search, Plus, X, UserPlus } from 'lucide-react'

export default function NewAppointmentPage() {
  const router = useRouter()
  const { data: clients } = useClients()
  const { data: services } = useServices()
  const createAppointment = useCreateAppointment()
  const createClient = useCreateClient()
  const { data: profile } = useProfile()

  const [clientId, setClientId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(getToday())
  const [time, setTime] = useState('')
  const [value, setValue] = useState(0)
  const [notes, setNotes] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [showResults, setShowResults] = useState(false)

  // WhatsApp confirmation modal
  const [showWhatsApp, setShowWhatsApp] = useState(false)

  // Inline new client form
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientSource, setNewClientSource] = useState('Indicação')

  const selectedClient = clients?.find((c) => c.id === clientId)
  const selectedService = services?.find((s) => s.id === serviceId)

  const filteredClients = (clients ?? []).filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const handleSelectService = (id: string) => {
    setServiceId(id)
    const svc = services?.find((s) => s.id === id)
    if (svc) setValue(svc.price)
  }

  const handleSave = async () => {
    if (!clientId || !serviceId || !date || !time) {
      toast('Preencha todos os campos')
      return
    }

    await createAppointment.mutateAsync({
      client_id: clientId,
      service_id: serviceId,
      service_name: selectedService?.name ?? '',
      scheduled_date: date,
      scheduled_time: time,
      estimated_value: value,
      notes: notes || undefined,
    })

    toast('✅ Atendimento agendado!')
    setShowWhatsApp(true)
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-1 text-[15px] font-semibold">Novo Atendimento</h2>
      <p className="mb-4 text-[11px] text-gray-400">
        Busque um cliente e selecione o servico
      </p>

      {/* Cliente */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-[13px] font-semibold">👤 Cliente</h3>
        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              className="flex-1 bg-transparent text-[13px] outline-none"
            />
          </div>
          {showResults && clientSearch && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[250px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {filteredClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setClientId(c.id)
                    setClientSearch(c.name)
                    setShowResults(false)
                    setShowNewClient(false)
                  }}
                  className="flex w-full items-center gap-2 border-b border-gray-50 px-3 py-2.5 text-left text-xs hover:bg-brand-50 last:border-0"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[9px] font-semibold text-brand-900">
                    {getInitials(c.name)}
                  </div>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gray-400">{c.code}</span>
                </button>
              ))}
              {/* Botão criar novo cliente */}
              <button
                onClick={() => {
                  setShowResults(false)
                  setShowNewClient(true)
                  setNewClientName(clientSearch)
                }}
                className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-3 text-left text-xs font-medium text-brand-900 hover:bg-brand-50"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100">
                  <UserPlus size={12} className="text-brand-900" />
                </div>
                Criar &quot;{clientSearch}&quot; como novo cliente
              </button>
            </div>
          )}
        </div>

        {/* Inline new client form */}
        {showNewClient && (
          <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-brand-900">
                <UserPlus size={12} className="mb-0.5 mr-1 inline" />
                Novo cliente
              </span>
              <button
                onClick={() => setShowNewClient(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nome *"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              />
              <input
                type="text"
                placeholder="Telefone (opcional)"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              />
              <select
                value={newClientSource}
                onChange={(e) => setNewClientSource(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none"
              >
                <option value="Indicação">Indicação</option>
                <option value="Instagram">Instagram</option>
                <option value="Google">Google</option>
                <option value="Passando na frente">Passando na frente</option>
                <option value="Outro">Outro</option>
              </select>
              <button
                onClick={async () => {
                  if (!newClientName.trim()) {
                    toast('Nome do cliente é obrigatório')
                    return
                  }
                  try {
                    const result = await createClient.mutateAsync({
                      name: newClientName.trim(),
                      phone: newClientPhone || undefined,
                      source: newClientSource,
                    })
                    setClientId(result.id)
                    setClientSearch(newClientName.trim())
                    setShowNewClient(false)
                    setNewClientName('')
                    setNewClientPhone('')
                    toast('Cliente criado!')
                  } catch {
                    toast('Erro ao criar cliente')
                  }
                }}
                disabled={createClient.isPending}
                className="w-full rounded-lg bg-brand-900 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                {createClient.isPending ? 'Criando...' : 'Criar e selecionar'}
              </button>
            </div>
          </div>
        )}

        {selectedClient && !showNewClient && (
          <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900">
            ✓ {selectedClient.name} ({selectedClient.code})
          </div>
        )}
      </div>

      {/* Servico */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-[13px] font-semibold">🛠️ Servico</h3>
        <select
          value={serviceId}
          onChange={(e) => handleSelectService(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none"
        >
          <option value="">Selecionar servico...</option>
          {services?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {formatCurrency(s.price)}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Valor (R$)
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              step="0.01"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Duracao
            </label>
            <input
              type="text"
              value={selectedService?.duration ?? ''}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Data e Horario */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-[13px] font-semibold">📅 Data e Horario</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Horario
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
            />
          </div>
        </div>
      </div>

      {/* Observacoes */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Observacoes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalhes do atendimento..."
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
          rows={3}
        />
      </div>

      {/* Resumo */}
      <div className="mb-4 rounded-xl border border-green-200 bg-brand-50 p-4">
        <div className="mb-3 text-xs font-semibold text-brand-900">
          📋 Resumo
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex gap-2">
            <span>👤</span>
            <span className="font-medium">
              {selectedClient?.name || 'Cliente nao selecionado'}
            </span>
          </div>
          <div className="flex gap-2">
            <span>🛠️</span>
            <span className="font-medium">
              {selectedService?.name || 'Servico nao selecionado'}
            </span>
          </div>
          <div className="flex gap-2">
            <span>📅</span>
            <span className="font-medium">
              {date} {time && `as ${time}`}
            </span>
          </div>
          <div className="flex gap-2">
            <span>💵</span>
            <span className="font-medium">{formatCurrency(value)}</span>
          </div>
        </div>
      </div>

      {/* Botoes */}
      <div className="flex gap-2">
        <button
          onClick={() => router.push('/schedule')}
          className="flex-1 rounded-lg border border-brand-900 px-3 py-2.5 text-xs font-medium text-brand-900"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={createAppointment.isPending}
          className="flex-1 rounded-lg bg-brand-900 px-3 py-2.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {createAppointment.isPending ? 'Salvando...' : 'Salvar atendimento'}
        </button>
      </div>

      {/* Modal WhatsApp confirmação */}
      {showWhatsApp && selectedClient && (
        <WhatsAppConfirmModal
          clientName={selectedClient.name}
          clientPhone={selectedClient.phone}
          serviceName={selectedService?.name ?? ''}
          date={date}
          time={time}
          businessName={profile?.business_name || profile?.full_name || 'Meu Sócio'}
          businessAddress={profile?.address || null}
          onClose={() => {
            setShowWhatsApp(false)
            router.push('/schedule')
          }}
        />
      )}
    </div>
  )
}
