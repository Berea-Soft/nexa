/**
 * HTTP Client Plugin - Type Definitions
 * Combines fetch power + axios convenience with SOLID principles
 */

// ============= Result Type (Either monad) =============
/**
 * Represents a successful or failed result
 * Allows for type-safe error handling without exceptions
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export const Ok = <T>(value: T): Result<T> => ({ ok: true, value })
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error })

// ============= HTTP Request/Response =============

/**
 * A single query-string value. Arrays are serialized as repeated keys
 * (`?tag=a&tag=b`); nested plain objects use one level of bracket notation
 * (`?filter[status]=active`). `null`/`undefined` values are omitted.
 */
export type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>
  | Record<string, string | number | boolean | null | undefined>

export type QueryParams = Record<string, QueryParamValue>

export interface HttpRequest {
  url: string
  /**
   * 'QUERY' is the IETF-draft safe/idempotent/cacheable HTTP method that
   * carries a JSON body — use it for complex search/filter payloads that
   * don't fit cleanly in a URL. See `IHttpClient.query()`.
   */
  method?:
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'HEAD'
    | 'OPTIONS'
    | 'QUERY'
  headers?: Record<string, string>
  body?: unknown
  query?: QueryParams
  params?: Record<string, string | number>
  timeout?: HttpTimeout
  signal?: AbortSignal
  /**
   * Controls cookie/credential policy for CORS requests. Same as fetch API.
   * 'omit' | 'same-origin' | 'include'
   */
  credentials?: RequestCredentials
  /**
   * Custom adapter for this request (same signature as fetch).
   */
  adapter?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  /**
   * If true (default), automatically converts body to FormData if files are detected.
   */
  autoFormData?: boolean
  /**
   * Transport layer to use for this request.
   * Overrides global transport setting.
   */
  transport?: 'fetch' | 'node' | 'http2' | 'deno' | 'bun' | 'cloudflare'
  /**
   * Node.js specific transport options for this request.
   * Overrides global nodeOptions.
   */
  nodeOptions?: NodeTransportOptions
}

export interface HttpResponse<T = unknown> {
  status: number
  statusText: string
  headers: Headers
  data: T
  request: HttpRequest
  duration: number
}

export interface HttpErrorDetails {
  message: string
  status?: number
  statusText?: string
  code?: string
  originalError?: unknown
  /**
   * The HTTP request that caused the error (available for both network and HTTP errors)
   */
  request?: HttpRequest
  /**
   * The HTTP response if the request reached the server and received a response (HTTP errors only)
   */
  response?: HttpResponse<unknown>
  /**
   * The configuration used for the request
   */
  config?: HttpRequestConfig
}

// ============= Progress =============
export interface ProgressEvent {
  loaded: number
  total: number
  percent: number
}

// ============= Lifecycle Hooks =============
export interface RequestHooks<T = unknown> {
  onStart?: (request: HttpRequest) => void
  onSuccess?: (response: HttpResponse<T>) => void
  onError?: (error: HttpErrorDetails) => void
  onFinally?: () => void
  onRetry?: (attempt: number, error: HttpErrorDetails) => void
}

// ============= Interceptor Pattern (Open/Closed) =============
export interface RequestInterceptor {
  onRequest(request: HttpRequest): HttpRequest | Promise<HttpRequest>
  onError?(
    error: HttpErrorDetails,
  ): HttpErrorDetails | Promise<HttpErrorDetails>
}

export interface ResponseInterceptor {
  onResponse<T = unknown>(
    response: HttpResponse<T>,
  ): HttpResponse<T> | Promise<HttpResponse<T>>
  onError?(
    error: HttpErrorDetails,
  ): HttpErrorDetails | Promise<HttpErrorDetails>
}

// ============= Retry Strategy (Strategy Pattern) =============
export type RetryCondition = (
  error: HttpErrorDetails,
  attempt: number,
) => boolean

export interface RetryStrategy {
  shouldRetry(attempt: number, error: HttpErrorDetails): boolean
  delayMs(attempt: number): number
}

