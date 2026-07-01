/**
 * Utilities - BDD Test Suite
 * Covers validators, transformers, retry strategies, middleware, plugins, cache, dedup, streaming helpers
 */

import { describe, it, expect, vi } from 'vitest'
import {
  // Validators
  createSchemaValidator,
  createRequiredFieldsValidator,
  validatorIsArray,
  validatorIsObject,
  // Transformers
  transformSnakeToCamel,
  transformCamelToSnake,
  transformFlatten,
  createProjectionTransformer,
  createWrapperTransformer,
  // Retry Strategies
  AggressiveRetry,
  ConservativeRetry,
  CircuitBreakerRetry,
  // Timeout
  withTimeout,
  retry,
  // Cache
  CacheStore,
  createCacheMiddleware,
  // Dedup
  RequestDeduplicator,
  createDedupeMiddleware,
  // Middleware
  createPipeline,
  MiddlewarePipeline,
  // Typed
  createTypedResponse,
  createTypedRequest,
  createTypedApiClient,
  TypedObservable,
  Defer,
  createTypeGuard,
  createUrl,
  createApiUrl,
  // Plugins
  PluginManager,
  LoggerPlugin,
  MetricsPlugin,
  CachePlugin,
  DedupePlugin,
  Ok,
  Err,
} from '../src/http-client/index.js'
import type {
  HttpContext,
  IHttpClient,
  ApiSchema,
} from '../src/http-client/index.js'

