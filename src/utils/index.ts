/**
 * HTTP Client Utilities
 * Common validators, transformers, and helpers
 */

import type { Validator, Transformer, RetryStrategy, HttpErrorDetails, IHttpClient } from '../types';
import { Ok, Err } from '../types';

// ============= Validators =============

/**
 * Schema validator using simple checks (can be replaced with Zod, Yup, etc)
 */
export function createSchemaValidator<T>(schema: Record<keyof T, (value: unknown) => boolean>): Validator {
  return {
    validate(data) {
      const obj = data as Record<string, unknown>;
      for (const [key, check] of Object.entries(schema)) {
        const checkFn = check as (value: unknown) => boolean;
        if (!checkFn(obj[key])) {
          return Err({
            message: `Validation failed: field "${key}" is invalid`,
            code: 'VALIDATION_ERROR',
          });
        }
      }
      return Ok(data);
    },
  };
}

/**
 * Validator that ensures response has required fields
 */
export function createRequiredFieldsValidator(fields: string[]): Validator {
  return {
    validate(data) {
      const obj = data as any;
      const missing = fields.filter((field) => !(field in obj));
      if (missing.length > 0) {
        return Err({
          message: `Validation failed: missing fields: ${missing.join(', ')}`,
          code: 'VALIDATION_ERROR',
        });
      }
      return Ok(data);
    },
  };
}

/**
 * Validator that ensures response is an array
 */
export const validatorIsArray: Validator = {
  validate(data) {
    return Array.isArray(data) ? Ok(data) : Err({ message: 'Expected array response', code: 'VALIDATION_ERROR' });
  },
};

/**
 * Validator that ensures response is an object
 */
export const validatorIsObject: Validator = {
  validate(data) {
    return data && typeof data === 'object' && !Array.isArray(data)
      ? Ok(data)
      : Err({ message: 'Expected object response', code: 'VALIDATION_ERROR' });
  },
};

// ============= Transformers =============

/**
 * Transform that converts snake_case to camelCase (common API pattern)
 */
export const transformSnakeToCamel: Transformer = {
  transform(data) {
    return transformObject(data, snakeToCamel);
  },
};

/**
 * Transform that converts camelCase to snake_case
 */
export const transformCamelToSnake: Transformer = {
  transform(data) {
    return transformObject(data, camelToSnake);
  },
};

/**
 * Transform that flattens nested data
 */
export const transformFlatten: Transformer = {
  transform(data) {
    return flatten(data);
  },
};

/**
 * Transform that picks specific fields (projection)
 */
export function createProjectionTransformer(fields: string[]): Transformer {
  return {
    transform(data) {
      if (Array.isArray(data)) {
        return data.map((item) => pickFields(item, fields));
      }
      return pickFields(data, fields);
    },
  };
}

/**
 * Transform that wraps data in a container
 */
export function createWrapperTransformer(wrapper: string): Transformer {
  return {
    transform(data) {
      return { [wrapper]: data };
    },
  };
}

// ============= Retry Strategies =============

/**
 * Aggressive retry: retry all errors up to max attempts
 */
export class AggressiveRetry implements RetryStrategy {
  private maxAttempts: number;

  constructor(maxAttempts: number = 5) {
    this.maxAttempts = maxAttempts;
  }

  shouldRetry(attempt: number): boolean {
    return attempt < this.maxAttempts;
  }

  delayMs(attempt: number): number {
    // Quick retries with minimal backoff
    return attempt * 50;
  }
}

/**
 * Conservative retry: only retry on specific status codes
 */
export class ConservativeRetry implements RetryStrategy {
  private retryableStatuses = [408, 429, 500, 502, 503, 504];
  private maxAttempts: number;

  constructor(maxAttempts: number = 3) {
    this.maxAttempts = maxAttempts;
  }

  shouldRetry(attempt: number, error: HttpErrorDetails): boolean {
    if (attempt >= this.maxAttempts) return false;
    return this.retryableStatuses.includes(error.status ?? 0) || error.code === 'TIMEOUT';
  }

  delayMs(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000); // capped at 10s
  }
}

/**
 * Circuit breaker pattern: fail fast after threshold
 */
export class CircuitBreakerRetry implements RetryStrategy {
  private failureCount = 0;
  private lastFailureTime = 0;
  private maxAttempts: number;
  private failureThreshold: number;
  private resetTimeMs: number;

