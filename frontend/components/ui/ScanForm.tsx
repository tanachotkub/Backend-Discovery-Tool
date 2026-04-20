'use client'
import { useState } from 'react'
import { Search, Zap, Shield, ChevronRight, Globe } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onScan: (url: string, deepScan: boolean) => void
  loading: boolean
}

export default function ScanForm({ onScan, loading }: Props) {
  const [url, setUrl] = useState('')
  const [deepScan, setDeepScan] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    onScan(url.trim(), deepScan)
  }

  return (
    <div className="card-glow bg-bg-card rounded-2xl p-8 border border-white/5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Globe className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-white font-semibold">สแกนเว็บไซต์</h2>
          <p className="text-white/40 text-sm">ค้นหา API Endpoint และ Backend URL</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm text-white/60 font-medium">URL เป้าหมาย</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
              className={clsx(
                'w-full pl-11 pr-4 py-3.5 rounded-xl text-sm',
                'bg-bg-elevated border border-white/8 text-white placeholder-white/25',
                'focus:outline-none focus:border-accent/50 focus:bg-bg-elevated',
                'transition-all duration-200',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            />
          </div>
        </div>

        {/* Scan Mode Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-bg-elevated border border-white/5">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              deepScan ? 'bg-accent/15 border border-accent/25' : 'bg-white/5 border border-white/10'
            )}>
              {deepScan ? <Zap className="w-4 h-4 text-accent" /> : <Shield className="w-4 h-4 text-white/40" />}
            </div>
            <div>
              <p className="text-sm text-white font-medium">
                {deepScan ? 'Deep Scan' : 'Basic Scan'}
              </p>
              <p className="text-xs text-white/35 mt-0.5">
                {deepScan
                  ? 'เปิด Browser จริง + ดักจับ Network Calls'
                  : 'วิเคราะห์ HTML + DNS + Headers'}
              </p>
            </div>
          </div>

          {/* Toggle */}
          <button
            type="button"
            onClick={() => setDeepScan(!deepScan)}
            className={clsx(
              'relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none',
              deepScan ? 'bg-accent' : 'bg-white/10'
            )}
          >
            <span className={clsx(
              'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300',
              deepScan ? 'left-6' : 'left-1'
            )} />
          </button>
        </div>

        {/* Deep scan warning */}
        {deepScan && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-warning/5 border border-warning/15">
            <Zap className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
            <p className="text-xs text-warning/80">
              Deep Scan ใช้เวลา 10–30 วินาที เพราะต้องเปิด Browser จริงและรอ JavaScript โหลด
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className={clsx(
            'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-medium text-sm transition-all duration-200',
            loading || !url.trim()
              ? 'bg-white/5 text-white/25 cursor-not-allowed border border-white/5'
              : 'bg-accent text-bg hover:bg-accent-hover shadow-lg shadow-accent/20 hover:shadow-accent/30'
          )}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              กำลังสร้าง Job...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              เริ่มสแกน
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
