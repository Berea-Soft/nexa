<p align="center">
  <h1 align="center">@bereasoftware/nexa</h1>
  <p align="center">
    A modern, type-safe HTTP client that combines the power of <code>fetch</code> with the convenience of <code>axios</code> — built on SOLID principles.
  </p>
</p>

<p align="center">
  <a href="#tests"><img src="https://img.shields.io/badge/Tests-233_passing-brightgreen?style=for-the-badge" alt="Tests" /></a>
  <a href="#test-coverage"><img src="https://img.shields.io/badge/Coverage-72%25-orange?style=for-the-badge" alt="Coverage" /></a>
  <a href="https://www.npmjs.com/package/@bereasoftware/nexa"><img src="https://img.shields.io/npm/v/@bereasoftware/nexa?style=for-the-badge" alt="NPM Version" /></a>
  <a href="https://bundlephobia.com/package/@bereasoftware/nexa"><img src="https://img.shields.io/bundlephobia/minzip/@bereasoftware/nexa?label=Bundle&style=for-the-badge" alt="Bundle Size" /></a>
  <a href="https://www.npmjs.com/package/@bereasoftware/nexa"><img src="https://img.shields.io/npm/dm/@bereasoftware/nexa?style=for-the-badge" alt="NPM Downloads" /></a>
  <img src="https://img.shields.io/badge/Node-20%2B-success?style=for-the-badge" alt="Node" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Dependencies-Zero-brightgreen?style=for-the-badge" alt="Dependencies" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" /></a>
  <a href="https://github.com/Berea-Soft/nexa"><img src="https://img.shields.io/badge/github-Repository-blue?logo=github&style=for-the-badge" alt="Repository" /></a>
</p>

> 📚 **Documentation available in other languages:**
>
> - 🇪🇸 [Español](README.md)
> - 🇬🇧 **English** (this file - README.en.md)

---

## Why Nexa?

