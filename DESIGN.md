# Design

## Design Philosophy

Nexa is designed with the following core principles:

### 1. Type Safety First

Every operation is fully typed. The Result monad ensures that both success and error paths are handled at compile time.

```typescript
// Compiler enforces handling both cases
const result = await client.get<User>("/users/1");
if (result.ok) {
  // result.value is User — fully typed
} else {
  // result.error is HttpErrorDetails — fully typed
}
```

### 2. Zero Dependencies

Built entirely on native `fetch`. No external runtime dependencies means:

- Smaller bundle size
- No supply chain risk
- No version conflicts
- Easier maintenance

### 3. Composable & Extensible

Every aspect of Nexa can be customized:

- **Strategies** for retry and cache
- **Interceptors** for request/response transformation
- **Plugins** for cross-cutting concerns
- **Validators** for data validation
- **Transformers** for data transformation

### 4. Developer Experience

- Intuitive API that feels natural
- Sensible defaults that work out of the box
- Progressive disclosure — simple for basics, powerful for advanced
- Comprehensive documentation in Spanish and English

## Naming Conventions

### Files
- `kebab-case.ts` for source files
- `*.test.ts` for test files
- `*.d.ts` for type declarations

### Types
- `PascalCase` for interfaces and types
- `I` prefix avoided — prefer descriptive names
- Generic parameters: single uppercase letters (`T`, `E`, `K`, `V`)

### Functions
- `camelCase` for functions and methods
- Verb-first naming: `createHttpClient`, `handleRequest`
- Boolean returns: `isValid`, `hasCache`, `shouldRetry`

### Variables
- `camelCase` for variables
- Descriptive names over abbreviations
- Constants: `UPPER_SNAKE_CASE`

## API Design Decisions

### Result Monad Over Exceptions

**Why:** Exceptions create hidden control flow and are not type-safe. The Result pattern makes error handling explicit and compiler-enforced.

**Trade-off:** More verbose than try/catch, but safer and more predictable.

### Factory Function Over Class Constructor

**Why:** `createHttpClient()` provides a cleaner API than `new HttpClient()`. It allows for future internal changes without breaking the public API.

```typescript
// Preferred
const client = createHttpClient({ baseURL: "..." });

// Not used
// const client = new HttpClient({ baseURL: "..." });
```

### Config Object Over Multiple Parameters

**Why:** A single config object is more extensible and easier to document.

```typescript
// Preferred
client.get("/users", { timeout: 5000, headers: { "X-Custom": "value" } });

// Not used
// client.get("/users", 5000, { "X-Custom": "value" });
```

### Method Chaining for Plugins

**Why:** Fluent API for plugin registration is more readable.

```typescript
manager
  .register(LoggerPlugin)
  .register(new MetricsPlugin())
  .register(new CachePlugin(30000));
```

## Code Style

### Formatting

- 2-space indentation
- Semicolons required
- Single quotes for strings (double for JSX/HTML)
- Trailing commas in multi-line
- Max line length: reasonable (no hard limit)

### Imports

- Type imports use `import type`
- Group imports: external, internal, types
- Named imports preferred over default

### Error Handling

- Never swallow errors silently
- Use Result monad for expected errors
- Throw only for programmer errors (bugs)
- Provide meaningful error codes

### Documentation

- JSDoc for public API
- Examples in README for common patterns
- Inline comments for non-obvious logic
- No comments for self-explanatory code

## Testing Philosophy

### What to Test

- Public API behavior
- Error scenarios
- Edge cases
- Integration between components

### What Not to Test

- Internal implementation details
- Third-party library behavior
- Trivial getters/setters
- Type-only code

### Test Organization

```
test/
├── http-client.test.ts    # Core HTTP client tests
└── utils.test.ts          # Utility function tests
```

### Coverage Goals

- **Target:** 75-80% (realistic ceiling for unit tests)
- **Focus:** All production code paths reachable via mocks
- **Acceptable gaps:** Streaming (requires real HTTP), reference examples

## Performance Considerations

### Bundle Size

- Tree-shakeable exports
- No dead code
- Minimal runtime overhead
- Multiple build formats for different use cases

### Runtime Performance

- Lazy evaluation where possible
- Efficient cache key generation
- Request deduplication to avoid redundant network calls
- Concurrent request limiting to prevent overload

### Memory Management

- Disposer functions for interceptors
- Cache TTL for automatic cleanup
- Deduplicator cleanup for completed requests
- No memory leaks in long-running applications

## Security Considerations

- No automatic credential storage
- User responsible for input validation
- HTTPS recommended for production
- Timeout defaults prevent resource exhaustion
- No automatic retry on POST/PUT/DELETE (user must opt-in)
