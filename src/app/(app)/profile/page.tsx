'use client'

import { useState } from 'react'
import { useProfile, useUpdateProfile, useSubscription, useLogout } from '@/hooks/use-profile'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/Toast'
import {
  User,
  Building2,
  Phone,
  Mail,
  Instagram,
  Globe,
  MapPin,
  FileText,
  LogOut,
  Save,
  Crown,
  Calendar,
} from 'lucide-react'

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const { data: subscription } = useSubscription()
  const updateProfile = useUpdateProfile()
  const logout = useLogout()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    trade: '',
    document: '',
    phone: '',
    email: '',
    instagram: '',
    website: '',
    address: '',
  })

  const startEditing = () => {
    if (!profile) return
    setForm({
      full_name: profile.full_name || '',
      business_name: profile.business_name || '',
      trade: profile.trade || '',
      document: profile.document || '',
      phone: profile.phone || '',
      email: profile.email || '',
      instagram: profile.instagram || '',
      website: profile.website || '',
      address: profile.address || '',
    })
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: form.full_name || null,
        business_name: form.business_name,
        trade: form.trade,
        document: form.document || null,
        phone: form.phone || null,
        email: form.email || null,
        instagram: form.instagram || null,
        website: form.website || null,
        address: form.address || null,
      })
      toast('Perfil atualizado!')
      setEditing(false)
    } catch {
      toast('Erro ao salvar perfil')
    }
  }

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
    } catch {
      toast('Erro ao sair')
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">Carregando...</div>
    )
  }

  if (!profile) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        Perfil não encontrado
      </div>
    )
  }

  const planLabel: Record<string, string> = {
    free: 'Gratuito',
    starter: 'Starter',
    pro: 'Pro',
    business: 'Business',
  }

  const planColor: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    starter: 'bg-blue-100 text-blue-700',
    pro: 'bg-brand-100 text-brand-900',
    business: 'bg-purple-100 text-purple-700',
  }

  const formatDateBR = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header com avatar */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-900">
            {(profile.full_name || profile.business_name || 'U')
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {profile.full_name || profile.business_name || 'Sem nome'}
            </h2>
            {profile.business_name && profile.full_name && (
              <p className="text-[13px] text-gray-500">{profile.business_name}</p>
            )}
            {profile.trade && (
              <p className="text-[11px] text-gray-400">{profile.trade}</p>
            )}
          </div>
          {!editing && (
            <button
              onClick={startEditing}
              className="rounded-lg border border-brand-900 px-3 py-1.5 text-[11px] font-medium text-brand-900"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Plano */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <Crown size={16} className="text-brand-900" />
          <h3 className="text-[13px] font-semibold">Seu Plano</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  planColor[subscription?.plan || 'free'] || planColor.free
                }`}
              >
                {planLabel[subscription?.plan || 'free'] || 'Gratuito'}
              </span>
              {subscription?.status === 'trialing' && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                  Trial
                </span>
              )}
            </div>
            {subscription?.trial_ends_at && subscription.status === 'trialing' && (
              <p className="mt-1.5 text-[11px] text-gray-400">
                Trial termina em {formatDateBR(subscription.trial_ends_at)}
              </p>
            )}
            {subscription?.current_period_end && subscription.status === 'active' && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
                <Calendar size={10} />
                Renova em {formatDateBR(subscription.current_period_end)}
              </p>
            )}
          </div>
          <button className="rounded-lg bg-brand-900 px-4 py-2 text-[11px] font-medium text-white">
            Upgrade
          </button>
        </div>
      </div>

      {/* Dados do negócio — Modo visualização */}
      {!editing && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h3 className="text-[13px] font-semibold">Dados do Negócio</h3>
          </div>
          <div className="divide-y divide-gray-50">
            <InfoRow icon={<User size={14} />} label="Nome completo" value={profile.full_name} />
            <InfoRow icon={<Building2 size={14} />} label="Nome do negócio" value={profile.business_name} />
            <InfoRow icon={<FileText size={14} />} label="Profissão/Ramo" value={profile.trade} />
            <InfoRow icon={<FileText size={14} />} label="CPF/CNPJ" value={profile.document} />
            <InfoRow icon={<Phone size={14} />} label="Telefone" value={profile.phone} />
            <InfoRow icon={<Mail size={14} />} label="E-mail" value={profile.email} />
            <InfoRow icon={<Instagram size={14} />} label="Instagram" value={profile.instagram} />
            <InfoRow icon={<Globe size={14} />} label="Website" value={profile.website} />
            <InfoRow icon={<MapPin size={14} />} label="Endereço" value={profile.address} />
          </div>
        </div>
      )}

      {/* Dados do negócio — Modo edição */}
      {editing && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h3 className="text-[13px] font-semibold">Editar Dados</h3>
          </div>
          <div className="space-y-3 p-5">
            <FormField
              label="Nome completo"
              value={form.full_name}
              onChange={(v) => setForm({ ...form, full_name: v })}
              placeholder="Seu nome completo"
            />
            <FormField
              label="Nome do negócio"
              value={form.business_name}
              onChange={(v) => setForm({ ...form, business_name: v })}
              placeholder="Ex: Studio Ana Makeup"
            />
            <FormField
              label="Profissão / Ramo"
              value={form.trade}
              onChange={(v) => setForm({ ...form, trade: v })}
              placeholder="Ex: Maquiadora, Personal Trainer..."
            />
            <FormField
              label="CPF / CNPJ"
              value={form.document}
              onChange={(v) => setForm({ ...form, document: v })}
              placeholder="000.000.000-00"
            />
            <FormField
              label="Telefone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="(11) 99999-9999"
            />
            <FormField
              label="E-mail"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="seu@email.com"
              type="email"
            />
            <FormField
              label="Instagram"
              value={form.instagram}
              onChange={(v) => setForm({ ...form, instagram: v })}
              placeholder="@seu_perfil"
            />
            <FormField
              label="Website"
              value={form.website}
              onChange={(v) => setForm({ ...form, website: v })}
              placeholder="https://seusite.com"
            />
            <FormField
              label="Endereço"
              value={form.address}
              onChange={(v) => setForm({ ...form, address: v })}
              placeholder="Rua, número, bairro, cidade"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-xs font-medium text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-900 py-2.5 text-xs font-medium text-white disabled:opacity-50"
              >
                <Save size={13} />
                {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sair */}
      <button
        onClick={handleLogout}
        disabled={logout.isPending}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-[13px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <LogOut size={15} />
        {logout.isPending ? 'Saindo...' : 'Sair da conta'}
      </button>

      {/* Footer info */}
      <div className="pb-4 text-center text-[10px] text-gray-400">
        Membro desde {formatDateBR(profile.created_at)}
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | null
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="text-gray-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase text-gray-400">{label}</div>
        <div className="text-[13px] font-medium">{value || '—'}</div>
      </div>
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-brand-900"
      />
    </div>
  )
}