export interface InlineRetryConfig {
  maxAttempts?: number
  backoffMs?: number
  on?: RetryCondition
}

// ============= Node.js Transport Options =============
/**
 * Node.js specific transport configuration for HTTP/1.1 and HTTP/2.
 */
export interface NodeTransportOptions {
  /**
   * Enable keep-alive connections. Default: true
   */
  keepAlive?: boolean
  /**
   * Maximum number of sockets to allow per host. Default: 50
   */
  maxSockets?: number
  /**
   * Maximum number of sockets to leave open in a free state. Default: 10
   */
  maxFreeSockets?: number
  /**
   * Maximum number of requests per socket. Default: 0 (unlimited)
   */
  maxRequestsPerSocket?: number
  /**
   * Socket timeout in milliseconds. Default: 60000 (60 seconds)
   */
  timeout?: number
  /**
   * Enable HTTP/2 protocol (only when transport is 'http2').
   */
  http2?: boolean
  /**
   * HTTP/2 specific settings.
   */
  http2Settings?: Record<string, unknown>
}

// ============= Cache Strategy (Strategy Pattern) =============
export interface CacheStrategy {
  get(key: string): unknown | null
  set(key: string, value: unknown, ttlMs?: number): void
  clear(): void
  has(key: string): boolean
}

// ============= Validation & Transform (Processing Pipeline) =============
export interface Validator {
  validate(data: unknown): Result<unknown, HttpErrorDetails>
}

export interface Transformer {
  transform(data: unknown): unknown
}

// ============= Response Type =============
export type ResponseType =
  | 'json'
  | 'text'
  | 'blob'
  | 'arrayBuffer'
  | 'formData'
  | 'stream'
  | 'auto'

// ============= Timeout Configuration =============
/**
 * Timeout configuration for HTTP requests.
 * - number: total timeout for the entire request (connection + response)
 * - object: differentiated timeouts for connection and response phases
 */
export type HttpTimeout =
  | number
  | {
      /**
       * Maximum time to establish connection (TCP/TLS handshake) in milliseconds.
       * If not specified, no connection timeout is applied.
       */
      connection?: number
      /**
       * Maximum time to receive complete response (after connection is established) in milliseconds.
       * If not specified, no response timeout is applied.
       */
      response?: number
      /**
       * Total timeout for the entire request (connection + response) in milliseconds.
       * If specified, overrides both connection and response timeouts.
       * Provided for backward compatibility and convenience.
       */
      total?: number
    }

// ============= Request Configuration =============
export interface HttpRequestConfig extends HttpRequest {
  retry?: RetryStrategy | InlineRetryConfig
  timeout?: HttpTimeout
  validate?: Validator
  transform?: Transformer
  cache?: { enabled: boolean; ttlMs?: number }
  responseType?: ResponseType
  hooks?: RequestHooks
  onUploadProgress?: (event: ProgressEvent) => void
  onDownloadProgress?: (event: ProgressEvent) => void
  /**
   * Axios compatibility: if true, sets credentials: 'include'; if false, credentials: 'same-origin'.
   * If credentials is also specified, this field is ignored.
   */
  withCredentials?: boolean
  /**
   * Allows using a custom adapter for the request (same signature as fetch).
   * Useful for mocks, tests, or special environments.
   */
  adapter?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  /**
   * Allows transforming the body before serializing and sending it. Similar to axios.transformRequest.
   * Can be a function or an array of functions.
   */
  transformRequest?:
    | ((data: unknown, headers: Record<string, string>) => unknown)
    | Array<(data: unknown, headers: Record<string, string>) => unknown>
  /**
   * Enable debug logging for this request. Overrides global debug setting.
   */
  debug?: boolean | 'verbose'
  /**
   * Custom logger function for this request. Overrides global logger.
   */
  logger?: (message: string, data?: unknown) => void
  /**
   * Transport layer to use for this request.
   * Overrides global transport setting.
   */
  transport?: 'fetch' | 'node' | 'http2' | 'deno' | 'bun' | 'cloudflare'
  /**
   * Node.js specific transport options for this request.
   * Overrides global nodeOptions.
   */
  nodeOptions?: NodeTransportOptions
  /**
   * If true (default), automatically converts body to FormData if files are detected.
   */
  autoFormData?: boolean
}

