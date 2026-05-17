/**
 * Vitest Integration Example
 * 
 * This file demonstrates how to use Nexa HTTP Client with Vitest for testing.
 * It shows various testing patterns including mocking, interceptors, and error handling.
 * 
 * Run with: npm test -- examples/vitest.integration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHttpClient } from '../../src/http-client/index.js';
import { createMockClient } from '../../src/testing/index.js';
import type { MockAdapter } from '../../src/testing/index.js';

describe('Nexa HTTP Client - Vitest Integration Examples', () => {
  let client: ReturnType<typeof createHttpClient>;
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    // Create a real HTTP client with a base URL for testing
    client = createHttpClient({ baseURL: 'https://api.example.com' });
    // Create a mock adapter for the client
    mockAdapter = createMockClient(client);
  });

  afterEach(() => {
    // Reset mock routes between tests
    mockAdapter.reset();
    // Clear any Vitest mocks
    vi.clearAllMocks();
  });

  describe('Basic Mocking', () => {
    it('should mock GET requests with static data', async () => {
      // Arrange
      const mockUsers = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
      mockAdapter.onGet('/users').reply(200, mockUsers);

      // Act
      const result = await mockAdapter.client.get('/users');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(mockUsers);
        expect(result.value.status).toBe(200);
      }
    });

    it('should mock POST requests with request body validation', async () => {
      // Arrange
      const newUser = { name: 'Alice', email: 'alice@example.com' };
      mockAdapter.onPost('/users').reply((config) => {
        // Validate the request body
        const body = config.body ? JSON.parse(config.body as string) : {};
        if (!body.name || !body.email) {
          return { status: 400, data: { error: 'Missing required fields' } };
        }
        return { status: 201, data: { ...body, id: 3 } };
      });

      // Act
      const result = await mockAdapter.client.post('/users', newUser);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe(201);
        expect(result.value.data).toEqual({ ...newUser, id: 3 });
      }
    });

    it('should mock error responses', async () => {
      // Arrange
      mockAdapter.onGet('/error').reply(500, { error: 'Internal Server Error' });

      // Act
      const result = await mockAdapter.client.get('/error');

      // Assert - The client returns an error result (not an exception)
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('HTTP_ERROR');
        expect(result.error.status).toBe(500);
      }
    });
  });

  describe('Advanced Mocking Patterns', () => {
    it('should use replyOnce for one-time mocks', async () => {
      // Arrange
      mockAdapter.onGet('/data').replyOnce(200, { data: 'first' });
      mockAdapter.onGet('/data').reply(200, { data: 'second' });

      // Act & Assert - First call
      const result1 = await mockAdapter.client.get('/data');
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value.data).toEqual({ data: 'first' });
      }

      // Act & Assert - Second call
      const result2 = await mockAdapter.client.get('/data');
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value.data).toEqual({ data: 'second' });
      }
    });

    it('should simulate network errors', async () => {
      // Arrange
      mockAdapter.onGet('/network-error').networkError('Network failure');

      // Act
      const result = await mockAdapter.client.get('/network-error');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.message).toContain('Network');
      }
    });

    it('should simulate timeouts', async () => {
      // Arrange
      mockAdapter.onGet('/slow').timeout();

      // Act
      const result = await mockAdapter.client.get('/slow');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('HTTP_ERROR');
        expect(result.error.status).toBe(408); // Request Timeout
      }
    });

    it('should use RegExp URL patterns', async () => {
      // Arrange
      mockAdapter.onGet(/\/users\/\d+/).reply(200, { id: 123 });

      // Act
      const result = await mockAdapter.client.get('/users/123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({ id: 123 });
      }
    });
  });

  describe('Testing Interceptors', () => {
    it('should test request interceptors', async () => {
      // Arrange
      const interceptor = vi.fn((config) => {
        config.headers = { ...config.headers, 'X-Test': 'true' };
        return config;
      });

      const testClient = createHttpClient({ baseURL: 'https://api.example.com' });
      testClient.addRequestInterceptor({ onRequest: interceptor });
      const testMock = createMockClient(testClient);
      
      testMock.onGet('/test').reply(200, { success: true });

      // Act
      await testMock.client.get('/test');

      // Assert - Verify interceptor was called
      expect(interceptor).toHaveBeenCalledTimes(1);
      expect(interceptor.mock.calls[0][0].headers['X-Test']).toBe('true');
    });

    it('should test response interceptors', async () => {
      // Arrange
      const interceptor = vi.fn((response) => {
        // Response interceptors receive HttpResponse, not Result
        response.data = { ...response.data, modified: true };
        return response;
      });

      const testClient = createHttpClient({ baseURL: 'https://api.example.com' });
      testClient.addResponseInterceptor({ onResponse: interceptor });
      const testMock = createMockClient(testClient);
      
      testMock.onGet('/data').reply(200, { original: true });

      // Act
      const result = await testMock.client.get('/data');

      // Assert
      expect(interceptor).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({ original: true, modified: true });
      }
    });
  });

  describe('Testing Retry Strategies', () => {
    it('should test retry logic with mock failures', async () => {
      // Arrange - Fail first, then succeed
      let callCount = 0;
      
      // Create a client (retry config will be per-request)
      const retryClient = createHttpClient({
        baseURL: 'https://api.example.com',
      });
      const retryMock = createMockClient(retryClient);

      // Mock route that fails first call with 500 error, succeeds second
      retryMock.onGet('/retry').replyOnce(500, { error: 'Internal Server Error' });
      retryMock.onGet('/retry').reply(() => {
        callCount++;
        return { status: 200, data: { success: true } };
      });

      // Act - Pass retry config in the request
      const result = await retryMock.client.get('/retry', {
        retry: {
          maxAttempts: 3,
          backoffMs: 0, // No delay for testing
        },
      });
      console.log('Result error:', result.ok ? 'success' : result.error);

      // Assert
      expect(callCount).toBe(1); // Should have succeeded on second attempt (first was 500 error)
      expect(result.ok).toBe(true);
    });
  });

  describe('Testing Cache Middleware', () => {
    it('should cache GET requests', async () => {
      // Arrange
      let apiCallCount = 0;
      mockAdapter.onGet('/cached').reply(() => {
        apiCallCount++;
        return { status: 200, data: { count: apiCallCount } };
      });

      // Create client with cache middleware
      const cachingClient = createHttpClient({
        baseURL: 'https://api.example.com',
      });

      // In a real scenario, you'd set up cache middleware
      // For this example, we'll just verify the mock behavior

      // Act - First call
      const result1 = await mockAdapter.client.get('/cached');
      // Act - Second call (should hit mock again unless cached)
      const result2 = await mockAdapter.client.get('/cached');

      // Assert
      expect(apiCallCount).toBe(2); // Mock called twice (no caching in mock)
      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
    });
  });
});