// ============= Validators =============
describe('Validators', () => {
  describe('createSchemaValidator', () => {
    it('should pass when all fields match schema', () => {
      const validator = createSchemaValidator<{ name: string; age: number }>({
        name: (v) => typeof v === 'string',
        age: (v) => typeof v === 'number',
      })
      const result = validator.validate({ name: 'John', age: 30 })
      expect(result.ok).toBe(true)
    })

    it('should fail when a field is invalid', () => {
      const validator = createSchemaValidator<{ name: string }>({
        name: (v) => typeof v === 'string',
      })
      const result = validator.validate({ name: 123 })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.message).toContain('name')
    })

    it('should return a typed Err instead of throwing for non-object input', () => {
      const validator = createSchemaValidator<{ name: string }>({
        name: (v) => typeof v === 'string',
      })
      expect(() => validator.validate(null)).not.toThrow()
      expect(() => validator.validate(42)).not.toThrow()
      const nullResult = validator.validate(null)
      expect(nullResult.ok).toBe(false)
      if (!nullResult.ok) expect(nullResult.error.code).toBe('VALIDATION_ERROR')
      const numberResult = validator.validate(42)
      expect(numberResult.ok).toBe(false)
    })
  })

  describe('createRequiredFieldsValidator', () => {
    it('should pass when all required fields present', () => {
      const validator = createRequiredFieldsValidator(['id', 'name'])
      const result = validator.validate({ id: 1, name: 'test' })
      expect(result.ok).toBe(true)
    })

    it('should fail when required fields are missing', () => {
      const validator = createRequiredFieldsValidator(['id', 'email'])
      const result = validator.validate({ id: 1 })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.message).toContain('email')
    })

    it('should return a typed Err instead of throwing for non-object input', () => {
      const validator = createRequiredFieldsValidator(['id'])
      expect(() => validator.validate(null)).not.toThrow()
      expect(() => validator.validate('a string')).not.toThrow()
      const result = validator.validate(null)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('validatorIsArray', () => {
    it('should pass for arrays', () => {
      expect(validatorIsArray.validate([1, 2]).ok).toBe(true)
    })
    it('should fail for non-arrays', () => {
      expect(validatorIsArray.validate({ a: 1 }).ok).toBe(false)
    })
  })

  describe('validatorIsObject', () => {
    it('should pass for objects', () => {
      expect(validatorIsObject.validate({ a: 1 }).ok).toBe(true)
    })
    it('should fail for arrays', () => {
      expect(validatorIsObject.validate([1]).ok).toBe(false)
    })
    it('should fail for null', () => {
      expect(validatorIsObject.validate(null).ok).toBe(false)
    })
  })
})

// ============= Transformers =============
describe('Transformers', () => {
  describe('transformSnakeToCamel', () => {
    it('should convert snake_case keys to camelCase', () => {
      const result = transformSnakeToCamel.transform({
        user_name: 'John',
        created_at: '2024',
      })
      expect(result).toEqual({ userName: 'John', createdAt: '2024' })
    })

    it('should handle nested objects', () => {
      const result = transformSnakeToCamel.transform({
        user: { first_name: 'John' },
      })
      expect(result).toEqual({ user: { firstName: 'John' } })
    })

    it('should handle arrays', () => {
      const result = transformSnakeToCamel.transform([
        { first_name: 'A' },
        { first_name: 'B' },
      ])
      expect(result).toEqual([{ firstName: 'A' }, { firstName: 'B' }])
    })
  })

  describe('transformCamelToSnake', () => {
    it('should convert camelCase keys to snake_case', () => {
      const result = transformCamelToSnake.transform({ userName: 'John' })
      expect(result).toEqual({ user_name: 'John' })
    })
  })

  describe('transformFlatten', () => {
    it('should flatten nested objects', () => {
      const result = transformFlatten.transform({ a: { b: 1, c: { d: 2 } } })
      expect(result).toEqual({ 'a.b': 1, 'a.c.d': 2 })
    })

    it('should flatten a top-level array the same way as a nested array', () => {
      const topLevel = transformFlatten.transform([{ id: 1 }, { id: 2 }])
      expect(topLevel).toEqual({ '[0].id': 1, '[1].id': 2 })

      const nested = transformFlatten.transform({
        items: [{ id: 1 }, { id: 2 }],
      })
      expect(nested).toEqual({ 'items[0].id': 1, 'items[1].id': 2 })
    })
  })

  describe('createProjectionTransformer', () => {
    it('should pick only specified fields', () => {
      const transformer = createProjectionTransformer(['id', 'name'])
      const result = transformer.transform({
        id: 1,
        name: 'John',
        email: 'j@e.com',
      })
      expect(result).toEqual({ id: 1, name: 'John' })
    })

    it('should work with arrays', () => {
      const transformer = createProjectionTransformer(['id'])
      const result = transformer.transform([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ])
      expect(result).toEqual([{ id: 1 }, { id: 2 }])
    })
  })

  describe('createWrapperTransformer', () => {
    it('should wrap data in specified key', () => {
      const transformer = createWrapperTransformer('data')
      const result = transformer.transform([1, 2, 3])
      expect(result).toEqual({ data: [1, 2, 3] })
    })
  })
})

// ============= Retry Strategies =============
describe('Retry Strategies', () => {
  describe('AggressiveRetry', () => {
    it('should retry up to maxAttempts', () => {
      const strategy = new AggressiveRetry(5)
      expect(strategy.shouldRetry(1)).toBe(true)
      expect(strategy.shouldRetry(4)).toBe(true)
      expect(strategy.shouldRetry(5)).toBe(false)
    })

    it('should use linear delay', () => {
      const strategy = new AggressiveRetry()
      expect(strategy.delayMs(1)).toBe(50)
      expect(strategy.delayMs(2)).toBe(100)
    })
  })

  describe('ConservativeRetry', () => {
    it('should retry only on retryable status codes', () => {
      const strategy = new ConservativeRetry(3)
      expect(strategy.shouldRetry(1, { message: 'err', status: 500 })).toBe(
        true,
      )
      expect(strategy.shouldRetry(1, { message: 'err', status: 429 })).toBe(
        true,
      )
      expect(strategy.shouldRetry(1, { message: 'err', status: 400 })).toBe(
        false,
      )
    })

    it('should retry on TIMEOUT', () => {
      const strategy = new ConservativeRetry(3)
      expect(strategy.shouldRetry(1, { message: 'err', code: 'TIMEOUT' })).toBe(
        true,
      )
    })

    it('should respect maxAttempts', () => {
      const strategy = new ConservativeRetry(2)
      expect(strategy.shouldRetry(2, { message: 'err', status: 500 })).toBe(
        false,
      )
    })

    it('should use exponential backoff capped at 10s', () => {
      const strategy = new ConservativeRetry()
      expect(strategy.delayMs(1)).toBe(1000)
      expect(strategy.delayMs(2)).toBe(2000)
      expect(strategy.delayMs(10)).toBe(10000) // capped
    })
  })

  describe('CircuitBreakerRetry', () => {
    it('should retry within threshold', () => {
      const strategy = new CircuitBreakerRetry(3, 5, 60000)
      expect(strategy.shouldRetry(1)).toBe(true)
      expect(strategy.shouldRetry(2)).toBe(true)
    })

    it('should stop after maxAttempts', () => {
      const strategy = new CircuitBreakerRetry(2)
      expect(strategy.shouldRetry(2)).toBe(false)
    })

    it('should reset counters', () => {
      const strategy = new CircuitBreakerRetry(10, 2, 60000)
      strategy.shouldRetry(1)
      strategy.shouldRetry(1)
      // Circuit open — 2 failures
      expect(strategy.shouldRetry(1)).toBe(false)
      strategy.reset()
      expect(strategy.shouldRetry(1)).toBe(true)
    })
  })
})

// ============= Timeout Utilities =============
describe('Timeout Utilities', () => {
  describe('withTimeout', () => {
    it('should return an AbortController', () => {
      const controller = withTimeout(1000)
      expect(controller).toBeInstanceOf(AbortController)
      expect(controller.signal.aborted).toBe(false)
      // Cleanup
      controller.abort()
    })

    it('should abort after specified ms', async () => {
      const controller = withTimeout(20)
      await new Promise((r) => setTimeout(r, 50))
      expect(controller.signal.aborted).toBe(true)
    })

    it('should clean up timer when aborted externally', () => {
      const controller = withTimeout(10000)
      controller.abort()
      expect(controller.signal.aborted).toBe(true)
    })
  })

  describe('retry', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('ok')
      const result = await retry(fn, 3)
      expect(result).toBe('ok')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('ok')
      const result = await retry(fn, 3)
      expect(result).toBe('ok')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should throw after all retries exhausted', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fail'))
      await expect(retry(fn, 2)).rejects.toThrow('always fail')
      expect(fn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    })
  })
})

