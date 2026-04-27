'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Action = {
    id: string
    title: string
    owner?: string
    priority: 'high' | 'medium' | 'low'
    due_date?: string
    type?: string
    urgency?: string
    status: string
}

const LOADING_MESSAGES = [
    'Bribing the AI...',
    'Untangling your chaos...',
    'Teaching robots to read minds...',
    'Parsing founder brain dump...',
    'Converting chaos to clarity...',
    'Consulting the algorithm...',
    'Almost there...',
]

const GAME_EMOJIS = ['🧠', '💡', '⚡', '🚀', '🎯', '🔥']

const QUICK_TEMPLATES = [
    {
        icon: 'meeting_room',
        title: 'Meeting Recap',
        desc: 'Action items from call',
        text: 'Just had a team meeting. Need to follow up with the design team on the new mockups, Sam needs to finish the API integration by Friday, and we should schedule a demo with the client next week.',
    },
    {
        icon: 'lightbulb',
        title: 'Brainstorm',
        desc: 'Convert chaos to nodes',
        text: 'Ideas from today: maybe build a mobile app, look into reducing cloud costs, reach out to 3 potential partners, update the pitch deck with new metrics, and check if the beta users need onboarding support.',
    },
    {
        icon: 'trending_up',
        title: 'Growth Sprint',
        desc: 'Weekly priorities',
        text: 'This week: launch the referral program, follow up with the 5 leads from last week, fix the checkout bug users reported, and review Q3 numbers with the board by Thursday.',
    },
    {
        icon: 'bug_report',
        title: 'Issue Dump',
        desc: 'Bugs & blockers',
        text: 'Production issues: the login page is broken on mobile, Sam still hasn\'t fixed the payment gateway bug from Monday, need to update SSL cert before it expires Friday, and the API is timing out for large requests.',
    },
]

const priorityColors: Record<string, string> = {
    high: 'bg-red-50 text-red-700 border border-red-200',
    medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    low: 'bg-green-50 text-green-700 border border-green-200',
}

const typeConfig: Record<string, { icon: string; color: string }> = {
    task: { icon: 'check_circle', color: 'text-zinc-400' },
    'follow-up': { icon: 'reply', color: 'text-blue-500' },
    reminder: { icon: 'alarm', color: 'text-purple-500' },
}

