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
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <div>
            <span className="font-semibold text-white text-sm">Backend Discovery</span>
            <span className="text-accent text-xs ml-1.5 opacity-60">v3.0</span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200',
                path === href
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs text-white/30">
          <Activity className="w-3.5 h-3.5 text-success animate-pulse-slow" />
          <span>ระบบออนไลน์</span>
        </div>
      </div>
    </nav>
  )
}