  constructor(maxAttempts: number = 3, failureThreshold: number = 5, resetTimeMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.failureThreshold = failureThreshold;
    this.resetTimeMs = resetTimeMs;
  }

  shouldRetry(attempt: number): boolean {
    if (attempt >= this.maxAttempts) return false;

    // Check if circuit should reset
    if (Date.now() - this.lastFailureTime > this.resetTimeMs) {
      this.failureCount = 0;
    }

    // Open circuit after threshold
    if (this.failureCount >= this.failureThreshold) {
      return false;
    }

    this.failureCount++;
    this.lastFailureTime = Date.now();
    return true;
  }

  delayMs(attempt: number): number {
    return 100 * Math.pow(2, attempt - 1);
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

// ============= Helper Functions =============

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

function transformObject(data: unknown, keyTransform: (key: string) => string): unknown {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => transformObject(item, keyTransform));
  }

  const transformed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    transformed[keyTransform(key)] = transformObject(value, keyTransform);
  }
  return transformed;
}

function flatten(data: unknown, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const key = prefix ? `${prefix}[${index}]` : `[${index}]`;
      Object.assign(result, flatten(item, key));
    });
  } else if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const flatKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, flatten(value, flatKey));
      } else {
        result[flatKey] = value;
      }
    }
  }

  return result;
}

function pickFields(data: unknown, fields: string[]): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};

  const obj = data as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    if (field in obj) {
      result[field] = obj[field];
    }
  }

  return result;
}

// ============= Timeout Utilities =============

/**
 * Creates an AbortController with a timeout.
 * Automatically aborts the operation after the specified milliseconds.
 * The timer is cleaned up when the signal is aborted (either by timeout or externally).
 * @param ms - Timeout in milliseconds
 * @returns AbortController that will abort after timeout
 */
export function withTimeout(ms: number): AbortController {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });
  return controller;
}

/**
 * Retry helper function that retries an async operation
 * @param fn - Async function to retry
 * @param retries - Number of retries (default: 3)
 * @returns Result of the function call
 */
export async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    return retry(fn, retries - 1);
  }
}

// ============= Advanced Features =============

// ===== 1. Automatic Cache (React Query Lite) =====

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

/**
 * Simple cache store with TTL support
 */
export class CacheStore {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttlMs });
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key) as CacheEntry<unknown> | undefined;
    if (!entry) return false;
    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

/**
 * Cache middleware factory - caches HTTP responses with TTL support
 * Automatically skips caching for non-GET requests
 */
export function createCacheMiddleware(options: { cache?: CacheStore; ttlMs?: number; cacheableStatuses?: number[] } = {}): Middleware<HttpContext> {
  const cache = options.cache || new CacheStore();
  const ttlMs = options.ttlMs || 60000; // Default 1 minute
  const cacheableStatuses = options.cacheableStatuses || [200, 304]; // Only cache successful responses

  return async (ctx, next) => {
    const method = (ctx.request.method || 'GET').toUpperCase();
    const isCacheable = method === 'GET'; // Only cache GET requests
    const cacheKey = `${method}:${ctx.request.url}`;

    // Try to serve from cache
    if (isCacheable && cache.has(cacheKey)) {
      const cachedResponse = cache.get<typeof ctx.response>(cacheKey);
      if (cachedResponse) {
        ctx.response = cachedResponse;
        ctx.state.cacheHit = true;
        return;
      }
    }

    // Proceed to next middleware
    await next();

    // Cache successful responses
    if (isCacheable && ctx.response && cacheableStatuses.includes(ctx.response.status)) {
      cache.set(cacheKey, ctx.response, ttlMs);
      ctx.state.cacheMiss = true;
    }
  };
}

/**
 * Pre-configured cache middleware with default 60s TTL
 */
export const cacheMiddleware: Middleware<HttpContext> = createCacheMiddleware();

// ===== 2. Request Deduplication =====

/**
 * Prevents duplicate requests to the same endpoint
 * Shares pending request promises
 */
export class RequestDeduplicator {
  private pending: Map<string, Promise<unknown>> = new Map();

  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    // Create new request and track it
    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise as Promise<T>;
  }

  clear(): void {
    this.pending.clear();
  }
}

