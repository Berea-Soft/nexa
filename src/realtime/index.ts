/**
 * Real-time communication clients for WebSocket and Server-Sent Events.
 * Provides unified API for real-time communication with automatic reconnection,
 * heartbeat, and plugin support.
 */

export type {
  WebSocketOptions,
  SSEOptions,
  RealtimeMessageEvent,
  IRealtimeClient,
  IWebSocketClient,
  ISSEClient,
} from '../types/index.js'

export { createWebSocketClient } from './websocket-client.js'
export { createSSEClient } from './sse-client.js'
export { createRealtimePlugin } from './plugin.js'
