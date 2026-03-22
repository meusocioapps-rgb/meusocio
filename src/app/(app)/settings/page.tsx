'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useServices, useCreateService } from '@/hooks/use-services'
import { formatCurrency } from '@/lib/utils'
import type { Settings } from '@/lib/types'
import { toast } from '@/components/Toast'
import { Plus, X } from 'lucide-react'

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
  const updateSettings = useUpdateSettings()
  const createService = useCreateService()

  const [showServiceModal, setShowServiceModal] = useState(false)
  const [reactivationDays, setReactivationDays] = useState(30)
  const [minVisits, setMinVisits] = useState(3)
  const [monthlyGoal, setMonthlyGoal] = useState(0)

  useEffect(() => {
    if (settings) {
      setReactivationDays(settings.reactivation_days)
      setMinVisits(settings.recurrence_min_visits)
      setMonthlyGoal(settings.monthly_goal)
    }
  }, [settings])

  const saveSettings = async () => {
    await updateSettings.mutateAsync({
      reactivation_days: reactivationDays,
      recurrence_min_visits: minVisits,
      monthly_goal: monthlyGoal,
    })
    toast('✅ Configuracoes salvas!')
  }

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-gray-400">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-4 text-[15px] font-semibold">Configuracoes</h2>

      {/* Lista de servicos */}
      <section className="mb-6">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Lista de servicos
        </h3>
        <p className="mb-3 text-[11px] text-gray-400">
          Nome, preco, duracao e CMV. Usados no novo atendimento.
        </p>
        <div className="space-y-2">
          {services?.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div className="flex-1">
                <div className="text-[13px] font-medium">{s.name}</div>
                <div className="text-[11px] text-gray-400">
                  {s.duration || '—'} · CMV: {formatCurrency(s.cost)}
                </div>
              </div>
              <span className="text-[13px] font-semibold text-brand-900">
                {formatCurrency(s.price)}
              </span>
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
            <div className="text-[13px] font-medium">🎯 Meta de faturamento</div>
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
            label="🎂 Lembrete de aniversario"
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
              <h3 className="text-[15px] font-semibold">🛠️ Novo Servico</h3>
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
                toast('✅ Servico adicionado!')
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
