# Architecture

## Overview

`@bereasoftware/nexa` is a modern, type-safe HTTP client library for TypeScript that combines the power of the native `fetch` API with the convenience of `axios`, built on SOLID principles.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Public API                            │
│  createHttpClient() │ Ok() │ Err() │ Validators │ Plugins    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    HttpClient Core                           │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Request  │  │ Interceptors │  │   Retry Strategies    │  │
│  │  Builder  │  │  Pipeline    │  │ (Aggressive/Conserv.) │  │
│  └────┬─────┘  └──────┬───────┘  └───────────┬───────────┘  │
│       │               │                       │              │
│  ┌────▼─────┐  ┌──────▼───────┐  ┌───────────▼───────────┐  │
│  │  Cache   │  │   Lifecycle  │  │  Concurrency Limiter  │  │
│  │ Strategy │  │    Hooks     │  │     (Queue System)    │  │
│  └────┬─────┘  └──────┬───────┘  └───────────┬───────────┘  │
│       │               │                       │              │
│  ┌────▼───────────────▼───────────────────────▼───────────┐  │
│  │              Request Executor (fetch wrapper)           │  │
│  │  URL interpolation │ Query params │ Body serialization │  │
│  │  Timeout handling  │ AbortSignal  │ Response parsing   │  │
│  └────────────────────────┬───────────────────────────────┘  │
└───────────────────────────┼───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                      Result Monad                              │
│         Result<T, E> = { ok: true, value: T }                  │
│                      | { ok: false, error: E }                 │
└───────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── http-client/
│   ├── index.ts              # Main exports
│   ├── http-client.ts        # HttpClient class implementation
│   ├── types.ts              # Core type definitions
│   ├── request-builder.ts    # Request configuration builder
│   ├── response-parser.ts    # Response type detection & parsing
│   ├── retry-strategies.ts   # Built-in retry implementations
│   ├── cache-strategy.ts     # Cache interface & memory implementation
│   ├── interceptors.ts       # Request/Response interceptor system
│   ├── concurrency-limiter.ts # Concurrent request queue
│   ├── pagination.ts         # Auto-pagination generator
│   ├── polling.ts            # Smart polling implementation
│   └── errors.ts             # HttpError class & error codes
│
├── utils/
│   ├── validators.ts         # Schema & field validators
│   ├── transformers.ts       # Data transformers (camelCase, etc.)
│   ├── middleware.ts         # Pipeline middleware system
│   ├── plugins.ts            # Plugin manager & built-in plugins
│   ├── streaming.ts          # Stream handling utilities
│   ├── generics.ts           # Type utilities & branded types
│   ├── retry.ts              # Generic retry function
│   ├── timeout.ts            # Timeout utility
│   ├── deduplicator.ts       # Request deduplication
│   └── cache.ts              # Cache store implementation
│
└── index.ts                  # Library entry point & exports
```

## Core Components

### 1. HttpClient

The central class that orchestrates all HTTP operations.

**Responsibilities:**
- Request lifecycle management
- Interceptor chain execution
- Retry strategy coordination
- Cache integration
- Concurrency limiting
- Error normalization

**Key Methods:**
- `request()`, `get()`, `post()`, `put()`, `patch()`, `delete()`, `head()`, `options()`
- `extend()` — Create child clients with inherited config
- `paginate()` — Async generator for paginated APIs
- `poll()` — Poll until condition met
- `cancelAll()` — Abort all pending requests

### 2. Result Monad

Discriminated union that eliminates try/catch blocks.

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

**Benefits:**
- Type-safe error handling
- No hidden control flow
- Compiler-enforced error handling
- Composable with functional patterns

### 3. Interceptor System

Middleware-like pattern for request/response transformation.

**Flow:**
```
Request → [Interceptor 1] → [Interceptor 2] → ... → fetch → Response
                                                        ↓
