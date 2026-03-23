'use client'

import { useState } from 'react'
import { useClients, useCreateClient } from '@/hooks/use-clients'
import {
  formatCurrency,
  formatDate,
  getInitials,
  cn,
} from '@/lib/utils'
import { Search, Plus, X } from 'lucide-react'
import { toast } from '@/components/Toast'

export default function ClientsPage() {
  const [filter, setFilter] = useState<'all' | 'recurrent' | 'reactivate'>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const { data: clients, isLoading } = useClients(filter)
  const createClient = useCreateClient()

  const filtered = (clients ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search)
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold">Clientes</h2>
          <p className="text-[11px] text-gray-400">
            {clients?.length ?? 0} cadastrados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 rounded-lg bg-brand-900 px-3 py-2 text-xs font-medium text-white"
        >
          <Plus size={14} />
          Novo cliente
        </button>
      </div>

      {/* Busca + Filtro */}
      <div className="mb-3 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
        >
          <option value="all">Todos</option>
          <option value="recurrent">⭐ Recorrentes</option>
          <option value="reactivate">⚠️ Sumidos</option>
        </select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-2 text-3xl">👥</div>
          <p className="text-[13px] text-gray-400">
            {search ? 'Nenhum cliente encontrado' : 'Cadastre seu primeiro cliente'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => (
            <a
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-900">
                {getInitials(client.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium truncate">
                    {client.name}
                  </span>
                  <span className="text-[10px] text-gray-400">{client.code}</span>
                </div>
                <div className="text-[11px] text-gray-400">
                  {client.last_service || 'Sem atendimento'}
                  {client.last_visit && ` · ${formatDate(client.last_visit)}`}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-semibold">
                  {formatCurrency(client.total_spent)}
                </div>
                <div className="mt-0.5">
                  {client.needs_reactivation ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                      Reativar
                    </span>
                  ) : client.is_recurrent ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      Recorrente
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      {client.total_visits} visitas
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Modal Novo Cliente */}
      {showModal && (
        <NewClientModal
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            await createClient.mutateAsync(data)
            setShowModal(false)
            toast('✅ Cliente cadastrado!')
          }}
          loading={createClient.isPending}
        />
      )}
    </div>
  )
}

function NewClientModal({
  onClose,
  onSave,
  loading,
}: {
  onClose: () => void
  onSave: (data: {
    name: string
    phone?: string
    email?: string
    instagram?: string
    birth_date?: string
    source?: string
  }) => Promise<void>
  loading: boolean
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    instagram: '',
    birth_date: '',
    source: 'Indicacao',
  })

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    await onSave({
      name: form.name.trim(),
      ...(form.phone && { phone: form.phone }),
      ...(form.email && { email: form.email }),
      ...(form.instagram && { instagram: form.instagram }),
      ...(form.birth_date && { birth_date: form.birth_date }),
      ...(form.source && { source: form.source }),
    })
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-[15px] font-semibold">👤 Novo Cliente</h3>
          <button onClick={onClose} className="text-gray-400">
            <X size={22} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-3">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Nome completo *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Nome do cliente"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              autoFocus
            />
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                WhatsApp
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
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
                onChange={(e) => set('instagram', e.target.value)}
                placeholder="@usuario"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              E-mail
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
            />
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                🎂 Data de nascimento
              </label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => set('birth_date', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Como chegou?
              </label>
              <select
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none"
              >
                <option>Indicacao</option>
                <option>Instagram</option>
                <option>Google</option>
                <option>Passante</option>
                <option>Outro</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-brand-900 px-3 py-2 text-xs font-medium text-brand-900"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || loading}
            className="flex-1 rounded-lg bg-brand-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
