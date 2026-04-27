'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

const SUGGESTED = [
    { icon: 'priority_high', label: "What's urgent today?" },
    { icon: 'summarize', label: 'Summarize my week' },
    { icon: 'lightbulb', label: 'Give me growth ideas' },
    { icon: 'history', label: 'Recent action updates' },
]

const WELCOME: Message = {
    id: 'welcome',
    role: 'assistant',
    content: "Hey! I'm your Founders Stack AI. I can help you think through priorities, summarize your actions, or brainstorm next steps. What's on your mind?",
    timestamp: new Date(),
}

export default function ConsolePage() {
    const [messages, setMessages] = useState<Message[]>([WELCOME])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim(),
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/console', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text.trim(),
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                }),
            })
            const data = await res.json()
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || "I couldn't process that. Try again.",
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, assistantMsg])
        } catch {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Something went wrong. Please try again.',
                timestamp: new Date(),
            }])
        }
        setLoading(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    return (
        <div className="min-h-screen bg-[#f9f9ff] flex flex-col">
            {/* Header */}
            <header className="bg-white flex justify-between items-end px-4 pb-4 w-full h-28 border-b border-zinc-200 sticky top-0 z-30">
                <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Founders Stack</p>
                    <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 leading-tight">🤖 AI Console</h1>
                </div>
                <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold mb-1">
                    FS
                </div>
            </header>

            {/* Chat area */}
            <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-5 pb-40 space-y-4">
                <p className="text-sm text-zinc-500">Ask anything about your actions.</p>

                {/* Messages */}
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 shrink-0 bg-zinc-900 rounded-lg flex items-center justify-center">
                                <span className="text-[10px] font-black text-white">FS</span>
                            </div>
                        )}
                        <div
                            className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'assistant'
                                    ? 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-sm'
                                    : 'bg-zinc-900 text-white rounded-tr-none'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 shrink-0 bg-zinc-900 rounded-lg flex items-center justify-center">
                            <span className="text-[10px] font-black text-white">FS</span>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                            <div className="flex gap-1 items-center h-5">
                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Suggested questions — show only at start */}
                {messages.length === 1 && (
                    <div className="pt-4">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-3">Try asking...</p>
                        <div className="grid grid-cols-2 gap-2">
                            {SUGGESTED.map(s => (
                                <button
                                    key={s.label}
                                    onClick={() => sendMessage(s.label)}
                                    className="bg-white border border-zinc-200 p-3 rounded-2xl text-left hover:bg-zinc-50 hover:border-zinc-300 transition group"
                                >
                                    <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-700 text-[20px] mb-1 block transition-colors">{s.icon}</span>
                                    <span className="text-xs font-medium text-zinc-700">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </main>

            {/* Input bar — fixed above bottom nav */}
            <div className="fixed bottom-16 left-0 w-full px-4 pb-3 bg-gradient-to-t from-[#f9f9ff] to-transparent pointer-events-none">
                <div className="max-w-2xl mx-auto pointer-events-auto">
                    <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-2xl px-4 py-2 shadow-lg">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-zinc-800 placeholder-zinc-400 py-1"
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || loading}
                            className="w-9 h-9 bg-zinc-900 text-white rounded-xl flex items-center justify-center hover:bg-zinc-700 disabled:opacity-40 active:scale-95 transition shrink-0"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}