'use client'
import { useState } from 'react'
import { Search, Zap, Shield, ChevronRight, Globe, Lock, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import { AuthConfig, Cookie } from '@/types'

interface Props {
  onScan: (url: string, deepScan: boolean, auth?: AuthConfig) => void
  loading: boolean
}

export default function ScanForm({ onScan, loading }: Props) {
  const [url, setUrl] = useState('')
  const [deepScan, setDeepScan] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [cookies, setCookies] = useState<Cookie[]>([{ name: '', value: '', domain: '' }])
  const [token, setToken] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    // Build auth config ถ้ามี
    let auth: AuthConfig | undefined

    const validCookies = cookies.filter(c => c.name.trim() && c.value.trim())
    const headers: Record<string, string> = {}
    if (token.trim()) {
      headers['Authorization'] = `Bearer ${token.trim()}`
    }

    if (validCookies.length > 0 || Object.keys(headers).length > 0) {
      auth = { cookies: validCookies, headers }
    }

    onScan(url.trim(), deepScan, auth)
  }

  const addCookie = () => {
    setCookies([...cookies, { name: '', value: '', domain: '' }])
  }

  const removeCookie = (index: number) => {
    setCookies(cookies.filter((_, i) => i !== index))
  }

  const updateCookie = (index: number, field: keyof Cookie, value: string) => {
    const updated = [...cookies]
    updated[index] = { ...updated[index], [field]: value }
    setCookies(updated)
  }

  const hasAuth = cookies.some(c => c.name && c.value) || token.trim()

  return (
    <div className="card rounded-2xl p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-ink font-semibold">สแกนเว็บไซต์</h2>
          <p className="text-ink-muted text-sm">ค้นหา API Endpoint และ Backend URL</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        {/* Scan Mode */}
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
              'relative w-11 h-6 rounded-full transition-all duration-300',
              deepScan ? 'bg-violet-600' : 'bg-ink-faint'
            )}
          >
            <span className={clsx(
              'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300',
              deepScan ? 'left-6' : 'left-1'
            )} />
          </button>
        </div>

        {/* ✅ Auth Section */}
        <div className="rounded-xl border border-ink-faint overflow-hidden">
          {/* Toggle Header */}
          <button
            type="button"
            onClick={() => setShowAuth(!showAuth)}
            className={clsx(
              'w-full flex items-center justify-between p-4 transition-colors',
              showAuth ? 'bg-emerald-50' : 'bg-surface-elevated hover:bg-surface-elevated/80'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                showAuth ? 'bg-emerald-600' : 'bg-ink-faint'
              )}>
                <Lock className={clsx('w-4 h-4', showAuth ? 'text-white' : 'text-ink-subtle')} />
              </div>
              <div className="text-left">
                <p className="text-sm text-ink font-medium flex items-center gap-2">
                  Authenticated Scan
                  {hasAuth && (
                    <span className="badge badge-success text-xs">Active</span>
                  )}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  ใส่ Cookies / Token เพื่อ scan หลัง login
                </p>
              </div>
            </div>
            {showAuth
              ? <ChevronUp className="w-4 h-4 text-ink-subtle" />
              : <ChevronDown className="w-4 h-4 text-ink-subtle" />}
          </button>

          {/* Auth Form */}
          {showAuth && (
            <div className="p-4 border-t border-ink-faint space-y-4">

              {/* Bearer Token */}
              <div className="space-y-2">
                <label className="text-xs text-ink-muted font-medium">
                  Bearer Token (Authorization Header)
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  className="w-full px-3 py-2.5 rounded-lg text-xs font-mono bg-surface border border-ink-faint text-ink placeholder-ink-subtle focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>

              {/* Cookies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-ink-muted font-medium">Cookies</label>
                  <button
                    type="button"
                    onClick={addCookie}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    เพิ่ม Cookie
                  </button>
                </div>

                <div className="space-y-2">
                  {cookies.map((cookie, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cookie.name}
                        onChange={e => updateCookie(i, 'name', e.target.value)}
                        placeholder="ชื่อ Cookie"
                        className="w-1/3 px-3 py-2 rounded-lg text-xs font-mono bg-surface border border-ink-faint text-ink placeholder-ink-subtle focus:outline-none focus:border-primary-400 transition-all"
                      />
                      <input
                        type="text"
                        value={cookie.value}
                        onChange={e => updateCookie(i, 'value', e.target.value)}
                        placeholder="ค่า Cookie"
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-mono bg-surface border border-ink-faint text-ink placeholder-ink-subtle focus:outline-none focus:border-primary-400 transition-all"
                      />
                      {cookies.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCookie(i)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-ink-subtle hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Guide */}
              <div className="p-3 rounded-lg bg-primary-50 border border-primary-100">
                <p className="text-xs text-primary-700 font-medium mb-1">วิธีดึง Cookies จาก Browser</p>
                <ol className="text-xs text-primary-600 space-y-0.5 list-decimal list-inside">
                  <li>เปิดเว็บที่ login แล้วใน browser</li>
                  <li>กด F12 → Application → Cookies</li>
                  <li>copy ชื่อและค่าของ cookie ที่ต้องการ</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Deep scan warning */}
        {deepScan && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <Zap className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Deep Scan ใช้เวลา 10–30 วินาที เพราะต้องเปิด Browser จริง
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
              {hasAuth && <Lock className="w-4 h-4" />}
              {!hasAuth && <Search className="w-4 h-4" />}
              {hasAuth ? 'Authenticated Scan' : 'เริ่มสแกน'}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}