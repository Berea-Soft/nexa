/**
 * HTTP Client Plugin - Type Definitions
 * Combines fetch power + axios convenience with SOLID principles
 */

// ============= Result Type (Either monad) =============
/**
 * Represents a successful or failed result
 * Allows for type-safe error handling without exceptions
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T,>(value: T): Result<T> => ({ ok: true, value });
export const Err = <E,>(error: E): Result<never, E> => ({ ok: false, error });

// ============= HTTP Request/Response =============
export interface HttpRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string | number | boolean>;
  params?: Record<string, string | number>;
  timeout?: HttpTimeout;
  signal?: AbortSignal;
  /**
   * Controls cookie/credential policy for CORS requests. Same as fetch API.
   * 'omit' | 'same-origin' | 'include'
   */
  credentials?: RequestCredentials;
  /**
   * Adapter personalizado para esta request (firma igual a fetch).
   */
  adapter?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /**
   * Si es true (default), convierte automáticamente el body a FormData si detecta archivos.
   */
  autoFormData?: boolean;
  /**
   * Transport layer to use for this request.
   * Overrides global transport setting.
   */
  transport?: 'fetch' | 'node' | 'http2' | 'deno' | 'bun' | 'cloudflare';
  /**
   * Node.js specific transport options for this request.
   * Overrides global nodeOptions.
   */
  nodeOptions?: NodeTransportOptions;
}

export interface HttpResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Headers;
  data: T;
  request: HttpRequest;
  duration: number;
}

export interface HttpErrorDetails {
  message: string;
  status?: number;
  statusText?: string;
  code?: string;
  originalError?: unknown;
  /**
   * The HTTP request that caused the error (available for both network and HTTP errors)
   */
  request?: HttpRequest;
  /**
   * The HTTP response if the request reached the server and received a response (HTTP errors only)
   */
  response?: HttpResponse<unknown>;
  /**
   * The configuration used for the request
   */
  config?: HttpRequestConfig;
}

// ============= Progress =============
export interface ProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

// ============= Lifecycle Hooks =============
export interface RequestHooks<T = unknown> {
  onStart?: (request: HttpRequest) => void;
  onSuccess?: (response: HttpResponse<T>) => void;
  onError?: (error: HttpErrorDetails) => void;
  onFinally?: () => void;
  onRetry?: (attempt: number, error: HttpErrorDetails) => void;
}

// ============= Interceptor Pattern (Open/Closed) =============
export interface RequestInterceptor {
  onRequest(request: HttpRequest): HttpRequest | Promise<HttpRequest>;
  onError?(error: HttpErrorDetails): HttpErrorDetails | Promise<HttpErrorDetails>;
}

export interface ResponseInterceptor {
  onResponse<T = unknown>(response: HttpResponse<T>): HttpResponse<T> | Promise<HttpResponse<T>>;
  onError?(error: HttpErrorDetails): HttpErrorDetails | Promise<HttpErrorDetails>;
}

// ============= Retry Strategy (Strategy Pattern) =============
export type RetryCondition = (error: HttpErrorDetails, attempt: number) => boolean;

export interface RetryStrategy {
  shouldRetry(attempt: number, error: HttpErrorDetails): boolean;
  delayMs(attempt: number): number;
}

export interface InlineRetryConfig {
  maxAttempts?: number;
  backoffMs?: number;
  on?: RetryCondition;
}

// ============= Node.js Transport Options =============
/**
 * Node.js specific transport configuration for HTTP/1.1 and HTTP/2.
 */
export interface NodeTransportOptions {
  /**
   * Enable keep-alive connections. Default: true
   */
  keepAlive?: boolean;
  /**
   * Maximum number of sockets to allow per host. Default: 50
   */
  maxSockets?: number;
  /**
   * Maximum number of sockets to leave open in a free state. Default: 10
   */
  maxFreeSockets?: number;
  /**
   * Maximum number of requests per socket. Default: 0 (unlimited)
   */
  maxRequestsPerSocket?: number;
  /**
   * Socket timeout in milliseconds. Default: 60000 (60 seconds)
   */
  timeout?: number;
  /**
   * Enable HTTP/2 protocol (only when transport is 'http2').
   */
  http2?: boolean;
  /**
   * HTTP/2 specific settings.
   */
  http2Settings?: Record<string, unknown>;
}

// ============= Cache Strategy (Strategy Pattern) =============
export interface CacheStrategy {
  get(key: string): unknown | null;
  set(key: string, value: unknown, ttlMs?: number): void;
  clear(): void;
  has(key: string): boolean;
}

// ============= Validation & Transform (Processing Pipeline) =============
export interface Validator {
  validate(data: unknown): Result<unknown, HttpErrorDetails>;
}

