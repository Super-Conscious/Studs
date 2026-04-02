import { useEffect, useState } from 'react'

let _show: (msg: string) => void = () => {}

export function showToast(msg: string) { _show(msg) }

export default function Toast() {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    _show = (msg: string) => {
      setMessage(msg)
      setVisible(true)
      setTimeout(() => setVisible(false), 2500)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[var(--text)] text-white px-5 py-3 text-sm font-medium shadow-lg animate-[fadeIn_0.2s_ease]">
      {message}
    </div>
  )
}
