/**
 * WebSocket client with automatic reconnection, heartbeat, and plugin support.
 */

import type {
  WebSocketOptions,
  IWebSocketClient,
  RealtimeMessageEvent,
} from '../types/index.js'
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
 * Base realtime client with common functionality
 */
abstract class BaseRealtimeClient {
  protected url: string
  protected options: WebSocketOptions
  protected pluginManager: PluginManager
  protected status: 'connecting' | 'open' | 'closing' | 'closed' = 'closed'
  protected reconnectAttempt = 0
  protected reconnectTimer: ReturnType<typeof setTimeout> | null = null
  protected heartbeatTimer: ReturnType<typeof setInterval> | null = null
  protected stats = {
    messagesSent: 0,
    messagesReceived: 0,
    connectionTime: 0,
    reconnectAttempts: 0,
  }
  private connectionStartTime = 0
  private listeners = {
    open: new Set<(event: Event) => void>(),
    close: new Set<(event?: CloseEvent) => void>(),
    error: new Set<(event: Event) => void>(),
    message: new Set<(event: RealtimeMessageEvent) => void>(),
  }

  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url
    this.options = options
    this.pluginManager = new PluginManager()
  }

  protected updateStatus(
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

  protected emitOpen(event: Event): void {
    this.pluginManager.emit('websocket:open', this.url, event)
    for (const listener of this.listeners.open) {
      listener(event)
    }
  }

  protected emitClose(event?: CloseEvent): void {
    this.pluginManager.emit('websocket:close', this.url, event)
    for (const listener of this.listeners.close) {
      listener(event)
    }
  }

  protected emitError(event: Event | Error): void {
    let errorEvent: Event
    if (event instanceof Error) {
      // Create a synthetic error event
      errorEvent = new Event('error')
      ;(errorEvent as unknown as Record<string, unknown>).error = event
    } else {
      errorEvent = event
    }
    this.pluginManager.emit('websocket:error', this.url, errorEvent)
    for (const listener of this.listeners.error) {
      listener(errorEvent)
    }
  }

  protected emitMessage(event: RealtimeMessageEvent): void {
    this.pluginManager.emit('websocket:message', this.url, event)
    for (const listener of this.listeners.message) {
      listener(event)
    }
  }

  onOpen(callback: (event: Event) => void): () => void {
    this.listeners.open.add(callback)
    return () => this.listeners.open.delete(callback)
  }

  onClose(callback: (event?: CloseEvent) => void): () => void {
    this.listeners.close.add(callback)
    return () => this.listeners.close.delete(callback)
  }

  onError(callback: (event: Event) => void): () => void {
    this.listeners.error.add(callback)
    return () => this.listeners.error.delete(callback)
  }

  onMessage<T = unknown>(
    callback: (event: RealtimeMessageEvent<T>) => void,
  ): () => void {
    // Type assertion needed because Set doesn't support generic type parameters
    this.listeners.message.add(
      callback as (event: RealtimeMessageEvent) => void,
    )
    return () =>
      this.listeners.message.delete(
        callback as (event: RealtimeMessageEvent) => void,
      )
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

  protected scheduleReconnect(): void {
    if (this.options.reconnect?.enabled === false) {
      return
    }

    const maxAttempts = this.options.reconnect?.maxAttempts ?? Infinity
    if (this.reconnectAttempt >= maxAttempts) {
      this.pluginManager.emit(
        'websocket:reconnect:failed',
        this.url,
        this.reconnectAttempt,
      )
      return
    }

    const baseDelay = this.options.reconnect?.baseDelay ?? 1000
    const maxDelay = this.options.reconnect?.maxDelay ?? 30000
    const delay = Math.min(
      maxDelay,
      baseDelay * Math.pow(2, this.reconnectAttempt),
    )

    this.reconnectAttempt++
    this.stats.reconnectAttempts = this.reconnectAttempt

    this.options.reconnect?.onReconnecting?.(this.reconnectAttempt, delay)
    this.pluginManager.emit(
      'websocket:reconnecting',
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

  protected startHeartbeat(): void {
    if (!this.options.heartbeat) {
      return
    }

    const interval = this.options.heartbeat.interval ?? 30000
    const pingMessage = this.options.heartbeat.pingMessage ?? 'ping'
    const pongMessage = this.options.heartbeat.pongMessage ?? 'pong'

    let pongReceived = true

    const checkPong = () => {
      if (!pongReceived) {
        this.pluginManager.emit('websocket:heartbeat:timeout', this.url)
        this.disconnect()
        return
      }
      pongReceived = false
      this.send(pingMessage)
      this.heartbeatTimer = setTimeout(checkPong, interval)
    }

    // Listen for pong messages
    const messageListener = (event: RealtimeMessageEvent) => {
      const data = event.raw
      if (typeof data === 'string' && data === pongMessage) {
        pongReceived = true
      }
    }

    this.onMessage(messageListener)
    this.heartbeatTimer = setTimeout(checkPong, interval)
  }

  protected stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  protected cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeat()
  }

  abstract connect(): Promise<void>
  abstract disconnect(): void
  abstract send(data: string | ArrayBuffer | Blob): void
}

/**
 * Browser WebSocket client implementation
 */
class BrowserWebSocketClient
  extends BaseRealtimeClient
  implements IWebSocketClient
{
  socket: WebSocket | null = null
  private messageTypeListeners = new Map<string, Set<(data: unknown) => void>>()

  constructor(url: string, options: WebSocketOptions = {}) {
    super(url, options)
  }

  async connect(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'open') {
      return
    }

    this.updateStatus('connecting')
    this.pluginManager.emit('websocket:connect:start', this.url)

    return new Promise((resolve, reject) => {
      const timeout = this.options.timeout ?? 10000
      const timeoutTimer = setTimeout(() => {
        this.updateStatus('closed')
        this.socket?.close()
        this.socket = null
        const error = new Error(
          `WebSocket connection timeout after ${timeout}ms`,
        )
        this.emitError(error)
        reject(error)
      }, timeout)

      try {
        this.socket = new WebSocket(this.url, this.options.protocols)

        this.socket.onopen = (event) => {
          clearTimeout(timeoutTimer)
          this.updateStatus('open')
          this.reconnectAttempt = 0
          this.emitOpen(event)
          this.options.onOpen?.(event)
          this.startHeartbeat()
          this.pluginManager.emit('websocket:connect:success', this.url)
          resolve()
        }

        this.socket.onclose = (event) => {
          clearTimeout(timeoutTimer)
          this.updateStatus('closed')
          this.emitClose(event)
          this.options.onClose?.(event)
          this.stopHeartbeat()
          this.pluginManager.emit(
            'websocket:disconnected',
            this.url,
            event.code,
            event.reason,
          )

          // Schedule reconnect if not explicitly closed by user
          if (event.code !== 1000 && !event.wasClean) {
            this.scheduleReconnect()
          }
        }

        this.socket.onerror = (event) => {
          clearTimeout(timeoutTimer)
          this.updateStatus('closed')
          this.emitError(event)
          this.options.onError?.(event)
          this.pluginManager.emit('websocket:connect:error', this.url, event)
          reject(event)
        }

        this.socket.onmessage = (event) => {
          this.stats.messagesReceived++
          const messageEvent: RealtimeMessageEvent = {
            data: this.tryParseData(event.data),
            raw: event.data,
            type: 'message',
            timestamp: Date.now(),
          }
          this.emitMessage(messageEvent)
          this.pluginManager.emit(
            'websocket:message:received',
            this.url,
            messageEvent,
          )
        }
      } catch (error) {
        clearTimeout(timeoutTimer)
        this.updateStatus('closed')
        this.pluginManager.emit('websocket:connect:error', this.url, error)
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.cleanup()
    if (this.socket) {
      this.updateStatus('closing')
      this.socket.close(1000, 'Client disconnected')
      this.socket = null
      this.updateStatus('closed')
    }
  }

  send(data: string | ArrayBuffer | Blob): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }
    this.socket.send(data)
    this.stats.messagesSent++
    this.pluginManager.emit('websocket:message:sent', this.url, data)
  }

  sendJson(data: unknown): void {
    this.send(JSON.stringify(data))
  }

  onMessageType<T = unknown>(
    type: string,
    callback: (data: T) => void,
  ): () => void {
    if (!this.messageTypeListeners.has(type)) {
      this.messageTypeListeners.set(type, new Set())
    }
    this.messageTypeListeners
      .get(type)!
      .add(callback as (data: unknown) => void)

    return () => {
      const listeners = this.messageTypeListeners.get(type)
      if (listeners) {
        listeners.delete(callback as (data: unknown) => void)
        if (listeners.size === 0) {
          this.messageTypeListeners.delete(type)
        }
      }
    }
  }

  private tryParseData(data: string | ArrayBuffer | Blob): unknown {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch {
        return data
      }
    }
    return data
  }
}

/**
 * Node.js WebSocket client implementation (requires 'ws' package)
 */
class NodeWebSocketClient extends BrowserWebSocketClient {
  async connect(): Promise<void> {
    if (isNode()) {
      try {
        // Security: Optional dependency 'ws' for Node.js WebSocket support
        // This is a dynamic import that only loads if the package is installed
        // @ts-ignore - optional dependency
        const { default: _ws } = await import('ws')
        void _ws
        // Override socket creation
        // Note: This is a simplified implementation
        // In a full implementation, we'd need to handle the WebSocket constructor differently
        return super.connect()
      } catch {
        throw new Error(
          'WebSocket client for Node.js requires the "ws" package. Please install it: npm install ws',
        )
      }
    }
    return super.connect()
  }
}

/**
 * Create a WebSocket client appropriate for the current environment
 */
export function createWebSocketClient(
  url: string,
  options: WebSocketOptions = {},
): IWebSocketClient {
  if (isNode()) {
    return new NodeWebSocketClient(url, options)
  }
  return new BrowserWebSocketClient(url, options)
}
