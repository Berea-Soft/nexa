/**
 * Server-Sent Events (SSE) client with automatic reconnection and plugin support.
 */

import type {
  SSEOptions,
  ISSEClient,
  RealtimeMessageEvent,
  RealtimeSendError,
  Result,
} from '../types/index.js'
import { Err } from '../types/index.js'
import { PluginManager } from '../utils/index.js'

/**
 * Check if running in Node.js environment
 */
function isNode(): boolean {
  return (
    typeof window === 'undefined' &&
    typeof process !== 'undefined' &&
    process.versions?.node !== undefined
  )
}

/**
 * Browser SSE client implementation using EventSource
 */
class BrowserSSEClient implements ISSEClient {
  private url: string
  private options: SSEOptions
  private _source: EventSource | null = null
  private pluginManager: PluginManager
  private status: 'connecting' | 'open' | 'closing' | 'closed' = 'closed'
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private stats = {
    messagesSent: 0, // SSE is receive-only
    messagesReceived: 0,
    connectionTime: 0,
    reconnectAttempts: 0,
  }
  private connectionStartTime = 0
  private listeners = {
    open: new Set<(event: Event) => void>(),
    close: new Set<() => void>(),
    error: new Set<(event: Event) => void>(),
    message: new Set<(event: RealtimeMessageEvent) => void>(),
    event: new Map<string, Set<(data: unknown) => void>>(),
  }
  private _lastEventId: string | null = null
  private nativeEventListeners = new Map<
    string,
    Map<(data: unknown) => void, (e: MessageEvent) => void>
  >()

  constructor(url: string, options: SSEOptions = {}) {
    this.url = url
    this.options = options
    this.pluginManager = new PluginManager()
  }

  private updateStatus(
    status: 'connecting' | 'open' | 'closing' | 'closed',
  ): void {
    this.status = status
    if (status === 'open') {
      this.connectionStartTime = Date.now()
    } else if (status === 'closed' && this.connectionStartTime > 0) {
      this.stats.connectionTime += Date.now() - this.connectionStartTime
      this.connectionStartTime = 0
    }
  }

  async connect(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'open') {
      return
    }

    this.updateStatus('connecting')
    this.pluginManager.emit('sse:connect:start', this.url)

    return new Promise((resolve, reject) => {
      const timeout = this.options.timeout ?? 10000
      const timeoutTimer = setTimeout(() => {
        this.updateStatus('closed')
        this._source?.close()
        this._source = null
        this.nativeEventListeners.clear()
        const error = new Error(`SSE connection timeout after ${timeout}ms`)
        this.emitError(error)
        reject(error)
      }, timeout)

      try {
        // EventSource doesn't support custom headers or POST requests in standard API
        // For advanced features, we'd need to use fetch with streaming
        this._source = new EventSource(this.url)

        this._source.onopen = (event) => {
          clearTimeout(timeoutTimer)
          this.updateStatus('open')
          this.reconnectAttempt = 0
          this.emitOpen(event)
          this.options.onOpen?.(event)
          this.pluginManager.emit('sse:connect:success', this.url)
          resolve()
        }

        this._source.onerror = (event) => {
          // EventSource doesn't provide close event, only error
          // We'll treat certain error states as disconnections
          clearTimeout(timeoutTimer)
          this.updateStatus('closed')
          this.emitError(event)
          this.options.onError?.(event)
          this.pluginManager.emit('sse:connect:error', this.url, event)

          if (this._source?.readyState === EventSource.CLOSED) {
            this.emitClose()
            this.options.onClose?.()
            this.scheduleReconnect()
          }
          reject(event)
        }

        // Listen for messages
        this._source.onmessage = (event) => {
          this.stats.messagesReceived++
          this._lastEventId = event.lastEventId || this._lastEventId

          const messageEvent: RealtimeMessageEvent = {
            data: this.tryParseData(event.data),
            raw: event.data,
            type: event.type || 'message',
            timestamp: Date.now(),
          }

          this.emitMessage(messageEvent)
          this.pluginManager.emit(
            'sse:message:received',
            this.url,
            messageEvent,
          )

          // Also emit to event-specific listeners
          const eventType = event.type || 'message'
          const eventListeners = this.listeners.event.get(eventType)
          if (eventListeners) {
            for (const listener of eventListeners) {
              listener(messageEvent.data)
            }
          }
        }

        // Re-attach named-event listeners registered before this (re)connect
        this.attachAllNamedListeners()
      } catch (error) {
        clearTimeout(timeoutTimer)
        this.updateStatus('closed')
        this.pluginManager.emit('sse:connect:error', this.url, error)
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.cleanup()
    if (this._source) {
      this.updateStatus('closing')
      this._source.close()
      this._source = null
      this.nativeEventListeners.clear()
      this.updateStatus('closed')
      this.emitClose()
      this.options.onClose?.()
    }
  }

  send(_data: string | ArrayBuffer | Blob): Result<void, RealtimeSendError> {
    return Err({
      message:
        'SSE is a receive-only protocol. Use HTTP requests to send data to server.',
      code: 'UNSUPPORTED',
    })
  }

  onMessage<T = unknown>(
    callback: (event: RealtimeMessageEvent<T>) => void,
  ): () => void {
    this.listeners.message.add(
      callback as (event: RealtimeMessageEvent) => void,
    )
    return () =>
      this.listeners.message.delete(
        callback as (event: RealtimeMessageEvent) => void,
      )
  }

  onOpen(callback: (event: Event) => void): () => void {
    this.listeners.open.add(callback)
    return () => this.listeners.open.delete(callback)
  }

  onClose(callback: () => void): () => void {
    this.listeners.close.add(callback)
    return () => this.listeners.close.delete(callback)
  }

  onError(callback: (event: Event) => void): () => void {
    this.listeners.error.add(callback)
    return () => this.listeners.error.delete(callback)
  }

  private attachNamedListener(
    event: string,
    callback: (data: unknown) => void,
  ): void {
    if (!this._source) {
      return
    }
    const nativeListener = (e: MessageEvent) => {
      const messageEvent: RealtimeMessageEvent = {
        data: this.tryParseData(e.data),
        raw: e.data,
        type: event,
        timestamp: Date.now(),
      }
      callback(messageEvent.data)
    }
    this._source.addEventListener(event, nativeListener)
    if (!this.nativeEventListeners.has(event)) {
      this.nativeEventListeners.set(event, new Map())
    }
    this.nativeEventListeners.get(event)!.set(callback, nativeListener)
  }

  private detachNamedListener(
    event: string,
    callback: (data: unknown) => void,
  ): void {
    const nativeListener = this.nativeEventListeners.get(event)?.get(callback)
    if (nativeListener) {
      this._source?.removeEventListener(event, nativeListener)
      this.nativeEventListeners.get(event)!.delete(callback)
      if (this.nativeEventListeners.get(event)!.size === 0) {
        this.nativeEventListeners.delete(event)
      }
    }
  }

  private attachAllNamedListeners(): void {
    this.nativeEventListeners.clear()
    for (const [event, callbacks] of this.listeners.event) {
      for (const callback of callbacks) {
        this.attachNamedListener(event, callback)
      }
    }
  }

  onEvent<T = unknown>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.event.has(event)) {
      this.listeners.event.set(event, new Set())
    }
    this.listeners.event.get(event)!.add(callback as (data: unknown) => void)
    this.attachNamedListener(event, callback as (data: unknown) => void)

    return () => {
      const listeners = this.listeners.event.get(event)
      if (listeners) {
        listeners.delete(callback as (data: unknown) => void)
        if (listeners.size === 0) {
          this.listeners.event.delete(event)
        }
      }
      this.detachNamedListener(event, callback as (data: unknown) => void)
    }
  }

  getStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    return this.status
  }

  getStats() {
    return {
      ...this.stats,
      connectionTime:
        this.stats.connectionTime +
        (this.connectionStartTime > 0
          ? Date.now() - this.connectionStartTime
          : 0),
    }
  }

  get lastEventId(): string | null {
    return this._lastEventId
  }

  get source(): EventSource | null {
    return this._source
  }

  private emitOpen(event: Event): void {
    this.pluginManager.emit('sse:open', this.url, event)
    for (const listener of this.listeners.open) {
      listener(event)
    }
  }

  private emitClose(): void {
    this.pluginManager.emit('sse:close', this.url)
    for (const listener of this.listeners.close) {
      listener()
    }
  }

  private emitError(event: Event | Error): void {
    let errorEvent: Event
    if (event instanceof Error) {
      // Create a synthetic error event
      errorEvent = new Event('error')
      ;(errorEvent as unknown as Record<string, unknown>).error = event
    } else {
      errorEvent = event
    }
    this.pluginManager.emit('sse:error', this.url, errorEvent)
    for (const listener of this.listeners.error) {
      listener(errorEvent)
    }
  }

  private emitMessage(event: RealtimeMessageEvent): void {
    this.pluginManager.emit('sse:message', this.url, event)
    for (const listener of this.listeners.message) {
      listener(event)
    }
  }

  private scheduleReconnect(): void {
    if (this.options.reconnect?.enabled === false) {
      return
    }

    const maxAttempts = this.options.reconnect?.maxAttempts ?? Infinity
    if (this.reconnectAttempt >= maxAttempts) {
      this.pluginManager.emit(
        'sse:reconnect:failed',
        this.url,
        this.reconnectAttempt,
      )
      return
    }

    const baseDelay = this.options.reconnect?.baseDelay ?? 1000
    const maxDelay = this.options.reconnect?.maxDelay ?? 30000
    const backoff = baseDelay * Math.pow(2, this.reconnectAttempt)
    // Jitter avoids a thundering herd when many clients reconnect at once.
    const jitter = Math.random() * backoff * 0.1
    const delay = Math.min(maxDelay, backoff + jitter)

    this.reconnectAttempt++
    this.stats.reconnectAttempts = this.reconnectAttempt

    this.options.reconnect?.onReconnecting?.(this.reconnectAttempt, delay)
    this.pluginManager.emit(
      'sse:reconnecting',
      this.url,
      this.reconnectAttempt,
      delay,
    )

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((err) => {
        this.emitError(err instanceof Error ? err : new Error(String(err)))
      })
    }, delay)
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private tryParseData(data: string): unknown {
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  }
}

/**
 * Node.js has no native EventSource implementation. This client is not
 * functional and fails fast at construction time instead of at connect()
 * time so callers don't build up state (listeners, config) against a
 * client that can never connect.
 */
class NodeSSEClient extends BrowserSSEClient {
  constructor(url: string, options: SSEOptions = {}) {
    super(url, options)
    throw new Error(
      "Nexa's SSE client is browser-only (it relies on the native EventSource API). " +
        'Node.js has no built-in EventSource. Use a polyfill (e.g. the "eventsource" package) ' +
        'and pass it via a custom implementation, or run this client in a browser environment.',
    )
  }
}

/**
 * Create an SSE client appropriate for the current environment
 */
export function createSSEClient(
  url: string,
  options: SSEOptions = {},
): ISSEClient {
  if (isNode()) {
    return new NodeSSEClient(url, options)
  }
  return new BrowserSSEClient(url, options)
}
