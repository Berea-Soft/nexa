export interface TrackedRequest {
  id: string
  method: string
  url: string
  status?: number
  duration: number
  timestamp: number
  cached: boolean
  ok: boolean
  code?: string
  headers: Record<string, string>
  body?: unknown
  responseHeaders?: Record<string, string>
  retryCount: number
}

export interface DevMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cachedRequests: number
  avgDuration: number
  maxDuration: number
  minDuration: number
  requestsPerSecond: number
  slowestRequests: TrackedRequest[]
}

export interface DevOverlayConfig {
  enabled?: boolean
  maxHistory?: number
  keyboardShortcut?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  theme?: 'dark' | 'light'
}
