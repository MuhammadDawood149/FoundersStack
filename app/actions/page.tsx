'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Action = {
    id: string
    title: string
    owner?: string
    priority: 'high' | 'medium' | 'low'
    due_date?: string
    due_date_parsed?: string
    type: 'task' | 'follow-up' | 'reminder'
    urgency: 'urgent' | 'normal'
    status: 'todo' | 'done' | 'snoozed'
    confidence?: number
    created_at: string
}

type Filter = 'all' | 'urgent' | 'follow-ups' | 'reminders' | 'tasks' | 'snoozed' | 'done'

const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'follow-ups', label: 'Follow-ups' },
    { id: 'reminders', label: 'Reminders' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'snoozed', label: 'Snoozed' },
    { id: 'done', label: 'Done' },
]

function getDeadlineState(action: Action): 'overdue' | 'today' | 'soon' | 'normal' | null {
    if (!action.due_date_parsed) return null
    const due = new Date(action.due_date_parsed)
    const now = new Date()
    const diffMs = due.getTime() - now.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    if (diffDays < 0) return 'overdue'
    if (diffDays < 1) return 'today'
    if (diffDays <= 3) return 'soon'
    return 'normal'
}

function getCardStyle(action: Action, deadlineState: ReturnType<typeof getDeadlineState>) {
    if (action.status === 'done') return 'bg-zinc-50 border-zinc-200 opacity-70'
    if (action.status === 'snoozed') return 'bg-zinc-50 border-zinc-200 opacity-60'
    if (deadlineState === 'overdue') return 'bg-zinc-100 border-zinc-200'
    if (deadlineState === 'today') return 'bg-[#FEE2E2] border-[#FCA5A5] border-l-4 border-l-red-600'
    if (deadlineState === 'soon') return 'bg-[#FFF7ED] border-[#FED7AA] border-l-4 border-l-orange-500'
    if (action.urgency === 'urgent') return 'bg-[#FEE2E2] border-[#FCA5A5] border-l-4 border-l-red-600'
    return 'bg-white border-zinc-200 border-l-4 border-l-zinc-300'
}

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    task: { icon: 'check_circle', color: 'text-zinc-500', bg: 'bg-zinc-100 text-zinc-600' },
    'follow-up': { icon: 'reply', color: 'text-blue-500', bg: 'bg-blue-50 text-blue-700' },
    reminder: { icon: 'alarm', color: 'text-purple-500', bg: 'bg-purple-50 text-purple-700' },
}

const priorityColors: Record<string, string> = {
    high: 'bg-red-50 text-red-700 border border-red-200',
    medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    low: 'bg-green-50 text-green-700 border border-green-200',
}