export interface Transformer {
  transform(data: unknown): unknown;
}

// ============= Response Type =============
export type ResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData' | 'stream' | 'auto';

// ============= Timeout Configuration =============
/**
 * Timeout configuration for HTTP requests.
 * - number: total timeout for the entire request (connection + response)
 * - object: differentiated timeouts for connection and response phases
 */
export type HttpTimeout = number | {
  /**
   * Maximum time to establish connection (TCP/TLS handshake) in milliseconds.
   * If not specified, no connection timeout is applied.
   */
  connection?: number;
  /**
   * Maximum time to receive complete response (after connection is established) in milliseconds.
   * If not specified, no response timeout is applied.
   */
  response?: number;
  /**
   * Total timeout for the entire request (connection + response) in milliseconds.
   * If specified, overrides both connection and response timeouts.
   * Provided for backward compatibility and convenience.
   */
  total?: number;
};

// ============= Request Configuration =============
/**
 * Configuración extendida para solicitudes HTTP.
 * - credentials: controla el envío de cookies/credenciales ('omit' | 'same-origin' | 'include').
 */
export interface HttpRequestConfig extends HttpRequest {
      /**
       * Si es true (default), convierte automáticamente el body a FormData si detecta archivos.
       */
      autoFormData?: boolean;
    /**
     * Compatibilidad con axios: si es true, establece credentials: 'include'; si es false, credentials: 'same-origin'.
     * Si también se especifica credentials, este campo es ignorado.
     */
    withCredentials?: boolean;
    /**
     * Permite usar un adapter personalizado para la request (firma igual a fetch).
     * Útil para mocks, tests, o entornos especiales.
     */
    adapter?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /**
   * Permite transformar el body antes de serializarlo y enviarlo. Similar a axios.transformRequest.
   * Puede ser una función o un array de funciones.
   */
  transformRequest?: ((data: unknown, headers: Record<string, string>) => unknown) | Array<(data: unknown, headers: Record<string, string>) => unknown>;
  retry?: RetryStrategy | InlineRetryConfig;
  validate?: Validator;
  transform?: Transformer;
  cache?: { enabled: boolean; ttlMs?: number };
  responseType?: ResponseType;
  hooks?: RequestHooks;
  onUploadProgress?: (event: ProgressEvent) => void;
  onDownloadProgress?: (event: ProgressEvent) => void;
  /**
   * Enable debug logging for this request. Overrides global debug setting.
   */
  debug?: boolean | 'verbose';
  /**
   * Custom logger function for this request. Overrides global logger.
   */
  logger?: (message: string, data?: unknown) => void;
  /**
   * Transport layer to use for this request.
   * Overrides global transport setting.
   */
  transport?: 'fetch' | 'node' | 'http2' | 'deno' | 'bun' | 'cloudflare';
  /**
   * Node.js specific transport options for this request.
   * Overrides global nodeOptions.
   */
  nodeOptions?: NodeTransportOptions;
}

// ============= Pagination =============
export interface PaginateOptions<T> {
  /** Extract items from a response page */
  getItems: (data: T) => unknown[];
  /** Return the config for the next page, or null to stop */
  getNextPage: (data: T, currentConfig: Omit<HttpRequestConfig, 'url' | 'method'>) => Omit<HttpRequestConfig, 'url' | 'method'> | null;
}

// ============= Polling =============
export interface PollOptions<T> {
  /** Interval between polls in ms */
  intervalMs: number;
  /** Max number of polls (0 = unlimited) */
  maxAttempts?: number;
  /** Stop polling when this returns true */
  until: (data: T) => boolean;
  /** Called on each successful poll */
  onPoll?: (data: T, attempt: number) => void;
}