Response ← [Interceptor 1] ← [Interceptor 2] ← ... ← fetch
```

- Request interceptors modify outgoing requests
- Response interceptors transform incoming responses or handle errors
- Each returns a disposer function for cleanup

### 4. Retry Strategies

Pluggable retry logic with multiple built-in strategies:

| Strategy | Use Case |
|----------|----------|
| Inline config | Simple exponential backoff |
| AggressiveRetry | Retry all errors |
| ConservativeRetry | Only retry transient HTTP errors |
| CircuitBreakerRetry | Fail-fast after threshold |
| Custom | Implement `RetryStrategy` interface |

### 5. Cache System

Pluggable caching with TTL support.

**Default:** In-memory `CacheStore` with TTL expiration
**Custom:** Implement `CacheStrategy` interface (Redis, IndexedDB, etc.)

**Scope:** GET requests only, keyed by URL + query params

### 6. Concurrency Limiter

Queue-based system to limit simultaneous requests.

- Configurable `maxConcurrent` limit
- Automatic queuing of excess requests
- Statistics via `queueStats` getter

### 7. Plugin System

Extensible architecture for cross-cutting concerns.

**Built-in Plugins:**
- `LoggerPlugin` — Request/response logging
- `MetricsPlugin` — Performance metrics collection
- `CachePlugin` — Cache integration
- `DedupePlugin` — Request deduplication

**Custom:** Implement `Plugin` interface with `name` and `setup()`

## Data Flow

### Request Lifecycle

```
1. User calls client.get('/users', config)
2. Request config merged with client defaults
3. Request interceptors execute (chain)
4. URL interpolation (:param → value)
5. Query params serialization
6. Body auto-serialization
7. Cache check (GET only)
8. Concurrency queue (if maxConcurrent set)
9. Retry wrapper execution
10. fetch() call with timeout/abort
11. Response parsing (auto-detect content-type)
12. Validators execute
13. Transformers execute
14. Response interceptors execute
15. Result<T, E> returned to caller
16. Lifecycle hooks fire (onSuccess/onError/onFinally)
```

## Design Principles

### SOLID

- **Single Responsibility:** Each component has one reason to change
- **Open/Closed:** Extensible via strategies, plugins, interceptors
- **Liskov Substitution:** All strategies implement their interfaces
- **Interface Segregation:** Focused interfaces (RetryStrategy, CacheStrategy, etc.)
- **Dependency Inversion:** Core depends on abstractions, not concretions

### Zero Dependencies

- Built entirely on native `fetch` API
- No external runtime dependencies
- Tree-shakeable exports

### Type Safety

- Full TypeScript support with generics
- Branded types for URL safety
- Type guards for runtime validation
- Result monad for compile-time error handling

## Extension Points

| Extension Point | Interface | Purpose |
|----------------|-----------|---------|
| Retry | `RetryStrategy` | Custom retry logic |
| Cache | `CacheStrategy` | Custom storage backend |
| Validation | `Validator` | Response data validation |
| Transformation | `Transformer` | Response data transformation |
| Interceptors | `RequestInterceptor` / `ResponseInterceptor` | Request/response modification |
| Plugins | `Plugin` | Cross-cutting functionality |
| Middleware | `Middleware<HttpContext>` | Pipeline processing |
| Dev Tracker | `DevTracker` | Request tracking for Dev Overlay |

### Dev Overlay

Visual development tool integrated into the HTTP client for debugging and monitoring.

**Components:**
- `RequestTracker` — Stores request history and calculates metrics
- `DevOverlayUI` — Floating panel with request list, search, and metrics

**Features:**
- Real-time request tracking with method, status, duration badges
- Metrics: total requests, avg duration, throughput, success/fail rates
- Search/filter by URL, method, or status
- Request detail view with headers and body
- Quick retry via direct `fetch()` from the overlay
- Keyboard shortcuts: `Ctrl+Shift+N` / `Cmd+Shift+N` (toggle), `Escape` (close), `Ctrl+F` / `Cmd+F` (search)

**Integration:**
```typescript
const { tracker, ui } = createDevOverlay(config);
const client = createHttpClient({ devTracker: tracker });
```

The Dev Overlay is tree-shakeable — if you don't import `createDevOverlay`, it won't be included in your bundle. The current UI is optimized for dark mode and `createDevOverlay()` behaves as a singleton.
