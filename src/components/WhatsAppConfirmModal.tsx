'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

interface WhatsAppConfirmModalProps {
  clientName: string
  clientPhone: string | null
  serviceName: string
  date: string
  time: string
  businessName: string
  businessAddress: string | null
  onClose: () => void
}

function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, '')
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function WhatsAppConfirmModal({
  clientName,
  clientPhone,
  serviceName,
  date,
  time,
  businessName,
  businessAddress,
  onClose,
}: WhatsAppConfirmModalProps) {
  const defaultMessage = `Oi, ${clientName}! Aqui é ${businessName} 😊
Passando pra confirmar sua reserva:

✅ Serviço: ${serviceName}
📅 Data: ${formatDateBR(date)}
🕐 Horário: ${time}${businessAddress ? `\n📍 Endereço: ${businessAddress}` : ''}

Qualquer dúvida, é só chamar!`

  const [message, setMessage] = useState(defaultMessage)

  const handleSend = () => {
    if (!clientPhone) return
    const phone = formatPhoneForWhatsApp(clientPhone)
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/55${phone}?text=${encoded}`, '_blank')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-[15px] font-semibold">Enviar confirmação para o cliente?</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="p-5">
          {!clientPhone ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-[13px] font-medium text-amber-800">
                Este cliente não tem WhatsApp cadastrado.
              </p>
              <p className="mt-1 text-[11px] text-amber-600">
                Adicione o telefone no perfil do cliente.
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-[13px] leading-relaxed outline-none focus:border-brand-900"
              />
              <p className="mt-2 text-[10px] text-gray-400">
                Você pode editar a mensagem antes de enviar.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-xs font-medium text-gray-600"
          >
            Fechar
          </button>
          {clientPhone && (
            <button
              onClick={handleSend}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-xs font-medium text-white hover:bg-green-700"
            >
              <MessageCircle size={14} />
              Enviar pelo WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
