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
      console.log('poll result:', data)
      setJob({ ...data }) // force new object reference
      if (data.status === 'pending' || data.status === 'processing') {
        timerRef.current = setTimeout(poll, 2000)
      }
    } catch (e) {
      console.error('poll error:', e)
      setError('ไม่สามารถดึงข้อมูล Job ได้')
    }
  }, [jobId])

  useEffect(() => {
    poll()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [poll])

  if (error) return (
    <div className="card-glow bg-bg-card rounded-2xl p-6 border border-danger/20">
      <p className="text-danger text-sm">{error}</p>
    </div>
  )

  if (!job) return (
    <div className="card-glow bg-bg-card rounded-2xl p-8 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-accent animate-spin" />
    </div>
  )

  const result = job.result

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="card-glow bg-bg-card rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <StatusIcon status={job.status} />
            <div>
              <p className="text-white font-medium text-sm">{statusLabel(job.status)}</p>
              <p className="text-white/35 text-xs mt-0.5 font-mono truncate max-w-xs">{job.url}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={clsx('badge', badgeClass(job.status))}>{job.status}</span>
            {result?.scan_duration && (
              <p className="text-white/30 text-xs mt-1">{result.scan_duration}</p>
            )}
          </div>
        </div>

        {(job.status === 'pending' || job.status === 'processing') && (
          <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden mt-4">
            <div className="h-full bg-gradient-to-r from-accent/0 via-accent to-accent/0 w-1/3 animate-scan-line" />
          </div>
        )}
      </div>

      {/* Result */}
      {result && job.status === 'done' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Endpoints', value: result.found_endpoints?.length ?? 0, color: 'text-accent' },
              { label: 'DNS', value: result.dns_results?.length ?? 0, color: 'text-success' },
              { label: 'JS', value: result.js_endpoints?.length ?? 0, color: 'text-warning' },
              { label: 'Network', value: result.network_calls?.length ?? 0, color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="card-glow bg-bg-card rounded-xl p-4 border border-white/5 text-center">
                <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
                <p className="text-white/40 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Headers */}
          {result.headers && Object.keys(result.headers).length > 0 && (
            <Section id="headers" icon={<Server className="w-4 h-4" />}
              title="Response Headers" subtitle="Technology Stack"
              expanded={expanded.includes('headers')} onToggle={() => toggle('headers')}>
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
            <Section id="endpoints" icon={<Globe className="w-4 h-4" />}
              title="Found Endpoints" subtitle={`พบ ${result.found_endpoints.length} รายการจาก HTML`}
              expanded={expanded.includes('endpoints')} onToggle={() => toggle('endpoints')}>
              <EndpointList items={result.found_endpoints} color="text-accent" />
            </Section>
          )}

          {/* DNS */}
          {result.dns_results && result.dns_results.length > 0 && (
            <Section id="dns" icon={<Wifi className="w-4 h-4" />}
              title="DNS Results" subtitle={`พบ ${result.dns_results.length} subdomain`}
              expanded={expanded.includes('dns')} onToggle={() => toggle('dns')}>
              <EndpointList items={result.dns_results} color="text-success" />
            </Section>
          )}

          {/* JS Endpoints */}
          {result.js_endpoints && result.js_endpoints.length > 0 && (
            <Section id="js" icon={<Code className="w-4 h-4" />}
              title="JS Endpoints" subtitle={`พบ ${result.js_endpoints.length} รายการจาก JavaScript`}
              expanded={expanded.includes('js')} onToggle={() => toggle('js')}>
              <EndpointList items={result.js_endpoints} color="text-warning" />
            </Section>
          )}

          {/* Network Calls */}
          {result.network_calls && result.network_calls.length > 0 && (
            <Section id="network" icon={<Network className="w-4 h-4" />}
              title="Network Calls" subtitle={`ดักจับได้ ${result.network_calls.length} XHR/Fetch calls`}
              expanded={expanded.includes('network')} onToggle={() => toggle('network')}>
              <EndpointList items={result.network_calls} color="text-purple-400" />
            </Section>
          )}

          {/* Scan mode */}
          <div className="flex justify-end">
            <span className={clsx('badge', result.scan_mode === 'deep' ? 'badge-processing' : 'bg-white/5 text-white/40 border border-white/10')}>
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
    <div className="card-glow bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 hover:bg-white/2 transition-colors">
        <div className="flex items-center gap-3">
          <div className="text-accent/70">{icon}</div>
          <div className="text-left">
            <p className="text-white font-medium text-sm">{title}</p>
            <p className="text-white/35 text-xs mt-0.5">{subtitle}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
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
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-bg-elevated hover:bg-subtle transition-colors group">
          <span className={clsx('text-xs mt-0.5 shrink-0', color)}>›</span>
          <span className="text-white/70 text-xs font-mono break-all group-hover:text-white/90 transition-colors">{item}</span>
        </div>
      ))}
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') return <CheckCircle className="w-5 h-5 text-success" />
  if (status === 'failed') return <XCircle className="w-5 h-5 text-danger" />
  if (status === 'processing') return <Loader2 className="w-5 h-5 text-accent animate-spin" />
  return <Clock className="w-5 h-5 text-warning" />
}

function statusLabel(s: string) {
  return ({ pending: 'รอดำเนินการ', processing: 'กำลังสแกน...', done: 'สแกนเสร็จแล้ว', failed: 'เกิดข้อผิดพลาด' } as Record<string, string>)[s] ?? s
}

function badgeClass(s: string) {
  return ({ done: 'badge-success', failed: 'badge-error', pending: 'badge-pending', processing: 'badge-processing' } as Record<string, string>)[s] ?? ''
}