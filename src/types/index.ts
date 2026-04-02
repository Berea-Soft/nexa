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
  timeout?: number;
  signal?: AbortSignal;
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
export interface RetryStrategy {
  shouldRetry(attempt: number, error: HttpErrorDetails): boolean;
  delayMs(attempt: number): number;
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

// ============= Request Configuration =============
export interface HttpRequestConfig extends HttpRequest {
  retry?: RetryStrategy | { maxAttempts: number; backoffMs: number };
  timeout?: number;
  validate?: Validator;
  transform?: Transformer;
  cache?: { enabled: boolean; ttlMs?: number };
  responseType?: ResponseType;
  hooks?: RequestHooks;
  onUploadProgress?: (event: ProgressEvent) => void;
  onDownloadProgress?: (event: ProgressEvent) => void;
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
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  defaultTimeout?: number;
  cacheStrategy?: CacheStrategy;
  validateStatus?: (status: number) => boolean;
  maxConcurrent?: number;
  defaultResponseType?: ResponseType;
  defaultHooks?: RequestHooks;
}