// ============= Pagination =============
export interface PaginateOptions<T> {
  /** Extract items from a response page */
  getItems: (data: T) => unknown[]
  /** Return the config for the next page, or null to stop */
  getNextPage: (
    data: T,
    currentConfig: Omit<HttpRequestConfig, 'url' | 'method'>,
  ) => Omit<HttpRequestConfig, 'url' | 'method'> | null
}

// ============= Polling =============
export interface PollOptions<T> {
  /** Interval between polls in ms */
  intervalMs: number
  /** Max number of polls (0 = unlimited) */
  maxAttempts?: number
  /** Stop polling when this returns true */
  until: (data: T) => boolean
  /** Called on each successful poll */
  onPoll?: (data: T, attempt: number) => void
}

// ============= HTTP Client Interface (Dependency Inversion) =============
export interface IHttpClient {
  request<T = unknown>(
    config: HttpRequestConfig,
  ): Promise<Result<HttpResponse<T>, HttpErrorDetails>>
  get<T = unknown>(
    url: string,
    config?: Omit<HttpRequestConfig, 'url' | 'method'>,
  ): Promise<Result<HttpResponse<T>, HttpErrorDetails>>
  post<T = unknown>(
    url: string,
    body?: unknown,
    config?: Omit<HttpRequestConfig, 'url' | 'method' | 'body'>,
  ): Promise<Result<HttpResponse<T>, HttpErrorDetails>>
  put<T = unknown>(
    url: string,
    body?: unknown,
    config?: Omit<HttpRequestConfig, 'url' | 'method' | 'body'>,
  ): Promise<Result<HttpResponse<T>, HttpErrorDetails>>
  patch<T = unknown>(
    url: string,
    body?: unknown,
    config?: Omit<HttpRequestConfig, 'url' | 'method' | 'body'>,
  ): Promise<Result<HttpResponse<T>, HttpErrorDetails>>
  /**
   * Safe, idempotent request carrying a JSON body — for complex search/filter
   * payloads that don't fit in a URL. Cacheable like GET when `config.cache`
   * is enabled (the body is included in the cache key).
   */
  query<T = unknown>(
    url: string,
    body?: unknown,
    config?: Omit<HttpRequestConfig, 'url' | 'method' | 'body'>,
  ): Promise<Result<HttpResponse<T>, HttpErrorDetails>>
  delete<T = unknown>(
    url: string,
    config?: Omit<HttpRequestConfig, 'url' | 'method'>,
  ): Promise<Result<HttpResponse<T>, HttpErrorDetails>>
  head(
    url: string,
    config?: Omit<HttpRequestConfig, 'url' | 'method'>,
  ): Promise<Result<HttpResponse<void>, HttpErrorDetails>>
  options(
    url: string,
    config?: Omit<HttpRequestConfig, 'url' | 'method'>,
  ): Promise<Result<HttpResponse<void>, HttpErrorDetails>>
  addRequestInterceptor(interceptor: RequestInterceptor): Disposer
  addResponseInterceptor(interceptor: ResponseInterceptor): Disposer
  clearInterceptors(): void
  extend(config?: HttpClientConfig): IHttpClient
  paginate<T = unknown>(
    url: string,
    options: PaginateOptions<T>,
    config?: Omit<HttpRequestConfig, 'url' | 'method'>,
  ): AsyncIterable<T[]>
  poll<T = unknown>(
    url: string,
    options: PollOptions<T>,
    config?: Omit<HttpRequestConfig, 'url' | 'method'>,
  ): Promise<Result<HttpResponse<T>, HttpErrorDetails>>
  cancelAll(): void
  clearCache(): void
}

/** Function that removes a previously added interceptor */
export type Disposer = () => void

