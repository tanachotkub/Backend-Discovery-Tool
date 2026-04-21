'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { getJob } from '@/lib/api'
import { Job } from '@/types'
import {
  CheckCircle, XCircle, Clock, Loader2,
  ChevronDown, ChevronUp, Globe, Server,
  Wifi, Code, Network
} from 'lucide-react'
import clsx from 'clsx'

interface Props { jobId: string }

export default function JobStatus({ jobId }: Props) {
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string[]>(['endpoints'])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const toggle = (key: string) =>
    setExpanded(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])

  const poll = useCallback(async () => {
    try {
      const data = await getJob(jobId)
      setJob({ ...data })
      if (data.status === 'pending' || data.status === 'processing') {
        timerRef.current = setTimeout(poll, 2000)
      }
    } catch {
      setError('ไม่สามารถดึงข้อมูล Job ได้')
    }
  }, [jobId])

  useEffect(() => {
    poll()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [poll])

  if (error) return (
    <div className="card rounded-2xl p-6 border-red-200">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  )

  if (!job) return (
    <div className="card rounded-2xl p-10 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
    </div>
  )

  const result = job.result

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <StatusIcon status={job.status} />
            <div>
              <p className="text-ink font-medium text-sm">{statusLabel(job.status)}</p>
              <p className="text-ink-subtle text-xs mt-0.5 font-mono truncate max-w-xs">{job.url}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={clsx('badge', badgeClass(job.status))}>{job.status}</span>
            {result?.scan_duration && (
              <p className="text-ink-subtle text-xs mt-1">{result.scan_duration}</p>
            )}
          </div>
        </div>

        {(job.status === 'pending' || job.status === 'processing') && (
          <div className="h-1.5 rounded-full bg-primary-100 overflow-hidden mt-4">
            <div className="h-full bg-gradient-to-r from-primary-200 via-primary-500 to-primary-200 w-1/3 animate-scan-line" />
          </div>
        )}
      </div>

      {result && job.status === 'done' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Endpoints', value: result.found_endpoints?.length ?? 0, color: 'text-primary-600', bg: 'bg-primary-50' },
              { label: 'DNS', value: result.dns_results?.length ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'JS', value: result.js_endpoints?.length ?? 0, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Network', value: result.network_calls?.length ?? 0, color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map(s => (
              <div key={s.label} className={clsx('rounded-xl p-4 text-center border border-white', s.bg)}>
                <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
                <p className="text-ink-muted text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Headers */}
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
              <EndpointList items={result.found_endpoints} color="text-primary-600" dot="bg-primary-400" />
            </Section>
          )}

          {result.dns_results && result.dns_results.length > 0 && (
            <Section id="dns" icon={<Wifi className="w-4 h-4" />}
              title="DNS Results" subtitle={`พบ ${result.dns_results.length} subdomain`}
              expanded={expanded.includes('dns')} onToggle={() => toggle('dns')}>
              <EndpointList items={result.dns_results} color="text-emerald-600" dot="bg-emerald-400" />
            </Section>
          )}

          {result.js_endpoints && result.js_endpoints.length > 0 && (
            <Section id="js" icon={<Code className="w-4 h-4" />}
              title="JS Endpoints" subtitle={`พบ ${result.js_endpoints.length} รายการจาก JavaScript`}
              expanded={expanded.includes('js')} onToggle={() => toggle('js')}>
              <EndpointList items={result.js_endpoints} color="text-amber-600" dot="bg-amber-400" />
            </Section>
          )}

          {result.network_calls && result.network_calls.length > 0 && (
            <Section id="network" icon={<Network className="w-4 h-4" />}
              title="Network Calls" subtitle={`ดักจับได้ ${result.network_calls.length} XHR/Fetch calls`}
              expanded={expanded.includes('network')} onToggle={() => toggle('network')}>
              <EndpointList items={result.network_calls} color="text-violet-600" dot="bg-violet-400" />
            </Section>
          )}

          <div className="flex justify-end">
            <span className={clsx('badge', result.scan_mode === 'deep' ? 'badge-deep' : 'badge-basic')}>
              {result.scan_mode === 'deep' ? '⚡ Deep Scan' : '🔍 Basic Scan'}
            </span>
          </div>
        </>
      )}
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

function EndpointList({ items, color, dot }: { items: string[]; color: string; dot: string }) {
  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-elevated border border-ink-faint/40 hover:border-primary-200 transition-colors group">
          <span className={clsx('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', dot)} />
          <span className={clsx('text-xs font-mono break-all', color)}>{item}</span>
        </div>
      ))}
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') return <CheckCircle className="w-5 h-5 text-emerald-500" />
  if (status === 'failed') return <XCircle className="w-5 h-5 text-red-500" />
  if (status === 'processing') return <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
  return <Clock className="w-5 h-5 text-amber-500" />
}

function statusLabel(s: string) {
  return ({ pending: 'รอดำเนินการ', processing: 'กำลังสแกน...', done: 'สแกนเสร็จแล้ว', failed: 'เกิดข้อผิดพลาด' } as Record<string, string>)[s] ?? s
}

function badgeClass(s: string) {
  return ({ done: 'badge-success', failed: 'badge-error', pending: 'badge-pending', processing: 'badge-processing' } as Record<string, string>)[s] ?? ''
}