// ============= HTTP Client Interface (Dependency Inversion) =============
export interface IHttpClient {
  request<T = unknown>(config: HttpRequestConfig): Promise<Result<HttpResponse<T>, HttpErrorDetails>>;
  get<T = unknown>(url: string, config?: Omit<HttpRequestConfig, 'url' | 'method'>): Promise<Result<HttpResponse<T>, HttpErrorDetails>>;
  post<T = unknown>(url: string, body?: unknown, config?: Omit<HttpRequestConfig, 'url' | 'method' | 'body'>): Promise<Result<HttpResponse<T>, HttpErrorDetails>>;
  put<T = unknown>(url: string, body?: unknown, config?: Omit<HttpRequestConfig, 'url' | 'method' | 'body'>): Promise<Result<HttpResponse<T>, HttpErrorDetails>>;
  patch<T = unknown>(url: string, body?: unknown, config?: Omit<HttpRequestConfig, 'url' | 'method' | 'body'>): Promise<Result<HttpResponse<T>, HttpErrorDetails>>;
  delete<T = unknown>(url: string, config?: Omit<HttpRequestConfig, 'url' | 'method'>): Promise<Result<HttpResponse<T>, HttpErrorDetails>>;
  head(url: string, config?: Omit<HttpRequestConfig, 'url' | 'method'>): Promise<Result<HttpResponse<void>, HttpErrorDetails>>;
  options(url: string, config?: Omit<HttpRequestConfig, 'url' | 'method'>): Promise<Result<HttpResponse<void>, HttpErrorDetails>>;
  addRequestInterceptor(interceptor: RequestInterceptor): Disposer;
  addResponseInterceptor(interceptor: ResponseInterceptor): Disposer;
  clearInterceptors(): void;
  extend(config?: HttpClientConfig): IHttpClient;
  paginate<T = unknown>(url: string, options: PaginateOptions<T>, config?: Omit<HttpRequestConfig, 'url' | 'method'>): AsyncIterable<T[]>;
  poll<T = unknown>(url: string, options: PollOptions<T>, config?: Omit<HttpRequestConfig, 'url' | 'method'>): Promise<Result<HttpResponse<T>, HttpErrorDetails>>;
  cancelAll(): void;
  clearCache(): void;
}

/** Function that removes a previously added interceptor */
export type Disposer = () => void;

// ============= Create Client Config =============
export interface HttpClientConfig {
    /**
     * Adapter global para todas las requests (firma igual a fetch).
     */
    adapter?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  /**
   * Controls cookie/credential policy for CORS requests. Same as fetch API.
   * 'omit' | 'same-origin' | 'include'
   */
  credentials?: RequestCredentials;
  /**
   * Compatibilidad con axios: si es true, establece credentials: 'include'; si es false, credentials: 'same-origin'.
   * Si también se especifica credentials, este campo es ignorado.
   */
  withCredentials?: boolean;
  defaultTimeout?: HttpTimeout;
  cacheStrategy?: CacheStrategy;
  validateStatus?: (status: number) => boolean;
  maxConcurrent?: number;
  defaultResponseType?: ResponseType;
  defaultHooks?: RequestHooks;
  /**
   * Permite transformar el body antes de serializarlo y enviarlo por defecto en todas las requests.
   */
  transformRequest?: ((data: unknown, headers: Record<string, string>) => unknown) | Array<(data: unknown, headers: Record<string, string>) => unknown>;
  /**
   * Si es true (default), convierte automáticamente el body a FormData si detecta archivos.
   */
  autoFormData?: boolean;
  /**
   * Enable debug logging for requests/responses. true for basic logs, 'verbose' for detailed logs.
   */
  debug?: boolean | 'verbose';
  /**
   * Custom logger function. If provided, replaces the default console.log with custom logging.
   */
  logger?: (message: string, data?: unknown) => void;
  /**
   * Transport layer to use for HTTP requests.
   * - 'fetch': Uses global fetch API (default)
   * - 'node': Uses Node.js http/https modules with HTTP/1.1
   * - 'http2': Uses Node.js http2 module (HTTP/2)
   * - 'deno': Uses Deno's fetch API (Deno environment)
   * - 'bun': Uses Bun's fetch API (Bun environment)
   * - 'cloudflare': Uses Cloudflare Workers fetch API
   * 
   * When 'node' or 'http2' is specified, nodeOptions can be used to configure
   * keep-alive, connection pooling, and other Node-specific settings.
   * 
   * Note: Node transports are only available in Node.js environments.
   * Deno, Bun, and Cloudflare transports use their respective fetch implementations.
   */
  transport?: 'fetch' | 'node' | 'http2' | 'deno' | 'bun' | 'cloudflare';
  /**
   * Node.js specific transport options.
   * Only applies when transport is 'node' or 'http2'.
   */
  nodeOptions?: NodeTransportOptions;
}

// ============= Real-Time Communication =============

/**
 * WebSocket connection options
 */
