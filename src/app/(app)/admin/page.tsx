'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/Toast'
import {
  Users,
  UserCheck,
  Clock,
  Crown,
  Search,
  Mail,
  Bell,
  Shield,
  X,
  ChevronLeft,
  Save,
  MessageSquare,
  Eye,
  Calendar,
  DollarSign,
  Briefcase,
  Phone,
  CheckCircle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Profile {
  id: string
  full_name: string | null
  business_name: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string | null
}

interface Feedback {
  id: string
  user_id: string | null
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  type: string
  message: string
  read: boolean
  created_at: string
}

type Tab = 'users' | 'feedbacks'

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
function useAdminUsers() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })
}

function useAdminFeedbacks() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['admin', 'feedbacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('Feedback table not available:', error.message)
        return [] as Feedback[]
      }
      return data as Feedback[]
    },
  })
}

function useUserDetails(userId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['admin', 'user-details', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null

      const [servicesRes, clientsRes, appointmentsRes, financesRes] = await Promise.all([
        supabase.from('services').select('*').eq('user_id', userId).order('name'),
        supabase.from('clients').select('*').eq('user_id', userId).order('name'),
        supabase.from('appointments').select('*').eq('user_id', userId).order('scheduled_date', { ascending: false }).limit(20),
        supabase.from('financial_entries').select('*').eq('user_id', userId).order('entry_date', { ascending: false }).limit(20),
      ])

      return {
        services: servicesRes.data ?? [],
        clients: clientsRes.data ?? [],
        appointments: appointmentsRes.data ?? [],
        finances: financesRes.data ?? [],
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function statusLabel(s: string) {
  const map: Record<string, string> = { trial: 'Trial', active: 'Ativo', expired: 'Expirado', cancelled: 'Cancelado' }
  return map[s] ?? s
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    trial: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  return map[s] ?? 'bg-gray-100 text-gray-500'
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: users, isLoading, error } = useAdminUsers()
  const { data: feedbacks } = useAdminFeedbacks()

  const [tab, setTab] = useState<Tab>('users')
  const [search, setSearch] = useState('')

  // User detail panel
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', business_name: '', phone: '' })

  const { data: userDetails, isLoading: detailsLoading } = useUserDetails(selectedUser?.id ?? null)

  // Notification modal
  const [notifTarget, setNotifTarget] = useState<Profile | null>(null)
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState<'push' | 'email' | 'whatsapp'>('push')

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{ type: 'suspend' | 'delete'; user: Profile } | null>(null)

  // Save profile mutation
  const saveProfile = useMutation({
    mutationFn: async (data: { id: string; full_name: string; business_name: string; phone: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name || null,
          business_name: data.business_name || null,
          phone: data.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setEditMode(false)
      // Update selectedUser locally too
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          full_name: editForm.full_name || null,
          business_name: editForm.business_name || null,
          phone: editForm.phone || null,
        })
      }
      toast('Perfil atualizado com sucesso!')
    },
    onError: (err) => toast(`Erro ao salvar: ${err instanceof Error ? err.message : 'verifique se rodou o SQL de admin no Supabase'}`),
  })

  // Suspend user (set a flag in profile)
  const suspendUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: true, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setConfirmAction(null)
      toast('Usuario suspenso com sucesso')
    },
    onError: () => toast('Erro ao suspender usuario'),
  })

  // Reactivate user
  const reactivateUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: false, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast('Usuario reativado com sucesso')
    },
    onError: () => toast('Erro ao reativar usuario'),
  })

  // Delete user profile (soft delete - removes profile data)
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setSelectedUser(null)
      setConfirmAction(null)
      toast('Perfil do usuario removido')
    },
    onError: () => toast('Erro ao remover usuario'),
  })

  // Mark feedback as read
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feedback').update({ read: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'feedbacks'] }),
  })

  // Derived
  const enriched = useMemo(
    () => (users ?? []).map((u) => ({ ...u, status: 'trial' as const })),
    [users],
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return enriched
    const q = search.toLowerCase()
    return enriched.filter(
      (u) =>
        (u.full_name ?? '').toLowerCase().includes(q) ||
        (u.business_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q),
    )
  }, [enriched, search])

  const total = enriched.length
  const trialCount = enriched.filter((u) => u.status === 'trial').length
  const unreadFeedbacks = (feedbacks ?? []).filter((f) => !f.read).length

  // Handlers
  function openUser(u: Profile) {
    setSelectedUser(u)
    setEditForm({
      full_name: u.full_name || '',
      business_name: u.business_name || '',
      phone: u.phone || '',
    })
    setEditMode(false)
  }

  function handleSaveProfile() {
    if (!selectedUser) return
    saveProfile.mutate({
      id: selectedUser.id,
      ...editForm,
    })
  }

  // ---------- Loading / Error ----------
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-900 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <Shield size={32} className="text-red-400" />
        <p className="text-[13px] font-medium text-gray-700">Acesso negado ou erro ao carregar dados</p>
        <p className="text-[11px] text-gray-400">Somente administradores podem acessar este painel.</p>
      </div>
    )
  }

  // ---------- User Detail Panel ----------
  if (selectedUser) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 md:px-6">
        {/* Back */}
        <button
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-1 text-xs font-medium text-brand-900 hover:underline"
        >
          <ChevronLeft size={14} /> Voltar para lista
        </button>

        {/* Profile Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-gray-800">
                {selectedUser.business_name || selectedUser.full_name || 'Usuario'}
              </h3>
              <p className="text-[11px] text-gray-400">{selectedUser.email}</p>
              <p className="text-[11px] text-gray-400">ID: {selectedUser.id}</p>
              <p className="mt-1 text-[11px] text-gray-400">Cadastro: {fmtDate(selectedUser.created_at)}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor('trial')}`}>
              {statusLabel('trial')}
            </span>
          </div>

          {/* Edit form */}
          {editMode ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">Nome completo</label>
                <input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">Nome do negocio</label>
                <input
                  value={editForm.business_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, business_name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">Telefone</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-900"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saveProfile.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-900 px-4 py-2 text-xs font-medium text-white"
                >
                  <Save size={13} /> {saveProfile.isPending ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
              >
                <Save size={13} /> Editar perfil
              </button>
              <button
                onClick={() => {
                  setNotifTarget(selectedUser)
                  setNotifMessage('')
                }}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
              >
                <Bell size={13} /> Notificar
              </button>
              <a
                href={`mailto:${selectedUser.email ?? ''}`}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
              >
                <Mail size={13} /> Email
              </a>
              {selectedUser.phone && (
                <a
                  href={`https://wa.me/55${selectedUser.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Phone size={13} /> WhatsApp
                </a>
              )}
              <div className="w-full border-t border-gray-100 my-1" />
              {(selectedUser as Profile & { is_suspended?: boolean }).is_suspended ? (
                <button
                  onClick={() => reactivateUser.mutate(selectedUser.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[11px] font-medium text-green-700 hover:bg-green-100"
                >
                  <UserCheck size={13} /> Reativar usuario
                </button>
              ) : (
                <button
                  onClick={() => setConfirmAction({ type: 'suspend', user: selectedUser })}
                  className="flex items-center gap-1.5 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-[11px] font-medium text-yellow-700 hover:bg-yellow-100"
                >
                  <Shield size={13} /> Suspender acesso
                </button>
              )}
              <button
                onClick={() => setConfirmAction({ type: 'delete', user: selectedUser })}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600 hover:bg-red-100"
              >
                <X size={13} /> Excluir perfil
              </button>
            </div>
          )}
        </div>

        {/* Details loading */}
        {detailsLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-900 border-t-transparent" />
          </div>
        ) : userDetails ? (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Services */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase size={14} className="text-brand-900" />
                <h4 className="text-[12px] font-bold uppercase text-gray-400">
                  Servicos ({userDetails.services.length})
                </h4>
              </div>
              {userDetails.services.length === 0 ? (
                <p className="text-[11px] text-gray-400">Nenhum servico cadastrado</p>
              ) : (
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  {userDetails.services.map((s: Record<string, unknown>) => (
                    <div key={s.id as string} className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                      <span className="font-medium text-gray-700">{s.name as string}</span>
                      <span className="text-gray-500">{fmtCurrency(Number(s.price) || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clients */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-brand-900" />
                <h4 className="text-[12px] font-bold uppercase text-gray-400">
                  Clientes ({userDetails.clients.length})
                </h4>
              </div>
              {userDetails.clients.length === 0 ? (
                <p className="text-[11px] text-gray-400">Nenhum cliente cadastrado</p>
              ) : (
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  {userDetails.clients.map((c: Record<string, unknown>) => (
                    <div key={c.id as string} className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                      <span className="font-medium text-gray-700">{c.name as string}</span>
                      <span className="text-gray-400">{c.phone as string || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Appointments */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-brand-900" />
                <h4 className="text-[12px] font-bold uppercase text-gray-400">
                  Agendamentos recentes ({userDetails.appointments.length})
                </h4>
              </div>
              {userDetails.appointments.length === 0 ? (
                <p className="text-[11px] text-gray-400">Nenhum agendamento</p>
              ) : (
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  {userDetails.appointments.map((a: Record<string, unknown>) => (
                    <div key={a.id as string} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">{a.service_name as string}</span>
                        <span className="ml-2 text-gray-400">{fmtDate(a.scheduled_date as string)}</span>
                      </div>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                        a.status === 'completed' ? 'bg-green-100 text-green-700' :
                        a.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        a.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{a.status as string}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Finances */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={14} className="text-brand-900" />
                <h4 className="text-[12px] font-bold uppercase text-gray-400">
                  Financeiro recente ({userDetails.finances.length})
                </h4>
              </div>
              {userDetails.finances.length === 0 ? (
                <p className="text-[11px] text-gray-400">Nenhum lancamento</p>
              ) : (
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  {userDetails.finances.map((f: Record<string, unknown>) => (
                    <div key={f.id as string} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">{f.description as string}</span>
                        <span className="ml-2 text-gray-400">{fmtDate(f.entry_date as string)}</span>
                      </div>
                      <span className={f.type === 'income' ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>
                        {f.type === 'income' ? '+' : '-'}{fmtCurrency(Number(f.amount) || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Notification Modal */}
        {notifTarget && (
          <NotificationModal
            target={notifTarget}
            message={notifMessage}
            type={notifType}
            onTypeChange={setNotifType}
            onMessageChange={setNotifMessage}
            onClose={() => setNotifTarget(null)}
            onSend={() => {
              setNotifTarget(null)
              toast('Funcionalidade em desenvolvimento')
            }}
          />
        )}

        {/* Confirm Action Modal */}
        {confirmAction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
              <h3 className="text-[14px] font-semibold text-gray-800">
                {confirmAction.type === 'suspend' ? 'Suspender usuario?' : 'Excluir perfil?'}
              </h3>
              <p className="mt-2 text-[12px] text-gray-500">
                {confirmAction.type === 'suspend'
                  ? `O usuario "${confirmAction.user.business_name || confirmAction.user.full_name}" tera o acesso suspenso. Voce pode reativar depois.`
                  : `O perfil de "${confirmAction.user.business_name || confirmAction.user.full_name}" sera removido. Esta acao nao pode ser desfeita.`}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (confirmAction.type === 'suspend') {
                      suspendUser.mutate(confirmAction.user.id)
                    } else {
                      deleteUser.mutate(confirmAction.user.id)
                    }
                  }}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold text-white ${
                    confirmAction.type === 'suspend' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                >
                  {confirmAction.type === 'suspend' ? 'Suspender' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---------- Main List View ----------
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-3 py-4 md:px-6 md:py-6">
      {/* Header */}
      <div>
        <h2 className="text-[15px] font-bold text-brand-900 md:text-lg">Painel Administrativo</h2>
        <p className="text-[11px] text-gray-400">{total} usuario{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab('users')}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            tab === 'users' ? 'bg-white text-brand-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={14} className="mr-1.5 inline" /> Usuarios
        </button>
        <button
          onClick={() => setTab('feedbacks')}
          className={`relative flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            tab === 'feedbacks' ? 'bg-white text-brand-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare size={14} className="mr-1.5 inline" /> Feedbacks
          {unreadFeedbacks > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unreadFeedbacks}
            </span>
          )}
        </button>
      </div>

      {tab === 'users' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Total', value: total, icon: Users, color: 'text-brand-900' },
              { label: 'Ativos', value: 0, icon: UserCheck, color: 'text-green-600' },
              { label: 'Trial', value: trialCount, icon: Clock, color: 'text-yellow-600' },
              { label: 'Pagantes', value: 0, icon: Crown, color: 'text-purple-600' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-gray-200 bg-white p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <kpi.icon size={16} className={kpi.color} />
                  <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{kpi.label}</span>
                </div>
                <div className={`mt-1 text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-8 pr-3 text-xs outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
            />
          </div>

          {/* Users Table (Desktop) */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                  <th className="px-4 py-3 font-medium text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[11px] text-gray-400">
                      Nenhum usuario encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/50"
                      onClick={() => openUser(u)}
                    >
                      <td className="px-4 py-3 font-medium text-[13px] text-gray-800">
                        {u.business_name || u.full_name || '—'}
                        {u.full_name && u.business_name && (
                          <span className="ml-1.5 text-[10px] text-gray-400">({u.full_name})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(u.status)}`}>
                          {statusLabel(u.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{fmtDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); openUser(u) }}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-brand-900"
                            title="Ver detalhes"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setNotifTarget(u); setNotifMessage('') }}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-brand-900"
                            title="Notificar"
                          >
                            <Bell size={13} />
                          </button>
                          <a
                            href={`mailto:${u.email ?? ''}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-brand-900"
                            title="Email"
                          >
                            <Mail size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Users Cards (Mobile) */}
          <div className="space-y-2 md:hidden">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-[11px] text-gray-400">
                Nenhum usuario encontrado
              </div>
            ) : (
              filtered.map((u) => (
                <div
                  key={u.id}
                  onClick={() => openUser(u)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white p-3 active:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-gray-800">
                        {u.business_name || u.full_name || '—'}
                      </p>
                      <p className="truncate text-[11px] text-gray-400">{u.email || '—'}</p>
                    </div>
                    <span className={`ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(u.status)}`}>
                      {statusLabel(u.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Cadastro: {fmtDate(u.created_at)}</span>
                    <Eye size={12} className="text-brand-900" />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Feedbacks Tab */
        <div className="space-y-2">
          {(feedbacks ?? []).length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-[11px] text-gray-400">
              Nenhum feedback recebido ainda
            </div>
          ) : (
            (feedbacks ?? []).map((f) => (
              <div
                key={f.id}
                className={`rounded-xl border bg-white p-4 ${f.read ? 'border-gray-100' : 'border-brand-200 bg-brand-50/30'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        f.type === 'bug' ? 'bg-red-100 text-red-700' :
                        f.type === 'sugestao' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {f.type === 'sugestao' ? 'Sugestao' : f.type === 'bug' ? 'Bug' : 'Outro'}
                      </span>
                      {!f.read && (
                        <span className="rounded-full bg-brand-900 px-1.5 py-0.5 text-[9px] font-bold text-white">Novo</span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] font-medium text-gray-700">
                      {f.user_name || 'Usuario'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {f.user_email} {f.user_phone ? `| ${f.user_phone}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400">{fmtDate(f.created_at)}</span>
                </div>

                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-[12px] leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {f.message}
                </div>

                <div className="mt-2 flex gap-2">
                  {!f.read && (
                    <button
                      onClick={() => markRead.mutate(f.id)}
                      className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <CheckCircle size={11} /> Marcar como lido
                    </button>
                  )}
                  {f.user_email && (
                    <a
                      href={`mailto:${f.user_email}`}
                      className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <Mail size={11} /> Responder
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Notification Modal */}
      {notifTarget && (
        <NotificationModal
          target={notifTarget}
          message={notifMessage}
          type={notifType}
          onTypeChange={setNotifType}
          onMessageChange={setNotifMessage}
          onClose={() => setNotifTarget(null)}
          onSend={() => {
            setNotifTarget(null)
            toast('Funcionalidade em desenvolvimento')
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notification Modal Component
// ---------------------------------------------------------------------------
function NotificationModal({
  target,
  message,
  type,
  onTypeChange,
  onMessageChange,
  onClose,
  onSend,
}: {
  target: Profile
  message: string
  type: 'push' | 'email' | 'whatsapp'
  onTypeChange: (t: 'push' | 'email' | 'whatsapp') => void
  onMessageChange: (m: string) => void
  onClose: () => void
  onSend: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-gray-800">Enviar Notificacao</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          Para: <span className="font-medium text-gray-600">{target.full_name || target.business_name || 'Usuario'}</span>
        </p>
        <div className="mt-3 flex gap-2">
          {(['push', 'email', 'whatsapp'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTypeChange(t)}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium ${
                type === t ? 'border-brand-900 bg-brand-900 text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t === 'push' ? 'Push' : t === 'email' ? 'Email' : 'WhatsApp'}
            </button>
          ))}
        </div>
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Escreva a mensagem..."
          rows={4}
          className="mt-3 w-full rounded-lg border border-gray-200 p-3 text-xs outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
        />
        <button
          onClick={onSend}
          className="mt-3 w-full rounded-lg bg-brand-900 py-2.5 text-xs font-semibold text-white hover:bg-brand-800"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
