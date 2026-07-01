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
  /** Fixed-size ring buffer; `buffer[writeIndex]` is the next slot to overwrite. */
  private buffer: TrackedRequest[] = []
  private writeIndex = 0
  private count = 0
  private maxHistory: number
  private listeners: Set<(request: TrackedRequest) => void> = new Set()
  private startTime = Date.now()
  private config: Required<DevOverlayConfig>

  constructor(config: DevOverlayConfig = {}) {
    this.maxHistory = Math.max(1, config.maxHistory ?? 500)
    this.buffer = new Array(this.maxHistory)
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
      branding: config.branding ?? 'Nexa DevTools',
      icon:
        config.icon ??
        'https://raw.githubusercontent.com/Berea-Soft/nexa/refs/heads/main/src/assets/faviconNew.png',
    }
  }

  track(request: Omit<TrackedRequest, 'id' | 'timestamp'>): TrackedRequest {
    const tracked: TrackedRequest = {
      ...request,
      id: this.generateId(),
      timestamp: Date.now(),
    }

    this.buffer[this.writeIndex] = tracked
    this.writeIndex = (this.writeIndex + 1) % this.maxHistory
    this.count = Math.min(this.count + 1, this.maxHistory)

    for (const listener of this.listeners) {
      listener(tracked)
    }

    return tracked
  }

  /** Returns a fresh array, newest first. O(n) — safe to call on every render. */
  getHistory(): TrackedRequest[] {
    const result: TrackedRequest[] = []
    for (let i = 0; i < this.count; i++) {
      const index =
        (((this.writeIndex - 1 - i) % this.maxHistory) + this.maxHistory) %
        this.maxHistory
      result.push(this.buffer[index])
    }
    return result
  }

  getMetrics(): DevMetrics {
    const history = this.getHistory()
    const durations = history.map((r) => r.duration)
    const elapsed = (Date.now() - this.startTime) / 1000

    return {
      totalRequests: history.length,
      successfulRequests: history.filter((r) => r.ok).length,
      failedRequests: history.filter((r) => !r.ok).length,
      cachedRequests: history.filter((r) => r.cached).length,
      avgDuration: durations.length
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      maxDuration: durations.length ? Math.max(...durations) : 0,
      minDuration: durations.length ? Math.min(...durations) : 0,
      requestsPerSecond: elapsed > 0 ? history.length / elapsed : 0,
      slowestRequests: history
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5),
    }
  }

  clear(): void {
    this.buffer = new Array(this.maxHistory)
    this.writeIndex = 0
    this.count = 0
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
    // Keep internal maxHistory (and the ring buffer's capacity) in sync
    const newMaxHistory = Math.max(1, this.config.maxHistory)
    if (newMaxHistory !== this.maxHistory) {
      this.resizeHistory(newMaxHistory)
    }
    // persist updated config
    try {
      savePersistedConfig(this.config)
    } catch {}
    return this.config
  }

  /** Rebuilds the ring buffer at a new capacity, keeping the most recent entries. */
  private resizeHistory(newMaxHistory: number): void {
    const newestFirst = this.getHistory().slice(0, newMaxHistory)
    this.maxHistory = newMaxHistory
    this.buffer = new Array(newMaxHistory)
    this.writeIndex = 0
    this.count = 0
    for (let i = newestFirst.length - 1; i >= 0; i--) {
      this.buffer[this.writeIndex] = newestFirst[i]
      this.writeIndex = (this.writeIndex + 1) % this.maxHistory
      this.count++
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
}