export interface WebSocketOptions {
  /** WebSocket protocols (subprotocols) */
  protocols?: string | string[];
  /** Headers to send during handshake */
  headers?: Record<string, string>;
  /** Automatic reconnection settings */
  reconnect?: {
    /** Enable automatic reconnection (default: true) */
    enabled?: boolean;
    /** Base delay in ms for exponential backoff (default: 1000) */
    baseDelay?: number;
    /** Maximum delay in ms (default: 30000) */
    maxDelay?: number;
    /** Maximum number of reconnect attempts (default: Infinity) */
    maxAttempts?: number;
    /** Called before each reconnection attempt */
    onReconnecting?: (attempt: number, delay: number) => void;
  };
  /** Timeout for connection establishment in ms (default: 10000) */
  timeout?: number;
  /** Callback for connection open */
  onOpen?: (event: Event) => void;
  /** Callback for connection close */
  onClose?: (event: CloseEvent) => void;
  /** Callback for connection error */
  onError?: (event: Event) => void;
  /** Enable heartbeat/ping-pong to keep connection alive */
  heartbeat?: {
    /** Interval in ms to send ping (default: 30000) */
    interval?: number;
    /** Timeout in ms to wait for pong before closing (default: 5000) */
    timeout?: number;
    /** Custom ping message (default: 'ping') */
    pingMessage?: string | ArrayBuffer | Blob;
    /** Custom pong message (default: 'pong') */
    pongMessage?: string | ArrayBuffer | Blob;
  };
}

/**
 * Server-Sent Events (SSE) connection options
 */
export interface SSEOptions {
  /** Headers to send with the request */
  headers?: Record<string, string>;
  /** Request method (default: GET) */
  method?: string;
  /** Request body (for POST requests) */
  body?: unknown;
  /** Whether to send credentials (cookies) (default: same-origin) */
  credentials?: RequestCredentials;
  /** Timeout for connection establishment in ms (default: 10000) */
  timeout?: number;
  /** Automatic reconnection settings */
  reconnect?: {
    /** Enable automatic reconnection (default: true) */
    enabled?: boolean;
    /** Base delay in ms for exponential backoff (default: 1000) */
    baseDelay?: number;
    /** Maximum delay in ms (default: 30000) */
    maxDelay?: number;
    /** Maximum number of reconnect attempts (default: Infinity) */
    maxAttempts?: number;
    /** Called before each reconnection attempt */
    onReconnecting?: (attempt: number, delay: number) => void;
  };
  /** Callback for connection open */
  onOpen?: (event: Event) => void;
  /** Callback for connection error */
  onError?: (event: Event) => void;
  /** Callback for connection close */
  onClose?: () => void;
}

/**
 * Real-time message event
 */
export interface RealtimeMessageEvent<T = unknown> {
  /** Message data (parsed if possible) */
  data: T;
  /** Raw message data */
  raw: string | ArrayBuffer | Blob;
  /** Message type (for WebSocket: 'message', for SSE: event type) */
  type: string;
  /** Timestamp when message was received */
  timestamp: number;
}

/**
 * Real-time client interface
 */
export interface IRealtimeClient {
  /** Connect to the server */
  connect(): Promise<void>;
  /** Disconnect from the server */
  disconnect(): void;
  /** Send a message */
  send(data: string | ArrayBuffer | Blob): void;
  /** Subscribe to messages */
  onMessage<T = unknown>(callback: (event: RealtimeMessageEvent<T>) => void): () => void;
  /** Subscribe to connection open events */
  onOpen(callback: (event: Event) => void): () => void;
  /** Subscribe to connection close events */
  onClose(callback: (event?: CloseEvent) => void): () => void;
  /** Subscribe to connection error events */
  onError(callback: (event: Event) => void): () => void;
  /** Get connection status */
  getStatus(): 'connecting' | 'open' | 'closing' | 'closed';
  /** Get connection statistics */
  getStats(): {
    messagesSent: number;
    messagesReceived: number;
    connectionTime: number;
    reconnectAttempts: number;
  };
}

/**
 * WebSocket client interface (extends IRealtimeClient)
 */
export interface IWebSocketClient extends IRealtimeClient {
  /** WebSocket instance */
  readonly socket: WebSocket | null;
  /** Send JSON data (automatically serialized) */
  sendJson(data: unknown): void;
  /** Subscribe to specific message types */
  onMessageType<T = unknown>(type: string, callback: (data: T) => void): () => void;
}

/**
 * SSE client interface (extends IRealtimeClient)
 */
export interface ISSEClient extends IRealtimeClient {
  /** EventSource instance */
  readonly source: EventSource | null;
  /** Subscribe to specific event types */
  onEvent<T = unknown>(event: string, callback: (data: T) => void): () => void;
  /** Last event ID */
  readonly lastEventId: string | null;
}

// ============= Global Environment Declarations =============
declare global {
  // Deno runtime
  interface Deno {
    readonly version: {
      deno: string;
    };
  }
  const Deno: Deno | undefined;
  
  // Bun runtime
  interface Bun {
    readonly version: string;
  }
  const Bun: Bun | undefined;
  
  // Cloudflare Workers WebSocketPair
  const WebSocketPair: {
    new(): { 0: WebSocket; 1: WebSocket };
  } | undefined;
}
