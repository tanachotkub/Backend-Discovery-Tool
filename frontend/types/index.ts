export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'
export type ScanMode = 'basic' | 'deep'

export interface ScanResult {
  status: string
  url: string
  found_endpoints: string[] | null
  headers: Record<string, string>
  dns_results: string[] | null
  scan_duration: string
  js_endpoints?: string[] | null
  network_calls?: string[] | null
  scan_mode: ScanMode
  error?: string
}

export interface Job {
  id: string
  url: string
  ip_address: string
  status: JobStatus
  result?: ScanResult
  error?: string
  created_at: string
  updated_at: string
}

export interface ScanHistory {
  id: number
  url: string
  status: string
  found_endpoints_count: number
  dns_results_count: number
  scan_duration: string
  result_json: string
  ip_address: string
  job_id: string
  js_endpoints_count: number
  network_calls_count: number
  scan_mode: ScanMode
  created_at: string
}

export interface HistoryResponse {
  data: ScanHistory[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface Cookie {
  name: string
  value: string
  domain?: string
  path?: string
}

export interface AuthConfig {
  cookies: Cookie[]
  headers: Record<string, string>
}

export interface ScanRequest {
  url: string
  deep_scan: boolean
  auth?: AuthConfig
}