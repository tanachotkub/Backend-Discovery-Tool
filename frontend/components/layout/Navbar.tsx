'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Search, History, Activity } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/', label: 'สแกน', icon: Search },
  { href: '/history', label: 'ประวัติ', icon: History },
]

export default function Navbar() {
  const path = usePathname()

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-blue-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft group-hover:bg-primary-700 transition-colors">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-ink text-sm">Backend Discovery</span>
            <span className="text-primary-400 text-xs ml-1.5">v1.0</span>
          </div>
        </Link>

        {/* Nav */}
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                path === href
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'text-ink-muted hover:text-ink hover:bg-primary-50'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs text-ink-subtle">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          ระบบออนไลน์
        </div>
      </div>
    </nav>
  )
}
