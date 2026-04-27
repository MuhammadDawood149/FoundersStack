'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Action = {
    id: string
    title: string
    owner?: string
    priority: 'high' | 'medium' | 'low'
    type: 'task' | 'follow-up' | 'reminder'
    urgency: 'urgent' | 'normal'
    status: 'todo' | 'done' | 'snoozed'
    created_at: string
}

export default function InsightsPage() {
    const [actions, setActions] = useState<Action[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchActions()
    }, [])

    const fetchActions = async () => {
        const { data } = await supabase.from('actions').select('*').order('created_at', { ascending: false })
        setActions(data || [])
        setLoading(false)
    }

    const total = actions.length
    const urgent = actions.filter(a => a.urgency === 'urgent' && a.status === 'todo').length
    const doneThisWeek = actions.filter(a => {
        if (a.status !== 'done') return false
        const created = new Date(a.created_at)
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
        return created > weekAgo
    }).length
    const followUpsPending = actions.filter(a => a.type === 'follow-up' && a.status === 'todo').length

    // Type breakdown
    const taskCount = actions.filter(a => a.type === 'task').length
    const followUpCount = actions.filter(a => a.type === 'follow-up').length
    const reminderCount = actions.filter(a => a.type === 'reminder').length
    const taskPct = total ? Math.round((taskCount / total) * 100) : 0
    const followUpPct = total ? Math.round((followUpCount / total) * 100) : 0
    const reminderPct = total ? Math.round((reminderCount / total) * 100) : 0

    // Priority breakdown
    const highCount = actions.filter(a => a.priority === 'high').length
    const mediumCount = actions.filter(a => a.priority === 'medium').length
    const lowCount = actions.filter(a => a.priority === 'low').length
    const highPct = total ? Math.round((highCount / total) * 100) : 0
    const mediumPct = total ? Math.round((mediumCount / total) * 100) : 0
    const lowPct = total ? Math.round((lowCount / total) * 100) : 0

    // Owner breakdown (top 5)
    const ownerMap: Record<string, number> = {}
    actions.forEach(a => {
        const o = a.owner || 'Founder'
        ownerMap[o] = (ownerMap[o] || 0) + 1
    })
    const owners = Object.entries(ownerMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Last 7 days trend
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        return d
    })
    const dayCounts = days.map(d => {
        const dateStr = d.toISOString().split('T')[0]
        return actions.filter(a => a.created_at.startsWith(dateStr)).length
    })
    const maxDay = Math.max(...dayCounts, 1)

    // Donut chart values
    const circumference = 2 * Math.PI * 15.9155
    const taskDash = (taskPct / 100) * circumference
    const followUpDash = (followUpPct / 100) * circumference
    const reminderDash = (reminderPct / 100) * circumference

    // AI Insight
    const topInsight = urgent > 3
        ? `You have ${urgent} urgent items piling up. Block 30 minutes now for a focused sprint.`
        : followUpsPending > 2
            ? `${followUpsPending} follow-ups are pending. Response rates drop 40% after 48 hours — send them now.`
            : doneThisWeek > 5
                ? `Strong week! You've cleared ${doneThisWeek} actions. Keep the momentum by reviewing what's next.`
                : 'Start your day by extracting your thoughts. Consistent dumping = fewer dropped balls.'

    return (
        <div className="min-h-screen bg-[#f9f9ff] pb-24">
            {/* Header */}
            <header className="bg-white flex justify-between items-end px-4 pb-4 w-full h-28 border-b border-zinc-200 sticky top-0 z-30">
                <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Founders Stack</p>
                    <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 leading-tight">📊 Insights</h1>
                </div>
                <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold mb-1">
                    FS
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
                <p className="text-sm text-zinc-500">How you're managing your chaos.</p>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                        <div className="text-4xl animate-spin mb-4">📊</div>
                        <p className="text-sm">Loading insights...</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard
                                label="Total Actions"
                                value={total}
                                icon="inventory_2"
                                iconColor="text-zinc-700"
                                sub={`${actions.filter(a => a.status === 'todo').length} remaining`}
                            />
                            <StatCard
                                label="🔥 Urgent"
                                value={urgent}
                                icon="priority_high"
                                iconColor="text-red-500"
                                sub="Needs attention"
                                valueColor="text-red-600"
                                borderColor="border-red-100"
                            />
                            <StatCard
                                label="✓ Done"
                                value={doneThisWeek}
                                icon="check_circle"
                                iconColor="text-green-500"
                                sub="This week"
                                valueColor="text-green-600"
                                borderColor="border-green-100"
                            />
                            <StatCard
                                label="↩ Pending"
                                value={followUpsPending}
                                icon="replay"
                                iconColor="text-blue-500"
                                sub="Follow-ups"
                                valueColor="text-blue-600"
                                borderColor="border-blue-100"
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* Actions by Type — Donut */}
                            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                                <h3 className="font-semibold text-zinc-900 mb-4 text-sm">Actions by Type</h3>
                                {total === 0 ? (
                                    <p className="text-center text-zinc-400 text-sm py-6">No data yet</p>
                                ) : (
                                    <div className="flex items-center gap-6">
                                        <div className="relative w-24 h-24 shrink-0">
                                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                                {/* Background */}
                                                <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#f4f4f5" strokeWidth="3.5" />
                                                {/* Tasks */}
                                                <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#18181b" strokeWidth="3.5"
                                                    strokeDasharray={`${taskDash} ${circumference}`} strokeLinecap="round" />
                                                {/* Follow-ups */}
                                                <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#3b82f6" strokeWidth="3.5"
                                                    strokeDasharray={`${followUpDash} ${circumference}`}
                                                    strokeDashoffset={-taskDash}
                                                    strokeLinecap="round" />
                                                {/* Reminders */}
                                                <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#a855f7" strokeWidth="3.5"
                                                    strokeDasharray={`${reminderDash} ${circumference}`}
                                                    strokeDashoffset={-(taskDash + followUpDash)}
                                                    strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-lg font-bold text-zinc-900">{total}</span>
                                                <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">total</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2.5">
                                            <LegendRow color="bg-zinc-900" label="Tasks" count={taskCount} pct={taskPct} />
                                            <LegendRow color="bg-blue-500" label="Follow-ups" count={followUpCount} pct={followUpPct} />
                                            <LegendRow color="bg-purple-500" label="Reminders" count={reminderCount} pct={reminderPct} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Priority Distribution */}
                            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                                <h3 className="font-semibold text-zinc-900 mb-4 text-sm">Priority Distribution</h3>
                                {total === 0 ? (
                                    <p className="text-center text-zinc-400 text-sm py-4">No data yet</p>
                                ) : (
                                    <div className="space-y-4">
                                        <PriorityBar label="High" count={highCount} pct={highPct} color="bg-red-500" textColor="text-red-600" />
                                        <PriorityBar label="Medium" count={mediumCount} pct={mediumPct} color="bg-yellow-400" textColor="text-yellow-700" />
                                        <PriorityBar label="Low" count={lowCount} pct={lowPct} color="bg-green-500" textColor="text-green-600" />
                                    </div>
                                )}
                            </div>

                            {/* Weekly Trend */}
                            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                                <h3 className="font-semibold text-zinc-900 mb-4 text-sm">Last 7 Days</h3>
                                <div className="flex items-end gap-1.5 h-24">
                                    {dayCounts.map((count, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                                                <div
                                                    className="w-full bg-zinc-900 rounded-t-lg transition-all"
                                                    style={{ height: count === 0 ? '2px' : `${(count / maxDay) * 80}px`, opacity: count === 0 ? 0.15 : 1 }}
                                                />
                                            </div>
                                            <span className="text-[9px] text-zinc-400 font-medium">
                                                {days[i].toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                                            </span>
                                      </div>
                                    ))}
                                </div>
                            </div>

                            {/* Owner Breakdown */}
                            {owners.length > 0 && (
                                <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                                    <h3 className="font-semibold text-zinc-900 mb-4 text-sm">By Owner</h3>
                                    <div className="space-y-3">
                                        {owners.map(([owner, count]) => (
                                            <div key={owner} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">
                                                        {owner.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-zinc-700 font-medium">{owner}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-zinc-900 rounded-full" style={{ width: `${(count / (owners[0]?.[1] || 1)) * 100}%` }} />
                                                    </div>
                                                    <span className="text-xs text-zinc-500 font-medium w-6 text-right">{count}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Insight */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-zinc-700 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">AI Strategy Insight</h2>
                            </div>
                            <div className="bg-white border border-zinc-200 border-l-4 border-l-zinc-900 rounded-2xl p-5">
                                <p className="text-sm text-zinc-700 italic leading-relaxed">"{topInsight}"</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Founders Stack AI</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}

function StatCard({ label, value, icon, iconColor, sub, valueColor = 'text-zinc-900', borderColor = 'border-zinc-200' }: {
    label: string; value: number; icon: string; iconColor: string; sub: string; valueColor?: string; borderColor?: string
}) {
    return (
        <div className={`bg-white border ${borderColor} rounded-2xl p-4`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
                <span className={`material-symbols-outlined text-[20px] ${iconColor}`}>{icon}</span>
            </div>
            <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
            <div className="text-xs text-zinc-400 mt-1">{sub}</div>
        </div>
    )
}

function LegendRow({ color, label, count, pct }: { color: string; label: string; count: number; pct: number }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-sm text-zinc-700">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">{count}</span>
                <span className="text-xs font-semibold text-zinc-600">{pct}%</span>
            </div>
        </div>
    )
}

function PriorityBar({ label, count, pct, color, textColor }: { label: string; count: number; pct: number; color: string; textColor: string }) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-700">{label}</span>
                <span className={`text-xs font-semibold ${textColor}`}>{count} tasks</span>
            </div>
            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}