// ============= CacheStore =============
describe('CacheStore', () => {
  it('should store and retrieve values', () => {
    const cache = new CacheStore()
    cache.set('key', { data: 1 })
    expect(cache.get('key')).toEqual({ data: 1 })
  })

  it('should return null for missing keys', () => {
    const cache = new CacheStore()
    expect(cache.get('missing')).toBeNull()
  })

  it('should expire entries after TTL', async () => {
    const cache = new CacheStore()
    cache.set('key', 'val', 20)
    expect(cache.has('key')).toBe(true)
    await new Promise((r) => setTimeout(r, 40))
    expect(cache.get('key')).toBeNull()
    expect(cache.has('key')).toBe(false)
  })

  it('should delete specific keys', () => {
    const cache = new CacheStore()
    cache.set('a', 1)
    cache.set('b', 2)
    cache.delete('a')
    expect(cache.get('a')).toBeNull()
    expect(cache.get('b')).toBe(2)
  })

  it('should clear all entries', () => {
    const cache = new CacheStore()
    cache.set('a', 1)
    cache.set('b', 2)
    cache.clear()
    expect(cache.get('a')).toBeNull()
    expect(cache.get('b')).toBeNull()
  })
})

// ============= RequestDeduplicator =============
describe('RequestDeduplicator', () => {
  it('should deduplicate concurrent identical requests', async () => {
    const dedup = new RequestDeduplicator()
    let callCount = 0
    const fn = () => {
      callCount++
      return Promise.resolve('result')
    }

    const [r1, r2] = await Promise.all([
      dedup.execute('key', fn),
      dedup.execute('key', fn),
    ])

    expect(r1).toBe('result')
    expect(r2).toBe('result')
    expect(callCount).toBe(1)
  })

  it('should not deduplicate different keys', async () => {
    const dedup = new RequestDeduplicator()
    let callCount = 0
    const fn = () => {
      callCount++
      return Promise.resolve('result')
    }

    await Promise.all([dedup.execute('a', fn), dedup.execute('b', fn)])

    expect(callCount).toBe(2)
  })

  it('should clean up after promise resolves', async () => {
    const dedup = new RequestDeduplicator()
    await dedup.execute('key', () => Promise.resolve('done'))
    // Second call should create a new request
    let called = false
    await dedup.execute('key', () => {
      called = true
      return Promise.resolve('done2')
    })
    expect(called).toBe(true)
  })
})

