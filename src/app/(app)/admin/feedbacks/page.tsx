'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/Toast'
import { CheckCircle, Mail, Bug, Lightbulb, HelpCircle, MessageSquare } from 'lucide-react'

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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminFeedbacksPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['admin', 'all-feedbacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return []
      return data as Feedback[]
    },
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('feedback').update({ read: true }).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      toast('Marcado como lido')
    },
  })

  const unread = (feedbacks ?? []).filter((f) => !f.read).length

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-900 border-t-transparent" /></div>
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Feedbacks</h1>
        <p className="text-sm text-gray-500">{(feedbacks ?? []).length} total · {unread} nao lido{unread !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {(feedbacks ?? []).length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <MessageSquare size={32} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">Nenhum feedback recebido</p>
          </div>
        ) : (
          (feedbacks ?? []).map((f) => {
            const typeInfo = f.type === 'bug' ? { label: 'Bug', color: 'bg-red-100 text-red-700', Icon: Bug }
              : f.type === 'sugestao' ? { label: 'Sugestao', color: 'bg-blue-100 text-blue-700', Icon: Lightbulb }
              : { label: 'Outro', color: 'bg-gray-100 text-gray-600', Icon: HelpCircle }

            return (
              <div key={f.id} className={`rounded-xl border bg-white p-5 ${!f.read ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typeInfo.color}`}>
                        <typeInfo.Icon size={11} /> {typeInfo.label}
                      </span>
                      {!f.read && <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-bold text-white">Novo</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{f.user_name || 'Usuario'}</p>
                    <p className="text-xs text-gray-400">{f.user_email} {f.user_phone ? `· ${f.user_phone}` : ''}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400">{fmtDate(f.created_at)}</span>
                </div>

                <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {f.message}
                </div>

                <div className="mt-3 flex gap-2">
                  {!f.read && (
                    <button onClick={() => markRead.mutate(f.id)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      <CheckCircle size={13} /> Marcar como lido
                    </button>
                  )}
                  {f.user_email && (
                    <a href={`mailto:${f.user_email}`} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      <Mail size={13} /> Responder
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
