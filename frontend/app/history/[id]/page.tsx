'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { getHistoryById, exportPDF } from '@/lib/api'
import { ScanHistory, ScanResult } from '@/types'
import {
  ArrowLeft, Globe, Server, Wifi, Code, Network,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle,
  Zap, Clock, Calendar, Loader2, Download
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
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportPDF(Number(id))
    } catch {
      alert('ไม่สามารถ export PDF ได้')
    } finally {
      setExporting(false)
    }
  }
  const toggle = (key: string) =>
    setExpanded(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])


  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getHistoryById(Number(id))
        setItem(data)
        if (data.result_json) setResult(JSON.parse(data.result_json))
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
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  )

  if (error || !item) return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-28">
        <div className="card rounded-2xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-ink font-medium mb-4">{error}</p>
          <button onClick={() => router.back()}
            className="text-primary-600 text-sm hover:underline">← กลับ</button>
        </div>
      </main>
    </div>
  )

  const total = item.found_endpoints_count + item.js_endpoints_count + item.network_calls_count
  const date = new Date(item.created_at)

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-ink-muted hover:text-primary-600 text-sm mb-6 transition-colors group font-medium">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          กลับหน้าประวัติ
        </button>

        {/* Header */}
        <div className="card rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={clsx(
                'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                item.status === 'success' ? 'bg-emerald-100' : 'bg-red-100'
              )}>
                {item.status === 'success'
                  ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                  : <AlertCircle className="w-5 h-5 text-red-500" />}
              </div>
              <div className="min-w-0">
                <p className="text-ink font-semibold truncate">{item.url}</p>
                <p className="text-ink-muted text-xs mt-0.5">ID #{item.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={clsx('badge', item.status === 'success' ? 'badge-success' : 'badge-error')}>
                {item.status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
              </span>
              <span className={clsx('badge', item.scan_mode === 'deep' ? 'badge-deep' : 'badge-basic')}>
                {item.scan_mode === 'deep' ? <><Zap className="w-3 h-3" />Deep Scan</> : '🔍 Basic Scan'}
              </span>

              {/* ปุ่ม Export PDF */}
              {/* ปุ่ม Export PDF */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-ink-faint/50">
            <div className="flex items-center gap-2 text-ink-muted text-xs">
              <Clock className="w-3.5 h-3.5 text-ink-subtle" />
              ใช้เวลา {item.scan_duration}
            </div>
            <div className="flex items-center gap-2 text-ink-muted text-xs">
              <Calendar className="w-3.5 h-3.5 text-ink-subtle" />
              {date.toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </div>
            <div className="flex items-center gap-2 text-ink-muted text-xs">
              <Globe className="w-3.5 h-3.5 text-ink-subtle" />
              {item.ip_address}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'HTML Endpoints', value: item.found_endpoints_count, color: 'text-primary-600', bg: 'bg-primary-50' },
            { label: 'DNS Results', value: item.dns_results_count, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'JS Endpoints', value: item.js_endpoints_count, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Network Calls', value: item.network_calls_count, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(s => (
            <div key={s.label} className={clsx('rounded-xl p-4 text-center border border-white/80', s.bg)}>
              <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-ink-muted text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        {result && (
          <div className="space-y-3">
            {result.headers && Object.keys(result.headers).length > 0 && (
              <Section id="headers" icon={<Server className="w-4 h-4" />}
                title="Response Headers" subtitle="Technology Stack ที่พบ"
                expanded={expanded.includes('headers')} onToggle={() => toggle('headers')}>
                <div className="space-y-2">
                  {Object.entries(result.headers).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border border-ink-faint/50">
                      <span className="text-primary-600 text-xs font-mono min-w-[140px]">{k}</span>
                      <span className="text-ink text-xs font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {result.found_endpoints && result.found_endpoints.length > 0 && (
              <Section id="endpoints" icon={<Globe className="w-4 h-4" />}
                title="Found Endpoints" subtitle={`พบ ${result.found_endpoints.length} รายการจาก HTML`}
                expanded={expanded.includes('endpoints')} onToggle={() => toggle('endpoints')}>
                <EndpointList items={result.found_endpoints} dot="bg-primary-400" color="text-primary-700" />
              </Section>
            )}

            {result.dns_results && result.dns_results.length > 0 && (
              <Section id="dns" icon={<Wifi className="w-4 h-4" />}
                title="DNS Results" subtitle={`พบ ${result.dns_results.length} subdomain`}
                expanded={expanded.includes('dns')} onToggle={() => toggle('dns')}>
                <EndpointList items={result.dns_results} dot="bg-emerald-400" color="text-emerald-700" />
              </Section>
            )}

            {result.js_endpoints && result.js_endpoints.length > 0 && (
              <Section id="js" icon={<Code className="w-4 h-4" />}
                title="JS Endpoints" subtitle={`พบ ${result.js_endpoints.length} รายการจาก JavaScript`}
                expanded={expanded.includes('js')} onToggle={() => toggle('js')}>
                <EndpointList items={result.js_endpoints} dot="bg-amber-400" color="text-amber-700" />
              </Section>
            )}

            {result.network_calls && result.network_calls.length > 0 && (
              <Section id="network" icon={<Network className="w-4 h-4" />}
                title="Network Calls" subtitle={`ดักจับได้ ${result.network_calls.length} XHR/Fetch calls`}
                expanded={expanded.includes('network')} onToggle={() => toggle('network')}>
                <EndpointList items={result.network_calls} dot="bg-violet-400" color="text-violet-700" />
              </Section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function Section({ icon, title, subtitle, expanded, onToggle, children }: {
  id: string; icon: React.ReactNode; title: string; subtitle: string
  expanded: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="card rounded-2xl overflow-hidden">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-primary-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="text-primary-500">{icon}</div>
          <div className="text-left">
            <p className="text-ink font-medium text-sm">{title}</p>
            <p className="text-ink-muted text-xs mt-0.5">{subtitle}</p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-ink-subtle" />
          : <ChevronDown className="w-4 h-4 text-ink-subtle" />}
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-ink-faint/50">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

function EndpointList({ items, dot, color }: { items: string[]; dot: string; color: string }) {
  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-elevated border border-ink-faint/40 hover:border-primary-200 transition-colors">
          <span className={clsx('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', dot)} />
          <span className={clsx('text-xs font-mono break-all', color)}>{item}</span>
        </div>
      ))}
    </div>
  )
}