/**
 * Deduplication middleware factory - shares pending requests to the same URL
 * Prevents duplicate network requests by sharing the same Promise
 */
export function createDedupeMiddleware(options: { deduplicator?: RequestDeduplicator; includeBody?: boolean; methods?: string[] } = {}): Middleware<HttpContext> {
  const deduplicator = options.deduplicator || new RequestDeduplicator();
  const includeBody = options.includeBody ?? false; // Include body in dedup key for POST/PUT/PATCH
  const methods = options.methods || ['GET']; // Methods to deduplicate

  return async (ctx, next) => {
    const method = (ctx.request.method || 'GET').toUpperCase();
    const shouldDedupe = methods.includes(method);

    if (!shouldDedupe) {
      await next();
      return;
    }

    // Build dedup key
    let dedupeKey = `${method}:${ctx.request.url}`;
    if (includeBody && ctx.request.body) {
      dedupeKey += `:${JSON.stringify(ctx.request.body)}`;
    }

    try {
      // Use deduplicator to share pending requests
      const response = await deduplicator.execute(dedupeKey, async () => {
        await next();
        return ctx.response;
      });

      ctx.response = response;
      ctx.state.deduped = true;
    } catch (error) {
      ctx.error = error;
      throw error;
    }
  };
}

/**
 * Pre-configured deduplication middleware for GET requests
 */
export const dedupeMiddleware: Middleware<HttpContext> = createDedupeMiddleware();

// ===== 3. Middleware Pipeline =====

/**
 * HTTP Context passed through middleware chain
 */
export interface HttpContext {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body?: unknown;
  };
  state: Record<string, unknown>;
  error?: unknown;
}

/**
 * Middleware function type with Express/Koa-like pattern
 * Receives context and next() function to proceed through pipeline
 */
export type Middleware<T extends HttpContext = HttpContext> = (
  ctx: T,
  next: () => Promise<void>,
) => Promise<void>;

/**
 * Create a middleware pipeline executor with proper sequencing
 * Prevents multiple next() calls and ensures proper error propagation
 */
export function createPipeline<T extends HttpContext = HttpContext>(middlewares: Middleware<T>[]) {
  return async (ctx: T): Promise<void> => {
    let index = -1;

    async function dispatch(i: number): Promise<void> {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const fn = middlewares[i];
      if (fn) {
        await fn(ctx, () => dispatch(i + 1));
      }
    }

    await dispatch(0);
  };
}

/**
 * Legacy: MiddlewarePipeline class (backwards compatible)
 * For simpler use cases, kept for compatibility
 */
export class MiddlewarePipeline<T = unknown> {
  private middlewares: Array<
    | Middleware<T extends HttpContext ? T : HttpContext>
    | ((data: T) => T | Promise<T>)
  > = [];

  use(
    middleware:
      | Middleware<T extends HttpContext ? T : HttpContext>
      | ((data: T) => T | Promise<T>),
  ): this {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(data: T): Promise<T> {
    // If data looks like HttpContext, use pipeline pattern
    if (data && typeof data === 'object' && 'request' in data && 'response' in data) {
      const ctx = data as unknown as HttpContext;
      const pipeline = createPipeline(
        this.middlewares.map((mw) => {
          if (typeof mw === 'function' && mw.length === 2) {
            return mw as Middleware;
          }
          // Convert simple transformer to middleware
          return async (ctx: HttpContext, next: () => Promise<void>) => {
            const transform = mw as (data: T) => T | Promise<T>;
            ctx.response.body = await transform(ctx.response.body as T);
            await next();
          };
        }),
      );
      await pipeline(ctx);
      return ctx.response.body as T;
    }

    // Fallback: simple data transformation pipeline
    let result = data;
    for (const mw of this.middlewares) {
      const transform = mw as (data: T) => T | Promise<T>;
      result = await transform(result);
    }
    return result;
  }

  clear(): void {
    this.middlewares = [];
  }
}

// ===== 4. Advanced Typed Generics =====

/**
 * Type-safe response wrapper with automatic type inference
 */
export interface TypedResponse<T, U = unknown> {
  ok: boolean;
  data?: T;
  error?: U;
  status: number;
  headers: Record<string, string>;
}

/**
 * Create a typed response builder
 */
export function createTypedResponse<T, U = unknown>(
  status: number,
  data?: T,
  error?: U,
  headers: Record<string, string> = {},
): TypedResponse<T, U> {
  return {
    ok: status >= 200 && status < 300,
    data,
    error,
    status,
    headers,
  };
}

/**
 * API Endpoint definition with typed request/response
 */
export interface ApiEndpoint<TRequest = unknown, TResponse = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  request?: TRequest;
  response: TResponse;
}

