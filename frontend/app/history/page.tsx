'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { getHistory, deleteHistory } from '@/lib/api'
import { ScanHistory, HistoryResponse } from '@/types'
import {
  History, Trash2, ChevronLeft, ChevronRight,
  Globe, Clock, Zap, Search, AlertCircle,
  CheckCircle, Eye
} from 'lucide-react'
import clsx from 'clsx'
import Swal from 'sweetalert2'

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
      setData(result)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleDelete = async (id: number, url: string) => {
  // ยืนยันรอบที่ 1
  const first = await Swal.fire({
    title: 'ลบประวัติการสแกน?',
    html: `<p style="font-size:13px;color:#64748b;margin-top:4px">
             <code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:12px">
               ${url}
             </code>
           </p>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่ ลบเลย',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl',
      cancelButton: 'rounded-xl',
    },
  })

  if (!first.isConfirmed) return

  // ยืนยันรอบที่ 2
  const second = await Swal.fire({
    title: 'แน่ใจหรือไม่?',
    text: 'ข้อมูลจะถูกลบถาวร ไม่สามารถกู้คืนได้',
    icon: 'error',
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน ลบถาวร',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl',
      cancelButton: 'rounded-xl',
    },
  })

  if (!second.isConfirmed) return

  // ลบจริง
  setDeleting(id)
  try {
    await deleteHistory(id)
    
    // แจ้งสำเร็จ
    await Swal.fire({
      title: 'ลบแล้ว!',
      text: 'ประวัติการสแกนถูกลบเรียบร้อย',
      icon: 'success',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#2563eb',
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl',
      },
    })

    fetchHistory()
  } catch {
    Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถลบได้ กรุณาลองใหม่',
      icon: 'error',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#2563eb',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl',
      },
    })
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
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">ประวัติการสแกน</h1>
              <p className="text-ink-muted text-sm">
                {data ? `พบ ${data.total} รายการ` : 'กำลังโหลด...'}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            {[
              { val: '', label: 'ทั้งหมด' },
              { val: 'success', label: 'สำเร็จ' },
              { val: 'error', label: 'ล้มเหลว' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => { setStatusFilter(val); setPage(1) }}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  statusFilter === val
                    ? 'bg-primary-600 text-white border-primary-600 shadow-soft'
                    : 'text-ink-muted hover:text-ink bg-white border-ink-faint hover:border-primary-300'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : !data?.data?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="w-10 h-10 text-ink-faint mb-4" />
              <p className="text-ink-muted text-sm font-medium">ยังไม่มีประวัติการสแกน</p>
              <p className="text-ink-subtle text-xs mt-1">เริ่มสแกนเว็บไซต์แรกของคุณได้เลย</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-surface-elevated border-b border-ink-faint/50 text-xs text-ink-muted font-semibold uppercase tracking-wider">
                <div className="col-span-4">URL</div>
                <div className="col-span-2 text-center">สถานะ</div>
                <div className="col-span-2 text-center">Endpoints</div>
                <div className="col-span-1 text-center">โหมด</div>
                <div className="col-span-1 text-center">เวลา</div>
                <div className="col-span-2 text-center">จัดการ</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-ink-faint/30">
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
                <div className="flex items-center justify-between px-6 py-4 bg-surface-elevated border-t border-ink-faint/50">
                  <p className="text-ink-muted text-xs">
                    หน้า {data.page} จาก {data.total_pages}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg hover:bg-primary-50 text-ink-muted hover:text-primary-600 disabled:opacity-30 transition-all border border-transparent hover:border-primary-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                      disabled={page === data.total_pages}
                      className="p-1.5 rounded-lg hover:bg-primary-50 text-ink-muted hover:text-primary-600 disabled:opacity-30 transition-all border border-transparent hover:border-primary-200"
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
  onDelete: (id: number, url: string) => void  // ← เพิ่ม url
  deleting: boolean
})  {
  const router = useRouter()
  const total = item.found_endpoints_count + item.js_endpoints_count + item.network_calls_count

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-primary-50/30 transition-colors group items-center">
      {/* URL */}
      <div className="col-span-4 flex items-center gap-2.5 min-w-0">
        <Globe className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
        <span className="text-ink text-xs font-mono truncate">{item.url}</span>
      </div>

      {/* Status */}
      <div className="col-span-2 flex justify-center">
        <span className={clsx('badge text-xs', item.status === 'success' ? 'badge-success' : 'badge-error')}>
          {item.status === 'success'
            ? <><CheckCircle className="w-3 h-3" />สำเร็จ</>
            : <><AlertCircle className="w-3 h-3" />ล้มเหลว</>}
        </span>
      </div>

      {/* Endpoints */}
      <div className="col-span-2 text-center">
        <span className="text-primary-600 font-bold text-sm">{total}</span>
        <span className="text-ink-subtle text-xs ml-1">รายการ</span>
      </div>

      {/* Mode */}
      <div className="col-span-1 flex justify-center">
        <span className={clsx('badge text-xs', item.scan_mode === 'deep' ? 'badge-deep' : 'badge-basic')}>
          {item.scan_mode === 'deep' ? <><Zap className="w-3 h-3" />Deep</> : 'Basic'}
        </span>
      </div>

      {/* Duration */}
      <div className="col-span-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <Clock className="w-3 h-3 text-ink-subtle" />
          <span className="text-ink-muted text-xs">{item.scan_duration}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex justify-center items-center gap-2">
        <button
          onClick={() => router.push(`/history/${item.id}`)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-50 border border-primary-200 text-primary-600 hover:bg-primary-100 text-xs font-medium transition-all"
        >
          <Eye className="w-3 h-3" />
          รายละเอียด
        </button>
        <button
        onClick={() => onDelete(item.id, item.url)}  // ← ส่ง url ด้วย
          disabled={deleting}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-ink-subtle hover:text-red-500 border border-transparent hover:border-red-200 transition-all disabled:opacity-30"
        >
          {deleting
            ? <div className="w-3.5 h-3.5 border border-red-300 border-t-red-500 rounded-full animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}
