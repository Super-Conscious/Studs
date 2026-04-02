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
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle auth callback (email confirmation redirect)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) navigate('/', { replace: true })
      })
    }
  }, [navigate])

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (isSignUp) {
      const err = await signUp(email, password)
      if (err) {
        setError(friendlyError(err.message))
      } else {
        setSuccess('Account created! Check your email for a confirmation link.')
      }
    } else {
      const err = await signIn(email, password)
      if (err) {
        setError(friendlyError(err.message))
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2 tracking-tight">Studs</h1>
        <p className="text-sm text-[var(--text-muted)] text-center mb-8">AI Earring Generator</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              required
              className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition"
            />
            {isSignUp && password.length > 0 && password.length < 6 && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5 ml-1">At least 6 characters</p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <span className="text-red-400 text-sm shrink-0 mt-0.5">!</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
              <span className="text-green-400 text-sm shrink-0 mt-0.5">&#10003;</span>
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
          className="w-full mt-4 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}
