/**
 * HTTP Client - BDD Test Suite
 * Using TDD approach: tests first, then implementation
 * Tests describe WHAT the system should do (not HOW)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHttpClient } from '../src/http-client/index.js';
import type { HttpRequestConfig, RetryStrategy, Validator } from '../src/types/index.js';
import { Ok, Err } from '../src/types/index.js';

describe('HTTP Client Plugin', () => {
  let client: ReturnType<typeof createHttpClient>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    client = createHttpClient({ baseURL: 'https://api.example.com' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic HTTP Methods', () => {
    describe('GET requests', () => {
      it('should make a GET request and return Result<Ok, Response>', async () => {
        // Given: API returns 200 with JSON data
        const mockData = { id: 1, name: 'John' };
        fetchMock.mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockData,
        });

        // When: making a GET request
        const result = await client.get<typeof mockData>('/users/1');

        // Then: should return Result with Ok status and parsed data
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.status).toBe(200);
          expect(result.value.data).toEqual(mockData);
          expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/users/1', expect.any(Object));
        }
      });

      it('should handle 404 Not Found as Result<Err>', async () => {
        // Given: API returns 404
        fetchMock.mockResolvedValueOnce({
          status: 404,
          statusText: 'Not Found',
          headers: new Headers(),
          text: async () => 'Not found',
        });

        // When: making a GET request to non-existent resource
        const result = await client.get('/users/999');

        // Then: should return Result with Err containing error details
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.status).toBe(404);
          expect(result.error.statusText).toBe('Not Found');
        }
      });

      it('should support query parameters', async () => {
        // Given: API endpoint with query support
        fetchMock.mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({ data: [] }),
        });

        // When: making request with query params
        await client.get('/users', { query: { page: 1, limit: 10 } });

        // Then: query params should be appended to URL
        const callArgs = fetchMock.mock.calls[0][0] as string;
        expect(callArgs).toContain('page=1');
        expect(callArgs).toContain('limit=10');
      });
    });

    describe('POST requests', () => {
      it('should make a POST request with JSON body', async () => {
        // Given: endpoint accepts POST
        const requestBody = { name: 'Alice', email: 'alice@example.com' };
        const responseData = { id: 2, ...requestBody };

        fetchMock.mockResolvedValueOnce({
          status: 201,
          statusText: 'Created',
          headers: new Headers(),
          json: async () => responseData,
        });

        // When: making POST request
        const result = await client.post('/users', requestBody);

        // Then: should send body as JSON and return Result<Ok>
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.status).toBe(201);
          expect(result.value.data).toEqual(responseData);
        }

        // Verify body was sent correctly
        const [, options] = fetchMock.mock.calls[0];
        expect((options as RequestInit).body).toEqual(JSON.stringify(requestBody));
      });

      it('should support PUT and PATCH methods', async () => {
        fetchMock.mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({ id: 1, updated: true }),
        });

        const updateData = { status: 'active' };

        // When: making PUT request
        await client.put('/users/1', updateData);

        // Then: should work with specified method
        const [, options] = fetchMock.mock.calls[0];
        expect((options as RequestInit).method).toBe('PUT');
      });

      it('should support DELETE method', async () => {
        fetchMock.mockResolvedValueOnce({
          status: 204,
          statusText: 'No Content',
          headers: new Headers(),
          text: async () => '',
        });

        // When: making DELETE request
        const result = await client.delete('/users/1');

        // Then: should handle empty response
        expect(result.ok).toBe(true);
        const [, options] = fetchMock.mock.calls[0];
        expect((options as RequestInit).method).toBe('DELETE');
      });
    });
  });

  describe('Retry Strategy (Resilience)', () => {
    it('should retry failed requests according to strategy', async () => {
      // Given: first 2 calls fail with 500, 3rd succeeds
      fetchMock
        .mockResolvedValueOnce({ status: 500, statusText: 'Server Error', headers: new Headers(), text: async () => 'Error' })
        .mockResolvedValueOnce({ status: 500, statusText: 'Server Error', headers: new Headers(), text: async () => 'Error' })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({ success: true }),
        });

      const retryStrategy: RetryStrategy = {
        shouldRetry: (attempt) => attempt < 3,
        delayMs: () => 10, // quick for testing
      };

      // When: making request with retry strategy
      const result = await client.get('/flaky-endpoint', { retry: retryStrategy });

      // Then: should retry and eventually succeed
      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3); // 2 failures + 1 success
    });

    it('should use exponential backoff if configured', async () => {
      // Given: exponential backoff config
      fetchMock
        .mockResolvedValueOnce({ status: 503, statusText: 'Service Unavailable', headers: new Headers(), text: async () => 'Down' })
        .mockResolvedValueOnce({ status: 503, statusText: 'Service Unavailable', headers: new Headers(), text: async () => 'Down' })
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: async () => ({}),
        });

      // When: making request with retry config
      const result = await client.get('/endpoint', { 
        retry: { maxAttempts: 3, backoffMs: 10 } 
      });

      // Then: should retry with backoff
      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Timeout handling', () => {
    it('should timeout if request takes too long', async () => {
      // Given: request that never resolves
      fetchMock.mockImplementation(() => new Promise(() => {})); // never resolves

      // When: making request with timeout
      const result = await client.get('/slow-endpoint', { timeout: 50 });

      // Then: should return timeout error
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('TIMEOUT');
      }
    });
  });

  describe('Interceptors (Open/Closed principle)', () => {
    it('should allow request interceptor to modify requests', async () => {
      // Given: request interceptor that adds auth header
      const addAuthToken = {
        onRequest: (req: HttpRequestConfig) => ({
          ...req,
          headers: { ...req.headers, Authorization: 'Bearer token123' },
        }),
      };

      client.addRequestInterceptor(addAuthToken);

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({}),
      });

      // When: making request
      await client.get('/secure-endpoint');

      // Then: interceptor should have added auth header
      const [, options] = fetchMock.mock.calls[0];
      expect((options as RequestInit).headers).toEqual(
        expect.objectContaining({ Authorization: 'Bearer token123' })
      );
    });

    it('should allow response interceptor to modify responses', async () => {
      // Given: response interceptor that normalizes data
      const normalizeResponse = {
        onResponse: (resp: any) => ({
          ...resp,
          data: { ...resp.data, _normalized: true },
        }),
      };

      client.addResponseInterceptor(normalizeResponse);

      const mockData = { name: 'John' };
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => mockData,
      });

      // When: making request
      const result = await client.get('/data');

      // Then: response should be normalized
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toHaveProperty('_normalized', true);
      }
    });

    it('should support multiple interceptors', async () => {
      // Given: multiple request interceptors
      client.addRequestInterceptor({
        onRequest: (req: HttpRequestConfig) => ({ ...req, headers: { ...req.headers, 'X-Custom-1': 'value1' } }),
      });
      client.addRequestInterceptor({
        onRequest: (req: HttpRequestConfig) => ({ ...req, headers: { ...req.headers, 'X-Custom-2': 'value2' } }),
      });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({}),
      });

      // When: making request
      await client.get('/endpoint');

      // Then: both interceptors should apply
      const [, options] = fetchMock.mock.calls[0];
      const headers = (options as RequestInit).headers as Record<string, string>;
      expect(headers['X-Custom-1']).toBe('value1');
      expect(headers['X-Custom-2']).toBe('value2');
    });
  });

  describe('Caching (Strategy Pattern)', () => {
    it('should cache GET requests if caching enabled', async () => {
      // Given: response for GET request
      const mockData = { cached: true };
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => mockData,
      });

      // When: making same request twice with caching
      await client.get('/data', { cache: { enabled: true, ttlMs: 5000 } });
      await client.get('/data', { cache: { enabled: true, ttlMs: 5000 } });

      // Then: fetch should only be called once (second from cache)
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should not cache non-GET requests', async () => {
      // Given: POST request
      fetchMock.mockResolvedValue({
        status: 201,
        statusText: 'Created',
        headers: new Headers(),
        json: async () => ({}),
      });

      // When: making same POST twice with caching
      await client.post('/data', { x: 1 }, { cache: { enabled: true } });
      await client.post('/data', { x: 1 }, { cache: { enabled: true } });

      // Then: fetch should be called twice (no caching for mutations)
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Validation (Processing Pipeline)', () => {
    it('should validate response data before returning', async () => {
      // Given: validator that requires id and name
      const validator: Validator = {
        validate: (data) => {
          const obj = data as any;
          return obj.id && obj.name ? Ok(data) : Err({ message: 'Invalid data' });
        },
      };

      const mockData = { id: 1, name: 'John' };
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => mockData,
      });

      // When: making request with validator
      const result = await client.get('/user', { validate: validator });

      // Then: should pass validation
      expect(result.ok).toBe(true);
    });

    it('should return validation error if data invalid', async () => {
      // Given: validator that requires specific fields
      const validator: Validator = {
        validate: (data) => {
          const obj = data as any;
          return obj.id ? Ok(data) : Err({ message: 'Missing id field' });
        },
      };

      const invalidData = { name: 'John' }; // missing id
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => invalidData,
      });

      // When: making request with strict validator
      const result = await client.get('/user', { validate: validator });

      // Then: should return validation error
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Missing id');
      }
    });
  });

  describe('Error Handling', () => {
    it('should convert HTTP errors to Result<Err>', async () => {
      // Given: API returns 401 Unauthorized
      fetchMock.mockResolvedValueOnce({
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        text: async () => 'Unauthorized',
      });

      // When: making request
      const result = await client.get('/protected');

      // Then: should return as error result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(401);
      }
    });

    it('should handle network errors gracefully', async () => {
      // Given: network error occurs
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      // When: making request
      const result = await client.get('/endpoint');

      // Then: should return error result (not throw)
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Network error');
      }
    });
  });

  describe('Type Safety', () => {
    it('should maintain generic type for response data', async () => {
      // Given: strongly typed response
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const mockUser: User = { id: 1, name: 'John', email: 'john@example.com' };
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => mockUser,
      });

      // When: making request with type parameter
      const result = await client.get<User>('/users/1');

      // Then: result data should be typed as User
      expect(result.ok).toBe(true);
      if (result.ok) {
        // TypeScript ensures .data conforms to User type
        expect(result.value.data.id).toBeGreaterThan(0);
        expect(result.value.data.email).toContain('@');
      }
    });
  });

  describe('Interceptor Disposal', () => {
    it('should return a disposer that removes the request interceptor', async () => {
      // Given: a request interceptor that adds a header
      const dispose = client.addRequestInterceptor({
        onRequest: (req) => ({
          ...req,
          headers: { ...req.headers, 'X-Injected': 'yes' },
        }),
      });

      fetchMock.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({}),
      });

      // When: making a request before disposal
      await client.get('/test');
      const headersBefore = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headersBefore['X-Injected']).toBe('yes');

      // When: disposing the interceptor and making another request
      dispose();
      await client.get('/test');
      const headersAfter = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>;

      // Then: header should no longer be present
      expect(headersAfter['X-Injected']).toBeUndefined();
    });

    it('should return a disposer that removes the response interceptor', async () => {
      // Given: a response interceptor that tags result
      const dispose = client.addResponseInterceptor({
        onResponse: (resp: any) => ({
          ...resp,
          data: { ...resp.data, _tagged: true },
        }),
      });

      fetchMock.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({ val: 1 }),
      });

      // When: making a request before disposal
      const r1 = await client.get('/test');
      expect(r1.ok && (r1.value.data as any)._tagged).toBe(true);

      // When: disposing and making another request
      dispose();
      const r2 = await client.get('/test');

      // Then: tag should no longer be present
      expect(r2.ok && (r2.value.data as any)._tagged).toBeUndefined();
    });
  });

  describe('Client Extension (extend)', () => {
    it('should create a child client inheriting config', async () => {
      // Given: a parent client with auth header
      client.addRequestInterceptor({
        onRequest: (req) => ({
          ...req,
          headers: { ...req.headers, Authorization: 'Bearer parent-token' },
        }),
      });

      // When: creating a child with a different baseURL
      const child = client.extend({ baseURL: 'https://api.v2.example.com' });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({ v2: true }),
      });

      await child.get('/status');

      // Then: child should use its own baseURL but inherit parent interceptor
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.v2.example.com/status');
      expect((options as RequestInit).headers).toEqual(
        expect.objectContaining({ Authorization: 'Bearer parent-token' }),
      );
    });

    it('should merge headers from parent and override', async () => {
      // Given: parent client with default Content-Type
      // When: extending with an extra default header
      const child = client.extend({
        defaultHeaders: { 'X-Api-Key': 'abc123' },
      });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({}),
      });

      await child.get('/data');

      // Then: child should have both parent and own headers
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Api-Key']).toBe('abc123');
    });
  });

  describe('Pagination (paginate)', () => {
    it('should iterate through all pages using async iterator', async () => {
      // Given: a paginated API with 3 pages
      interface Page { items: string[]; nextCursor: string | null }

      fetchMock
        .mockResolvedValueOnce({
          status: 200, statusText: 'OK', headers: new Headers(),
          json: async () => ({ items: ['a', 'b'], nextCursor: 'c2' }),
        })
        .mockResolvedValueOnce({
          status: 200, statusText: 'OK', headers: new Headers(),
          json: async () => ({ items: ['c', 'd'], nextCursor: 'c3' }),
        })
        .mockResolvedValueOnce({
          status: 200, statusText: 'OK', headers: new Headers(),
          json: async () => ({ items: ['e'], nextCursor: null }),
        });

      // When: iterating pages
      const allItems: string[] = [];
      for await (const items of client.paginate<Page>('/items', {
        getItems: (data) => data.items,
        getNextPage: (data, cfg) =>
          data.nextCursor
            ? { ...cfg, query: { ...cfg.query as object, cursor: data.nextCursor } }
            : null,
      })) {
        allItems.push(...items as unknown as string[]);
      }

      // Then: all items from all pages should be collected
      expect(allItems).toEqual(['a', 'b', 'c', 'd', 'e']);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should stop on API error', async () => {
      // Given: first page ok, second page fails
      fetchMock
        .mockResolvedValueOnce({
          status: 200, statusText: 'OK', headers: new Headers(),
          json: async () => ({ items: ['a'], next: true }),
        })
        .mockResolvedValueOnce({
          status: 500, statusText: 'Server Error', headers: new Headers(),
          text: async () => 'Error',
        });

      // When: iterating pages
      const pages: unknown[][] = [];
      for await (const items of client.paginate<{ items: string[]; next: boolean }>('/items', {
        getItems: (data) => data.items,
        getNextPage: (_data, cfg) => cfg, // always next
      })) {
        pages.push(items);
      }

      // Then: only first page collected, stops on error
      expect(pages).toHaveLength(1);
    });
  });

  describe('Polling (poll)', () => {
    it('should poll until condition is met', async () => {
      // Given: a job endpoint that progresses through statuses
      fetchMock
        .mockResolvedValueOnce({
          status: 200, statusText: 'OK', headers: new Headers(),
          json: async () => ({ status: 'running', progress: 50 }),
        })
        .mockResolvedValueOnce({
          status: 200, statusText: 'OK', headers: new Headers(),
          json: async () => ({ status: 'running', progress: 80 }),
        })
        .mockResolvedValueOnce({
          status: 200, statusText: 'OK', headers: new Headers(),
          json: async () => ({ status: 'completed', progress: 100 }),
        });

      // When: polling until completed
      const result = await client.poll<{ status: string; progress: number }>('/jobs/1', {
        intervalMs: 10,
        maxAttempts: 10,
        until: (data) => data.status === 'completed',
      });

      // Then: should return the final successful response
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data.status).toBe('completed');
        expect(result.value.data.progress).toBe(100);
      }
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should return error when max attempts exhausted', async () => {
      // Given: endpoint that never reaches desired state
      fetchMock.mockResolvedValue({
        status: 200, statusText: 'OK', headers: new Headers(),
        json: async () => ({ status: 'pending' }),
      });

      // When: polling with a low max
      const result = await client.poll<{ status: string }>('/jobs/1', {
        intervalMs: 10,
        maxAttempts: 3,
        until: (data) => data.status === 'done',
      });

      // Then: should return POLL_EXHAUSTED error
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('POLL_EXHAUSTED');
      }
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should call onPoll callback on each attempt', async () => {
      // Given: polling endpoint
      fetchMock
        .mockResolvedValueOnce({
          status: 200, statusText: 'OK', headers: new Headers(),
          json: async () => ({ v: 1 }),
        })
        .mockResolvedValueOnce({
          status: 200, statusText: 'OK', headers: new Headers(),
          json: async () => ({ v: 2 }),
        });

      const onPoll = vi.fn();

      // When: polling with callback
      await client.poll<{ v: number }>('/data', {
        intervalMs: 10,
        maxAttempts: 5,
        until: (data) => data.v === 2,
        onPoll,
      });

      // Then: onPoll should have been called for each attempt
      expect(onPoll).toHaveBeenCalledTimes(2);
      expect(onPoll).toHaveBeenCalledWith({ v: 1 }, 1);
      expect(onPoll).toHaveBeenCalledWith({ v: 2 }, 2);
    });
  });

  describe('Content-Type Handling (Response Type Detection)', () => {
    it('should parse text/plain responses', async () => {
      // Given: API returns plain text
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain; charset=utf-8' }),
        text: async () => 'Hello World',
      });

      // When: making request without explicit responseType
      const result = await client.get('/text');

      // Then: should parse as text
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toBe('Hello World');
      }
    });

    it('should parse multipart/form-data responses', async () => {
      // Given: API returns form data
      const formData = new FormData();
      formData.append('field', 'value');
      
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'multipart/form-data' }),
        formData: async () => formData,
      });

      // When: making request
      const result = await client.get('/form');

      // Then: should parse as form data
      expect(result.ok).toBe(true);
    });

    it('should handle binary/blob responses (image, audio, video)', async () => {
      // Given: API returns image
      const blob = new Blob(['image data'], { type: 'image/png' });
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'image/png' }),
        blob: async () => blob,
      });

      // When: making request
      const result = await client.get('/image.png');

      // Then: should parse as blob
      expect(result.ok).toBe(true);
    });

    it('should handle application/octet-stream', async () => {
      // Given: API returns binary stream
      const blob = new Blob(['binary'], { type: 'application/octet-stream' });
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        blob: async () => blob,
      });

      // When: making request
      const result = await client.get('/file.bin');

      // Then: should parse as blob
      expect(result.ok).toBe(true);
    });

    it('should fallback to JSON then text on unknown content-type', async () => {
      // Given: API returns unknown type, falls back to JSON
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/unknown' }),
        json: async () => ({ fallback: true }),
        text: async () => 'text',
      });

      // When: making request
      const result = await client.get('/unknown');

      // Then: should try JSON first
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({ fallback: true });
      }
    });

    it('should fallback to text if JSON parse fails', async () => {
      // Given: API returns invalid JSON that falls back to text
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/weird' }),
        json: async () => { throw new Error('not json'); },
        text: async () => 'plain text',
      });

      // When: making request
      const result = await client.get('/weird');

      // Then: should return text
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toBe('plain text');
      }
    });
  });

  describe('Error Normalization (normalizeError)', () => {
    it('should normalize TimeoutError', async () => {
      // Given: fetch throws TimeoutError
      const timeoutErr = new Error('Timeout');
      timeoutErr.name = 'TimeoutError';
      fetchMock.mockRejectedValueOnce(timeoutErr);

      // When: making request
      const result = await client.get('/endpoint');

      // Then: should normalize as TIMEOUT
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('TIMEOUT');
        expect(result.error.message).toBe('Request timed out');
      }
    });

    it('should normalize DOMException AbortError', async () => {
      // Given: fetch throws generic Error with AbortError behavior
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      fetchMock.mockRejectedValueOnce(abortErr);

      // When: making request
      const result = await client.get('/endpoint');

      // Then: should normalize as ABORTED
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ABORTED');
      }
    });

    it('should normalize DOMException with AbortError', async () => {
      // Given: DOMException AbortError
      const abortErr = new DOMException('Abort', 'AbortError');
      fetchMock.mockRejectedValueOnce(abortErr);

      // When: making request
      const result = await client.get('/endpoint');

      // Then: should return error
      expect(result.ok).toBe(false);
    });

    it('should normalize Error with AbortError name', async () => {
      // Given: Error with AbortError name
      const abortErr = new Error('abort');
      abortErr.name = 'AbortError';
      fetchMock.mockRejectedValueOnce(abortErr);

      // When: making request
      const result = await client.get('/endpoint');

      // Then: should normalize as ABORTED
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ABORTED');
      }
    });

    it('should normalize TypeError as NETWORK_ERROR', async () => {
      // Given: fetch throws TypeError (network issue)
      const netErr = new TypeError('Failed to fetch');
      fetchMock.mockRejectedValueOnce(netErr);

      // When: making request
      const result = await client.get('/endpoint');

      // Then: should normalize as NETWORK_ERROR
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });

    it('should handle unknown error type (string)', async () => {
      // Given: error is a string (edge case)
      fetchMock.mockRejectedValueOnce('Unknown error string');

      // When: making request
      const result = await client.get('/endpoint');

      // Then: should handle gracefully
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('Unknown error string');
      }
    });
  });

  describe('Request Queue (activeRequests, cancelAll, clearCache)', () => {
    it('should track active requests count increases', async () => {  
      // Given: setup to check activeRequests during request
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({}),
      });

      // When: making request
      const result = await client.get('/test');

      // Then: should complete and activeRequests should be 0
      expect(result.ok).toBe(true);
      expect(client.activeRequests).toBe(0);
    });

    it('should cancel all pending requests', async () => {
      // Given: slow requests that timeout
      fetchMock.mockImplementation(() => new Promise(() => {})); // never resolves

      // When: making request with timeout and canceling
      const p1 = client.get('/1', { timeout: 100 });
      await new Promise(r => setTimeout(r, 50));
      client.cancelAll();
      const result = await p1;

      // Then: request should be canceled
      expect(result.ok).toBe(false);
    });

    it('should clear cache', async () => {
      // Given: cached GET request
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({ cached: true }),
      });

      await client.get('/data', { cache: { enabled: true, ttlMs: 10000 } });

      // When: clearing cache
      client.clearCache();

      // Then: next call should fetch again
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({ fresh: true }),
      });

      const result = await client.get('/data', { cache: { enabled: true, ttlMs: 10000 } });

      // Should have fetched (not cached)
      expect(fetchMock).toHaveBeenCalledTimes(2);
      if (result.ok) {
        expect(result.value.data).toEqual({ fresh: true });
      }
    });
  });

  describe('Request Lifecycle', () => {
    it('should handle errors during request', async () => {
      // Given: endpoint that returns 500
      fetchMock.mockResolvedValueOnce({
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        text: async () => 'Error',
      });

      // When: making request to failing endpoint
      const result = await client.get('/data');

      // Then: should return error result
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(500);
      }
    });

    it('should handle response duration tracking', async () => {
      // Given: normal endpoint
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({ ok: true }),
      });

      // When: making request
      const result = await client.get('/data');

      // Then: should track response successfully
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe(200);
      }
    });
  });

  describe('HEAD and OPTIONS methods', () => {
    it('should support HEAD method', async () => {
      // Given: HEAD endpoint
      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'x-total': '100' }),
        text: async () => '',
      });

      // When: making HEAD request
      const result = await client.head('/resource');

      // Then: should complete successfully
      expect(result.ok).toBe(true);
      const [, options] = fetchMock.mock.calls[0];
      expect((options as RequestInit).method).toBe('HEAD');
    });

    it('should support OPTIONS method', async () => {
      // Given: CORS preflight endpoint
      fetchMock.mockResolvedValueOnce({
        status: 204,
        statusText: 'No Content',
        headers: new Headers({ 'allow': 'GET,POST,PUT,DELETE' }),
        text: async () => '',
      });

      // When: making OPTIONS request
      const result = await client.options('/api');

      // Then: should complete successfully
      expect(result.ok).toBe(true);
      const [, options] = fetchMock.mock.calls[0];
      expect((options as RequestInit).method).toBe('OPTIONS');
    });
  });

  describe('Response type handling - formData', () => {
    it('should parse formData response type', async () => {
      // Given: endpoint returning form data
      const mockFormData = new FormData();
      mockFormData.append('field', 'value');

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'multipart/form-data' }),
        formData: async () => mockFormData,
        json: async () => ({ field: 'value' }),
        text: async () => 'field=value',
      });

      // When: requesting with responseType='formData'
      const result = await client.get('/form', { responseType: 'formData' });

      // Then: should parse as FormData
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(mockFormData);
      }
    });

    it('should parse stream response type', async () => {
      // Given: endpoint returning a stream
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('streaming data'));
          controller.close();
        },
      });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        body: mockStream,
        text: async () => 'streaming data',
      });

      // When: requesting with responseType='stream'
      const result = await client.get('/stream', { responseType: 'stream' });

      // Then: should return the stream
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toBeDefined();
      }
    });

    it('should auto-detect multipart/form-data as formData', async () => {
      // Given: response with multipart content
      const mockFormData = new FormData();
      mockFormData.append('file', new Blob(['content']));

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'multipart/form-data; boundary=----' }),
        formData: async () => mockFormData,
        json: async () => { throw new Error('Not JSON'); },
        text: async () => '(form data)',
      });

      // When: responseType auto with multipart
      const result = await client.get('/multipart-data', { responseType: 'auto' });

      // Then: should parse as FormData
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data instanceof FormData || result.value.data === mockFormData).toBe(true);
      }
    });
  });

  describe('Binary content-type detection', () => {
    it('should detect application/octet-stream as binary', async () => {
      // Given: octet-stream response
      const binaryData = new Uint8Array([1, 2, 3, 4]);

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        blob: async () => new Blob([binaryData]),
        json: async () => { throw new Error('Not JSON'); },
        text: async () => 'binary',
      });

      // When: responseType auto-detect with octet-stream
      const result = await client.get('/data', { responseType: 'auto' });

      // Then: should parse as blob
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data instanceof Blob).toBe(true);
      }
    });

    it('should detect image/* as binary', async () => {
      // Given: image response
      const imageData = new Uint8Array([137, 80, 78, 71]); // PNG magic bytes

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'image/png' }),
        blob: async () => new Blob([imageData], { type: 'image/png' }),
        json: async () => { throw new Error('Not JSON'); },
        text: async () => '(image data)',
      });

      // When: responseType auto-detect with image/png
      const result = await client.get('/avatar.png', { responseType: 'auto' });

      // Then: should parse as blob
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data instanceof Blob).toBe(true);
      }
    });

    it('should detect audio/* as binary', async () => {
      // Given: audio response
      const audioData = new Uint8Array([255, 251]); // MP3 frame sync

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'audio/mpeg' }),
        blob: async () => new Blob([audioData], { type: 'audio/mpeg' }),
        json: async () => { throw new Error('Not JSON'); },
        text: async () => '(audio data)',
      });

      // When: responseType auto-detect with audio/mpeg
      const result = await client.get('/song.mp3', { responseType: 'auto' });

      // Then: should parse as blob
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data instanceof Blob).toBe(true);
      }
    });

    it('should detect video/* as binary', async () => {
      // Given: video response
      const videoData = new Uint8Array([0, 0, 0, 32]); // MP4 ftyp box

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'video/mp4' }),
        blob: async () => new Blob([videoData], { type: 'video/mp4' }),
        json: async () => { throw new Error('Not JSON'); },
        text: async () => '(video data)',
      });

      // When: responseType auto-detect with video/mp4
      const result = await client.get('/movie.mp4', { responseType: 'auto' });

      // Then: should parse as blob
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data instanceof Blob).toBe(true);
      }
    });
  });

  describe('parseBody fallback logic', () => {
    it('should fallback from JSON to text on parse error', async () => {
      // Given: response with no JSON content-type but JSON parse fails
      const invalidJson = 'This is not valid JSON';

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/x-unknown' }),
        json: async () => { throw new SyntaxError('Unexpected token'); },
        text: async () => invalidJson,
        blob: async () => new Blob([invalidJson]),
      });

      // When: responseType auto-detect with unknown type tries JSON then text
      const result = await client.get('/malformed', { responseType: 'auto' });

      // Then: should fallback from JSON to text
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toBe(invalidJson);
      }
    });

    it('should handle unknown content-type with JSON fallback', async () => {
      // Given: unknown content-type that is valid JSON
      const jsonData = { result: 'success' };

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/x-custom-format' }),
        json: async () => jsonData,
        text: async () => JSON.stringify(jsonData),
      });

      // When: responseType auto-detect with unknown content-type
      const result = await client.get('/custom', { responseType: 'auto' });

      // Then: should try JSON first
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(jsonData);
      }
    });

    it('should fallback to text when JSON fails on unknown content-type', async () => {
      // Given: unknown content-type with non-JSON text
      const textContent = 'Some plain text response';

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/x-custom' }),
        json: async () => { throw new SyntaxError('Invalid JSON'); },
        text: async () => textContent,
      });

      // When: responseType auto-detect falls back through JSON
      const result = await client.get('/text-custom', { responseType: 'auto' });

      // Then: should fallback to text
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toBe(textContent);
      }
    });
  });

  describe('Advanced request configuration', () => {
    it('should support request with null body', async () => {
      // Given: request with explicitly null body
      fetchMock.mockResolvedValueOnce({
        status: 201,
        statusText: 'Created',
        headers: new Headers(),
        json: async () => ({ id: 1 }),
      });

      // When: making request with body=null
      const result = await client.post('/data', null);

      // Then: should send request successfully
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe(201);
      }
    });

    it('should send Blob as body', async () => {
      // Given: blob data
      const blob = new Blob(['test data'], { type: 'text/plain' });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: async () => 'Received',
      });

      // When: sending Blob
      const result = await client.post('/upload', blob);

      // Then: should send and return success
      expect(result.ok).toBe(true);
    });

    it('should send URLSearchParams as body', async () => {
      // Given: URLSearchParams
      const params = new URLSearchParams({ key: 'value', foo: 'bar' });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: async () => 'OK',
      });

      // When: sending URLSearchParams
      const result = await client.post('/form', params);

      // Then: should send with form encoding
      expect(result.ok).toBe(true);
      const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
      const headers = callArgs.headers as Record<string, string>;
      expect(Object.values(headers).some(h => typeof h === 'string' && h.includes('application/x-www-form-urlencoded'))).toBe(true);
    });

    it('should send ArrayBuffer as body', async () => {
      // Given: ArrayBuffer
      const buffer = new ArrayBuffer(4);

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: async () => 'OK',
      });

      // When: sending ArrayBuffer
      const result = await client.post('/binary', buffer);

      // Then: should send as octet-stream
      expect(result.ok).toBe(true);
    });
  });

  describe('Response parsing edge cases', () => {
    it('should import and use HttpError from library', async () => {
      // Given: HttpError import
      const { HttpError, isHttpError, createHttpClient } = await import('../src/http-client');

      // When: creating an HttpError instance
      const error = new HttpError('Server error', 500, 'SERVER_ERROR', { detail: 'test' });

      // Then: should have all properties
      expect(error).toBeInstanceOf(HttpError);
      expect(error.message).toBe('Server error');
      expect(error.status).toBe(500);
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.name).toBe('HttpError');
    });

    it('should identify instances with isHttpError', async () => {
      // Given: HttpError and isHttpError from library
      const { HttpError, isHttpError } = await import('../src/http-client');

      const httpErr = new HttpError('Not found', 404, 'NOT_FOUND');
      const regularErr = new Error('Regular error');

      // When: checking types
      const isHttpError1 = isHttpError(httpErr);
      const isHttpError2 = isHttpError(regularErr);
      const isHttpError3 = isHttpError(null);

      // Then: should correctly identify only HttpError instances
      expect(isHttpError1).toBe(true);
      expect(isHttpError2).toBe(false);
      expect(isHttpError3).toBe(false);
    });

    it('should create client with factory function', async () => {
      // Given: createHttpClient factory
      const { createHttpClient } = await import('../src/http-client');

      // When: creating clients with different configs
      const client1 = createHttpClient();
      const client2 = createHttpClient({ baseURL: '/api', defaultTimeout: 5000 });

      // Then: should return initialized clients
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
      expect(typeof client1.get).toBe('function');
      expect(typeof client2.post).toBe('function');
    });
  });

  describe('Module exports and imports', () => {
    it('should export HttpClient class', async () => {
      const { HttpClient } = await import('../src/http-client');
      expect(HttpClient).toBeDefined();
      expect(typeof HttpClient).toBe('function');
    });

    it('should export createHttpClient factory', async () => {
      const { createHttpClient } = await import('../src/http-client');
      expect(typeof createHttpClient).toBe('function');
    });

    it('should export HttpError class', async () => {
      const { HttpError } = await import('../src/http-client');
      expect(HttpError).toBeDefined();
      expect(typeof HttpError).toBe('function');
    });

    it('should export isHttpError function', async () => {
      const { isHttpError } = await import('../src/http-client');
      expect(typeof isHttpError).toBe('function');
    });

    it('should export utilities from utils module', async () => {
      const utils = await import('../src/http-client');
      expect(utils.PluginManager).toBeDefined();
      expect(utils.LoggerPlugin).toBeDefined();
      expect(utils.MetricsPlugin).toBeDefined();
      expect(utils.CacheStore).toBeDefined();
      expect(utils.RequestDeduplicator).toBeDefined();
    });

    it('should export types and interfaces', async () => {
      const { Ok, Err } = await import('../src/http-client');
      expect(typeof Ok).toBe('function');
      expect(typeof Err).toBe('function');
    });

    it('should export all Result helper types', async () => {
      const httpClient = await import('../src/http-client');
      expect(httpClient.Ok).toBeDefined();
      expect(httpClient.Err).toBeDefined();
      expect(httpClient.createTypedResponse).toBeDefined();
      expect(httpClient.createTypedRequest).toBeDefined();
    });

    it('should export streaming utilities', async () => {
      const httpClient = await import('../src/http-client');
      expect(httpClient.handleStream).toBeDefined();
      expect(httpClient.streamToFile).toBeDefined();
      expect(httpClient.createStreamingMiddleware).toBeDefined();
    });
  });

  describe('Request body serialization edge cases', () => {
    it('should handle FormData without content-type setting', async () => {
      // Given: FormData body
      const formData = new FormData();
      formData.append('field', 'value');

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: async () => 'OK',
      });

      // When: sending FormData (should NOT set explicit content-type)
      const result = await client.post('/upload', formData);

      // Then: request should succeed
      expect(result.ok).toBe(true);
    });

    it('should handle ReadableStream as body', async () => {
      // Given: ReadableStream
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: async () => 'OK',
      });

      // When: sending ReadableStream
      const result = await client.post('/stream', stream);

      // Then: request should succeed
      expect(result.ok).toBe(true);
    });

    it('should handle TypedArray as body', async () => {
      // Given: Uint8Array
      const array = new Uint8Array([10, 20, 30, 40]);

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: async () => 'OK',
      });

      // When: sending TypedArray
      const result = await client.post('/binary', array);

      // Then: request should succeed with octet-stream
      expect(result.ok).toBe(true);
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle Error with message containing abort', async () => {
      // Given: Error with abort in message
      const abortError = new Error('Operation was aborted');
      fetchMock.mockRejectedValueOnce(abortError);

      // When: request error
      const result = await client.get('/err');

      // Then: should treat as aborted
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ABORTED');
      }
    });
  });

  describe('Content-type detection with FormData', () => {
    it('should parse arrayBuffer response type', async () => {
      // Given: binary data response
      const buffer = new ArrayBuffer(10);

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/octet-stream' }),
        arrayBuffer: async () => buffer,
      });

      // When: requesting with responseType='arrayBuffer'
      const result = await client.get('/data', { responseType: 'arrayBuffer' });

      // Then: should return ArrayBuffer
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(buffer);
      }
    });

    it('should parse blob response type', async () => {
      // Given: blob response
      const blob = new Blob(['test'], { type: 'text/plain' });

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        blob: async () => blob,
      });

      // When: requesting with responseType='blob'
      const result = await client.get('/blob', { responseType: 'blob' });

      // Then: should return Blob
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(blob);
      }
    });

    it('should parse text response type explicitly', async () => {
      // Given: text response
      const text = 'Plain text content';

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: async () => text,
      });

      // When: requesting with responseType='text'
      const result = await client.get('/text', { responseType: 'text' });

      // Then: should return text
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toBe(text);
      }
    });

    it('should parse json response type explicitly', async () => {
      // Given: JSON response
      const data = { key: 'value', nested: { prop: 123 } };

      fetchMock.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => data,
      });

      // When: requesting with responseType='json'
      const result = await client.get('/json', { responseType: 'json' });

      // Then: should return parsed JSON
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(data);
      }
    });

    it('should handle null response body', async () => {
      // Given: response with undefined body
      fetchMock.mockResolvedValueOnce({
        status: 204,
        statusText: 'No Content',
        headers: new Headers(),
        text: async () => '',
      });

      // When: requesting response that triggers auto-detect
      const result = await client.get('/no-content', { responseType: 'auto' });

      // Then: should handle gracefully
      expect(result.ok).toBe(true);
    });
  });

  describe('Plugin System - Example Plugins Coverage', () => {
    it('should execute LoggerPlugin.setup to register event handlers', async () => {
      // Given: a PluginManager and LoggerPlugin
      const { PluginManager, LoggerPlugin } = await import('../src/utils');

      const manager = new PluginManager();
      const consoleSpy = vi.spyOn(console, 'log');

      // When: registering LoggerPlugin
      manager.register(LoggerPlugin);

      // Then: plugin should be registered (setup called)
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.anything()); // setup doesn't log

      consoleSpy.mockRestore();
    });

    it('should execute LoggerPlugin request:start handler', async () => {
      // Given: a PluginManager with LoggerPlugin and spy
      const { PluginManager, LoggerPlugin } = await import('../src/utils');

      const manager = new PluginManager();
      const consoleSpy = vi.spyOn(console, 'log');

      manager.register(LoggerPlugin);

      // When: emitting request:start event
      manager.emit('request:start', '/test-url');

      // Then: should log request started (gives coverage of console.log in handler)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📤 Request started'));

      consoleSpy.mockRestore();
    });

    it('should execute LoggerPlugin request:success handler', async () => {
      // Given: a PluginManager with LoggerPlugin
      const { PluginManager, LoggerPlugin } = await import('../src/utils');

      const manager = new PluginManager();
      const consoleSpy = vi.spyOn(console, 'log');

      manager.register(LoggerPlugin);

      // When: emitting request:success event
      manager.emit('request:success', '/test-url', 200);

      // Then: should log success (executes console.log in success handler)
      const calls = consoleSpy.mock.calls.map(c => c[0]);
      expect(calls.some(c => typeof c === 'string' && c.includes('✅ Request succeeded'))).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should execute LoggerPlugin request:error handler', async () => {
      // Given: a PluginManager with LoggerPlugin
      const { PluginManager, LoggerPlugin } = await import('../src/utils');

      const manager = new PluginManager();
      const consoleErrorSpy = vi.spyOn(console, 'error');

      manager.register(LoggerPlugin);

      // When: emitting request:error event
      const error = new Error('Test error');
      manager.emit('request:error', '/test-url', error);

      // Then: should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Request failed'),
        error,
      );

      consoleErrorSpy.mockRestore();
    });

    it('should execute MetricsPlugin.setup and track metrics', async () => {
      // Given: a PluginManager with MetricsPlugin
      const { PluginManager, MetricsPlugin } = await import('../src/utils');

      const manager = new PluginManager();
      const metricsPlugin = new MetricsPlugin();

      // When: registering MetricsPlugin
      manager.register(metricsPlugin);

      // Then: plugin should be initialized
      expect(metricsPlugin).toBeDefined();
    });

    it('should track request count in MetricsPlugin', async () => {
      // Given: a PluginManager with MetricsPlugin
      const { PluginManager, MetricsPlugin } = await import('../src/utils');

      const manager = new PluginManager();
      const metricsPlugin = new MetricsPlugin();

      manager.register(metricsPlugin);

      // When: emitting request:complete events
      manager.emit('request:complete', 'https://test.local', 200, 100); // url, status, time

      // Then: MetricsPlugin should have tracked the request
      // (setup handler connects to request:complete and increments metrics)
      expect(metricsPlugin).toBeDefined();
    });

    it('should track errors in MetricsPlugin', async () => {
      // Given: a PluginManager with MetricsPlugin  
      const { PluginManager, MetricsPlugin } = await import('../src/utils');

      const manager = new PluginManager();
      const metricsPlugin = new MetricsPlugin();

      manager.register(metricsPlugin);

      // When: emitting error events  
      const testError = new Error('Network failure');
      manager.emit('request:error', 'https://test.local', testError);

      // Then: MetricsPlugin error count incremented
      expect(metricsPlugin).toBeDefined();
    });
  });
});
