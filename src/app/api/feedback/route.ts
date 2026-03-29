import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { createServerSupabase } from '@/lib/supabase/server'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const feedbackSchema = z.object({
  userName: z.string().max(200).optional(),
  userEmail: z.string().email().max(320).optional(),
  userPhone: z.string().max(30).optional(),
  type: z.enum(['sugestao', 'bug', 'outro']),
  message: z.string().min(1).max(5000),
})

// Simple in-memory rate limit: max 5 feedback per IP per 15 min
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const maxRequests = 5
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= maxRequests
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Muitas requisicoes. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    // Auth check — require authenticated user
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // Validate input
    const body = await req.json()
    const result = feedbackSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

    const { userName, userEmail, userPhone, type, message } = result.data

    const typeLabel =
      type === 'sugestao'
        ? 'Sugestao de melhoria'
        : type === 'bug'
          ? 'Relato de bug'
          : 'Outro'

    // Escape all user-provided data before interpolating into HTML
    const safeUserName = escapeHtml(userName || 'Nao informado')
    const safeUserEmail = escapeHtml(userEmail || 'Nao informado')
    const safeUserPhone = escapeHtml(userPhone || 'Nao informado')
    const safeMessage = escapeHtml(message)

    const htmlBody = `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0D2B1E; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">Novo Feedback - Meu Socio</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 100px;">Tipo:</td>
              <td style="padding: 8px 0; font-weight: 600;">${typeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Usuario:</td>
              <td style="padding: 8px 0; font-weight: 600;">${safeUserName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0;">${safeUserEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Telefone:</td>
              <td style="padding: 8px 0;">${safeUserPhone}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <h3 style="font-size: 14px; color: #374151; margin: 0 0 8px;">Mensagem:</h3>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1f2937; white-space: pre-wrap;">${safeMessage}</div>
          <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
            Enviado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </p>
        </div>
      </div>
    `

    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      })

      await transporter.sendMail({
        from: `"Meu Socio Feedback" <${smtpUser}>`,
        to: process.env.ADMIN_EMAIL || 'meusocio.apps@gmail.com',
        subject: `[Feedback] ${typeLabel} - ${safeUserName}`,
        html: htmlBody,
      })

      return NextResponse.json({ sent: true })
    }

    return NextResponse.json({
      sent: false,
      message: 'SMTP nao configurado. Feedback salvo no banco.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao enviar email' },
      { status: 500 },
    )
  }
}