| Feature                         | `fetch` | `axios` | **Nexa** |
| ------------------------------- | :-----: | :-----: | :------: |
| Zero dependencies               |   ✅    |   ❌    |    ✅    |
| Type-safe errors (Result monad) |   ❌    |   ❌    |    ✅    |
| Auto body serialization         |   ❌    |   ✅    |    ✅    |
| Path parameter interpolation    |   ❌    |   ❌    |    ✅    |
| Retry strategies (pluggable)    |   ❌    |   ❌    |    ✅    |
| Built-in caching                |   ❌    |   ❌    |    ✅    |
| Request deduplication           |   ❌    |   ❌    |    ✅    |
| Download progress               |   ❌    |   ✅    |    ✅    |
| Lifecycle hooks                 |   ❌    |   ❌    |    ✅    |
| Concurrent request limiting     |   ❌    |   ❌    |    ✅    |
| Auto-pagination                 |   ❌    |   ❌    |    ✅    |
| Smart polling                   |   ❌    |   ❌    |    ✅    |
| Client extension (`.extend()`)  |   ❌    |   ✅    |    ✅    |
| Interceptor disposal            |   ❌    |   ❌    |    ✅    |
| Middleware pipeline             |   ❌    |   ❌    |    ✅    |
| Plugin system                   |   ❌    |   ❌    |    ✅    |
| Validators & transformers       |   ❌    |   ❌    |    ✅    |
| Response duration tracking      |   ❌    |   ❌    |    ✅    |
| Smart response type detection   |   ❌    |   ✅    |    ✅    |
| Request transformation (transformRequest)   |   ❌    |   ✅    |    ✅    |
| Credentials policy   |   ✅    |   ✅    |    ✅    |
| Adapter pattern (mocking/testing)   |   ❌    |   ✅    |    ✅    |
| Automatic FormData conversion   |   ❌    |   ❌    |    ✅    |
| Enhanced error context (request/response/config)   |   ❌    |   ✅    |    ✅    |
| Differentiated timeouts (connection vs response)   |   ❌    |   ❌    |    ✅    |
| Debug logging (development mode)                   |   ❌    |   ❌    |    ✅    |
| Tree-shakeable                  |   ✅    |   ❌    |    ✅    |

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Result Monad (No try/catch)](#result-monad)
  - [Creating a Client](#creating-a-client)
- [HTTP Methods](#http-methods)
- [Request Configuration](#request-configuration)
  - [Path Parameters](#path-parameters)
  - [Query Parameters](#query-parameters)
  - [Auto Body Serialization](#auto-body-serialization)
  - [Request Transformation (transformRequest)](#request-transformation-transformrequest)
  - [Credentials Policy](#credentials-policy)
  - [Adapter Pattern](#adapter-pattern)
  - [Transport Configuration](#transport-configuration)
  - [Response Types](#response-types)
  - [Timeout](#timeout)
- [Retry Strategies](#retry-strategies)
  - [Inline Config](#inline-retry-config)
  - [AggressiveRetry](#aggressiveretry)
  - [ConservativeRetry](#conservativeretry)
  - [CircuitBreakerRetry](#circuitbreakerretry)
  - [Custom Strategy](#custom-retry-strategy)
- [Interceptors](#interceptors)
  - [Request Interceptors](#request-interceptors)
  - [Response Interceptors](#response-interceptors)
  - [Interceptor Disposal](#interceptor-disposal)
- [Caching](#caching)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Download Progress](#download-progress)
- [Concurrent Request Limiting](#concurrent-request-limiting)
- [Client Extension](#client-extension)
- [Auto-Pagination](#auto-pagination)
- [Smart Polling](#smart-polling)
- [Request Cancellation](#request-cancellation)
- [Validators](#validators)
- [Transformers](#transformers)
- [Middleware Pipeline](#middleware-pipeline)
- [Plugin System](#plugin-system)
- [Streaming](#streaming)
- [Typed Generics](#typed-generics)
- [Error Handling](#error-handling)
  - [Enhanced Error Context](#enhanced-error-context)
- [API Reference](#api-reference)
- [Build Formats](#build-formats)
- [Development](#development)
- [License](#license)

---

## Installation

```bash
npm install @bereasoftware/nexa
```

```bash
yarn add @bereasoftware/nexa
```

```bash
pnpm add @bereasoftware/nexa
```

---

## Quick Start

```typescript
import { createHttpClient } from "@bereasoftware/nexa";

const client = createHttpClient({
  baseURL: "https://api.example.com",
});

// Type-safe, no try/catch needed
const result = await client.get<User>("/users/1");

if (result.ok) {
  console.log(result.value.data); // User
  console.log(result.value.status); // 200
  console.log(result.value.duration); // 42 (ms)
} else {
  console.log(result.error.message); // "Request failed with status 404"
  console.log(result.error.code); // "HTTP_ERROR"
}
```

---

## Core Concepts

### Result Monad

Nexa returns a `Result<T, E>` type instead of throwing exceptions. This eliminates the need for `try/catch` blocks and gives you full type safety on both success and error paths.

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

You can also construct results manually:

```typescript
import { Ok, Err } from "@bereasoftware/nexa";

const success = Ok({ name: "John" }); // { ok: true, value: { name: 'John' } }
const failure = Err({ message: "Not found", code: "HTTP_ERROR" });
```

Every client method returns `Promise<Result<HttpResponse<T>, HttpErrorDetails>>`:

```typescript
const result = await client.get<User[]>('/users');

if (result.ok) {
  // result.value is HttpResponse<User[]>
  const users: User[] = result.value.data;
  const status: number = result.value.status;
  const duration: number = result.value.duration;
  const headers: Headers = result.value.headers;
} else {
  // result.error is HttpErrorDetails
  const message: string = result.error.message;
  const code: string = result.error.code;       // 'HTTP_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR' | 'ABORTED' | ...
  const status?: number = result.error.status;
}
```

### Creating a Client

```typescript
import { createHttpClient } from "@bereasoftware/nexa";

const client = createHttpClient({
  baseURL: "https://api.example.com",
  defaultHeaders: { Authorization: "Bearer token123" },
  defaultTimeout: 10000, // 10s (default: 30s)
  validateStatus: (status) => status < 400, // Custom status validation
  maxConcurrent: 5, // Max 5 simultaneous requests
  defaultResponseType: "json", // 'json' | 'text' | 'blob' | 'auto' | ...
  defaultHooks: {
    onStart: (req) => console.log("Starting:", req.url),
    onFinally: () => console.log("Done"),
  },
});
```

**Full `HttpClientConfig` options:**

| Option                | Type                          | Default                                  | Description                                |
| --------------------- | ----------------------------- | ---------------------------------------- | ------------------------------------------ |
| `baseURL`             | `string`                      | `''`                                     | Base URL prepended to all requests         |
| `defaultHeaders`      | `Record<string, string>`      | `{ 'Content-Type': 'application/json' }` | Default headers for every request          |
| `defaultTimeout`      | `number`                      | `30000`                                  | Default timeout in ms                      |
| `validateStatus`      | `(status: number) => boolean` | `status >= 200 && status < 300`          | Which HTTP statuses are considered success |
| `cacheStrategy`       | `CacheStrategy`               | `MemoryCache`                            | Custom cache implementation                |
| `maxConcurrent`       | `number`                      | `0` (unlimited)                          | Max concurrent requests                    |
| `defaultResponseType` | `ResponseType`                | `'auto'`                                 | Default response parsing strategy          |
| `defaultHooks`        | `RequestHooks`                | `{}`                                     | Default lifecycle hooks for all requests   |
| `debug`               | `boolean \| 'verbose'`        | `undefined`                              | Enable debug logging for requests/responses. `true` for basic logs, `'verbose'` for detailed logs. |
| `logger`              | `(message: string, data?: unknown) => void` | `undefined`                              | Custom logger function. If provided, replaces the default console.log with custom logging. |

---

## HTTP Methods

```typescript
// GET
const result = await client.get<User>("/users/1");

// POST
const result = await client.post<User>("/users", {
  name: "John",
  email: "john@example.com",
});

// PUT
const result = await client.put<User>("/users/1", { name: "John Updated" });

// PATCH
const result = await client.patch<User>("/users/1", {
  email: "new@example.com",
});

// DELETE
const result = await client.delete<void>("/users/1");

// HEAD (check resource existence)
const result = await client.head("/users/1");

// OPTIONS (CORS preflight, available methods)
const result = await client.options("/users");
```

All methods accept an optional config object as the last parameter:

```typescript
const result = await client.get<User>("/users/1", {
  timeout: 5000,
  headers: { "X-Custom": "value" },
  cache: { enabled: true, ttlMs: 60000 },
  retry: { maxAttempts: 3, backoffMs: 1000 },
});
```

---

## Request Configuration

### Path Parameters

Nexa supports `:param` style path interpolation with automatic URI encoding:

```typescript
const result = await client.get<User>("/users/:id/posts/:postId", {
  params: { id: 42, postId: "hello world" },
});
// → GET /users/42/posts/hello%20world
```

### Query Parameters

```typescript
const result = await client.get<User[]>("/users", {
  query: { page: 1, limit: 20, active: true },
});
// → GET /users?page=1&limit=20&active=true
```

### Auto Body Serialization

Nexa automatically detects and serializes the request body:

| Body Type          | Serialization      | Content-Type                        |
| ------------------ | ------------------ | ----------------------------------- |
| `object` / `array` | `JSON.stringify()` | `application/json`                  |
| `string`           | Passed as-is       | `text/plain`                        |
| `FormData`         | Passed as-is       | Auto (multipart boundary)           |
| `URLSearchParams`  | Passed as-is       | `application/x-www-form-urlencoded` |
| `Blob`             | Passed as-is       | Blob's type                         |
| `ArrayBuffer`      | Passed as-is       | `application/octet-stream`          |
| `ReadableStream`   | Passed as-is       | `application/octet-stream`          |

When `autoFormData` is enabled (default), objects containing `File` or `Blob` instances are automatically converted to `FormData`. This is useful for uploading files without manually creating `FormData` instances.

```typescript
// JSON (automatic)
await client.post("/users", { name: "John" });

// FormData (automatic content-type with boundary)
const form = new FormData();
form.append("file", fileBlob);
await client.post("/upload", form);

// URL-encoded
await client.post(
  "/login",
  new URLSearchParams({ user: "john", pass: "secret" }),
);
```

### Request Transformation (transformRequest)

Nexa supports request transformation similar to axios's `transformRequest`. You can provide a function or array of functions that transform the request body before serialization. The transformation is applied after interceptors and before serialization.

```typescript
// Global configuration
const client = createHttpClient({
  transformRequest: [(data, headers) => {
    // Add timestamp to all requests
    if (data && typeof data === 'object') {
      return { ...data, timestamp: Date.now() };
    }
    return data;
  }]
});

// Per-request configuration
await client.post('/api', { foo: 'bar' }, {
  transformRequest: [(data) => ({ ...data, extra: 'value' })]
});
```

### Credentials Policy

Nexa supports the standard fetch `credentials` option as well as axios-compatible `withCredentials` boolean. This controls whether cookies and other credentials are sent with cross-origin requests.

```typescript
// Using fetch-style credentials
await client.get('/api', { credentials: 'include' });

// Using axios-style withCredentials (true = 'include', false = 'same-origin')
await client.post('/api', data, { withCredentials: true });

// Global configuration
const client = createHttpClient({
  credentials: 'same-origin', // Default: 'omit'
  // or
  withCredentials: true, // Equivalent to credentials: 'include'
});
```

Priority: `credentials` overrides `withCredentials` if both are specified.

### Adapter Pattern

Nexa supports custom adapters for mocking, testing, or integrating with different environments (Cloudflare Workers, Node.js, etc.). The adapter has the same signature as the global `fetch` function.

```typescript
// Mock adapter for testing
const mockAdapter = async (input: RequestInfo, init?: RequestInit) => {
  return new Response(JSON.stringify({ mock: true }), { status: 200 });
};

// Global adapter
const client = createHttpClient({
  adapter: mockAdapter,
});

// Per-request adapter (overrides global)
await client.get('/api', { adapter: mockAdapter });
```

Adapters can be used to intercept requests before they reach the network, enabling easy testing without actual HTTP calls.

### Mocking Utilities (axios-mock-adapter style)

For more sophisticated testing scenarios, Nexa provides a mocking utility similar to `axios-mock-adapter`. This allows you to configure mock responses for specific routes and HTTP methods.

```typescript
import { createHttpClient } from '@bereasoftware/nexa';
import { createMockClient } from '@bereasoftware/nexa/testing';

const client = createHttpClient({ baseURL: 'https://api.example.com' });
const mockClient = createMockClient(client);

// Configure mock responses
mockClient.onGet('/users').reply(200, [{ id: 1, name: 'John' }]);
mockClient.onPost('/users').reply(201, { id: 2, name: 'Jane' });
mockClient.onPut('/users/1').reply(200, { id: 1, name: 'Updated' });
mockClient.onDelete('/users/1').reply(204);

// Network error simulation
mockClient.onGet('/error').networkError('Network failure');

// Use the mock-enabled client for requests
const result = await mockClient.client.get('/users');
if (result.ok) {
  console.log(result.value.data); // [{ id: 1, name: 'John' }]
}

// Advanced: reply once, then fall through
mockClient.onGet('/once').replyOnce(200, { data: 'first' });
// Second call to same route will not match (unless passthrough enabled)

// Advanced: function-based responses
mockClient.onGet('/dynamic').reply((config) => ({
  status: 200,
  data: { url: config.url, query: config.query },
}));

// Reset mock routes between tests
mockClient.reset();
```

**Key features:**
- **Fluent API**: `onGet(url).reply(status, data)` similar to axios-mock-adapter
- **URL patterns**: Support string exact match or RegExp
- **Response functions**: Dynamic responses based on request config
- **Call limits**: `replyOnce()` for one-time mock
- **Network errors**: Simulate network failures with `networkError()`
- **Timeout simulation**: `timeout()` method for timeout testing
- **Passthrough mode**: Optionally forward unmatched requests to real adapter
- **Base URL support**: Automatically strips baseURL when matching

**Options** for `createMockClient`:
- `passthrough`: Forward unmatched requests to original adapter (default: `false`)
- `baseURL`: Base URL to strip when matching routes
- `delay`: Default delay for all responses (ms)

### Transport Configuration

Nexa supports multiple transport layers for different environments. By default, it uses the global `fetch` API (available in browsers and Node.js 18+). For advanced Node.js scenarios, you can use the native HTTP/1.1 or HTTP/2 modules with keep-alive, connection pooling, and other Node-specific optimizations.

```typescript
import { createHttpClient } from '@bereasoftware/nexa';

// Use Node.js HTTP/1.1 with keep-alive and connection pooling
const client = createHttpClient({
  transport: 'node', // 'fetch' (default), 'node', or 'http2'
  nodeOptions: {
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    maxRequestsPerSocket: 0, // unlimited
    timeout: 60000,
  },
});

// Use HTTP/2 for better performance with multiplexing
const http2Client = createHttpClient({
  transport: 'http2',
  nodeOptions: {
    http2Settings: {
      enablePush: false,
    },
  },
});

// Override transport per request
await client.get('/api', {
  transport: 'http2',
  nodeOptions: { keepAlive: true },
});
```

**Note:** Node transports (`'node'` and `'http2'`) are only available in Node.js environments. In browsers, they will fall back to `'fetch'` automatically.

**Available options in `nodeOptions`:**
- `keepAlive` (boolean): Enable keep-alive connections (default: `true`)
- `maxSockets` (number): Maximum sockets per host (default: `50`)
- `maxFreeSockets` (number): Maximum free sockets to keep open (default: `10`)
- `maxRequestsPerSocket` (number): Maximum requests per socket (default: `0` = unlimited)
- `timeout` (number): Socket timeout in milliseconds (default: `60000`)
- `http2` (boolean): Deprecated - use `transport: 'http2'` instead
- `http2Settings` (Record<string, unknown>): HTTP/2 specific settings (only for `transport: 'http2'`)

### Response Types

Control how the response body is parsed:

```typescript
// Auto-detect based on Content-Type header (default)
const result = await client.get("/data", { responseType: "auto" });

// Force JSON parsing
const result = await client.get<User>("/user", { responseType: "json" });

// Get raw text
const result = await client.get<string>("/page", { responseType: "text" });

// Download as Blob
const result = await client.get<Blob>("/file.pdf", { responseType: "blob" });

// Get ArrayBuffer
const result = await client.get<ArrayBuffer>("/binary", {
  responseType: "arrayBuffer",
});

// Get FormData
const result = await client.get<FormData>("/form", {
  responseType: "formData",
});

// Get ReadableStream (for manual streaming)
const result = await client.get<ReadableStream>("/stream", {
  responseType: "stream",
});
```

**Auto-detection logic:** `application/json` → JSON, `text/*` → text, `multipart/form-data` → FormData, `application/octet-stream` / `image/*` / `audio/*` / `video/*` → Blob, fallback → try JSON then text.

### Timeout

```typescript
// Per-request timeout
const result = await client.get("/slow-endpoint", { timeout: 5000 });

// Timeout produces a specific error code
if (!result.ok && result.error.code === "TIMEOUT") {
  console.log("Request timed out");
```

Nexa also supports differentiated timeouts for connection and response phases, going beyond axios/fetch's single timeout. You can specify timeouts as an object:

```typescript
// Differentiated timeouts
await client.get('/api', {
  timeout: {
    connection: 3000,  // 3 seconds to establish connection
    response: 10000,   // 10 seconds to receive complete response
    total: 15000       // Optional total timeout (overrides connection/response)
  }
});

// Backward compatibility: number still works (total timeout)
await client.get('/api', { timeout: 5000 });
```

Error codes: `TIMEOUT` for connection/total timeouts, `RESPONSE_TIMEOUT` for response phase timeouts.

### Debug Logging

Nexa provides axios-like debug logging for development. Enable it globally or per-request:

```typescript
// Global debug logging
const client = createHttpClient({
  debug: true, // basic logs
  // debug: 'verbose', // detailed logs
});

// Per-request override
await client.get('/api', { debug: 'verbose' });
```

Logs include request method/URL, response status, duration, errors, retries, and cache hits. With `verbose` mode, you also see transformed requests, interceptor outputs, and response data.

#### Custom Logger

You can provide a custom logger function to redirect logs to your preferred logging system:

```typescript
const client = createHttpClient({
  debug: true,
  logger: (message, data) => {
    // Send to your logging service
    myLogger.info(message, data);
  },
});

// Request-level logger override
await client.post('/api', data, { 
  debug: true,
  logger: (msg, data) => console.warn(msg, data)
});
```

The logger receives two arguments: the log message (prefixed with `[Nexa HTTP]`) and optional data object.

---

## Retry Strategies

### Inline Retry Config

Simple retry with exponential backoff:

```typescript
const result = await client.get("/unstable-api", {
  retry: { maxAttempts: 3, backoffMs: 1000 },
});
// Retries up to 3 times with exponential backoff + jitter
```

### Custom Retry Condition

You can provide a custom condition function to decide which errors should be retried:

```typescript
const result = await client.get('/api', {
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    on: (error) => {
      // Retry only on network errors or 5xx status
      return error.code === 'NETWORK_ERROR' || 
             (error.status >= 500 && error.status < 600) ||
             error.message.includes('ECONNRESET')
    }
  }
});
```

The `on` function receives the `HttpErrorDetails` and attempt number, and returns `true` if the request should be retried. If `on` is not provided, the default condition (5xx status, network errors, timeouts) is used.

### AggressiveRetry

Retries all errors up to max attempts with minimal delay:

```typescript
import { AggressiveRetry } from "@bereasoftware/nexa";

const result = await client.get("/api", {
  retry: new AggressiveRetry(5), // 5 attempts, 50ms * attempt delay
});
```

### ConservativeRetry

Only retries on specific HTTP status codes (408, 429, 500, 502, 503, 504) and timeouts:

```typescript
import { ConservativeRetry } from "@bereasoftware/nexa";

const result = await client.get("/api", {
  retry: new ConservativeRetry(3), // 3 attempts, exponential backoff capped at 10s
});
```

### CircuitBreakerRetry

Fail-fast pattern — stops retrying after a threshold of failures:

```typescript
import { CircuitBreakerRetry } from "@bereasoftware/nexa";

const breaker = new CircuitBreakerRetry(
  3, // maxAttempts per request
  5, // failureThreshold before circuit opens
  60000, // resetTimeMs — circuit resets after 60s
);

const result = await client.get("/api", { retry: breaker });

// Reset the circuit manually
breaker.reset();
```

### Custom Retry Strategy

Implement the `RetryStrategy` interface:

```typescript
import type { RetryStrategy, HttpErrorDetails } from "@bereasoftware/nexa";

const customRetry: RetryStrategy = {
  shouldRetry(attempt: number, error: HttpErrorDetails): boolean {
    // Only retry network errors and 503
    return (
      (error.code === "NETWORK_ERROR" || error.status === 503) && attempt < 5
    );
  },
  delayMs(attempt: number): number {
    // Linear backoff: 500ms, 1000ms, 1500ms...
    return attempt * 500;
  },
};

const result = await client.get("/api", { retry: customRetry });
```

---

## Interceptors

### Request Interceptors

Modify requests before they are sent:

```typescript
client.addRequestInterceptor({
  onRequest(request) {
    // Add auth token to every request
    return {
      ...request,
      headers: {
        ...request.headers,
        Authorization: `Bearer ${getToken()}`,
      },
    };
  },
});
```

### Response Interceptors

Transform responses or handle errors globally:

```typescript
client.addResponseInterceptor({
  onResponse(response) {
    // Log all successful responses
    console.log(
      `[${response.status}] ${response.request.url} (${response.duration}ms)`,
    );
    return response;
  },
  onError(error) {
    // Handle 401 globally
    if (error.status === 401) {
      redirectToLogin();
    }
    return error;
  },
});
```

### Interceptor Disposal

Both `addRequestInterceptor` and `addResponseInterceptor` return a disposer function to remove the interceptor:

```typescript
const dispose = client.addRequestInterceptor({
  onRequest(request) {
    return { ...request, headers: { ...request.headers, "X-Temp": "value" } };
  },
});

// Later: remove the interceptor
dispose();

// Or clear all interceptors
client.clearInterceptors();
```

---

## Caching

Built-in in-memory cache with TTL support. Only caches GET requests:

```typescript
const result = await client.get<User>("/users/1", {
  cache: { enabled: true, ttlMs: 60000 }, // Cache for 1 minute
});

// Second call returns cached response instantly
const cached = await client.get<User>("/users/1", {
  cache: { enabled: true, ttlMs: 60000 },
});
```

**Custom cache implementation:**

```typescript
import type { CacheStrategy } from "@bereasoftware/nexa";

const redisCache: CacheStrategy = {
  get(key: string) {
    return redis.get(key);
  },
  set(key: string, value: unknown, ttlMs?: number) {
    redis.set(key, value, "PX", ttlMs);
  },
  has(key: string) {
    return redis.exists(key);
  },
  clear() {
    redis.flushdb();
  },
};

const client = createHttpClient({ cacheStrategy: redisCache });
```

---

## Lifecycle Hooks

Monitor the full request lifecycle:

```typescript
const result = await client.get<User>("/users/1", {
  hooks: {
    onStart(request) {
      console.log("Starting request to:", request.url);
    },
    onSuccess(response) {
      console.log("Success:", response.status, `(${response.duration}ms)`);
    },
    onError(error) {
      console.error("Failed:", error.message, error.code);
    },
    onRetry(attempt, error) {
      console.warn(`Retry #${attempt}:`, error.message);
    },
    onFinally() {
      console.log("Request complete (success or failure)");
    },
  },
});
```

Default hooks can be set at the client level:

```typescript
const client = createHttpClient({
  defaultHooks: {
    onError: (error) => reportToSentry(error),
    onFinally: () => hideLoadingSpinner(),
  },
});
```

---

## Download Progress

Track download progress with a callback:

```typescript
const result = await client.get<Blob>("/large-file.zip", {
  responseType: "blob",
  onDownloadProgress(event) {
    console.log(
      `Downloaded: ${event.percent}% (${event.loaded}/${event.total} bytes)`,
    );
    updateProgressBar(event.percent);
  },
});
```

The `ProgressEvent` interface:

```typescript
interface ProgressEvent {
  loaded: number; // Bytes downloaded so far
  total: number; // Total bytes (from Content-Length header)
  percent: number; // 0-100
}
```

---

## Concurrent Request Limiting

Limit the number of simultaneous requests to avoid overwhelming a server:

```typescript
const client = createHttpClient({
  baseURL: "https://api.example.com",
  maxConcurrent: 3, // Only 3 requests at a time
});

// Fire 10 requests — only 3 run simultaneously, rest queue automatically
const results = await Promise.all(urls.map((url) => client.get(url)));
```

Check queue status:

```typescript
console.log(client.queueStats);
// { active: 3, pending: 7 }

console.log(client.activeRequests);
// 3
```

---

## Client Extension

Create child clients that inherit configuration and interceptors:

```typescript
const baseClient = createHttpClient({
  baseURL: "https://api.example.com",
  defaultHeaders: { "X-App": "MyApp" },
});

baseClient.addRequestInterceptor({
  onRequest(req) {
    return {
      ...req,
      headers: { ...req.headers, Authorization: "Bearer token" },
    };
  },
});

// Child inherits baseURL, headers, interceptors — and adds version header
const v2Client = baseClient.extend({
  defaultHeaders: { "X-API-Version": "2" },
});

// v2Client has headers: { 'X-App': 'MyApp', 'X-API-Version': '2' }
// v2Client also has the auth interceptor from baseClient
```

---

## Auto-Pagination

Iterate through paginated APIs with async generators:

```typescript
interface PageResponse {
  items: User[];
  nextCursor: string | null;
}

for await (const users of client.paginate<PageResponse>("/users", {
  getItems: (data) => data.items,
  getNextPage: (data, config) =>
    data.nextCursor
      ? {
          ...config,
          query: { ...(config.query as any), cursor: data.nextCursor },
        }
      : null,
})) {
  console.log("Page with", users.length, "users");
  // Process each page of users
}
```

Pagination stops automatically when `getNextPage` returns `null` or a request fails.

---

## Smart Polling

Poll an endpoint until a condition is met:

```typescript
interface Job {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
}

const result = await client.poll<Job>("/jobs/abc123", {
  intervalMs: 2000, // Poll every 2 seconds
  maxAttempts: 30, // Give up after 30 attempts (0 = unlimited)
  until: (job) => job.status === "completed" || job.status === "failed",
  onPoll: (job, attempt) => {
    console.log(`Attempt ${attempt}: ${job.status}`);
  },
});

if (result.ok) {
  console.log("Job finished:", result.value.data.result);
} else if (result.error.code === "POLL_EXHAUSTED") {
  console.log("Polling timed out");
}
```

---

## Request Cancellation

Cancel all pending requests:

```typescript
// Start several requests
const promise1 = client.get("/slow-1");
const promise2 = client.get("/slow-2");

// Cancel everything
client.cancelAll();

// Or use AbortSignal for individual requests
const controller = new AbortController();
const result = client.get("/data", { signal: controller.signal });
controller.abort();
```

---

## Validators

Validate response data before it reaches your code:

```typescript
import {
  createSchemaValidator,
  createRequiredFieldsValidator,
  validatorIsArray,
  validatorIsObject,
} from "@bereasoftware/nexa";

// Schema validator
const userValidator = createSchemaValidator<User>({
  id: (v) => typeof v === "number",
  name: (v) => typeof v === "string" && (v as string).length > 0,
  email: (v) => typeof v === "string" && (v as string).includes("@"),
});

const result = await client.get<User>("/users/1", {
  validate: userValidator,
});
// If validation fails: result.error.code === 'VALIDATION_ERROR'

// Required fields validator
const result = await client.get("/api/data", {
  validate: createRequiredFieldsValidator(["id", "name", "createdAt"]),
});

// Array validator
const result = await client.get("/users", {
  validate: validatorIsArray,
});

// Object validator
const result = await client.get("/user/1", {
  validate: validatorIsObject,
});
```

---

## Transformers

Transform response data after parsing:

```typescript
import {
  transformSnakeToCamel,
  transformCamelToSnake,
  transformFlatten,
  createProjectionTransformer,
  createWrapperTransformer,
} from "@bereasoftware/nexa";

// Convert snake_case API responses to camelCase
const result = await client.get("/users/1", {
  transform: transformSnakeToCamel,
});
// { first_name: 'John' } → { firstName: 'John' }

// Convert camelCase to snake_case (for sending data)
const result = await client.get("/data", {
  transform: transformCamelToSnake,
});

// Flatten nested objects
const result = await client.get("/nested", {
  transform: transformFlatten,
});
// { user: { name: 'John' } } → { 'user.name': 'John' }

// Pick specific fields
const result = await client.get("/users/1", {
  transform: createProjectionTransformer(["id", "name"]),
});
// Only keeps { id, name } from the response

// Wrap data in a container
const result = await client.get("/items", {
  transform: createWrapperTransformer("data"),
});
// [1, 2, 3] → { data: [1, 2, 3] }
```

---

## Middleware Pipeline

Express/Koa-style middleware pipeline for advanced request processing:

```typescript
import {
  createPipeline,
  createCacheMiddleware,
  createDedupeMiddleware,
  createStreamingMiddleware,
  type HttpContext,
  type Middleware,
} from "@bereasoftware/nexa";

// Create custom middleware
const loggingMiddleware: Middleware<HttpContext> = async (ctx, next) => {
  console.log(`→ ${ctx.request.method} ${ctx.request.url}`);
  const start = Date.now();
  await next();
  console.log(`← ${ctx.response.status} (${Date.now() - start}ms)`);
};

const authMiddleware: Middleware<HttpContext> = async (ctx, next) => {
  ctx.request.headers["Authorization"] = `Bearer ${getToken()}`;
  await next();
};

// Build and execute pipeline
const pipeline = createPipeline([
  loggingMiddleware,
  authMiddleware,
  createCacheMiddleware({ ttlMs: 30000 }),
  createDedupeMiddleware(),
]);

const ctx: HttpContext = {
  request: { method: "GET", url: "/users", headers: {} },
  response: { status: 0, headers: {} },
  state: {},
};

await pipeline(ctx);
```

**Pre-built middleware:**

| Middleware                            | Description                                  |
| ------------------------------------- | -------------------------------------------- |
| `createCacheMiddleware(options?)`     | Caches GET responses with TTL                |
| `cacheMiddleware`                     | Pre-configured cache (60s TTL)               |
| `createDedupeMiddleware(options?)`    | Deduplicates concurrent identical requests   |
| `dedupeMiddleware`                    | Pre-configured deduplication for GET         |
| `createStreamingMiddleware(options?)` | Handles streaming responses with progress    |
| `streamingMiddleware`                 | Pre-configured streaming with console output |

---

## Plugin System

Extend Nexa with a plugin architecture:

```typescript
import {
  PluginManager,
  LoggerPlugin,
  MetricsPlugin,
  CachePlugin,
  DedupePlugin,
} from "@bereasoftware/nexa";

const manager = new PluginManager();

// Register plugins
manager
  .register(LoggerPlugin)
  .register(new MetricsPlugin())
  .register(new CachePlugin(30000)) // 30s TTL
  .register(new DedupePlugin());

// Listen to events
manager.on("request:start", (url) => console.log("Request to:", url));
manager.on("request:success", (url, status) =>
  console.log("Success:", url, status),
);

// Get metrics
const metrics = (
  manager.getPlugins().find((p) => p.name === "metrics") as MetricsPlugin
).getMetrics();
console.log(metrics); // { requests: 10, errors: 1, totalTime: 4200, avgTime: 420 }
```

**Create custom plugins:**

```typescript
import type { Plugin } from "@bereasoftware/nexa";

const rateLimitPlugin: Plugin = {
  name: "rate-limit",
  setup(client) {
    // Add rate limiting middleware, event listeners, etc.
    const manager = client as PluginManager;
    manager.on("request:start", () => {
      // Custom rate limiting logic
    });
  },
};

manager.register(rateLimitPlugin);
```

---

## Streaming

Handle large files and streaming responses:

```typescript
import { handleStream, streamToFile } from "@bereasoftware/nexa";

// Manual stream processing
const response = await fetch("https://example.com/large-file");
const data = await handleStream(response, {
  onChunk(chunk) {
    console.log("Received chunk:", chunk.length, "bytes");
  },
  onProgress(loaded, total) {
    console.log(`Progress: ${Math.round((loaded / total) * 100)}%`);
  },
});

// Download stream to file
const response = await fetch("https://example.com/data.csv");
await streamToFile(response, "output.csv");
// Works in both Node.js (fs.writeFile) and browser (Blob download)
```

---

## Typed Generics

Advanced type-safe utilities for API client design:

### Typed API Client

```typescript
import { createTypedApiClient, type ApiEndpoint } from "@bereasoftware/nexa";

// Define your API schema with full types
interface UserApi {
  getUser: ApiEndpoint<void, User>;
  createUser: ApiEndpoint<CreateUserDto, User>;
  listUsers: ApiEndpoint<void, User[]>;
}

const api = createTypedApiClient<UserApi>({
  getUser: { method: "GET", path: "/users/1", response: {} as User },
  createUser: { method: "POST", path: "/users", response: {} as User },
  listUsers: { method: "GET", path: "/users", response: [] as User[] },
});

// Fully typed request — knows input and output types
const user = await api.request(client, "getUser");
const newUser = await api.request(client, "createUser", {
  name: "Ella",
  email: "ella@example.com",
});
```

### Branded Types

```typescript
import {
  createUrl,
  createApiUrl,
  type Url,
  type ApiUrl,
  type FileUrl,
} from "@bereasoftware/nexa";

// Branded URLs prevent mixing different URL types at compile time
const apiUrl: ApiUrl = createApiUrl("/users/1");
const genericUrl: Url = createUrl("https://example.com");
```

### Type Guards

```typescript
import { createTypeGuard } from "@bereasoftware/nexa";

interface User {
  id: number;
  name: string;
}

const ensureUser = createTypeGuard<User>(
  (value): value is User =>
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value,
);

const user = ensureUser(unknownData); // throws TypeError if invalid
```

### Observable Pattern

```typescript
import { TypedObservable } from "@bereasoftware/nexa";

const stream = new TypedObservable<User>();

const sub = stream.subscribe(
  (user) => console.log("User:", user.name),
  (err) => console.error("Error:", err),
  () => console.log("Complete"),
);

// Chainable operators
const names = stream.filter((user) => user.active).map((user) => user.name);

stream.next({ id: 1, name: "John", active: true });
stream.complete();

sub.unsubscribe();
```

### Defer (Lazy Promise)

```typescript
import { Defer } from "@bereasoftware/nexa";

const deferred = new Defer<string>();

// Pass the promise to consumers
someConsumer(deferred.promise_());

// Resolve later
deferred.resolve("done");
// Or reject
deferred.reject(new Error("failed"));
```

---

## Error Handling

### Error Codes

| Code               | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `HTTP_ERROR`       | Non-2xx HTTP status (configurable via `validateStatus`) |
| `TIMEOUT`          | Request exceeded timeout duration                       |
| `NETWORK_ERROR`    | Network failure (DNS, connection refused, etc.)         |
| `ABORTED`          | Request was manually cancelled                          |
| `VALIDATION_ERROR` | Response data failed validation                         |
| `POLL_EXHAUSTED`   | Polling reached max attempts without condition met      |
| `MAX_RETRIES`      | All retry attempts exhausted                            |
| `UNKNOWN_ERROR`    | Unclassified error                                      |

### Enhanced Error Context

Nexa provides rich error context similar to axios, including the original request, response, and configuration in error objects. This makes debugging easier.

```typescript
const result = await client.get('/api');
if (!result.ok) {
  const { request, response, config } = result.error;
  console.log('Failed request URL:', request?.url);
  console.log('Response status:', response?.status);
  console.log('Config timeout:', config?.timeout);
}
```

All errors now include `request`, `response` (if available), and `config` properties.

### HttpError Class

```typescript
import { HttpError, isHttpError } from "@bereasoftware/nexa";

// Check if an error is an HttpError
if (isHttpError(error)) {
  console.log(error.status); // HTTP status code
  console.log(error.code); // Error code string
}
```

### Pattern: Handle Different Error Types

```typescript
const result = await client.get<User>("/users/1");

if (!result.ok) {
  switch (result.error.code) {
    case "TIMEOUT":
      showNotification("Request timed out, please try again");
      break;
    case "NETWORK_ERROR":
      showNotification("No internet connection");
      break;
    case "HTTP_ERROR":
      if (result.error.status === 404) showNotification("User not found");
      else if (result.error.status === 403) redirectToLogin();
      break;
    case "VALIDATION_ERROR":
      reportBug("API returned unexpected data format");
      break;
    default:
      reportError(result.error);
  }
}
```

---

## API Reference

### `createHttpClient(config?: HttpClientConfig): HttpClient`

Factory function to create a new HTTP client instance.

### `HttpClient` Methods

| Method                   | Signature                                                                             | Description                  |
| ------------------------ | ------------------------------------------------------------------------------------- | ---------------------------- |
| `request`                | `<T>(config: HttpRequestConfig) → Promise<Result<HttpResponse<T>, HttpErrorDetails>>` | Core request method          |
| `get`                    | `<T>(url, config?) → Promise<Result<...>>`                                            | GET request                  |
| `post`                   | `<T>(url, body?, config?) → Promise<Result<...>>`                                     | POST request                 |
| `put`                    | `<T>(url, body?, config?) → Promise<Result<...>>`                                     | PUT request                  |
| `patch`                  | `<T>(url, body?, config?) → Promise<Result<...>>`                                     | PATCH request                |
| `delete`                 | `<T>(url, config?) → Promise<Result<...>>`                                            | DELETE request               |
| `head`                   | `(url, config?) → Promise<Result<...>>`                                               | HEAD request                 |
| `options`                | `(url, config?) → Promise<Result<...>>`                                               | OPTIONS request              |
| `extend`                 | `(overrides?: HttpClientConfig) → HttpClient`                                         | Create child client          |
| `paginate`               | `<T>(url, options, config?) → AsyncGenerator<T[]>`                                    | Auto-pagination              |
| `poll`                   | `<T>(url, options, config?) → Promise<Result<...>>`                                   | Smart polling                |
| `addRequestInterceptor`  | `(interceptor) → Disposer`                                                            | Add request interceptor      |
| `addResponseInterceptor` | `(interceptor) → Disposer`                                                            | Add response interceptor     |
| `clearInterceptors`      | `() → void`                                                                           | Remove all interceptors      |
| `cancelAll`              | `() → void`                                                                           | Cancel all pending requests  |
| `activeRequests`         | `number` (getter)                                                                     | Number of in-flight requests |
| `queueStats`             | `{ active, pending }` (getter)                                                        | Queue statistics             |

### Types

| Type                  | Description                                                                       |
| --------------------- | --------------------------------------------------------------------------------- |
| `Result<T, E>`        | Success/failure discriminated union                                               |
| `HttpRequest`         | Request configuration (url, method, headers, body, query, params)                 |
| `HttpResponse<T>`     | Response with data, status, headers, duration                                     |
| `HttpErrorDetails`    | Error with message, code, status, originalError                                   |
| `HttpRequestConfig`   | Full request config (extends HttpRequest + retry, cache, hooks, etc.)             |
| `HttpClientConfig`    | Client-level configuration                                                        |
| `RequestInterceptor`  | Intercept outgoing requests                                                       |
| `ResponseInterceptor` | Intercept incoming responses                                                      |
| `RetryStrategy`       | Custom retry logic interface                                                      |
| `CacheStrategy`       | Custom cache implementation interface                                             |
| `Validator`           | Response validation interface                                                     |
| `Transformer`         | Response transformation interface                                                 |
| `PaginateOptions<T>`  | Pagination configuration                                                          |
| `PollOptions<T>`      | Polling configuration                                                             |
| `RequestHooks<T>`     | Lifecycle hook callbacks                                                          |
| `ProgressEvent`       | Download progress data                                                            |
| `ResponseType`        | `'json' \| 'text' \| 'blob' \| 'arrayBuffer' \| 'formData' \| 'stream' \| 'auto'` |
| `Disposer`            | Function that removes an interceptor                                              |

---

## Build Formats

Nexa ships in multiple module formats:

| Format    | File                    | Use Case                                |
| --------- | ----------------------- | --------------------------------------- |
| **ESM**   | `dist/nexa.es.js`       | Modern bundlers (Vite, Rollup, esbuild) |
| **CJS**   | `dist/nexa.cjs.js`      | Node.js `require()`                     |
| **UMD**   | `dist/nexa.umd.js`      | Universal (AMD, CJS, global)            |
| **IIFE**  | `dist/nexa.iife.js`     | Script tags (`<script>`)                |
| **Types** | `dist/types/index.d.ts` | TypeScript type declarations            |

---

## Development

### Tests

**205 tests in total**: 88 HTTP Client tests + 69 utilities tests + 24 mock tests + 4 Node adapter tests + 20 additional tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests use **Vitest** (globals mode) with BDD style (`describe`/`it`/`expect`).

### Build

```bash
# Generate distribution
npm run build
```

**Build configuration:**

- **Formats**: ES, CommonJS, UMD, IIFE
- **Minification**: OXC (ultra-fast)
- **Type Definitions**: Bundled in `/dist/types`
- **Tree-shakeable**: Only imports what you use
- **Externals**: `fs` (Node.js only for `streamToFile`)

**Output:**

```
dist/
  ├── nexa.es.js        (24.9 KB, gzip: 7.53 KB)
  ├── nexa.cjs.js       (19.9 KB, gzip: 6.68 KB)
  ├── nexa.umd.js       (19.8 KB, gzip: 6.75 KB)
  ├── nexa.iife.js      (19.6 KB, gzip: 6.68 KB)
  └── types/            (TypeScript .d.ts declarations)
```

### Test Coverage

**Overall Coverage: 71.4%** — solid unit test coverage with mock-based HTTP testing

| Component   | Coverage   | Details                           |
| ----------- | ---------- | --------------------------------- |
| HTTP Client | **66.7%** | 67.3% branches, 67.0% functions |
| Types       | **100%**   | Perfect type coverage             |
| Testing     | **93.7%**  | 85.1% branches, 95.8% functions   |
| Utils       | **71.8%**  | 66.7% branches, 81.1% functions   |

**HTTP Client** (`test/http-client.test.ts`) — **88 tests**:

- ✓ Core methods: create, GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS (7 tests)
- ✓ Retry strategies & timeouts (3 tests)
- ✓ Interceptors & disposal (5 tests)
- ✓ Caching & validation (4 tests)
- ✓ Type safety & extensions (3 tests)
- ✓ Pagination & polling (5 tests)
- ✓ Response type handling: all 8+ types + auto-detection (13 tests)
- ✓ Binary content-type detection: image/_, audio/_, video/\*, octet-stream (5 tests)
- ✓ Body serialization: JSON, null, strings, Blob, URLSearchParams, ArrayBuffer, TypedArray, FormData, ReadableStream (7 tests)
- ✓ Error normalization: TimeoutError, AbortError, TypeError, unknown, NETWORK_ERROR (5+ tests)
- ✓ Request management: activeRequests, cancelAll, clearCache (2 tests)
- ✓ Module exports verification: all 8 export categories (8 tests)
- ✓ Plugin integration: LoggerPlugin, MetricsPlugin event handlers (7 tests)
- ✓ Advanced configuration: null body, direct Blob, abort messages (5+ tests)

**Utilities** (`test/utils.test.ts`) \u2014 **69 tests**:

- \u2713 Validators: schema, required fields, type checks (4 tests)
- \u2713 Transformers: snake↔camel case, flatten, projection, wrapper (5 tests)
- \u2713 Retry Strategies: Aggressive, Conservative, Circuit Breaker (10 tests)
- \u2713 Timeout & Retry: withTimeout, retry function (6 tests)
- \u2713 Cache: CacheStore CRUD, TTL expiry (5 tests)
- \u2713 Deduplication: RequestDeduplicator sharing, cleanup (3 tests)
- \u2713 Middleware Pipeline: ordering, next() guard, legacy pipeline (3 tests)
- \u2713 Cache Middleware: GET caching, POST bypass (2 tests)
- \u2713 Dedup Middleware: GET dedup, POST bypass (2 tests)
- \u2713 Typed Generics: TypedResponse, TypedObservable (map/filter), Defer, type guards, branded types (9 tests)
- \u2713 Plugins: PluginManager, LoggerPlugin, MetricsPlugin, CachePlugin, DedupePlugin (5 tests)\n\n### Coverage Limitations & Realistic Ceiling\n\nUnit test coverage plateaus around **75-80%** due to inherent mock-based testing limitations:\n\n**Why not 95%?**\n- **Streaming features** (~3-5% gap): Download progress tracking uses `ReadableStream.getReader()` which requires real HTTP streams—not mockable with `fetch-mock`\n- **Utility examples** (~5-10% gap): Middleware patterns and reference code are intentionally not exercised in production \n- **Export-only files** (~2-3% gap): `http-client/index.ts` verified via import validation, not unit testable\n\n**Realistic maximums:**\n- Unit tests + mocks: **~80-85%** ceiling (current: 71.4%)\n- Integration tests required: Would reach 90%+ but beyond this project\u2019s scope\n\nThe 71.4% coverage represents comprehensive testing of all **production code paths** that can be reached via HTTP mocks.

---

## License

MIT © [John Andrade](mailto:johnandrade@bereasoft.com) — [@bereasoftware](https://github.com/Berea-Soft)
