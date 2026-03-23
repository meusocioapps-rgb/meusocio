'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/Toast'
import { Download, FileSpreadsheet, Users, Calendar, DollarSign, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const supabase = createClient()

type ExportType = 'clients' | 'appointments' | 'finances'

interface ExportOption {
  type: ExportType
  label: string
  description: string
  icon: React.ReactNode
  color: string
  bg: string
}

const exportOptions: ExportOption[] = [
  {
    type: 'clients',
    label: 'Clientes',
    description: 'Nome, telefone, email, Instagram, total de visitas, status',
    icon: <Users size={18} />,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    type: 'appointments',
    label: 'Atendimentos',
    description: 'Data, horário, cliente, serviço, valor, status',
    icon: <Calendar size={18} />,
    color: 'text-brand-900',
    bg: 'bg-brand-100',
  },
  {
    type: 'finances',
    label: 'Financeiro',
    description: 'Receitas e despesas com data, descrição, valor, status',
    icon: <DollarSign size={18} />,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
]

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const bom = '\uFEFF' // UTF-8 BOM for Excel
  const csv = bom + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ExportPage() {
  const [loading, setLoading] = useState<ExportType | null>(null)

  const handleExport = async (type: ExportType) => {
    setLoading(type)
    try {
      const today = new Date().toISOString().slice(0, 10)

      if (type === 'clients') {
        const { data, error } = await supabase
          .from('clients_with_status')
          .select('*')
          .order('name')
        if (error) throw error

        const headers = [
          'Código', 'Nome', 'Telefone', 'Email', 'Instagram',
          'Nascimento', 'Fonte', 'Total Visitas', 'Total Gasto',
          'Última Visita', 'Recorrente', 'Reativar', 'Status', 'Observações',
        ]
        const rows = (data ?? []).map((c) => [
          escapeCsv(c.code),
          escapeCsv(c.name),
          escapeCsv(c.phone),
          escapeCsv(c.email),
          escapeCsv(c.instagram),
          escapeCsv(c.birth_date),
          escapeCsv(c.source),
          escapeCsv(c.total_visits),
          escapeCsv(c.total_spent),
          escapeCsv(c.last_visit),
          c.is_recurrent ? 'Sim' : 'Não',
          c.needs_reactivation ? 'Sim' : 'Não',
          escapeCsv(c.activity_status),
          escapeCsv(c.notes),
        ])

        downloadCsv(`clientes_${today}.csv`, headers, rows)
        toast(`${rows.length} clientes exportados!`)
      }

      if (type === 'appointments') {
        const { data, error } = await supabase
          .from('appointments_with_client')
          .select('*')
          .order('scheduled_date', { ascending: false })
          .limit(5000)
        if (error) throw error

        const headers = [
          'Data', 'Horário', 'Cliente', 'Telefone', 'Serviço',
          'Valor Estimado', 'Valor Final', 'Status', 'Retorno Gratuito',
          'Upsell', 'Valor Upsell', 'Observações',
        ]
        const statusMap: Record<string, string> = {
          scheduled: 'Agendado',
          confirmed: 'Confirmado',
          completed: 'Realizado',
          rescheduled: 'Remarcado',
          no_show: 'Faltou',
          cancelled: 'Cancelado',
        }
        const rows = (data ?? []).map((a) => [
          escapeCsv(a.scheduled_date),
          escapeCsv(a.scheduled_time?.slice(0, 5)),
          escapeCsv(a.client_name),
          escapeCsv(a.client_phone),
          escapeCsv(a.service_name),
          escapeCsv(a.estimated_value),
          escapeCsv(a.final_value),
          escapeCsv(statusMap[a.status] || a.status),
          a.is_free_return ? 'Sim' : 'Não',
          escapeCsv(a.upsell_service),
          escapeCsv(a.upsell_value),
          escapeCsv(a.notes),
        ])

        downloadCsv(`atendimentos_${today}.csv`, headers, rows)
        toast(`${rows.length} atendimentos exportados!`)
      }

      if (type === 'finances') {
        const { data, error } = await supabase
          .from('financial_entries')
          .select('*')
          .order('entry_date', { ascending: false })
          .limit(5000)
        if (error) throw error

        const headers = [
          'Data', 'Tipo', 'Descrição', 'Valor', 'Cliente',
          'Serviço', 'Status', 'Categoria',
        ]
        const rows = (data ?? []).map((e) => [
          escapeCsv(e.entry_date),
          e.type === 'income' ? 'Receita' : 'Despesa',
          escapeCsv(e.description),
          escapeCsv(e.amount),
          escapeCsv(e.client_name),
          escapeCsv(e.service_name),
          e.status === 'paid' ? 'Pago' : e.status === 'pending' ? 'Pendente' : 'Parcial',
          escapeCsv(e.expense_category),
        ])

        downloadCsv(`financeiro_${today}.csv`, headers, rows)
        toast(`${rows.length} registros exportados!`)
      }
    } catch {
      toast('Erro ao exportar dados')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-2 text-4xl">📤</div>
        <h2 className="text-lg font-semibold">Exportar Dados</h2>
        <p className="mt-1 text-[13px] text-gray-400">
          Baixe seus dados em formato CSV (compatível com Excel)
        </p>
      </div>

      {/* Export cards */}
      <div className="space-y-3">
        {exportOptions.map((opt) => (
          <div
            key={opt.type}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                  opt.bg,
                  opt.color
                )}
              >
                {opt.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold">{opt.label}</h3>
                <p className="mt-0.5 text-[11px] text-gray-400">{opt.description}</p>
              </div>
              <button
                onClick={() => handleExport(opt.type)}
                disabled={loading !== null}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium text-white disabled:opacity-50',
                  opt.type === 'clients'
                    ? 'bg-blue-600'
                    : opt.type === 'appointments'
                      ? 'bg-brand-900'
                      : 'bg-green-600'
                )}
              >
                {loading === opt.type ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download size={12} />
                    Exportar
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet size={16} className="mt-0.5 text-gray-400" />
          <div>
            <h4 className="text-[12px] font-semibold">Sobre o formato</h4>
            <ul className="mt-1 space-y-1 text-[11px] text-gray-500">
              <li>• Arquivo CSV com separador ponto-e-vírgula (;)</li>
              <li>• Compatível com Excel, Google Sheets e Numbers</li>
              <li>• Codificação UTF-8 com BOM (acentos preservados)</li>
              <li>• Limite de 5.000 registros por exportação</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