/**
 * Create a strongly-typed API client method
 */
export function createTypedRequest<TRequest, TResponse>(
  endpoint: ApiEndpoint<TRequest, TResponse>,
): (client: IHttpClient, req?: TRequest) => Promise<TResponse> {
  return async (client, req?) => {
    const url = endpoint.path;
    let response: unknown;

    switch (endpoint.method) {
      case 'GET':
        response = await client.get(url);
        break;
      case 'POST':
        response = await client.post(url, req);
        break;
      case 'PUT':
        response = await client.put(url, req);
        break;
      case 'PATCH':
        response = await client.patch(url, req);
        break;
      case 'DELETE':
        response = await client.delete(url);
        break;
      default:
        throw new Error(`Unsupported method: ${endpoint.method}`);
    }

    return response as TResponse;
  };
}

/**
 * API Schema - maps multiple endpoints with automatic type inference
 */
export type ApiSchema = Record<string, ApiEndpoint>;

/**
 * Create a typed API client from schema
 */
export function createTypedApiClient<T extends ApiSchema>(schema: T) {
  return {
    request: async <K extends keyof T>(
      client: IHttpClient,
      endpoint: K,
      data?: T[K] extends ApiEndpoint<infer TReq, any> ? TReq : never,
    ): Promise<T[K] extends ApiEndpoint<any, infer TRes> ? TRes : never> => {
      const ep = schema[endpoint] as ApiEndpoint;
      const requester = createTypedRequest(ep);
      return (await requester(client, data)) as T[K] extends ApiEndpoint<any, infer TRes> ? TRes : never;
    },
  };
}

/**
 * Observable-like response wrapper for reactive patterns
 */
export class TypedObservable<T> {
  private subscribers: Array<(value: T) => void> = [];
  private errorSubscribers: Array<(error: unknown) => void> = [];
  private completeSubscribers: Array<() => void> = [];

  subscribe(
    next?: (value: T) => void,
    error?: (err: unknown) => void,
    complete?: () => void,
  ): { unsubscribe: () => void } {
    if (next) this.subscribers.push(next);
    if (error) this.errorSubscribers.push(error);
    if (complete) this.completeSubscribers.push(complete);

    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter((s) => s !== next);
        this.errorSubscribers = this.errorSubscribers.filter((e) => e !== error);
        this.completeSubscribers = this.completeSubscribers.filter((c) => c !== complete);
      },
    };
  }

  next(value: T): void {
    this.subscribers.forEach((s) => s(value));
  }

  error(err: unknown): void {
    this.errorSubscribers.forEach((e) => e(err));
  }

  complete(): void {
    this.completeSubscribers.forEach((c) => c());
  }

  map<U>(fn: (value: T) => U): TypedObservable<U> {
    const obs = new TypedObservable<U>();
    this.subscribe(
      (value) => obs.next(fn(value)),
      (err) => obs.error(err),
      () => obs.complete(),
    );
    return obs;
  }

  filter(predicate: (value: T) => boolean): TypedObservable<T> {
    const obs = new TypedObservable<T>();
    this.subscribe(
      (value) => {
        if (predicate(value)) obs.next(value);
      },
      (err) => obs.error(err),
      () => obs.complete(),
    );
    return obs;
  }
}

/**
 * Union type helper - extracts success/error types
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Result type extractor for discriminated unions
 */
export type ResultOf<T extends { ok: boolean }> = T extends { ok: true } ? Omit<T, 'ok'> : T extends { ok: false } ? Omit<T, 'ok'> : never;

/**
 * Guard function for typing - validates data is T at runtime
 */
export function createTypeGuard<T>(
  check: (value: unknown) => value is T,
): (value: unknown) => T {
  return (value) => {
    if (!check(value)) {
      throw new TypeError(`Value does not match expected type`);
    }
    return value;
  };
}

/**
 * Branded types for URL safety
 */
