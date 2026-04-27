'use client'
import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import ScanForm from '@/components/ui/ScanForm'
import JobStatus from '@/components/ui/JobStatus'
import { startScan } from '@/lib/api'
import { Shield, Zap, Globe, Database, AlertCircle } from 'lucide-react'
import { AuthConfig } from '@/types' // ← ต้องมี ScanHistory ด้วย


export default function HomePage() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

const handleScan = async (url: string, deepScan: boolean, auth?: AuthConfig) => {
  setLoading(true)
  setError('')
  setJobId(null)
  try {
    const res = await startScan(url, deepScan, auth) // ← เพิ่ม auth
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

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center stagger">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 border border-primary-200 text-primary-700 text-xs font-medium mb-8">
            <Shield className="w-3.5 h-3.5" />
            Reconnaissance Tool
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl font-bold text-ink mb-5 leading-tight tracking-tight">
            Backend{' '}
            <span className="text-primary-600">Discovery</span>
            {' '}Tool
          </h1>

          {/* Description */}
          <p className="text-ink-muted text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            วิเคราะห์เว็บไซต์เพื่อค้นหา API Endpoint, Backend URL
            และ Technology Stack
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-16">
            {[
              { icon: Globe, label: 'HTML Scanning', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { icon: Database, label: 'DNS Enumeration', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { icon: Shield, label: 'SSRF Protection', color: 'bg-violet-50 text-violet-700 border-violet-200' },
              { icon: Zap, label: 'Deep Scan (Chromium)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            ].map(({ icon: Icon, label, color }) => (
              <span key={label} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium ${color}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

   {/* Main Content */}
<section className="pb-20 px-6">
  <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6 items-stretch"> {/* ← เปลี่ยน items-start → items-stretch */}

    {/* Left: Form */}
    <div className="space-y-4 flex flex-col">
      <ScanForm onScan={handleScan} loading={loading} />
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>

    {/* Right: Result */}
    <div className="flex flex-col"> {/* ← เพิ่ม flex flex-col */}
      {jobId
        ? <JobStatus key={jobId} jobId={jobId} />
        : <EmptyState />}
    </div>
  </div>
</section>

      {/* Footer */}
      <footer className="border-t border-ink-faint/50 py-8 px-6 text-center">
        <p className="text-ink-subtle text-xs">
          Backend Discovery Tool v1.3.1 — ใช้เพื่อการศึกษาและได้รับอนุญาตเท่านั้น
        </p>
      </footer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full">
      <div className="relative mb-6">
        {/* แก้ icon เป็นสีเข้มขึ้น */}
        <div className="w-20 h-20 rounded-2xl bg-primary-100 border-2 border-primary-200 flex items-center justify-center">
          <Shield className="w-9 h-9 text-primary-500" /> {/* เปลี่ยนจาก text-primary-300 → text-primary-500 */}
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
          <span className="text-emerald-600 text-xs font-bold">✓</span>
        </div>
      </div>

      <p className="text-ink font-semibold mb-2">พร้อมสแกน</p>
      <p className="text-ink-muted text-sm max-w-44 leading-relaxed">
        กรอก URL และกดปุ่ม "เริ่มสแกน" เพื่อวิเคราะห์เว็บไซต์
      </p>

      <div className="flex items-center gap-2 mt-8">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-primary-300" />
        ))}
      </div>
    </div>
  )
}