export default function ExtractPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('text')
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])
    const [gameEmojis, setGameEmojis] = useState<{ id: number; emoji: string; x: number; caught: boolean }[]>([])
    const [score, setScore] = useState(0)
    const [recentActions, setRecentActions] = useState<Action[]>([])
    const [showResults, setShowResults] = useState(false)
    const [toast, setToast] = useState('')
    const [fileName, setFileName] = useState('')

    const imageRef = useRef<HTMLInputElement>(null)
    const whatsappRef = useRef<HTMLInputElement>(null)
    const docRef = useRef<HTMLInputElement>(null)
    const voiceRef = useRef<HTMLInputElement>(null)

    const tabs = [
        { id: 'text', label: 'Text', icon: 'edit' },
        { id: 'image', label: 'Image', icon: 'image' },
        { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
        { id: 'doc', label: 'PDF/Doc', icon: 'description' },
        { id: 'voice', label: 'Voice', icon: 'mic' },
    ]

    const startLoadingGame = () => {
        let i = 0
        const msgInterval = setInterval(() => {
            i = (i + 1) % LOADING_MESSAGES.length
            setLoadingMsg(LOADING_MESSAGES[i])
        }, 1500)
        let emojiId = 0
        const emojiInterval = setInterval(() => {
            const newEmoji = {
                id: emojiId++,
                emoji: GAME_EMOJIS[Math.floor(Math.random() * GAME_EMOJIS.length)],
                x: Math.random() * 75 + 5,
                caught: false,
            }
            setGameEmojis(prev => [...prev.slice(-6), newEmoji])
        }, 700)
        return () => { clearInterval(msgInterval); clearInterval(emojiInterval) }
    }

    const catchEmoji = (id: number) => {
        setGameEmojis(prev => prev.map(e => e.id === id ? { ...e, caught: true } : e))
        setScore(prev => prev + 1)
    }

    const showToast = (msg: string) => {
        setToast(msg)
        setTimeout(() => setToast(''), 3000)
    }

    const extractActions = async (text: string) => {
        const res = await fetch('/api/input', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: text }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        return data.actions || []
    }

    const handleExtract = async (text: string) => {
        if (!text.trim()) return
        setLoading(true)
        setScore(0)
        setGameEmojis([])
        const cleanup = startLoadingGame()
        try {
            const actions = await extractActions(text)
            setRecentActions(actions)
            setShowResults(true)
            showToast(`✓ ${actions.length} actions extracted!`)
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
        cleanup()
        setLoading(false)
    }

    const handleFileUpload = async (file: File, endpoint: string) => {
        setLoading(true)
        setScore(0)
        setGameEmojis([])
        setFileName(file.name)
        const cleanup = startLoadingGame()
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch(endpoint, { method: 'POST', body: formData })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setInput(data.text)
            const actions = await extractActions(data.text)
            setRecentActions(actions)
            setShowResults(true)
            showToast(`✓ ${actions.length} actions extracted!`)
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
        cleanup()
        setLoading(false)
    }

    const urgent = recentActions.filter(a => a.urgency === 'urgent')
    const normal = recentActions.filter(a => a.urgency !== 'urgent')

    return (
        <div className="min-h-screen bg-[#f9f9ff] pb-24">

            {/* Toast */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-[18px]">check_circle</span>
                    {toast}
                </div>
            )}

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center px-8">
                    <div className="text-7xl mb-6 animate-bounce">🧠</div>
                    <p className="text-2xl font-bold text-zinc-900 mb-2 text-center">Extracting your actions...</p>
                    <p className="text-sm text-zinc-400 mb-8 h-5 transition-all duration-500">{loadingMsg}</p>

                    {/* Progress bar */}
                    <div className="w-64 h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-10">
                        <div className="h-full bg-black rounded-full animate-progress" />
                    </div>

                    {/* Mini Game */}
                    <div className="w-full max-w-xs">
                        <p className="text-center text-xs text-zinc-400 mb-3 uppercase tracking-widest font-medium">While you wait... tap to catch!</p>
                        <div className="relative h-36 bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden">
                            {gameEmojis.map(e => !e.caught && (
                                <button
                                    key={e.id}
                                    onClick={() => catchEmoji(e.id)}
                                    className="absolute text-2xl animate-fall cursor-pointer hover:scale-125 transition-transform"
                                    style={{ left: `${e.x}%` }}
                                >
                                    {e.emoji}
                                </button>
                            ))}
                            {score > 0 && (
                                <div className="absolute top-2 right-3 bg-black text-white text-xs px-2 py-1 rounded-full font-bold">
                                    {score} 🎯
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white flex justify-between items-end px-4 pb-4 w-full h-28 border-b border-zinc-200 sticky top-0 z-30">
                <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Founders Stack</p>
                    <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 leading-tight">Dump Your Thoughts</h1>
                </div>
                <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold mb-1">
                    FS
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-5">
                <p className="text-zinc-500 text-sm mb-5">Use any format. AI handles the rest.</p>

                {/* Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-200 mb-6 no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setShowResults(false); setFileName('') }}
                            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition-all text-sm font-medium ${activeTab === tab.id
                                ? 'border-black text-black'
                                : 'border-transparent text-zinc-400 hover:text-zinc-700'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Text Tab */}
                {activeTab === 'text' && (
                    <div>
                        <div className="relative bg-white border border-zinc-200 rounded-2xl p-4 mb-4 shadow-sm">
                            <textarea
                                className="w-full h-52 border-none focus:ring-0 p-0 text-zinc-800 placeholder-zinc-300 resize-none text-sm leading-relaxed bg-transparent"
                                placeholder="e.g. Need to follow up with Ahmed tomorrow about Q4 projections. Sam should check the server logs. Not sure if we sent the contract to the client..."
                                value={input}
                                onChange={(e) => setInput(e.target.value.slice(0, 1000))}
                            />
                            <span className="absolute bottom-3 right-3 text-xs text-zinc-300">{input.length} / 1000</span>
                        </div>
                        <button
                            onClick={() => handleExtract(input)}
                            disabled={loading || !input.trim()}
                            className="w-full h-14 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-40 transition active:scale-[0.98] text-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            Extract Actions
                        </button>
                    </div>
                )}

                {/* Upload Tabs */}
                {activeTab !== 'text' && (
                    <div>
                        <div
                            onClick={() => {
                                if (activeTab === 'image') imageRef.current?.click()
                                if (activeTab === 'whatsapp') whatsappRef.current?.click()
                                if (activeTab === 'doc') docRef.current?.click()
                                if (activeTab === 'voice') voiceRef.current?.click()
                            }}
                            className="border-2 border-dashed border-zinc-200 rounded-2xl h-52 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 hover:border-zinc-300 transition mb-4 bg-white"
                        >
                            {fileName ? (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-green-500 mb-2">check_circle</span>
                                    <p className="font-semibold text-zinc-700 text-sm">{fileName}</p>
                                    <p className="text-xs text-zinc-400 mt-1">Tap to change file</p>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-5xl text-zinc-300 mb-3">
                                        {activeTab === 'image' ? 'image' : activeTab === 'whatsapp' ? 'chat' : activeTab === 'doc' ? 'description' : 'mic'}
                                    </span>
                                    <p className="font-semibold text-zinc-600 text-sm">
                                        {activeTab === 'image' && 'Drop image or tap to upload'}
                                        {activeTab === 'whatsapp' && 'Drop exported WhatsApp chat (.txt)'}
                                        {activeTab === 'doc' && 'Drop PDF or Word document'}
                                        {activeTab === 'voice' && 'Upload voice note or recording'}
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-2">
                                        {activeTab === 'image' && 'Screenshots, whiteboards, handwritten notes'}
                                        {activeTab === 'whatsapp' && 'WhatsApp → More → Export Chat → Without Media'}
                                        {activeTab === 'doc' && 'Supported: .pdf, .docx'}
                                        {activeTab === 'voice' && 'Supported: .m4a, .mp3, .wav, .webm'}
                                    </p>
                                </>
                            )}
                        </div>
                        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, '/api/parse-image') }} />
                        <input ref={whatsappRef} type="file" accept=".txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, '/api/parse-whatsapp') }} />
                        <input ref={docRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, '/api/parse-document') }} />
                        <input ref={voiceRef} type="file" accept="audio/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, '/api/parse-voice') }} />
                    </div>
                )}

                {/* Quick Templates */}
                {!showResults && (
                    <div className="mt-8">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-4">Quick Templates</p>
                        <div className="grid grid-cols-2 gap-3">
                            {QUICK_TEMPLATES.map(t => (
                                <button
                                    key={t.title}
                                    onClick={() => { setActiveTab('text'); setInput(t.text); setShowResults(false) }}
                                    className="p-4 border border-zinc-200 rounded-2xl bg-white hover:bg-zinc-50 hover:border-zinc-300 transition text-left group"
                                >
                                    <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-700 text-[22px] mb-2 block transition-colors">{t.icon}</span>
                                    <p className="font-semibold text-zinc-800 text-sm">{t.title}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">{t.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results */}
                {showResults && recentActions.length > 0 && (
                    <div className="mt-8 space-y-6">
                        {urgent.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-1">
                                    🔥 Urgent ({urgent.length})
                                </p>
                                <div className="space-y-3">
                                    {urgent.map((action, i) => (
                                        <ActionCard key={action.id} action={action} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {normal.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-3">
                                    Actions ({normal.length})
                                </p>
                                <div className="space-y-3">
                                    {normal.map((action, i) => (
                                        <ActionCard key={action.id} action={action} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => router.push('/actions')}
                            className="w-full h-12 border border-zinc-200 bg-white text-zinc-700 rounded-xl font-medium text-sm hover:bg-zinc-50 transition flex items-center justify-center gap-2"
                        >
                            View all in Actions
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    </div>
                )}
            </main>

            <style jsx global>{`
        @keyframes progress {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-progress { animation: progress 1.5s ease-in-out infinite; }
        @keyframes fall {
          0% { top: -10%; opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        .animate-fall { animation: fall 2.5s linear forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    )
}

function ActionCard({ action, index }: { action: Action; index: number }) {
    const tc = typeConfig[action.type || 'task'] || typeConfig.task
    return (
        <div
            className={`bg-white border rounded-2xl p-4 shadow-sm ${action.urgency === 'urgent' ? 'border-red-200 border-l-4 border-l-red-500' : 'border-zinc-200'}`}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                    <span className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${tc.color}`}>{tc.icon}</span>
                    <p className="font-semibold text-zinc-900 text-sm leading-snug">{action.title}</p>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${priorityColors[action.priority]}`}>
                    {action.priority}
                </span>
            </div>
            <div className="ml-7 mt-2 flex flex-wrap gap-3">
                {action.owner && (
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        {action.owner}
                    </span>
                )}
                {action.due_date && (
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {action.due_date}
                    </span>
                )}
            </div>
        </div>
    )
}