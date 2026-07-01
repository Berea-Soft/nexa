import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSEClient } from '../src/realtime/sse-client.js'
import { createWebSocketClient } from '../src/realtime/websocket-client.js'
import { createRealtimePlugin } from '../src/realtime/plugin.js'
import { PluginManager } from '../src/utils/index.js'

type Listener = (event: unknown) => void

class FakeEventSource {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2

  url: string
  readyState = FakeEventSource.CONNECTING
  onopen: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onmessage: ((event: unknown) => void) | null = null
  listeners = new Map<string, Set<Listener>>()

  constructor(url: string) {
    this.url = url
  }

  addEventListener(type: string, listener: Listener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener)
  }

  close(): void {
    this.readyState = FakeEventSource.CLOSED
  }
}

class FakeWebSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  url: string
  readyState = FakeWebSocket.CONNECTING
  onopen: ((event: unknown) => void) | null = null
  onclose:
    | ((event: { code: number; reason: string; wasClean: boolean }) => void)
    | null = null
  onerror: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null

  constructor(url: string) {
    this.url = url
  }

  send(): void {}

  close(code = 1000, reason = ''): void {
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.({ code, reason, wasClean: code === 1000 })
  }
}

describe('SSE client listener lifecycle', () => {
  let createdSources: FakeEventSource[] = []

  afterEach(() => {
    createdSources = []
    vi.unstubAllGlobals()
  })

  function setup() {
    createdSources = []
    vi.stubGlobal('window', {})
    vi.stubGlobal(
      'EventSource',
      class extends FakeEventSource {
        constructor(url: string) {
          super(url)
          createdSources.push(this)
        }
      },
    )
  }

  it('re-attaches named-event listeners exactly once per reconnect instead of leaking', async () => {
    setup()
    const client = createSSEClient('http://example.com/stream', {
      reconnect: { enabled: false },
    })

    const connectPromise = client.connect()
    const source1 = createdSources[0]
    source1.onopen?.({})
    await connectPromise

    const received: unknown[] = []
    const unsubscribe = client.onEvent('ping', (data) => received.push(data))

    expect(source1.listeners.get('ping')?.size).toBe(1)

    // Simulate a reconnect: a brand new EventSource is created on the next connect()
    client.disconnect()
    const reconnectPromise = client.connect()
    const source2 = createdSources[1]
    source2.onopen?.({})
    await reconnectPromise

    // The listener registered before the reconnect must be re-attached to the
    // new source exactly once — not lost, and not duplicated.
    expect(source2.listeners.get('ping')?.size).toBe(1)
    expect(source1.listeners.get('ping')?.size).toBe(1)

    unsubscribe()
    expect(source2.listeners.get('ping')?.size).toBe(0)
  })

  it('does not leak a native listener when the same callback is unsubscribed and resubscribed', async () => {
    setup()
    const client = createSSEClient('http://example.com/stream', {
      reconnect: { enabled: false },
    })
    const connectPromise = client.connect()
    const source = createdSources[0]
    source.onopen?.({})
    await connectPromise

    const callback = () => {}
    const unsubscribe1 = client.onEvent('tick', callback)
    unsubscribe1()
    const unsubscribe2 = client.onEvent('tick', callback)

    expect(source.listeners.get('tick')?.size).toBe(1)
    unsubscribe2()
    expect(source.listeners.get('tick')?.size ?? 0).toBe(0)
  })

  it('applies jitter to the reconnect backoff instead of a perfectly deterministic delay', async () => {
    setup()
    const client = createSSEClient('http://example.com/stream', {
      reconnect: { baseDelay: 100, maxDelay: 100_000 },
    })
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    const connectPromise = client.connect()
    const source = createdSources[0]
    source.onopen?.({})
    await connectPromise

    // An abnormal error (CLOSED readyState) triggers scheduleReconnect().
    source.readyState = FakeEventSource.CLOSED
    source.onerror?.({})

    // base = 100 * 2^0 = 100; jitter adds up to 10% on top.
    const reconnectDelay = setTimeoutSpy.mock.calls
      .map(([, delay]) => delay)
      .find(
        (delay) => typeof delay === 'number' && delay >= 100 && delay <= 110,
      )

    expect(reconnectDelay).toBeDefined()
  })

  it('returns an Err Result from send() instead of throwing, since SSE is receive-only', async () => {
    setup()
    const client = createSSEClient('http://example.com/stream', {
      reconnect: { enabled: false },
    })
    const connectPromise = client.connect()
    const source = createdSources[0]
    source.onopen?.({})
    await connectPromise

    let result: ReturnType<typeof client.send> | undefined
    expect(() => {
      result = client.send('hello')
    }).not.toThrow()
    expect(result?.ok).toBe(false)
    if (result && !result.ok) {
      expect(result.error.code).toBe('UNSUPPORTED')
    }
  })
})

