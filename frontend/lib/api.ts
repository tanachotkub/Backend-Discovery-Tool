import axios from 'axios'
import { Job, HistoryResponse, ScanHistory } from '@/types' // ← ต้องมี ScanHistory ด้วย

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

export async function startScan(url: string, deepScan: boolean): Promise<{ job_id: string; status: string }> {
  const res = await api.post('/api/scan', { url, deep_scan: deepScan })
  return res.data
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await api.get(`/api/jobs/${jobId}`)
  return res.data.data
}

export async function getHistory(page = 1, perPage = 10, status = ''): Promise<HistoryResponse> {
  const res = await api.get('/api/scans', { params: { page, per_page: perPage, status } })
  
  // Backend ส่งมาแบบนี้
  // {
  //   status: 'success',
  //   data: [...],        ← array ตรงๆ
  //   total: 10,
  //   page: 1,
  //   per_page: 10,
  //   total_pages: 2
  // }
  
  const { data, total, page: p, per_page, total_pages } = res.data
  
  return {
    data,
    total,
    page: p,
    per_page,
    total_pages,
  }
}

// ✅ เพิ่มใหม่
export async function getHistoryById(id: number): Promise<ScanHistory> {
  const res = await api.get(`/api/scans/${id}`)
  return res.data.data
}

export async function deleteHistory(id: number): Promise<void> {
  await api.delete(`/api/scans/${id}`)
}

export async function exportPDF(id: number): Promise<void> {
  const res = await api.get(`/api/scans/${id}/export`, {
    responseType: 'blob',  // ← รับเป็น binary
  })

  // สร้าง download link
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `scan-report-${id}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}