export type Url<T extends string = string> = string & { readonly __url: unique symbol; readonly __type: T };
export type ApiUrl = Url<'api'>;
export type FileUrl = Url<'file'>;

export function createUrl<T extends string = string>(url: string): Url<T> {
  return url as Url<T>;
}

export function createApiUrl(path: string): ApiUrl {
  return createUrl<'api'>(path);
}

/**
 * Defer pattern for lazy evaluation
 */
export class Defer<T> {
  private _promise: Promise<T>;
  private resolveFunc!: (value: T) => void;
  private rejectFunc!: (reason?: unknown) => void;

  constructor() {
    this._promise = new Promise((resolve, reject) => {
      this.resolveFunc = resolve;
      this.rejectFunc = reject;
    });
  }

  resolve(value: T): void {
    this.resolveFunc(value);
  }

  reject(reason?: unknown): void {
    this.rejectFunc(reason);
  }

  get promise(): Promise<T> {
    return this._promise;
  }

  /**
   * @deprecated Use `defer.promise` getter instead
   */
  promise_(): Promise<T> {
    return this._promise;
  }
}

// ===== 5. Streaming Support =====

/**
 * Streaming response handler for large files/streams
 */
export interface StreamOptions {
  chunkSize?: number;
  onChunk?: (chunk: Uint8Array) => void | Promise<void>;
  onProgress?: (loaded: number, total: number) => void;
}

/**
 * Handle streaming responses
 */
export async function handleStream(
  response: Response,
  options: StreamOptions = {},
): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is not readable');

  const chunks: Uint8Array[] = [];
  let loaded = 0;
  const total = parseInt(response.headers.get('content-length') || '0', 10);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    loaded += value.length;

    if (options.onChunk) {
      await options.onChunk(value);
    }

    if (options.onProgress && total > 0) {
      options.onProgress(loaded, total);
    }
  }

  return concatUint8Arrays(chunks, loaded);
}

/**
 * Efficiently concatenate Uint8Array chunks into a single array
 */
function concatUint8Arrays(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

/**
 * Stream to file (Node.js compatible)
 */
export async function streamToFile(
  response: Response,
  filePath: string,
): Promise<void> {
  const data = await handleStream(response);

  // For browser, you'd use Blob
  // For Node.js, you'd use fs.writeFile
  if (typeof window === 'undefined') {
    // Node.js environment
    const fs = await import('fs').then((m) => m.promises);
    await fs.writeFile(filePath, data);
  } else {
    // Browser: create blob and download
    const blob = new Blob([data.buffer as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Streaming middleware factory - handles streaming responses with progress tracking
 * Useful for large file downloads, real-time data streaming, etc.
 */
export function createStreamingMiddleware(options: { onChunk?: (chunk: Uint8Array) => void | Promise<void>; onProgress?: (loaded: number, total: number) => void } = {}): Middleware<HttpContext> {
  return async (ctx, next) => {
    await next();

    // Check if response has a body to stream
    if (ctx.response && ctx.response.body && typeof ctx.response.body === 'object' && 'getReader' in ctx.response.body) {
      const reader = (ctx.response.body as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      const total = parseInt((ctx.response.headers?.['content-length'] as string) || '0', 10);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          loaded += value.length;

          if (options.onChunk) {
            await options.onChunk(value);
          }

          if (options.onProgress && total > 0) {
            options.onProgress(loaded, total);
          }

          ctx.state.streamedChunks = (ctx.state.streamedChunks as Uint8Array[]) || [];
          (ctx.state.streamedChunks as Uint8Array[]).push(value);
        }

        // Combine all chunks into response body
        const resultData = concatUint8Arrays(chunks, loaded);
        ctx.response.body = resultData;
        ctx.state.streaming = true;
        ctx.state.streamedBytes = loaded;
      } finally {
        reader.releaseLock();
      }
    }
  };
}

/**
 * Pre-configured streaming middleware with default progress tracking
 */
export const streamingMiddleware: Middleware<HttpContext> = createStreamingMiddleware({
  onProgress: (loaded, total) => {
    if (total > 0) {
      const percent = Math.round((loaded / total) * 100);
      console.log(`⬇️ Streaming: ${percent}% (${loaded}/${total} bytes)`);
    }
  },
});

// ===== 6. Plugins System =====

/**
 * Plugin interface - plugins can extend HttpClient functionality
 */
export interface Plugin {
  name: string;
  setup(manager: PluginManager): void | Promise<void>;
}

/**
 * Plugin manager for extensible architecture
 * Integrates cache, deduplication, and middleware
 */
export class PluginManager {
  private plugins: Plugin[] = [];
  private cache: CacheStore = new CacheStore();
  private deduplicator: RequestDeduplicator = new RequestDeduplicator();
  private middlewares: Middleware<HttpContext>[] = [];
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  /**
   * Register a plugin and call its setup method
   */
  register(plugin: Plugin): this {
    this.plugins.push(plugin);
    void plugin.setup(this);
    this.emit('plugin:registered', plugin.name);
    return this;
  }

  /**
   * Add middleware to the pipeline
   */
  addMiddleware(middleware: Middleware<HttpContext>): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Get cache store
   */
  getCache(): CacheStore {
    return this.cache;
  }

  /**
   * Get request deduplicator
   */
  getDeduplicator(): RequestDeduplicator {
    return this.deduplicator;
  }

  /**
   * Get middleware pipeline executor
   */
  getPipeline(): (ctx: HttpContext) => Promise<void> {
    return createPipeline(this.middlewares);
  }

  /**
   * Execute middleware pipeline for a context
   */
  async executePipeline(ctx: HttpContext): Promise<void> {
    const pipeline = this.getPipeline();
    await pipeline(ctx);
  }

  /**
   * Register event listener
   */
  on(event: string, handler: (...args: unknown[]) => void | Promise<void>): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(handler);
    return this;
  }

  /**
   * Emit event to all listeners
   */
  emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        void handler(...args);
      }
    }
  }

  /**
   * Unregister event listener
   */
  off(event: string, handler: (...args: unknown[]) => void): this {
    this.listeners.get(event)?.delete(handler);
    return this;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }

  /**
   * Clear all plugins, middlewares, and listeners
   */
  clear(): void {
    this.plugins = [];
    this.middlewares = [];
    this.listeners.clear();
    this.cache.clear();
    this.deduplicator.clear();
  }
}

