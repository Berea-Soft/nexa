import type { TrackedRequest, DevMetrics, DevOverlayConfig } from './types'

const STORAGE_KEY = 'nexa.devOverlay.config'

export function loadPersistedConfig(): Partial<DevOverlayConfig> {
  try {
    if (typeof localStorage === 'undefined') {
      return {}
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }
    return JSON.parse(raw) as Partial<DevOverlayConfig>
  } catch {
    return {}
  }
}

function savePersistedConfig(cfg: Partial<DevOverlayConfig>): void {
  try {
    if (typeof localStorage === 'undefined') {
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  } catch {}
}

export class RequestTracker {
  private history: TrackedRequest[] = []
  private maxHistory: number
  private listeners: Set<(request: TrackedRequest) => void> = new Set()
  private startTime = Date.now()
  private config: Required<DevOverlayConfig>

  constructor(config: DevOverlayConfig = {}) {
    this.maxHistory = config.maxHistory ?? 500
    this.config = {
      enabled: config.enabled ?? true,
      maxHistory: this.maxHistory,
      keyboardShortcut: config.keyboardShortcut ?? 'ctrl+shift+n',
      position: config.position ?? 'bottom-right',
      theme: config.theme ?? 'dark',
      devOnly: config.devOnly ?? true,
      floatingButtonSize: config.floatingButtonSize ?? 48,
      floatingButtonOffset: config.floatingButtonOffset ?? 24,
      floatingButtonTheme: config.floatingButtonTheme ?? 'inherit',
    }
  }

  track(request: Omit<TrackedRequest, 'id' | 'timestamp'>): TrackedRequest {
    const tracked: TrackedRequest = {
      ...request,
      id: this.generateId(),
      timestamp: Date.now(),
    }

    this.history.unshift(tracked)
    if (this.history.length > this.maxHistory) {
      this.history.pop()
    }

    for (const listener of this.listeners) {
      listener(tracked)
    }

    return tracked
  }

  getHistory(): TrackedRequest[] {
    return this.history
  }

  getMetrics(): DevMetrics {
    const durations = this.history.map((r) => r.duration)
    const elapsed = (Date.now() - this.startTime) / 1000

    return {
      totalRequests: this.history.length,
      successfulRequests: this.history.filter((r) => r.ok).length,
      failedRequests: this.history.filter((r) => !r.ok).length,
      cachedRequests: this.history.filter((r) => r.cached).length,
      avgDuration: durations.length
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      maxDuration: durations.length ? Math.max(...durations) : 0,
      minDuration: durations.length ? Math.min(...durations) : 0,
      requestsPerSecond: elapsed > 0 ? this.history.length / elapsed : 0,
      slowestRequests: [...this.history]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5),
    }
  }

  clear(): void {
    this.history = []
    this.startTime = Date.now()
  }

  onChange(listener: (request: TrackedRequest) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getConfig(): Required<DevOverlayConfig> {
    return this.config
  }

  updateConfig(partial: Partial<DevOverlayConfig>): Required<DevOverlayConfig> {
    this.config = {
      ...this.config,
      ...partial,
    }
    // Keep internal maxHistory in sync
    this.maxHistory = this.config.maxHistory
    // persist updated config
    try {
      savePersistedConfig(this.config)
    } catch {}
    return this.config
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
}