// ============= Middleware Pipeline =============
describe('Middleware Pipeline', () => {
  describe('createPipeline', () => {
    it('should execute middlewares in order', async () => {
      const order: number[] = []
      const pipeline = createPipeline<HttpContext>([
        async (ctx, next) => {
          order.push(1)
          await next()
          order.push(4)
        },
        async (ctx, next) => {
          order.push(2)
          await next()
          order.push(3)
        },
      ])

      const ctx: HttpContext = {
        request: { method: 'GET', url: '/test', headers: {} },
        response: { status: 200, headers: {} },
        state: {},
      }
      await pipeline(ctx)
      expect(order).toEqual([1, 2, 3, 4])
    })

    it('should throw if next() called multiple times', async () => {
      const pipeline = createPipeline<HttpContext>([
        async (_ctx, next) => {
          await next()
          await next()
        },
      ])

      const ctx: HttpContext = {
        request: { method: 'GET', url: '/test', headers: {} },
        response: { status: 200, headers: {} },
        state: {},
      }
      await expect(pipeline(ctx)).rejects.toThrow(
        'next() called multiple times',
      )
    })
  })

  describe('MiddlewarePipeline (legacy)', () => {
    it('should execute simple data transformers', async () => {
      const pipeline = new MiddlewarePipeline<number>()
      pipeline.use((n: number) => n * 2)
      pipeline.use((n: number) => n + 1)
      const result = await pipeline.execute(5)
      expect(result).toBe(11)
    })
  })
})

// ============= Cache Middleware =============
describe('createCacheMiddleware', () => {
  it('should cache GET responses', async () => {
    const cache = new CacheStore()
    const middleware = createCacheMiddleware({ cache, ttlMs: 5000 })

    const ctx: HttpContext = {
      request: { method: 'GET', url: '/data', headers: {} },
      response: { status: 200, headers: {}, body: { result: 42 } },
      state: {},
    }

    // First call goes through
    await middleware(ctx, async () => {})
    expect(ctx.state.cacheMiss).toBe(true)

    // Second call should be served from cache
    const ctx2: HttpContext = {
      request: { method: 'GET', url: '/data', headers: {} },
      response: { status: 0, headers: {} },
      state: {},
    }
    await middleware(ctx2, async () => {
      throw new Error('should not be called')
    })
    expect(ctx2.state.cacheHit).toBe(true)
  })

  it('should skip caching for POST requests', async () => {
    const cache = new CacheStore()
    const middleware = createCacheMiddleware({ cache })
    let nextCalled = 0

    const ctx: HttpContext = {
      request: { method: 'POST', url: '/data', headers: {} },
      response: { status: 201, headers: {} },
      state: {},
    }

    await middleware(ctx, async () => {
      nextCalled++
    })
    await middleware(ctx, async () => {
      nextCalled++
    })
    expect(nextCalled).toBe(2)
  })
})

// ============= Dedup Middleware =============
describe('createDedupeMiddleware', () => {
  it('should deduplicate GET requests', async () => {
    const deduplicator = new RequestDeduplicator()
    const middleware = createDedupeMiddleware({ deduplicator })

    let fetchCount = 0
    const makeCtx = (): HttpContext => ({
      request: { method: 'GET', url: '/data', headers: {} },
      response: { status: 200, headers: {}, body: { ok: true } },
      state: {},
    })

    const ctx1 = makeCtx()
    const ctx2 = makeCtx()

    await Promise.all([
      middleware(ctx1, async () => {
        fetchCount++
      }),
      middleware(ctx2, async () => {
        fetchCount++
      }),
    ])

    expect(fetchCount).toBe(1)
  })

  it('should not deduplicate POST by default', async () => {
    const middleware = createDedupeMiddleware()
    let fetchCount = 0

    const ctx: HttpContext = {
      request: { method: 'POST', url: '/data', headers: {} },
      response: { status: 201, headers: {} },
      state: {},
    }

    await middleware(ctx, async () => {
      fetchCount++
    })
    await middleware(ctx, async () => {
      fetchCount++
    })
    expect(fetchCount).toBe(2)
  })
})

