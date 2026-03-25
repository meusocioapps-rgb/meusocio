import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'meusocio.apps@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const { type, to_email, to_phone, to_name, subject, message } = body as {
      type: 'email' | 'whatsapp'
      to_email: string
      to_phone?: string
      to_name: string
      subject?: string
      message: string
    }

    if (!type || !message?.trim()) {
      return NextResponse.json(
        { error: 'Tipo e mensagem sao obrigatorios' },
        { status: 400 },
      )
    }

    // --- EMAIL via Resend ---
    if (type === 'email') {
      if (!to_email) {
        return NextResponse.json(
          { error: 'Email do destinatario e obrigatorio' },
          { status: 400 },
        )
      }

      const resendKey = process.env.RESEND_API_KEY
      if (!resendKey) {
        return NextResponse.json(
          { error: 'RESEND_API_KEY nao configurada' },
          { status: 500 },
        )
      }

      const emailSubject = subject || `Mensagem do Meu Socio para ${to_name}`

      const htmlBody = `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0D2B1E; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">Meu Socio</h2>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 14px; color: #374151;">Ola, <strong>${to_name}</strong>!</p>
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1f2937; white-space: pre-wrap;">${message}</div>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
              Enviado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
          </div>
        </div>
      `

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'Meu Socio <noreply@meusocio.app>',
          to: [to_email],
          subject: emailSubject,
          html: htmlBody,
        }),
      })

      if (!resendRes.ok) {
        const errData = await resendRes.json().catch(() => ({}))
        console.error('Resend error:', errData)
        return NextResponse.json(
          { error: 'Erro ao enviar email via Resend' },
          { status: 500 },
        )
      }

      const data = await resendRes.json()
      return NextResponse.json({ sent: true, id: data.id })
    }

    // --- WHATSAPP via wa.me URL ---
    if (type === 'whatsapp') {
      if (!to_phone) {
        return NextResponse.json(
          { error: 'Telefone do destinatario e obrigatorio' },
          { status: 400 },
        )
      }

      // Remove non-numeric characters from phone
      const cleanPhone = to_phone.replace(/\D/g, '')
      const encodedMessage = encodeURIComponent(message)
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`

      return NextResponse.json({ sent: true, whatsapp_url: waUrl })
    }

    return NextResponse.json(
      { error: 'Tipo invalido. Use "email" ou "whatsapp".' },
      { status: 400 },
    )
  } catch (err) {
    console.error('Admin notify error:', err)
    return NextResponse.json(
      { error: 'Erro interno ao enviar notificacao' },
      { status: 500 },
    )
  }
}
