import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Wrong email or password.',
  'Email not confirmed': 'Check your email for a confirmation link.',
  'User already registered': 'An account with this email already exists. Try signing in.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  'Unable to validate email address: invalid format': 'Please enter a valid email address.',
  'Email rate limit exceeded': 'Too many attempts. Try again in a few minutes.',
  'For security purposes, you can only request this after': 'Too many attempts. Try again in a few minutes.',
}

function friendlyError(msg: string): string {
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return friendly
  }
  return msg
}

export default function LoginPage() {
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { document.title = 'Studs — Sign In' }, [])

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) navigate('/', { replace: true })
      })
    }
  }, [navigate])

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'reset') {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (resetErr) setError(friendlyError(resetErr.message))
      else setSuccess('Password reset link sent. Check your email.')
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const err = await signUp(email, password)
      if (err) setError(friendlyError(err.message))
      else setSuccess('Account created! Check your email for a confirmation link.')
    } else {
      const err = await signIn(email, password)
      if (err) setError(friendlyError(err.message))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-black text-center mb-1 tracking-tight text-[var(--text)]">STUDS</h1>
        <p className="text-sm text-[var(--text-muted)] text-center mb-10">AI Earring Generator</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            required
            className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--text)] text-sm transition"
          />
          {mode !== 'reset' && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--text)] text-sm transition"
            />
          )}
          {mode === 'signup' && password.length > 0 && password.length < 6 && (
            <p className="text-xs text-[var(--text-muted)] ml-1">At least 6 characters</p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 px-4 py-3">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--accent)] text-[var(--accent-text)] font-bold hover:bg-[var(--accent-hover)] transition disabled:opacity-50 text-sm uppercase tracking-wider"
          >
            {loading ? 'Please wait...' : mode === 'reset' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-2 mt-4">
          {mode === 'signin' && (
            <>
              <button onClick={() => { setMode('reset'); setError(''); setSuccess('') }} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
                Forgot password?
              </button>
              <button onClick={() => { setMode('signup'); setError(''); setSuccess('') }} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
                Don't have an account? Sign up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => { setMode('signin'); setError(''); setSuccess('') }} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
              Already have an account? Sign in
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => { setMode('signin'); setError(''); setSuccess('') }} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
