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

        try {
            if (mode === 'signup') {
                if (!fullName.trim()) {
                    setError('Please enter your name.')
                    setLoading(false)
                    return
                }

                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName.trim() }
                    }
                })

                if (signUpError) { setError(signUpError.message); setLoading(false); return }

                // If session returned directly (email confirm is off), go straight in
                if (data.session) {
                    router.push('/extract')
                    return
                }

                // Fallback: try signing in manually
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
                if (signInError) { setError(signInError.message); setLoading(false); return }
                if (signInData.session) { router.push('/extract'); return }

                setError('Account created but could not sign in. Please sign in manually.')
                setMode('signin')

            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
                if (signInError) { setError(signInError.message); setLoading(false); return }
                if (data.session) { router.push('/extract'); return }
                setError('Could not sign in. Please try again.')
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong.')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black font-bold text-sm">FS</span>
                    </div>
                    <span className="text-white font-semibold text-lg">Founders Stack</span>
                </div>

                {/* Title */}
                <h1 className="text-white text-2xl font-bold mb-1">
                    {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="text-gray-400 text-sm mb-6">
                    {mode === 'signin'
                        ? 'Sign in to your Founders Stack account'
                        : 'Start managing your startup actions'}
                </p>

                {/* Fields */}
                <div className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Paul or Sam"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Email</label>
                        <input
                            type="email"
                            placeholder="you@startup.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <p className="text-red-400 text-sm mt-3">{error}</p>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full mt-6 bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
                >
                    {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>

                {/* Toggle */}
                <p className="text-gray-500 text-sm text-center mt-4">
                    {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
                        className="text-white hover:underline"
                    >
                        {mode === 'signin' ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    )
}