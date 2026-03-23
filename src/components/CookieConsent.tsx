'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COOKIE_KEY = 'meusocio_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }))
    setVisible(false)
  }

  const acceptEssential = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ accepted: 'essential', date: new Date().toISOString() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] border-t border-gray-200 bg-white px-4 py-4 shadow-2xl md:flex md:items-center md:gap-4 md:px-8">
      <div className="flex-1 mb-3 md:mb-0">
        <p className="text-[12px] leading-relaxed text-gray-600">
          Utilizamos cookies essenciais para o funcionamento do sistema e cookies analiticos para
          melhorar sua experiencia. Ao continuar, voce concorda com nossa{' '}
          <Link href="/privacy" className="font-semibold text-brand-900 underline">
            Politica de Privacidade
          </Link>{' '}
          e{' '}
          <Link href="/terms" className="font-semibold text-brand-900 underline">
            Termos de Uso
          </Link>
          , em conformidade com a LGPD (Lei 13.709/2018).
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={acceptEssential}
          className="rounded-lg border border-gray-300 px-4 py-2 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Apenas essenciais
        </button>
        <button
          onClick={accept}
          className="rounded-lg bg-brand-900 px-4 py-2 text-[11px] font-medium text-white transition-colors hover:bg-brand-800"
        >
          Aceitar todos
        </button>
      </div>
    </div>
  )
}
