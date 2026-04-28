'use client'

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'

export default function BottomNavWrapper() {
    const pathname = usePathname()

    if (pathname === '/' || pathname === '/auth') return null

    return <BottomNav />
}