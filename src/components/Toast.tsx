'use client'

import { useEffect, useState } from 'react'

let showToastFn: (msg: string) => void = () => {}

export function toast(message: string) {
  showToastFn(message)
}

export function ToastProvider() {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    showToastFn = (msg) => {
      setMessage(msg)
      setVisible(true)
      setTimeout(() => setVisible(false), 2500)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-1/2 z-[999] -translate-x-1/2 whitespace-nowrap rounded-xl bg-brand-900 px-5 py-2.5 text-[13px] font-medium text-white shadow-lg">
      {message}
    </div>
  )
}