// ===== Example Plugins =====

/**
 * Example: Logger plugin - logs HTTP requests and responses
 */
export const LoggerPlugin: Plugin = {
  name: 'logger',
  setup(manager: PluginManager) {
    manager.on('request:start', (...args: unknown[]) => {
      const url = args[0] as string;
      console.log(`📤 Request started: ${url}`);
    });
    manager.on('request:success', (...args: unknown[]) => {
      const url = args[0] as string;
      const status = args[1] as number;
      console.log(`✅ Request succeeded: ${url} (${status})`);
    });
    manager.on('request:error', (...args: unknown[]) => {
      const url = args[0] as string;
      const error = args[1] as unknown;
      console.error(`❌ Request failed: ${url}`, error);
    });
  },
};

/**
 * Example: Metrics plugin - collects request metrics
 */
export class MetricsPlugin implements Plugin {
  name = 'metrics';
  private metrics = {
    requests: 0,
    errors: 0,
    totalTime: 0,
    avgTime: 0,
  };

  setup(manager: PluginManager): void {
    manager.on('request:complete', (...args: unknown[]) => {
      const duration = args[0] as number;
      const success = args[1] as boolean;
      this.metrics.requests++;
      this.metrics.totalTime += duration;
      this.metrics.avgTime = this.metrics.totalTime / this.metrics.requests;
      if (!success) {
        this.metrics.errors++;
      }
    });
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

/**
 * Example: Cache plugin - automatically adds caching middleware
 */
export class CachePlugin implements Plugin {
  name = 'cache';
  ttlMs: number;

  constructor(ttlMs: number = 60000) {
    this.ttlMs = ttlMs;
  }

  setup(manager: PluginManager): void {
    manager.addMiddleware(createCacheMiddleware({ ttlMs: this.ttlMs }));
  }
}

/**
 * Example: Deduplication plugin - prevents duplicate requests
 */
export class DedupePlugin implements Plugin {
  name = 'dedupe';

  setup(manager: PluginManager): void {
    manager.addMiddleware(createDedupeMiddleware());
  }
}

// Re-export type for convenience
export type { HttpErrorDetails };