// ============= Typed Generics =============
describe('Typed Generics', () => {
  describe('createTypedResponse', () => {
    it('should create success response', () => {
      const resp = createTypedResponse(200, { id: 1 })
      expect(resp.ok).toBe(true)
      expect(resp.data).toEqual({ id: 1 })
      expect(resp.status).toBe(200)
    })

    it('should create error response', () => {
      const resp = createTypedResponse(500, undefined, 'Server Error')
      expect(resp.ok).toBe(false)
      expect(resp.error).toBe('Server Error')
    })
  })

  describe('TypedObservable', () => {
    it('should notify subscribers', () => {
      const obs = new TypedObservable<number>()
      const values: number[] = []
      obs.subscribe((v) => values.push(v))
      obs.next(1)
      obs.next(2)
      expect(values).toEqual([1, 2])
    })

    it('should support map operator', () => {
      const obs = new TypedObservable<number>()
      const mapped = obs.map((n) => n * 2)
      const values: number[] = []
      mapped.subscribe((v) => values.push(v))
      obs.next(3)
      obs.next(5)
      expect(values).toEqual([6, 10])
    })

    it('should support filter operator', () => {
      const obs = new TypedObservable<number>()
      const even = obs.filter((n) => n % 2 === 0)
      const values: number[] = []
      even.subscribe((v) => values.push(v))
      obs.next(1)
      obs.next(2)
      obs.next(3)
      obs.next(4)
      expect(values).toEqual([2, 4])
    })

    it('should support unsubscribe', () => {
      const obs = new TypedObservable<number>()
      const values: number[] = []
      const sub = obs.subscribe((v) => values.push(v))
      obs.next(1)
      sub.unsubscribe()
      obs.next(2)
      expect(values).toEqual([1])
    })

    it('should notify error and complete', () => {
      const obs = new TypedObservable<number>()
      const errors: unknown[] = []
      let completed = false
      obs.subscribe(
        undefined,
        (e) => errors.push(e),
        () => {
          completed = true
        },
      )
      obs.error('oops')
      obs.complete()
      expect(errors).toEqual(['oops'])
      expect(completed).toBe(true)
    })
  })

  describe('Defer', () => {
    it('should resolve via promise getter', async () => {
      const defer = new Defer<string>()
      setTimeout(() => defer.resolve('done'), 10)
      const result = await defer.promise
      expect(result).toBe('done')
    })

    it('should reject', async () => {
      const defer = new Defer<string>()
      setTimeout(() => defer.reject(new Error('fail')), 10)
      await expect(defer.promise).rejects.toThrow('fail')
    })
  })

  describe('createTypeGuard', () => {
    it('should return value when check passes', () => {
      const guard = createTypeGuard<string>(
        (v): v is string => typeof v === 'string',
      )
      expect(guard('hello')).toBe('hello')
    })

    it('should throw when check fails', () => {
      const guard = createTypeGuard<string>(
        (v): v is string => typeof v === 'string',
      )
      expect(() => guard(42)).toThrow('Value does not match expected type')
    })
  })

  describe('createTypedRequest / createTypedApiClient', () => {
    function createMockClient(
      overrides: Partial<IHttpClient> = {},
    ): IHttpClient {
      const notImplemented = vi.fn(() =>
        Promise.reject(new Error('not implemented')),
      )
      return {
        request: notImplemented,
        get: notImplemented,
        post: notImplemented,
        put: notImplemented,
        patch: notImplemented,
        delete: notImplemented,
        query: notImplemented,
        head: notImplemented,
        options: notImplemented,
        addRequestInterceptor: vi.fn(() => () => {}),
        addResponseInterceptor: vi.fn(() => () => {}),
        clearInterceptors: vi.fn(),
        extend: vi.fn(),
        paginate: vi.fn(),
        ...overrides,
      } as unknown as IHttpClient
    }

    it('should unwrap a successful Result and return the response data', async () => {
      const client = createMockClient({
        get: vi
          .fn()
          .mockResolvedValue(
            Ok({ status: 200, statusText: 'OK', headers: {}, data: { id: 1 } }),
          ),
      })

      const getUser = createTypedRequest<void, { id: number }>({
        method: 'GET',
        path: '/users/1',
        response: { id: 0 },
      })

      const data = await getUser(client)
      expect(data).toEqual({ id: 1 })
    })

    it('should throw when the underlying request fails instead of returning the Result wrapper', async () => {
      const client = createMockClient({
        get: vi
          .fn()
          .mockResolvedValue(Err({ message: 'Not Found', code: 'HTTP_ERROR' })),
      })

      const getUser = createTypedRequest<void, { id: number }>({
        method: 'GET',
        path: '/users/1',
        response: { id: 0 },
      })

      await expect(getUser(client)).rejects.toThrow('Not Found')
    })

    it('should pass the request body through for POST/PUT/PATCH', async () => {
      const postSpy = vi.fn().mockResolvedValue(
        Ok({
          status: 201,
          statusText: 'Created',
          headers: {},
          data: { id: 2 },
        }),
      )
      const client = createMockClient({ post: postSpy })

      const createUser = createTypedRequest<{ name: string }, { id: number }>({
        method: 'POST',
        path: '/users',
        response: { id: 0 },
      })

      const data = await createUser(client, { name: 'Ada' })
      expect(postSpy).toHaveBeenCalledWith('/users', { name: 'Ada' })
      expect(data).toEqual({ id: 2 })
    })

    it('should route the QUERY method to client.query() with the request body', async () => {
      const querySpy = vi.fn().mockResolvedValue(
        Ok({
          status: 200,
          statusText: 'OK',
          headers: {},
          data: { results: ['a'] },
        }),
      )
      const client = createMockClient({ query: querySpy })

      const searchUsers = createTypedRequest<
        { term: string },
        { results: string[] }
      >({
        method: 'QUERY',
        path: '/search',
        response: { results: [] },
      })

      const data = await searchUsers(client, { term: 'nexa' })
      expect(querySpy).toHaveBeenCalledWith('/search', { term: 'nexa' })
      expect(data).toEqual({ results: ['a'] })
    })

    it('should route each endpoint in a schema via createTypedApiClient', async () => {
      const client = createMockClient({
        get: vi
          .fn()
          .mockResolvedValue(
            Ok({ status: 200, statusText: 'OK', headers: {}, data: { id: 1 } }),
          ),
        delete: vi.fn().mockResolvedValue(
          Ok({
            status: 204,
            statusText: 'No Content',
            headers: {},
            data: undefined,
          }),
        ),
      })

      const schema = {
        getUser: {
          method: 'GET' as const,
          path: '/users/1',
          response: { id: 0 } as { id: number },
        },
        deleteUser: {
          method: 'DELETE' as const,
          path: '/users/1',
          response: undefined as unknown,
        },
      } satisfies ApiSchema

      const api = createTypedApiClient(schema)
      const user = await api.request(client, 'getUser')
      expect(user).toEqual({ id: 1 })

      await expect(api.request(client, 'deleteUser')).resolves.toBeUndefined()
    })
  })

  describe('Branded types', () => {
    it('should create URL types', () => {
      const url = createUrl('https://example.com')
      expect(url).toBe('https://example.com')
    })

    it('should create API URL type', () => {
      const url = createApiUrl('/api/users')
      expect(url).toBe('/api/users')
    })
  })
})

