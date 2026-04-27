'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Search, History, Activity, BarChart2, Sun, Moon } from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '@/components/ThemeProvider'

const navItems = [
  { href: '/', label: 'Scan', icon: Search },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/history', label: 'Scan History', icon: History },
]

export default function Navbar() {
  const path = usePathname()
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-blue-100/80 dark:border-gray-700/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-ink dark:text-white text-sm">Backend Discovery</span>
            <span className="text-primary-400 text-xs ml-1.5">v1.3.1</span>
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
                  : 'text-ink-muted dark:text-gray-400 hover:text-ink dark:hover:text-white hover:bg-primary-50 dark:hover:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-ink-subtle dark:text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            Backend Discovery: Online
          </div>

          {/* ✅ Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={clsx(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
              'border border-ink-faint dark:border-gray-700',
              'hover:bg-primary-50 dark:hover:bg-gray-800',
              'text-ink-muted dark:text-gray-400'
            )}
            title={theme === 'light' ? 'เปลี่ยนเป็น Dark Mode' : 'เปลี่ยนเป็น Light Mode'}
          >
            {theme === 'light'
              ? <Moon className="w-4 h-4" />
              : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>
    </nav>
  )
}