'use client'
import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import { getHistory, deleteHistory } from '@/lib/api'
import { ScanHistory, HistoryResponse } from '@/types'
import {
  History, Trash2, ChevronLeft, ChevronRight,
  Globe, Clock, Zap, Search, AlertCircle, CheckCircle
} from 'lucide-react'
import clsx from 'clsx'

export default function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

const fetchHistory = useCallback(async () => {
  setLoading(true)
  try {
    const result = await getHistory(page, 10, statusFilter)
    console.log('history result:', result) // ← เพิ่มตรงนี้
    setData(result)
  } catch (e) {
    console.error('history error:', e)     // ← เพิ่มตรงนี้
    setData(null)
  } finally {
    setLoading(false)
  }
}, [page, statusFilter])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await deleteHistory(id)
      fetchHistory()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <History className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ประวัติการสแกน</h1>
              <p className="text-white/40 text-sm">
                {data ? `พบ ${data.total} รายการ` : 'กำลังโหลด...'}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            {['', 'success', 'error'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  statusFilter === s
                    ? 'bg-accent/15 text-accent border border-accent/25'
                    : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                {s === '' ? 'ทั้งหมด' : s === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card-glow bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : !data?.data?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="w-10 h-10 text-white/10 mb-4" />
              <p className="text-white/30 text-sm">ยังไม่มีประวัติการสแกน</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-xs text-white/30 font-medium uppercase tracking-wider">
                <div className="col-span-4">URL</div>
                <div className="col-span-2 text-center">สถานะ</div>
                <div className="col-span-2 text-center">Endpoints</div>
                <div className="col-span-2 text-center">โหมด</div>
                <div className="col-span-1 text-center">เวลา</div>
                <div className="col-span-1 text-center">ลบ</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/4">
                {data.data.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    deleting={deleting === item.id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
                  <p className="text-white/30 text-xs">
                    หน้า {data.page} จาก {data.total_pages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                      disabled={page === data.total_pages}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white disabled:opacity-30 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function HistoryRow({ item, onDelete, deleting }: {
  item: ScanHistory
  onDelete: (id: number) => void
  deleting: boolean
}) {
  const totalEndpoints = item.found_endpoints_count + item.js_endpoints_count + item.network_calls_count
  const date = new Date(item.created_at)

  return (
    <div className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/2 transition-colors group items-center">
      {/* URL */}
      <div className="col-span-4 flex items-center gap-2.5 min-w-0">
        <Globe className="w-3.5 h-3.5 text-white/20 shrink-0" />
        <span className="text-white/70 text-xs font-mono truncate">{item.url}</span>
      </div>

      {/* Status */}
      <div className="col-span-2 flex justify-center">
        <span className={clsx('badge text-xs', item.status === 'success' ? 'badge-success' : 'badge-error')}>
          {item.status === 'success'
            ? <><CheckCircle className="w-3 h-3" />สำเร็จ</>
            : <><AlertCircle className="w-3 h-3" />ล้มเหลว</>}
        </span>
      </div>

      {/* Endpoints count */}
      <div className="col-span-2 text-center">
        <span className="text-accent font-bold text-sm">{totalEndpoints}</span>
        <span className="text-white/25 text-xs ml-1">รายการ</span>
      </div>

      {/* Mode */}
      <div className="col-span-2 flex justify-center">
        <span className={clsx(
          'badge text-xs',
          item.scan_mode === 'deep'
            ? 'badge-processing'
            : 'bg-white/5 text-white/35 border border-white/10'
        )}>
          {item.scan_mode === 'deep' ? <><Zap className="w-3 h-3" />Deep</> : 'Basic'}
        </span>
      </div>

      {/* Duration */}
      <div className="col-span-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <Clock className="w-3 h-3 text-white/20" />
          <span className="text-white/40 text-xs">{item.scan_duration}</span>
        </div>
      </div>

      {/* Delete */}
      <div className="col-span-1 flex justify-center">
        <button
          onClick={() => onDelete(item.id)}
          disabled={deleting}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-danger/10 text-white/20 hover:text-danger transition-all disabled:opacity-30"
        >
          {deleting
            ? <div className="w-3.5 h-3.5 border border-danger/30 border-t-danger rounded-full animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}
