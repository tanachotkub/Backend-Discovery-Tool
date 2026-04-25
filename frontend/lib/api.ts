import axios from 'axios'
import { Job, HistoryResponse, ScanHistory, AuthConfig } from '@/types' // ← ต้องมี ScanHistory ด้วย

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

export async function startScan(
  url: string,
  deepScan: boolean,
  auth?: AuthConfig
): Promise<{ job_id: string; status: string; authenticated: boolean }> {
  const res = await api.post('/api/scan', {
    url,
    deep_scan: deepScan,
    auth: auth ?? null,
  })
  return res.data
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await api.get(`/api/jobs/${jobId}`)
  return res.data.data
}

export async function getHistory(page = 1, perPage = 10, status = ''): Promise<HistoryResponse> {
  const res = await api.get('/api/scans', { params: { page, per_page: perPage, status } })  
  const { data, total, page: p, per_page, total_pages } = res.data
  
  return {
    data,
    total,
    page: p,
    per_page,
    total_pages,
  }
}

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

export interface DashboardStats {
  total_scans: number
  total_endpoints: number
  success_rate: number
  basic_scans: number
  deep_scans: number
  scan_per_day: { date: string; count: number }[]
  top_urls: { url: string; count: number }[]
  total_html_endpoints: number
  total_dns_results: number
  total_js_endpoints: number
  total_network_calls: number
}
export async function getDashboardStats(days = 7): Promise<DashboardStats> {
  const res = await api.get('/api/dashboard/stats', { params: { days } })
  return res.data.data
}