export default function ActionsPage() {
    const [actions, setActions] = useState<Action[]>([])
    const [filter, setFilter] = useState<Filter>('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchActions()
    }, [])

    const fetchActions = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('actions')
            .select('*')
            .order('created_at', { ascending: false })
        setActions(data || [])
        setLoading(false)
    }

    const updateStatus = async (id: string, status: Action['status']) => {
        setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a))
        await supabase.from('actions').update({ status }).eq('id', id)
    }

    const deleteAction = async (id: string) => {
        setActions(prev => prev.filter(a => a.id !== id))
        await supabase.from('actions').delete().eq('id', id)
    }

    const filtered = actions.filter(a => {
        if (filter === 'all') return a.status === 'todo'
        if (filter === 'urgent') return a.urgency === 'urgent' && a.status === 'todo'
        if (filter === 'follow-ups') return a.type === 'follow-up' && a.status === 'todo'
        if (filter === 'reminders') return a.type === 'reminder' && a.status === 'todo'
        if (filter === 'tasks') return a.type === 'task' && a.status === 'todo'
        if (filter === 'snoozed') return a.status === 'snoozed'
        if (filter === 'done') return a.status === 'done'
        return true
    })

    const counts: Record<Filter, number> = {
        all: actions.filter(a => a.status === 'todo').length,
        urgent: actions.filter(a => a.urgency === 'urgent' && a.status === 'todo').length,
        'follow-ups': actions.filter(a => a.type === 'follow-up' && a.status === 'todo').length,
        reminders: actions.filter(a => a.type === 'reminder' && a.status === 'todo').length,
        tasks: actions.filter(a => a.type === 'task' && a.status === 'todo').length,
        snoozed: actions.filter(a => a.status === 'snoozed').length,
        done: actions.filter(a => a.status === 'done').length,
    }

    return (
        <div className="min-h-screen bg-[#f9f9ff] pb-24">
            {/* Header */}
            <header className="bg-white flex justify-between items-end px-4 pb-4 w-full h-28 border-b border-zinc-200 sticky top-0 z-30">
                <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Founders Stack</p>
                    <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 leading-tight">Actions</h1>
                </div>
                <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold mb-1">
                    FS
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-5">
                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                    {FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${filter === f.id
                                ? 'bg-zinc-900 text-white'
                                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                                }`}
                        >
                            {f.label}
                            {counts[f.id] > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filter === f.id ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                                    {counts[f.id]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Cards */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                        <div className="text-4xl animate-spin mb-4">⚙️</div>
                        <p className="text-sm">Loading actions...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                        <span className="material-symbols-outlined text-5xl mb-4 text-zinc-300">inbox</span>
                        <p className="font-semibold text-zinc-500">No actions here</p>
                        <p className="text-sm text-zinc-400 mt-1">
                            {filter === 'all' ? 'Extract some thoughts to get started' : `No ${filter} actions right now`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(action => {
                            const deadlineState = getDeadlineState(action)
                            const cardStyle = getCardStyle(action, deadlineState)
                            const tc = typeConfig[action.type] || typeConfig.task
                            const isDone = action.status === 'done'
                            const isSnoozed = action.status === 'snoozed'

                            return (
                                <div key={action.id} className={`border rounded-2xl p-4 shadow-sm transition-all ${cardStyle}`}>
                                    {/* Top row */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${tc.bg}`}>
                                                {action.type}
                                            </span>
                                            {deadlineState === 'overdue' && (
                                                <span className="text-xs px-2 py-0.5 rounded-lg font-semibold bg-zinc-200 text-zinc-600 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">warning</span> Overdue
                                                </span>
                                            )}
                                            {deadlineState === 'today' && (
                                                <span className="text-xs px-2 py-0.5 rounded-lg font-semibold bg-red-100 text-red-700">Today!</span>
                                            )}
                                            {deadlineState === 'soon' && (
                                                <span className="text-xs px-2 py-0.5 rounded-lg font-semibold bg-orange-100 text-orange-700">Soon</span>
                                            )}
                                        </div>
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${priorityColors[action.priority]}`}>
                                            {action.priority}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className={`font-semibold text-base leading-snug mb-2 ${isDone || deadlineState === 'overdue' ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                                        {action.title}
                                    </h3>

                                    {/* Meta */}
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        {action.owner && (
                                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">person</span>
                                                {action.owner}
                                            </span>
                                        )}
                                        {action.due_date && (
                                            <span className={`text-xs flex items-center gap-1 ${deadlineState === 'overdue' ? 'text-zinc-400' : deadlineState === 'today' ? 'text-red-600 font-medium' : deadlineState === 'soon' ? 'text-orange-600' : 'text-zinc-500'}`}>
                                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                {action.due_date}
                                            </span>
                                        )}
                                        {action.confidence !== undefined && (
                                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">psychology</span>
                                                {Math.round(action.confidence * 100)}% confident
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {!isDone && (
                                            <button
                                                onClick={() => updateStatus(action.id, 'done')}
                                                className="flex-1 h-11 bg-zinc-900 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-zinc-700 active:scale-[0.98] transition"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">check</span>
                                                Done
                                            </button>
                                        )}
                                        {isDone && (
                                            <button
                                                onClick={() => updateStatus(action.id, 'todo')}
                                                className="flex-1 h-11 border border-zinc-300 bg-white text-zinc-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-zinc-50 active:scale-[0.98] transition"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">undo</span>
                                                Undo
                                            </button>
                                        )}
                                        {!isSnoozed && !isDone && (
                                            <button
                                                onClick={() => updateStatus(action.id, 'snoozed')}
                                                className="h-11 w-11 border border-zinc-200 bg-white text-zinc-600 rounded-xl flex items-center justify-center hover:bg-zinc-50 active:scale-[0.98] transition"
                                                title="Snooze"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">snooze</span>
                                            </button>
                                        )}
                                        {isSnoozed && (
                                            <button
                                                onClick={() => updateStatus(action.id, 'todo')}
                                                className="h-11 w-11 border border-zinc-200 bg-white text-zinc-600 rounded-xl flex items-center justify-center hover:bg-zinc-50 active:scale-[0.98] transition"
                                                title="Wake up"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">alarm_on</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteAction(action.id)}
                                            className="h-11 w-11 border border-zinc-200 bg-white text-zinc-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-[0.98] transition"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    )
}