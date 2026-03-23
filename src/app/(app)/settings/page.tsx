'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/use-services'
import { useClients, useUpdateClient, useDeleteClient } from '@/hooks/use-clients'
import { formatCurrency } from '@/lib/utils'
import type { Settings } from '@/lib/types'
import { toast } from '@/components/Toast'
import { Plus, X, Search, Pencil, Trash2, Check } from 'lucide-react'

const supabase = createClient()

function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single()
      if (error) throw error
      return data as Settings
    },
    staleTime: 300_000,
  })
}

function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('settings')
        .update(updates)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const { data: services } = useServices()
  const { data: clients } = useClients()
  const updateSettings = useUpdateSettings()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const [showServiceModal, setShowServiceModal] = useState(false)
  const [reactivationDays, setReactivationDays] = useState(30)
  const [minVisits, setMinVisits] = useState(3)
  const [monthlyGoal, setMonthlyGoal] = useState(0)

  // Client management state
  const [clientSearch, setClientSearch] = useState('')
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editClientData, setEditClientData] = useState<{ name: string; phone: string; email: string; instagram: string }>({ name: '', phone: '', email: '', instagram: '' })
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  // Service management state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [editServiceData, setEditServiceData] = useState<{ name: string; price: number; duration: string; cost: number }>({ name: '', price: 0, duration: '', cost: 0 })
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setReactivationDays(settings.reactivation_days)
      setMinVisits(settings.recurrence_min_visits)
      setMonthlyGoal(settings.monthly_goal)
    }
  }, [settings])

  const filteredClients = useMemo(() => {
    if (!clients) return []
    if (!clientSearch.trim()) return []
    const q = clientSearch.toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    )
  }, [clients, clientSearch])

  const saveSettings = async () => {
    await updateSettings.mutateAsync({
      reactivation_days: reactivationDays,
      recurrence_min_visits: minVisits,
      monthly_goal: monthlyGoal,
    })
    toast('Configuracoes salvas!')
  }

  const startEditClient = (c: { id: string; name: string; phone: string | null; email: string | null; instagram: string | null }) => {
    setEditingClientId(c.id)
    setEditClientData({ name: c.name, phone: c.phone || '', email: c.email || '', instagram: c.instagram || '' })
  }

  const saveClient = async () => {
    if (!editingClientId) return
    await updateClient.mutateAsync({ id: editingClientId, ...editClientData })
    setEditingClientId(null)
    toast('Cliente atualizado!')
  }

  const confirmDeleteClient = async () => {
    if (!deletingClientId) return
    await deleteClient.mutateAsync(deletingClientId)
    setDeletingClientId(null)
    toast('Cliente excluido!')
  }

  const startEditService = (s: { id: string; name: string; price: number; duration: string | null; cost: number }) => {
    setEditingServiceId(s.id)
    setEditServiceData({ name: s.name, price: s.price, duration: s.duration || '', cost: s.cost })
  }

  const saveService = async () => {
    if (!editingServiceId) return
    await updateService.mutateAsync({ id: editingServiceId, ...editServiceData })
    setEditingServiceId(null)
    toast('Servico atualizado!')
  }

  const confirmDeleteService = async () => {
    if (!deletingServiceId) return
    await deleteService.mutateAsync(deletingServiceId)
    setDeletingServiceId(null)
    toast('Servico excluido!')
  }

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-gray-400">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-4 text-[15px] font-semibold">Configuracoes</h2>

      {/* Gerenciar Clientes */}
      <section className="mb-6">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Gerenciar Clientes
        </h3>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Buscar cliente por nome, codigo ou telefone..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-[13px] outline-none"
          />
        </div>
        {clientSearch.trim() && (
          <div className="space-y-2">
            {filteredClients.length === 0 ? (
              <p className="py-3 text-center text-[12px] text-gray-400">Nenhum cliente encontrado</p>
            ) : (
              filteredClients.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                  {editingClientId === c.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editClientData.name}
                        onChange={(e) => setEditClientData({ ...editClientData, name: e.target.value })}
                        placeholder="Nome"
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] outline-none"
                      />
                      <input
                        type="text"
                        value={editClientData.phone}
                        onChange={(e) => setEditClientData({ ...editClientData, phone: e.target.value })}
                        placeholder="Telefone"
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] outline-none"
                      />
                      <input
                        type="email"
                        value={editClientData.email}
                        onChange={(e) => setEditClientData({ ...editClientData, email: e.target.value })}
                        placeholder="Email"
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] outline-none"
                      />
                      <input
                        type="text"
                        value={editClientData.instagram}
                        onChange={(e) => setEditClientData({ ...editClientData, instagram: e.target.value })}
                        placeholder="Instagram"
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingClientId(null)}
                          className="flex-1 rounded-lg border border-gray-300 py-1.5 text-[11px] font-medium text-gray-600"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveClient}
                          disabled={updateClient.isPending}
                          className="flex-1 rounded-lg bg-brand-900 py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
                        >
                          {updateClient.isPending ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{c.name}</div>
                        <div className="text-[11px] text-gray-400">
                          #{c.code} {c.phone && ` · ${c.phone}`}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => startEditClient(c)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-brand-500 hover:text-brand-900"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingClientId(c.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-500"
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Lista de servicos */}
      <section className="mb-6">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Gerenciar Servicos
        </h3>
        <p className="mb-3 text-[11px] text-gray-400">
          Nome, preco, duracao e CMV. Usados no novo atendimento.
        </p>
        <div className="space-y-2">
          {services?.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              {editingServiceId === s.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editServiceData.name}
                    onChange={(e) => setEditServiceData({ ...editServiceData, name: e.target.value })}
                    placeholder="Nome do servico"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] outline-none"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-0.5 block text-[9px] font-semibold uppercase text-gray-400">Preco (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editServiceData.price}
                        onChange={(e) => setEditServiceData({ ...editServiceData, price: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[13px] outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[9px] font-semibold uppercase text-gray-400">Duracao</label>
                      <input
                        type="text"
                        value={editServiceData.duration}
                        onChange={(e) => setEditServiceData({ ...editServiceData, duration: e.target.value })}
                        placeholder="Ex: 2h"
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[13px] outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[9px] font-semibold uppercase text-gray-400">CMV (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editServiceData.cost}
                        onChange={(e) => setEditServiceData({ ...editServiceData, cost: Number(e.target.value) })}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[13px] outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingServiceId(null)}
                      className="flex-1 rounded-lg border border-gray-300 py-1.5 text-[11px] font-medium text-gray-600"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveService}
                      disabled={updateService.isPending}
                      className="flex-1 rounded-lg bg-brand-900 py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
                    >
                      {updateService.isPending ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{s.name}</div>
                    <div className="text-[11px] text-gray-400">
                      {s.duration || '\u2014'} · CMV: {formatCurrency(s.cost)}
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold text-brand-900">
                    {formatCurrency(s.price)}
                  </span>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => startEditService(s)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-brand-500 hover:text-brand-900"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeletingServiceId(s.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-500"
                      title="Excluir"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowServiceModal(true)}
          className="mt-2 flex items-center gap-1 rounded-lg bg-brand-900 px-3 py-1.5 text-[11px] font-medium text-white"
        >
          <Plus size={12} />
          Adicionar servico
        </button>
      </section>

      {/* Meta mensal */}
      <section className="mb-6">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Meta mensal
        </h3>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex-1">
            <div className="text-[13px] font-medium">Meta de faturamento</div>
            <div className="text-[11px] text-gray-400">
              {monthlyGoal > 0
                ? `Atual: ${formatCurrency(monthlyGoal)}`
                : 'Nao definida'}
            </div>
          </div>
          <input
            type="number"
            value={monthlyGoal || ''}
            onChange={(e) => setMonthlyGoal(Number(e.target.value))}
            placeholder="R$ 0"
            className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none"
          />
        </div>
      </section>

      {/* Parametros de clientes */}
      <section className="mb-6">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Parametros de clientes
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex-1">
              <div className="text-[13px] font-medium">
                Dias para marcar como &quot;Sumido&quot;
              </div>
              <div className="text-[11px] text-gray-400">
                Padrao: 30 dias
              </div>
            </div>
            <input
              type="number"
              value={reactivationDays}
              onChange={(e) => setReactivationDays(Number(e.target.value))}
              className="w-16 rounded-lg border border-gray-200 px-2.5 py-1.5 text-center text-xs outline-none"
            />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex-1">
              <div className="text-[13px] font-medium">
                Visitas minimas para &quot;Recorrente&quot;
              </div>
              <div className="text-[11px] text-gray-400">
                Padrao: 3 visitas
              </div>
            </div>
            <input
              type="number"
              value={minVisits}
              onChange={(e) => setMinVisits(Number(e.target.value))}
              className="w-16 rounded-lg border border-gray-200 px-2.5 py-1.5 text-center text-xs outline-none"
            />
          </div>
        </div>
      </section>

      {/* Notificacoes */}
      <section className="mb-6">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Notificacoes
        </h3>
        <div className="space-y-2">
          <ToggleRow
            label="Lembrete de aniversario"
            sub="Aviso 7 dias antes"
            checked={settings?.notify_birthday ?? true}
            onChange={(v) => updateSettings.mutate({ notify_birthday: v })}
          />
          <ToggleRow
            label="Lembrete de DAS"
            checked={settings?.notify_das ?? true}
            onChange={(v) => updateSettings.mutate({ notify_das: v })}
          />
          <ToggleRow
            label="Clientes sumidos"
            sub={`Apos ${reactivationDays} dias sem retorno`}
            checked={settings?.notify_inactive ?? true}
            onChange={(v) => updateSettings.mutate({ notify_inactive: v })}
          />
          <ToggleRow
            label="Despesas fixas vencendo"
            checked={settings?.notify_fixed_expenses ?? true}
            onChange={(v) => updateSettings.mutate({ notify_fixed_expenses: v })}
          />
        </div>
      </section>

      {/* Salvar */}
      <button
        onClick={saveSettings}
        disabled={updateSettings.isPending}
        className="w-full rounded-lg bg-brand-900 py-2.5 text-xs font-medium text-white disabled:opacity-50"
      >
        {updateSettings.isPending ? 'Salvando...' : 'Salvar configuracoes'}
      </button>

      {/* Modal Novo Servico */}
      {showServiceModal && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowServiceModal(false)}
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white md:rounded-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-[15px] font-semibold">Novo Servico</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-gray-400">
                <X size={22} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                await createService.mutateAsync({
                  name: fd.get('name') as string,
                  price: Number(fd.get('price')),
                  duration: (fd.get('duration') as string) || undefined,
                  cost: Number(fd.get('cost')) || 0,
                })
                setShowServiceModal(false)
                toast('Servico adicionado!')
              }}
              className="p-5"
            >
              <div className="mb-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Nome *</label>
                <input name="name" type="text" placeholder="Ex: Manutencao eletrica" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" required />
              </div>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Preco (R$)</label>
                  <input name="price" type="number" step="0.01" placeholder="0" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" required />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">Duracao</label>
                  <input name="duration" type="text" placeholder="Ex: 2h" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">CMV (R$)</label>
                <input name="cost" type="number" step="0.01" placeholder="0" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowServiceModal(false)} className="flex-1 rounded-lg border border-brand-900 py-2 text-xs font-medium text-brand-900">Cancelar</button>
                <button type="submit" disabled={createService.isPending} className="flex-1 rounded-lg bg-brand-900 py-2 text-xs font-medium text-white disabled:opacity-50">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusao de Cliente */}
      {deletingClientId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setDeletingClientId(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <div className="mb-3 text-3xl">&#9888;&#65039;</div>
            <h3 className="mb-2 text-[15px] font-semibold">Excluir cliente?</h3>
            <p className="mb-4 text-[12px] text-gray-500">
              Esta acao nao pode ser desfeita. Todos os dados deste cliente serao removidos.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingClientId(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteClient}
                disabled={deleteClient.isPending}
                className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                {deleteClient.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusao de Servico */}
      {deletingServiceId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setDeletingServiceId(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <div className="mb-3 text-3xl">&#9888;&#65039;</div>
            <h3 className="mb-2 text-[15px] font-semibold">Excluir servico?</h3>
            <p className="mb-4 text-[12px] text-gray-500">
              Esta acao nao pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingServiceId(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteService}
                disabled={deleteService.isPending}
                className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                {deleteService.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string
  sub?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? 'bg-brand-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
