'use client'
import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import ScanForm from '@/components/ui/ScanForm'
import JobStatus from '@/components/ui/JobStatus'
import { startScan } from '@/lib/api'
import { Shield, Zap, Globe, Database } from 'lucide-react'

export default function HomePage() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScan = async (url: string, deepScan: boolean) => {
    setLoading(true)
    setError('')
    setJobId(null)
    try {
      const res = await startScan(url, deepScan)
      setJobId(res.job_id)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Hero */}
        <div className="text-center mb-12 stagger">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/8 border border-accent/15 text-accent text-xs mb-6">
            <Shield className="w-3.5 h-3.5" />
            Reconnaissance Tool — Phase 3
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Backend{' '}
            <span className="text-accent">Discovery</span>
            <br />Tool
          </h1>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            วิเคราะห์เว็บไซต์เพื่อค้นหา API Endpoint, Backend URL
            และ Technology Stack โดยอัตโนมัติ
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { icon: Globe, label: 'HTML Scanning' },
            { icon: Database, label: 'DNS Enumeration' },
            { icon: Shield, label: 'SSRF Protection' },
            { icon: Zap, label: 'Deep Scan (Selenium)' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/4 border border-white/8 text-white/50 text-xs">
              <Icon className="w-3 h-3" />
              {label}
            </span>
          ))}
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-6 items-start max-w-5xl mx-auto">
          {/* Left: Form */}
          <div>
            <ScanForm onScan={handleScan} loading={loading} />

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-danger/8 border border-danger/20">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right: Result */}
          <div>
           
{jobId ? (
  <JobStatus key={jobId} jobId={jobId} />
) : (
  <EmptyState />
)}
          </div>
        </div>
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card-glow bg-bg-card rounded-2xl p-12 border border-white/5 flex flex-col items-center justify-center text-center min-h-[400px]">
      <div className="w-16 h-16 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center mb-6">
        <Shield className="w-8 h-8 text-accent/40" />
      </div>
      <p className="text-white/30 text-sm font-medium mb-2">รอการสแกน</p>
      <p className="text-white/20 text-xs max-w-48">
        กรอก URL และกด "เริ่มสแกน" เพื่อวิเคราะห์เว็บไซต์
      </p>
    </div>
  )
}
