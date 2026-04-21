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
<div className="card rounded-2xl p-8 h-full flex flex-col">      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-ink font-semibold">สแกนเว็บไซต์</h2>
          <p className="text-ink-muted text-sm">ค้นหา API Endpoint และ Backend URL</p>
        </div>
      </div>

<form onSubmit={handleSubmit} className="space-y-5"> {/* ← เอา flex flex-col flex-1 ออก */}
        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm text-ink-muted font-medium">URL เป้าหมาย</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
              className={clsx(
                'w-full pl-11 pr-4 py-3.5 rounded-xl text-sm',
                'bg-surface-elevated border border-ink-faint text-ink placeholder-ink-subtle',
                'focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
                'transition-all duration-200',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            />
          </div>
        </div>

        {/* Scan Mode Toggle */}
        <div className={clsx(
          'flex items-center justify-between p-4 rounded-xl border transition-all',
          deepScan ? 'bg-violet-50 border-violet-200' : 'bg-surface-elevated border-ink-faint'
        )}>
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              deepScan ? 'bg-violet-600' : 'bg-ink-faint'
            )}>
              {deepScan
                ? <Zap className="w-4 h-4 text-white" />
                : <Shield className="w-4 h-4 text-ink-subtle" />}
            </div>
            <div>
              <p className="text-sm text-ink font-medium">
                {deepScan ? 'Deep Scan' : 'Basic Scan'}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">
                {deepScan
                  ? 'เปิด Browser จริง + ดักจับ Network Calls'
                  : 'วิเคราะห์ HTML + DNS + Headers'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDeepScan(!deepScan)}
            className={clsx(
              'relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none',
              deepScan ? 'bg-violet-600' : 'bg-ink-faint'
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
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <Zap className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Deep Scan ใช้เวลา 10–30 วินาที เพราะต้องเปิด Browser จริงและรอ JavaScript โหลด
            </p>
          </div>
        )}

        {/* Submit */}
  {/* Submit — เอา mt-auto และ div wrapper ออก */}
  <button
    type="submit"
    disabled={loading || !url.trim()}
    className={clsx(
      'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-medium text-sm transition-all duration-200',
      loading || !url.trim()
        ? 'bg-ink-faint text-ink-subtle cursor-not-allowed'
        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-soft hover:shadow-medium'
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
