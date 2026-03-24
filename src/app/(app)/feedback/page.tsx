'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { toast } from '@/components/Toast'
import { Send, MessageSquare, Bug, Lightbulb } from 'lucide-react'

type FeedbackType = 'sugestao' | 'bug' | 'outro'

export default function FeedbackPage() {
  const { data: profile } = useProfile()
  const [type, setType] = useState<FeedbackType>('sugestao')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast('Escreva sua mensagem antes de enviar.')
      return
    }

    setSending(true)

    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser()

      const userName = profile?.business_name || profile?.full_name || 'Usuario'
      const userEmail = user?.email || profile?.email || 'sem email'
      const userPhone = profile?.phone || 'sem telefone'

      const typeLabel = type === 'sugestao' ? 'Sugestao de melhoria' : type === 'bug' ? 'Relato de bug' : 'Outro'

      // Save to feedback table
      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id,
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone,
          type: type,
          message: message.trim(),
        })

      if (insertError) {
        console.warn('Erro ao salvar feedback:', insertError.message)
      }

      // Send email notification via API route
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName,
            userEmail,
            userPhone,
            type,
            message: message.trim(),
          }),
        })
      } catch (emailErr) {
        console.warn('Email fallback failed:', emailErr)
      }

      setSent(true)
      setMessage('')
      toast('Feedback enviado! Obrigado pela sua contribuicao.')

      // Reset after 5 seconds
      setTimeout(() => setSent(false), 5000)
    } catch (err) {
      console.error('Erro ao enviar feedback:', err)
      toast('Erro ao enviar. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
          <MessageSquare size={28} className="text-brand-900" />
        </div>
        <h2 className="text-[17px] font-bold text-gray-900">
          Sua opiniao e muito importante!
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
          Ajude-nos a melhorar o Meu Socio. Envie sugestoes de novas funcionalidades,
          melhorias na experiencia ou reporte algum problema que encontrou.
          Cada feedback e lido pessoalmente pela nossa equipe.
        </p>
      </div>

      {sent ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mb-3 text-4xl">✅</div>
          <h3 className="text-[15px] font-semibold text-green-800">
            Feedback enviado com sucesso!
          </h3>
          <p className="mt-2 text-[12px] text-green-600">
            Agradecemos sua contribuicao. Vamos analisar e, se necessario, entraremos em contato.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white"
          >
            Enviar outro feedback
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Type selector */}
          <div className="mb-4">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Tipo de feedback
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('sugestao')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  type === 'sugestao'
                    ? 'border-brand-900 bg-brand-50 text-brand-900'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <Lightbulb size={18} />
                <span className="text-[11px] font-medium">Sugestao</span>
              </button>
              <button
                type="button"
                onClick={() => setType('bug')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  type === 'bug'
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <Bug size={18} />
                <span className="text-[11px] font-medium">Bug / Erro</span>
              </button>
              <button
                type="button"
                onClick={() => setType('outro')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  type === 'outro'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <MessageSquare size={18} />
                <span className="text-[11px] font-medium">Outro</span>
              </button>
            </div>
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Sua mensagem
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === 'sugestao'
                  ? 'Descreva sua ideia ou sugestao de melhoria...'
                  : type === 'bug'
                    ? 'Descreva o problema que encontrou, em qual tela e o que aconteceu...'
                    : 'Escreva sua mensagem...'
              }
              rows={6}
              className="w-full resize-none rounded-xl border border-gray-200 p-4 text-[13px] leading-relaxed outline-none transition-colors focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
              required
            />
          </div>

          {/* User info display */}
          <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
              Seus dados (enviados junto)
            </div>
            <div className="space-y-0.5 text-[11px] text-gray-500">
              <p><span className="font-medium text-gray-600">Nome:</span> {profile?.business_name || profile?.full_name || '—'}</p>
              <p><span className="font-medium text-gray-600">Email:</span> {profile?.email || '—'}</p>
              {profile?.phone && (
                <p><span className="font-medium text-gray-600">Telefone:</span> {profile.phone}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {sending ? (
              'Enviando...'
            ) : (
              <>
                <Send size={16} />
                Enviar feedback
              </>
            )}
          </button>

          <p className="mt-3 text-center text-[10px] text-gray-400">
            Seu feedback sera enviado diretamente para nossa equipe.
          </p>
        </form>
      )}
    </div>
  )
}