describe('NodeSSEClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fails fast at construction time in a Node environment instead of at connect() time', () => {
    // No `window` stub — isNode() resolves true in the default Vitest node environment.
    expect(() => createSSEClient('http://example.com/stream')).toThrow(
      /browser-only/i,
    )
  })
})

describe('WebSocket client heartbeat listener lifecycle', () => {
  let createdSockets: FakeWebSocket[] = []

  afterEach(() => {
    createdSockets = []
    vi.unstubAllGlobals()
  })

  function setup() {
    createdSockets = []
    vi.stubGlobal('window', {})
    vi.stubGlobal(
      'WebSocket',
      class extends FakeWebSocket {
        constructor(url: string) {
          super(url)
          createdSockets.push(this)
        }
      },
    )
  }

  it('does not accumulate a heartbeat message listener across reconnects', async () => {
    setup()
    const client = createWebSocketClient('ws://example.com', {
      heartbeat: { interval: 1_000_000 },
      reconnect: { enabled: false },
    })

    const connectPromise = client.connect()
    const socket1 = createdSockets[0]
    socket1.readyState = FakeWebSocket.OPEN
    socket1.onopen?.({})
    await connectPromise

    const listeners = (
      client as unknown as { listeners: { message: Set<unknown> } }
    ).listeners.message
    expect(listeners.size).toBe(1)

    // Simulate an abnormal close (server drop) — stopHeartbeat() must
    // unsubscribe the previous listener before a reconnect happens.
    socket1.onclose?.({ code: 1006, reason: '', wasClean: false })
    expect(listeners.size).toBe(0)

    const reconnectPromise = client.connect()
    const socket2 = createdSockets[1]
    socket2.readyState = FakeWebSocket.OPEN
    socket2.onopen?.({})
    await reconnectPromise

    // Still exactly one listener after the reconnect — not two.
    expect(listeners.size).toBe(1)
  })

  it('applies jitter to the reconnect backoff instead of a perfectly deterministic delay', async () => {
    setup()
    const client = createWebSocketClient('ws://example.com', {
      reconnect: { baseDelay: 100, maxDelay: 100_000 },
    })
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    const connectPromise = client.connect()
    const socket = createdSockets[0]
    socket.readyState = FakeWebSocket.OPEN
    socket.onopen?.({})
    await connectPromise

    socket.onclose?.({ code: 1006, reason: '', wasClean: false })

    // base = 100 * 2^0 = 100; jitter adds up to 10% on top.
    const reconnectDelay = setTimeoutSpy.mock.calls
      .map(([, delay]) => delay)
      .find(
        (delay) => typeof delay === 'number' && delay >= 100 && delay <= 110,
      )

    expect(reconnectDelay).toBeDefined()
  })

  it('disconnects when a heartbeat pong is not received before the next ping', async () => {
    setup()
    vi.useFakeTimers()
    try {
      const client = createWebSocketClient('ws://example.com', {
        heartbeat: { interval: 1000 },
        reconnect: { enabled: false },
      })

      const connectPromise = client.connect()
      const socket = createdSockets[0]
      socket.readyState = FakeWebSocket.OPEN
      socket.onopen?.({})
      await connectPromise
      expect(client.getStatus()).toBe('open')

      // 1st tick: pongReceived starts true, so it just sends a ping and resets.
      await vi.advanceTimersByTimeAsync(1000)
      expect(client.getStatus()).toBe('open')

      // 2nd tick: no pong arrived in between, so the heartbeat times out.
      await vi.advanceTimersByTimeAsync(1000)
      expect(client.getStatus()).toBe('closed')
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps the connection alive when a pong is received between pings', async () => {
    setup()
    vi.useFakeTimers()
    try {
      const client = createWebSocketClient('ws://example.com', {
        heartbeat: { interval: 1000 },
        reconnect: { enabled: false },
      })

      const connectPromise = client.connect()
      const socket = createdSockets[0]
      socket.readyState = FakeWebSocket.OPEN
      socket.onopen?.({})
      await connectPromise

      await vi.advanceTimersByTimeAsync(1000)
      // Simulate the server replying with a pong before the next check.
      socket.onmessage?.({ data: 'pong' })
      await vi.advanceTimersByTimeAsync(1000)

      expect(client.getStatus()).toBe('open')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('WebSocket client send() Result contract', () => {
  let createdSockets: FakeWebSocket[] = []

  afterEach(() => {
    createdSockets = []
    vi.unstubAllGlobals()
  })

  function setup() {
    createdSockets = []
    vi.stubGlobal('window', {})
    vi.stubGlobal(
      'WebSocket',
      class extends FakeWebSocket {
        constructor(url: string) {
          super(url)
          createdSockets.push(this)
        }
      },
    )
  }

  it('returns an Err Result instead of throwing when not connected', () => {
    setup()
    const client = createWebSocketClient('ws://example.com')

    let result: ReturnType<typeof client.send> | undefined
    expect(() => {
      result = client.send('ping')
    }).not.toThrow()
    expect(result?.ok).toBe(false)
    if (result && !result.ok) {
      expect(result.error.code).toBe('NOT_CONNECTED')
    }
  })

  it('returns an Ok Result once connected and sendJson delegates to send', async () => {
    setup()
    const client = createWebSocketClient('ws://example.com', {
      reconnect: { enabled: false },
    })
    const connectPromise = client.connect()
    const socket = createdSockets[0]
    socket.readyState = FakeWebSocket.OPEN
    const sendSpy = vi.spyOn(socket, 'send')
    socket.onopen?.({})
    await connectPromise

    const result = client.send('ping')
    expect(result.ok).toBe(true)
    expect(sendSpy).toHaveBeenCalledWith('ping')

    const jsonResult = client.sendJson({ hello: 'world' })
    expect(jsonResult.ok).toBe(true)
    expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({ hello: 'world' }))
  })
})

describe('RealtimePlugin', () => {
  it('re-emits websocket/sse lifecycle events under a normalized realtime:* namespace', () => {
    const manager = new PluginManager()
    manager.register(createRealtimePlugin())

    const received: unknown[][] = []
    manager.on('realtime:connect:start', (...args) => received.push(args))
    manager.on('realtime:connect:success', (...args) => received.push(args))
    manager.on('realtime:message', (...args) => received.push(args))

    manager.emit('websocket:connect:start', 'ws://x')
    manager.emit('websocket:connect:success', 'ws://x')
    manager.emit('websocket:message:received', 'ws://x', { hello: true })
    manager.emit('sse:connect:start', 'http://y')
    manager.emit('sse:message:received', 'http://y', { tick: 1 })

    expect(received).toEqual([
      ['websocket', 'ws://x'],
      ['websocket', 'ws://x'],
      ['websocket', 'ws://x', { hello: true }],
      ['sse', 'http://y'],
      ['sse', 'http://y', { tick: 1 }],
    ])
  })
})
