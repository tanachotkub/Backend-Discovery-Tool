'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { getDashboardStats, DashboardStats } from '@/lib/api'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie,
    Cell, Legend
} from 'recharts'
import {
    Activity, Globe, CheckCircle, Zap,
    TrendingUp, Search, Wifi, Code, Network, BarChart2
} from 'lucide-react'
import clsx from 'clsx'

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(7)


    // โหลดใหม่เมื่อ days เปลี่ยน
    useEffect(() => {
        setLoading(true)
        getDashboardStats(days)
            .then(setStats)
            .finally(() => setLoading(false))
    }, [days])

    if (loading) return (
        <div className="min-h-screen">
            <Navbar />
            <div className="flex items-center justify-center pt-40">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        </div>
    )

    if (!stats) return null

    const pieData = [
        { name: 'HTML Endpoints', value: stats.total_html_endpoints, color: '#2563eb' },
        { name: 'DNS Results', value: stats.total_dns_results, color: '#10b981' },
        { name: 'JS Endpoints', value: stats.total_js_endpoints, color: '#f59e0b' },
        { name: 'Network Calls', value: stats.total_network_calls, color: '#8b5cf6' },
    ]

    const scanModeData = [
        { name: 'Basic Scan', value: stats.basic_scans, color: '#64748b' },
        { name: 'Deep Scan', value: stats.deep_scans, color: '#7c3aed' },
    ]

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
                            <BarChart2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-ink">Dashboard</h1>
                            <p className="text-ink-muted text-sm">ภาพรวมการใช้งานระบบ</p>
                        </div>
                    </div>

                    {/* ✅ ปุ่มเลือกวัน */}
                    <div className="flex items-center gap-1 bg-surface-elevated border border-ink-faint rounded-xl p-1">
                        {[7, 14, 30].map(d => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                    days === d
                                        ? 'bg-primary-600 text-white shadow-soft'
                                        : 'text-ink-muted hover:text-ink hover:bg-white'
                                )}
                            >
                                {d} วัน
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        {
                            label: 'การสแกนทั้งหมด',
                            value: stats.total_scans.toLocaleString(),
                            icon: Activity,
                            color: 'text-primary-600',
                            bg: 'bg-primary-50',
                            border: 'border-primary-100',
                        },
                        {
                            label: 'Endpoints ที่พบ',
                            value: stats.total_endpoints.toLocaleString(),
                            icon: Globe,
                            color: 'text-emerald-600',
                            bg: 'bg-emerald-50',
                            border: 'border-emerald-100',
                        },
                        {
                            label: 'Success Rate',
                            value: `${stats.success_rate.toFixed(1)}%`,
                            icon: CheckCircle,
                            color: 'text-amber-600',
                            bg: 'bg-amber-50',
                            border: 'border-amber-100',
                        },
                        {
                            label: 'Deep Scans',
                            value: stats.deep_scans.toLocaleString(),
                            icon: Zap,
                            color: 'text-violet-600',
                            bg: 'bg-violet-50',
                            border: 'border-violet-100',
                        },
                    ].map(card => (
                        <div key={card.label}
                            className={clsx('card rounded-2xl p-5 border', card.border)}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-ink-muted text-xs font-medium">{card.label}</p>
                                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', card.bg)}>
                                    <card.icon className={clsx('w-4 h-4', card.color)} />
                                </div>
                            </div>
                            <p className={clsx('text-3xl font-bold', card.color)}>{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Row 1 */}
                <div className="grid lg:grid-cols-3 gap-6 mb-6">

                    {/* Scan per day — ใหญ่สุด */}
                    <div className="lg:col-span-2 card rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="w-4 h-4 text-primary-500" />
                            <h2 className="text-ink font-semibold text-sm">จำนวนการสแกน 7 วันย้อนหลัง</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stats.scan_per_day} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px', border: '1px solid #e2e8f0',
                                        fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                                    }}
                                    formatter={(v) => [Number(v) ?? 0, 'การสแกน']}
                                />
                                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Basic vs Deep Pie */}
                    <div className="card rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Search className="w-4 h-4 text-primary-500" />
                            <h2 className="text-ink font-semibold text-sm">Basic vs Deep Scan</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie
                                    data={scanModeData}
                                    cx="50%" cy="50%"
                                    innerRadius={45} outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {scanModeData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v) => [Number(v) ?? 0, 'ครั้ง']}
                                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-2 mt-2">
                            {scanModeData.map(d => (
                                <div key={d.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                                        <span className="text-ink-muted">{d.name}</span>
                                    </div>
                                    <span className="font-semibold text-ink">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid lg:grid-cols-2 gap-6">

                    {/* Endpoint breakdown */}
                    <div className="card rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Globe className="w-4 h-4 text-primary-500" />
                            <h2 className="text-ink font-semibold text-sm">Endpoints ที่พบทั้งหมด</h2>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'HTML Endpoints', value: stats.total_html_endpoints, color: 'bg-primary-500', text: 'text-primary-600' },
                                { label: 'DNS Results', value: stats.total_dns_results, color: 'bg-emerald-500', text: 'text-emerald-600' },
                                { label: 'JS Endpoints', value: stats.total_js_endpoints, color: 'bg-amber-500', text: 'text-amber-600' },
                                { label: 'Network Calls', value: stats.total_network_calls, color: 'bg-violet-500', text: 'text-violet-600' },
                            ].map(item => {
                                const pct = stats.total_endpoints > 0
                                    ? (item.value / stats.total_endpoints * 100).toFixed(1)
                                    : '0'
                                return (
                                    <div key={item.label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-ink-muted font-medium">{item.label}</span>
                                            <span className={clsx('font-bold', item.text)}>
                                                {item.value.toLocaleString()} ({pct}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={clsx('h-full rounded-full transition-all', item.color)}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Total */}
                        <div className="mt-4 pt-4 border-t border-ink-faint/50 flex justify-between">
                            <span className="text-ink-muted text-xs font-medium">รวมทั้งหมด</span>
                            <span className="text-primary-600 font-bold text-sm">
                                {stats.total_endpoints.toLocaleString()} items
                            </span>
                        </div>
                    </div>

                    {/* Top 5 URLs */}
                    <div className="card rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="w-4 h-4 text-primary-500" />
                            <h2 className="text-ink font-semibold text-sm">Top 5 URLs ที่ scan บ่อย</h2>
                        </div>

                        {stats.top_urls.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Search className="w-8 h-8 text-ink-faint mb-3" />
                                <p className="text-ink-muted text-sm">ยังไม่มีข้อมูล</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.top_urls.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        {/* Rank */}
                                        <span className={clsx(
                                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                                            i === 0 ? 'bg-amber-100 text-amber-600' :
                                                i === 1 ? 'bg-slate-100 text-slate-500' :
                                                    i === 2 ? 'bg-orange-100 text-orange-500' :
                                                        'bg-ink-faint/30 text-ink-subtle'
                                        )}>
                                            {i + 1}
                                        </span>

                                        {/* URL */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-ink text-xs font-mono truncate">{item.url}</p>
                                            <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-400 rounded-full"
                                                    style={{
                                                        width: `${(item.count / stats.top_urls[0].count) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Count */}
                                        <span className="text-primary-600 font-bold text-sm shrink-0">
                                            {item.count}x
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    )
}