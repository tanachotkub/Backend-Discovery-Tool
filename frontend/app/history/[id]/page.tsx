'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { getHistoryById } from '@/lib/api'
import { ScanHistory, ScanResult } from '@/types'
import {
  ArrowLeft, Globe, Server, Wifi, Code,
  Network, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, Zap, Clock,
  Calendar, Loader2
} from 'lucide-react'
import clsx from 'clsx'

export default function HistoryDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [item, setItem] = useState<ScanHistory | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string[]>(['endpoints'])

  const toggle = (key: string) =>
    setExpanded(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getHistoryById(Number(id))
        setItem(data)
        // parse result_json
        if (data.result_json) {
          const parsed = JSON.parse(data.result_json)
          setResult(parsed)
        }
      } catch {
        setError('ไม่พบข้อมูลการสแกนนี้')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-28">
        <div className="card-glow bg-bg-card rounded-2xl p-8 border border-danger/20 text-center">
          <AlertCircle className="w-10 h-10 text-danger mx-auto mb-4" />
          <p className="text-danger">{error}</p>
          <button onClick={() => router.back()} className="mt-4 text-white/40 text-sm hover:text-white transition-colors">
            ← กลับ
          </button>
        </div>
      </main>
    </div>
  )

  if (!item) return null

  const totalEndpoints = item.found_endpoints_count + item.js_endpoints_count + item.network_calls_count
  const date = new Date(item.created_at)

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          กลับหน้าประวัติ
        </button>

        {/* Header Card */}
        <div className="card-glow bg-bg-card rounded-2xl p-6 border border-white/5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                item.status === 'success'
                  ? 'bg-success/10 border border-success/20'
                  : 'bg-danger/10 border border-danger/20'
              )}>
                {item.status === 'success'
                  ? <CheckCircle className="w-5 h-5 text-success" />
                  : <AlertCircle className="w-5 h-5 text-danger" />}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{item.url}</p>
                <p className="text-white/35 text-xs mt-0.5">ID #{item.id}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={clsx('badge', item.status === 'success' ? 'badge-success' : 'badge-error')}>
                {item.status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
              </span>
              <span className={clsx(
                'badge',
                item.scan_mode === 'deep'
                  ? 'badge-processing'
                  : 'bg-white/5 text-white/40 border border-white/10'
              )}>
                {item.scan_mode === 'deep' ? <><Zap className="w-3 h-3" />Deep Scan</> : '🔍 Basic Scan'}
              </span>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-6 mt-5 pt-5 border-t border-white/5">
            <div className="flex items-center gap-2 text-white/35 text-xs">
              <Clock className="w-3.5 h-3.5" />
              ใช้เวลา {item.scan_duration}
            </div>
            <div className="flex items-center gap-2 text-white/35 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              {date.toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </div>
            <div className="flex items-center gap-2 text-white/35 text-xs">
              <Globe className="w-3.5 h-3.5" />
              {item.ip_address}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'HTML Endpoints', value: item.found_endpoints_count, color: 'text-accent' },
            { label: 'DNS Results', value: item.dns_results_count, color: 'text-success' },
            { label: 'JS Endpoints', value: item.js_endpoints_count, color: 'text-warning' },
            { label: 'Network Calls', value: item.network_calls_count, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="card-glow bg-bg-card rounded-xl p-4 border border-white/5 text-center">
              <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-white/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Result sections จาก result_json */}
        {result && (
          <div className="space-y-3">

            {/* Headers */}
            {result.headers && Object.keys(result.headers).length > 0 && (
              <Section
                id="headers" icon={<Server className="w-4 h-4" />}
                title="Response Headers" subtitle="Technology Stack ที่พบ"
                expanded={expanded.includes('headers')} onToggle={() => toggle('headers')}
              >
                <div className="space-y-2">
                  {Object.entries(result.headers).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated">
                      <span className="text-accent/70 text-xs font-mono min-w-[140px]">{k}</span>
                      <span className="text-white/80 text-xs font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Found Endpoints */}
            {result.found_endpoints && result.found_endpoints.length > 0 && (
              <Section
                id="endpoints" icon={<Globe className="w-4 h-4" />}
                title="Found Endpoints" subtitle={`พบ ${result.found_endpoints.length} รายการจาก HTML`}
                expanded={expanded.includes('endpoints')} onToggle={() => toggle('endpoints')}
              >
                <EndpointList items={result.found_endpoints} color="text-accent" />
              </Section>
            )}

            {/* DNS Results */}
            {result.dns_results && result.dns_results.length > 0 && (
              <Section
                id="dns" icon={<Wifi className="w-4 h-4" />}
                title="DNS Results" subtitle={`พบ ${result.dns_results.length} subdomain`}
                expanded={expanded.includes('dns')} onToggle={() => toggle('dns')}
              >
                <EndpointList items={result.dns_results} color="text-success" />
              </Section>
            )}

            {/* JS Endpoints */}
            {result.js_endpoints && result.js_endpoints.length > 0 && (
              <Section
                id="js" icon={<Code className="w-4 h-4" />}
                title="JS Endpoints" subtitle={`พบ ${result.js_endpoints.length} รายการจาก JavaScript files`}
                expanded={expanded.includes('js')} onToggle={() => toggle('js')}
              >
                <EndpointList items={result.js_endpoints} color="text-warning" />
              </Section>
            )}

            {/* Network Calls */}
            {result.network_calls && result.network_calls.length > 0 && (
              <Section
                id="network" icon={<Network className="w-4 h-4" />}
                title="Network Calls" subtitle={`ดักจับได้ ${result.network_calls.length} XHR/Fetch calls`}
                expanded={expanded.includes('network')} onToggle={() => toggle('network')}
              >
                <EndpointList items={result.network_calls} color="text-purple-400" />
              </Section>
            )}

          </div>
        )}
      </main>
    </div>
  )
}

/* ── Sub-components ── */
function Section({ icon, title, subtitle, expanded, onToggle, children }: {
  id: string; icon: React.ReactNode; title: string; subtitle: string
  expanded: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="card-glow bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-accent/70">{icon}</div>
          <div className="text-left">
            <p className="text-white font-medium text-sm">{title}</p>
            <p className="text-white/35 text-xs mt-0.5">{subtitle}</p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-white/30" />
          : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

function EndpointList({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-bg-elevated hover:bg-subtle transition-colors group">
          <span className={clsx('text-xs mt-0.5 shrink-0', color)}>›</span>
          <span className="text-white/70 text-xs font-mono break-all group-hover:text-white/90 transition-colors">
            {item}
          </span>
        </div>
      ))}
    </div>
  )
}