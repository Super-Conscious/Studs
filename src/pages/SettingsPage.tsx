import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useApiKey } from '../hooks/useApiKey'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { apiKey, saveApiKey, saving } = useApiKey(user)
  const navigate = useNavigate()
  const [keyInput, setKeyInput] = useState(apiKey)
  const [saved, setSaved] = useState(false)

  if (apiKey && !keyInput) setKeyInput(apiKey)

  const handleSave = async () => {
    const err = await saveApiKey(keyInput)
    if (!err) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <button onClick={() => navigate('/')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
            &larr; Back
          </button>
        </div>

        <section className="bg-[var(--surface)] border border-[var(--border)]  p-6 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Gemini API Key</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Enter your Google AI Studio API key. Get one at{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-[var(--text)] underline font-medium">
              aistudio.google.com
            </a>
          </p>
          <div className="flex gap-3">
            <input
              type="password"
              placeholder="AIza..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-[var(--border)]  text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--text)] text-sm font-mono transition"
            />
            <button
              onClick={handleSave}
              disabled={saving || !keyInput}
              className="px-6 py-2.5 bg-[var(--accent)] text-[var(--accent-text)] font-bold  text-sm hover:bg-[var(--accent-hover)] transition disabled:opacity-50 uppercase tracking-wider"
            >
              {saving ? '...' : saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </section>

        <section className="bg-[var(--surface)] border border-[var(--border)]  p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Account</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">{user?.email}</p>
          <button
            onClick={signOut}
            className="px-5 py-2 border border-red-300 text-red-600  text-sm font-medium hover:bg-red-50 transition"
          >
            Sign Out
          </button>
        </section>
      </div>
    </div>
  )
}
