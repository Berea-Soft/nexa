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
  /**
   * When true the floating button and overlay UI will only be created
   * when running in a development environment. Defaults to true.
   */
  devOnly?: boolean
  /** Size in pixels for the floating button (width & height). Default 48 */
  floatingButtonSize?: number
  /** Offset in pixels from the viewport edges. Default 24 */
  floatingButtonOffset?: number
  /** Theme for the floating button. 'inherit' uses overlay theme. Default 'inherit' */
  floatingButtonTheme?: 'inherit' | 'dark' | 'light'
  /** Branding name shown in the header. Default 'Nexa DevTools' */
  branding?: string
  /** URL or base64 for the logo icon. */
  icon?: string
}