// ============= Create Client Config =============
export interface HttpClientConfig {
  baseURL?: string
  defaultHeaders?: Record<string, string>
  defaultTimeout?: HttpTimeout
  cacheStrategy?: CacheStrategy
  validateStatus?: (status: number) => boolean
  maxConcurrent?: number
  defaultResponseType?: ResponseType
  defaultHooks?: RequestHooks
  devTracker?: DevTracker
  /**
   * Global adapter for all requests (same signature as fetch).
   */
  adapter?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  /**
   * Controls cookie/credential policy for CORS requests. Same as fetch API.
   * 'omit' | 'same-origin' | 'include'
   */
  credentials?: RequestCredentials
  /**
   * Axios compatibility: if true, sets credentials: 'include'; if false, credentials: 'same-origin'.
   * If credentials is also specified, this field is ignored.
   */
  withCredentials?: boolean
  /**
   * Allows transforming the body before serializing and sending it by default in all requests.
   */
  transformRequest?:
    | ((data: unknown, headers: Record<string, string>) => unknown)
    | Array<(data: unknown, headers: Record<string, string>) => unknown>
  /**
   * If true (default), automatically converts body to FormData if files are detected.
   */
  autoFormData?: boolean
  /**
   * Enable debug logging for requests/responses. true for basic logs, 'verbose' for detailed logs.
   */
  debug?: boolean | 'verbose'
  /**
   * Custom logger function. If provided, replaces the default console.log with custom logging.
   */
  logger?: (message: string, data?: unknown) => void
  /**
   * Transport layer to use for HTTP requests.
   * - 'fetch': Uses global fetch API (default)
   * - 'node': Uses Node.js http/https modules with HTTP/1.1
   * - 'http2': Uses Node.js http2 module (HTTP/2)
   * - 'deno': Uses Deno's fetch API (Deno environment)
   * - 'bun': Uses Bun's fetch API (Bun environment)
   * - 'cloudflare': Uses Cloudflare Workers fetch API
   */
  transport?: 'fetch' | 'node' | 'http2' | 'deno' | 'bun' | 'cloudflare'
  /**
   * Node.js specific transport options.
   * Only applies when transport is 'node' or 'http2'.
   */
  nodeOptions?: NodeTransportOptions
}

// ============= Dev Tracker Interface =============
export interface DevTracker {
  track(request: {
    method: string
    url: string
    status?: number
    duration: number
    cached: boolean
    ok: boolean
    code?: string
    headers: Record<string, string>
    body?: unknown
    retryCount: number
  }): void
}

// ============= Real-time Communication =============

/**
 * WebSocket connection options
 */
export interface WebSocketOptions {
  /** WebSocket protocols (subprotocols) */
  protocols?: string | string[]
  /** Headers to send during handshake */
  headers?: Record<string, string>
  /** Automatic reconnection settings */
  reconnect?: {
    /** Enable automatic reconnection (default: true) */
    enabled?: boolean
    /** Base delay in ms for exponential backoff (default: 1000) */
    baseDelay?: number
    /** Maximum delay in ms (default: 30000) */
    maxDelay?: number
    /** Maximum number of reconnect attempts (default: Infinity) */
    maxAttempts?: number
    /** Called before each reconnection attempt */
    onReconnecting?: (attempt: number, delay: number) => void
  }
  /** Timeout for connection establishment in ms (default: 10000) */
  timeout?: number
  /** Callback for connection open */
  onOpen?: (event: Event) => void
  /** Callback for connection close */
  onClose?: (event: CloseEvent) => void
  /** Callback for connection error */
  onError?: (event: Event) => void
  /** Enable heartbeat/ping-pong to keep connection alive */
  heartbeat?: {
    /** Interval in ms to send ping (default: 30000) */
    interval?: number
    /** Timeout in ms to wait for pong before closing (default: 5000) */
    timeout?: number
    /** Custom ping message (default: 'ping') */
    pingMessage?: string | ArrayBuffer | Blob
    /** Custom pong message (default: 'pong') */
    pongMessage?: string | ArrayBuffer | Blob
  }
}

/**
 * Server-Sent Events (SSE) connection options
 */
