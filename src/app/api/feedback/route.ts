import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userName, userEmail, userPhone, type, message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    const typeLabel =
      type === 'sugestao'
        ? 'Sugestao de melhoria'
        : type === 'bug'
          ? 'Relato de bug'
          : 'Outro'

    // Build email content
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
              <td style="padding: 8px 0; font-weight: 600;">${userName || 'Nao informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0;">${userEmail || 'Nao informado'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Telefone:</td>
              <td style="padding: 8px 0;">${userPhone || 'Nao informado'}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <h3 style="font-size: 14px; color: #374151; margin: 0 0 8px;">Mensagem:</h3>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1f2937; white-space: pre-wrap;">${message}</div>
          <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
            Enviado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </p>
        </div>
      </div>
    `

    // Check if SMTP credentials are configured
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })

      await transporter.sendMail({
        from: `"Meu Socio Feedback" <${smtpUser}>`,
        to: 'meusocio.apps@gmail.com',
        subject: `[Feedback] ${typeLabel} - ${userName || 'Usuario'}`,
        html: htmlBody,
      })

      return NextResponse.json({ sent: true })
    }

    // If no SMTP configured, just acknowledge (data is saved in DB by the client)
    return NextResponse.json({
      sent: false,
      message: 'SMTP nao configurado. Feedback salvo no banco.',
    })
  } catch (err) {
    console.error('Feedback email error:', err)
    return NextResponse.json(
      { error: 'Erro ao enviar email' },
      { status: 500 },
    )
  }
}
