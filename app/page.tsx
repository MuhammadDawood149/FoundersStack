'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your name.')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() }
        }
      })
      if (error) { setError(error.message); setLoading(false); return }
      await supabase.auth.signInWithPassword({ email, password })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push('/extract')
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-8 w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">FS</span>
          </div>
          <span className="text-zinc-900 font-semibold text-base">Founders Stack</span>
        </div>

        {/* Toggle tabs */}
        <div className="flex bg-zinc-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('signup'); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signup'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-600'
              }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setMode('signin'); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signin'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-600'
              }`}
          >
            Sign In
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-zinc-500 text-xs font-medium mb-1 block uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Paul or Sam"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-400 transition"
              />
            </div>
          )}
          <div>
            <label className="text-zinc-500 text-xs font-medium mb-1 block uppercase tracking-wider">Email</label>
            <input
              type="email"
              placeholder="you@startup.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-400 transition"
            />
          </div>
          <div>
            <label className="text-zinc-500 text-xs font-medium mb-1 block uppercase tracking-wider">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-400 transition"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-xs mt-3">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-5 bg-zinc-900 text-white font-semibold py-3 rounded-xl hover:bg-zinc-700 disabled:opacity-50 transition text-sm"
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}