// ============= Plugins =============
describe('Plugins', () => {
  describe('PluginManager', () => {
    it('should register plugins and call setup', () => {
      const manager = new PluginManager()
      const setupFn = vi.fn()
      manager.register({ name: 'test', setup: setupFn })
      expect(setupFn).toHaveBeenCalledWith(manager)
      expect(manager.getPlugins()).toHaveLength(1)
    })

    it('should emit and listen to events', () => {
      const manager = new PluginManager()
      const handler = vi.fn()
      manager.on('test', handler)
      manager.emit('test', 'arg1', 'arg2')
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should remove event listeners', () => {
      const manager = new PluginManager()
      const handler = vi.fn()
      manager.on('test', handler)
      manager.off('test', handler)
      manager.emit('test')
      expect(handler).not.toHaveBeenCalled()
    })

    it('should manage middleware pipeline', async () => {
      const manager = new PluginManager()
      manager.addMiddleware(async (ctx, next) => {
        ctx.state.step1 = true
        await next()
      })

      const ctx: HttpContext = {
        request: { method: 'GET', url: '/test', headers: {} },
        response: { status: 200, headers: {} },
        state: {},
      }
      await manager.executePipeline(ctx)
      expect(ctx.state.step1).toBe(true)
    })

    it('should clear all state', () => {
      const manager = new PluginManager()
      manager.register({ name: 'test', setup: () => {} })
      manager.on('event', () => {})
      manager.getCache().set('key', 'val')
      manager.clear()
      expect(manager.getPlugins()).toHaveLength(0)
      expect(manager.getCache().get('key')).toBeNull()
    })
  })

  describe('Built-in plugins', () => {
    it('LoggerPlugin should register event listeners', () => {
      const manager = new PluginManager()
      manager.register(LoggerPlugin)
      expect(manager.getPlugins()).toHaveLength(1)
    })

    it('MetricsPlugin should collect metrics', () => {
      const metrics = new MetricsPlugin()
      const manager = new PluginManager()
      manager.register(metrics)
      manager.emit('request:complete', 100, true)
      manager.emit('request:complete', 200, false)
      const m = metrics.getMetrics()
      expect(m.requests).toBe(2)
      expect(m.errors).toBe(1)
      expect(m.avgTime).toBe(150)
    })

    it('CachePlugin should add cache middleware', () => {
      const manager = new PluginManager()
      manager.register(new CachePlugin(30000))
      // Pipeline should be non-empty
      expect(manager.getPlugins()[0].name).toBe('cache')
    })

    it('DedupePlugin should add dedupe middleware', () => {
      const manager = new PluginManager()
      manager.register(new DedupePlugin())
      expect(manager.getPlugins()[0].name).toBe('dedupe')
    })
  })
})