export interface SSEOptions {
  /** Headers to send with the request */
  headers?: Record<string, string>
  /** Request method (default: GET) */
  method?: string
  /** Request body (for POST requests) */
  body?: unknown
  /** Whether to send credentials (cookies) (default: same-origin) */
  credentials?: RequestCredentials
  /** Timeout for connection establishment in ms (default: 10000) */
  timeout?: number
  /** Automatic reconnection settings */
  reconnect?: {
    /** Enable automatic reconnection (default: true) */
    enabled?: boolean
    /** Base delay in ms for exponential backoff (default: 1000) */
    baseDelay?: number
    /** Maximum delay in ms (default: 30000) */
    maxDelay?: number
    /** Maximum number of reconnect attempts (default: Infinity) */
    maxAttempts?: number
    /** Called before each reconnection attempt */
    onReconnecting?: (attempt: number, delay: number) => void
  }
  /** Callback for connection open */
  onOpen?: (event: Event) => void
  /** Callback for connection error */
  onError?: (event: Event) => void
  /** Callback for connection close */
  onClose?: () => void
}

/**
 * Real-time message event
 */
export interface RealtimeMessageEvent<T = unknown> {
  /** Message data (parsed if possible) */
  data: T
  /** Raw message data */
  raw: string | ArrayBuffer | Blob
  /** Message type (for WebSocket: 'message', for SSE: event type) */
  type: string
  /** Timestamp when message was received */
  timestamp: number
}

/**
 * Error returned by a failed IRealtimeClient.send()/sendJson() call.
 */
export interface RealtimeSendError {
  message: string
  code: 'NOT_CONNECTED' | 'UNSUPPORTED' | 'SEND_FAILED'
}

/**
 * Real-time client interface
 */
export interface IRealtimeClient {
  /** Connect to the server */
  connect(): Promise<void>
  /** Disconnect from the server */
  disconnect(): void
  /** Send a message. Returns a Result instead of throwing on failure. */
  send(data: string | ArrayBuffer | Blob): Result<void, RealtimeSendError>
  /** Subscribe to messages */
  onMessage<T = unknown>(
    callback: (event: RealtimeMessageEvent<T>) => void,
  ): () => void
  /** Subscribe to connection open events */
  onOpen(callback: (event: Event) => void): () => void
  /** Subscribe to connection close events */
  onClose(callback: (event?: CloseEvent) => void): () => void
  /** Subscribe to connection error events */
  onError(callback: (event: Event) => void): () => void
  /** Get connection status */
  getStatus(): 'connecting' | 'open' | 'closing' | 'closed'
  /** Get connection statistics */
  getStats(): {
    messagesSent: number
    messagesReceived: number
    connectionTime: number
    reconnectAttempts: number
  }
}

/**
 * WebSocket client interface (extends IRealtimeClient)
 */
export interface IWebSocketClient extends IRealtimeClient {
  /** WebSocket instance */
  readonly socket: WebSocket | null
  /** Send JSON data (automatically serialized). Returns a Result instead of throwing. */
  sendJson(data: unknown): Result<void, RealtimeSendError>
  /** Subscribe to specific message types */
  onMessageType<T = unknown>(
    type: string,
    callback: (data: T) => void,
  ): () => void
}

/**
 * SSE client interface (extends IRealtimeClient)
 */
export interface ISSEClient extends IRealtimeClient {
  /** EventSource instance */
  readonly source: EventSource | null
  /** Subscribe to specific event types */
  onEvent<T = unknown>(event: string, callback: (data: T) => void): () => void
  /** Last event ID */
  readonly lastEventId: string | null
}

// ============= Global Environment Declarations =============
declare global {
  // Deno runtime
  interface Deno {
    readonly version: {
      deno: string
    }
  }
  const Deno: Deno | undefined

  // Bun runtime
  interface Bun {
    readonly version: string
  }
  const Bun: Bun | undefined

  // Cloudflare Workers WebSocketPair
  const WebSocketPair:
    | {
        new (): { 0: WebSocket; 1: WebSocket }
      }
    | undefined
}
