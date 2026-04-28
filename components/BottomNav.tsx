'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const links = [
    { href: '/extract', label: 'Extract', icon: 'input' },
    { href: '/actions', label: 'Actions', icon: 'play_arrow' },
    { href: '/insights', label: 'Insights', icon: 'insights' },
    { href: '/console', label: 'Console', icon: 'terminal' },
]

export default function BottomNav() {
    const pathname = usePathname()
    const router = useRouter()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-16 bg-white border-t border-zinc-200 shadow-sm">
                {links.map(({ href, label, icon }) => {
                    const active = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center justify-center transition-all active:scale-95 ${active ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-700'}`}
                        >
                            <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                {icon}
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
                        </Link>
                    )
                })}
                <button
                    onClick={handleSignOut}
                    className="flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-700 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider">Sign Out</span>
                </button>
            </nav>
        </>
    )
}