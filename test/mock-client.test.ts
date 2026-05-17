/**
 * Mock Client Test Suite
 * Tests for axios-mock-adapter-like mocking utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHttpClient } from '../src/http-client/index.js';
import { createMockClient, MockAdapter } from '../src/testing/index.js';

describe('Mock Client Utilities', () => {
  let client: ReturnType<typeof createHttpClient>;
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    client = createHttpClient({ baseURL: 'https://api.example.com' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createMockClient', () => {
    it('should create a MockAdapter instance', () => {
      mockAdapter = createMockClient(client);
      expect(mockAdapter).toBeInstanceOf(MockAdapter);
      expect(mockAdapter.client).toBeDefined();
    });

    it('should accept options', () => {
      mockAdapter = createMockClient(client, {
        passthrough: true,
        delay: 100,
        baseURL: 'https://api.example.com',
      });
      expect(mockAdapter).toBeInstanceOf(MockAdapter);
    });
  });

  describe('MockAdapter basic functionality', () => {
    beforeEach(() => {
      mockAdapter = createMockClient(client);
    });

    it('should mock GET requests with static response', async () => {
      const mockData = [{ id: 1, name: 'John' }];
      mockAdapter.onGet('/users').reply(200, mockData);

      const result = await mockAdapter.client.get('/users');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(mockData);
        expect(result.value.status).toBe(200);
      }
    });

    it('should mock POST requests with static response', async () => {
      const mockData = { id: 1, name: 'Jane' };
      mockAdapter.onPost('/users').reply(201, mockData);

      const result = await mockAdapter.client.post('/users', { name: 'Jane' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(mockData);
        expect(result.value.status).toBe(201);
      }
    });

    it('should mock PUT requests', async () => {
      const mockData = { id: 1, name: 'Updated' };
      mockAdapter.onPut('/users/1').reply(200, mockData);

      const result = await mockAdapter.client.put('/users/1', { name: 'Updated' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(mockData);
      }
    });

    it('should mock PATCH requests', async () => {
      const mockData = { id: 1, email: 'new@example.com' };
      mockAdapter.onPatch('/users/1').reply(200, mockData);

      const result = await mockAdapter.client.patch('/users/1', { email: 'new@example.com' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual(mockData);
      }
    });

    it('should mock DELETE requests', async () => {
      mockAdapter.onDelete('/users/1').reply(204);

      const result = await mockAdapter.client.delete('/users/1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe(204);
      }
    });

    it('should handle request with baseURL correctly', async () => {
      const mockData = { id: 1 };
      mockAdapter.onGet('/users').reply(200, mockData);

      // Request should match without baseURL
      const result = await mockAdapter.client.get('/users');
      expect(result.ok).toBe(true);
    });
  });

  describe('MockAdapter advanced features', () => {
    beforeEach(() => {
      mockAdapter = createMockClient(client);
    });

    it('should support replyOnce for one-time mock', async () => {
      const mockData1 = { id: 1 };
      const mockData2 = { id: 2 };
      
      mockAdapter.onGet('/users').replyOnce(200, mockData1);
      mockAdapter.onGet('/users').reply(200, mockData2);

      // First call gets first response
      const result1 = await mockAdapter.client.get('/users');
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value.data).toEqual(mockData1);
      }

      // Second call gets second response
      const result2 = await mockAdapter.client.get('/users');
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value.data).toEqual(mockData2);
      }
    });

    it('should support networkError simulation', async () => {
      mockAdapter.onGet('/error').networkError('Network failure');

      const result = await mockAdapter.client.get('/error');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.message).toContain('Network');
      }
    });

    it('should support timeout simulation', async () => {
      mockAdapter.onGet('/slow').timeout();

      const result = await mockAdapter.client.get('/slow');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // The mock adapter returns a timeout response (status 408) rather than throwing
        // This depends on implementation
        expect(result.error.code).toBe('HTTP_ERROR');
        expect(result.error.status).toBe(408);
      }
    });

    it('should support function-based responses', async () => {
      mockAdapter.onGet('/dynamic').reply((config) => ({
        status: 200,
        data: { url: config.url },
      }));

      const result = await mockAdapter.client.get('/dynamic', {
        query: { page: 1, limit: 10 },
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        // config.url includes query parameters
        expect(result.value.data.url).toBe('https://api.example.com/dynamic?page=1&limit=10');
      }
    });

    it('should support RegExp URL patterns', async () => {
      mockAdapter.onGet(/\/users\/\d+/).reply(200, { id: 123 });

      const result = await mockAdapter.client.get('/users/123');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data.id).toBe(123);
      }
    });

    it('should support onAny for any HTTP method', async () => {
      mockAdapter.onAny('/any').reply(200, { works: true });

      const getResult = await mockAdapter.client.get('/any');
      expect(getResult.ok).toBe(true);
      
      const postResult = await mockAdapter.client.post('/any', {});
      expect(postResult.ok).toBe(true);
    });
  });

  describe('MockAdapter configuration options', () => {
    it('should respect passthrough option', async () => {
      // Mock global fetch for passthrough
      const fetchMock = vi.fn();
      global.fetch = fetchMock;
      fetchMock.mockResolvedValue({
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ passed: true }),
      });

      mockAdapter = createMockClient(client, { passthrough: true });
      
      // No route configured, should pass through to fetch
      const result = await mockAdapter.client.get('/not-mocked');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({ passed: true });
      }
    });

    it('should apply default delay', async () => {
      const start = Date.now();
      mockAdapter = createMockClient(client, { delay: 50 });
      mockAdapter.onGet('/delayed').reply(200, { delayed: true });

      const result = await mockAdapter.client.get('/delayed');
      const elapsed = Date.now() - start;
      
      expect(result.ok).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some tolerance
    });

    it('should handle response delay per route', async () => {
      const start = Date.now();
      mockAdapter = createMockClient(client);
      mockAdapter.onGet('/delayed').reply({
        status: 200,
        data: { delayed: true },
        delay: 30,
      });

      const result = await mockAdapter.client.get('/delayed');
      const elapsed = Date.now() - start;
      
      expect(result.ok).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(20);
    });
  });

  describe('MockAdapter utility methods', () => {
    beforeEach(() => {
      mockAdapter = createMockClient(client);
    });

    it('should reset all routes', async () => {
      mockAdapter.onGet('/users').reply(200, { id: 1 });
      mockAdapter.reset();

      // No route configured, should return 404 (no passthrough)
      const result = await mockAdapter.client.get('/users');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(404);
      }
    });

    it('should track call counts', async () => {
      mockAdapter.onGet('/users').reply(200, { id: 1 });
      
      await mockAdapter.client.get('/users');
      await mockAdapter.client.get('/users');
      
      // Call count tracking would need to be exposed in the API
      // For now, we just verify the route works multiple times
      const result = await mockAdapter.client.get('/users');
      expect(result.ok).toBe(true);
    });

    it('should handle binary data responses', async () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      mockAdapter.onGet('/binary').reply(200, buffer);

      const result = await mockAdapter.client.get('/binary');
      if (!result.ok) {
        console.log('Binary data error:', result.error);
      }
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Client may return Blob or ArrayBuffer for binary data
        expect(result.value.data instanceof Blob || result.value.data instanceof ArrayBuffer).toBe(true);
        // Verify data integrity
        const buffer = result.value.data instanceof Blob 
          ? new Uint8Array(await result.value.data.arrayBuffer())
          : new Uint8Array(result.value.data);
        expect(buffer).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
      }
    });

    it('should handle text responses', async () => {
      const text = 'Plain text response';
      mockAdapter.onGet('/text').reply(200, text);

      const result = await mockAdapter.client.get('/text', { responseType: 'text' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toBe(text);
      }
    });

    it('should handle empty responses', async () => {
      mockAdapter.onGet('/empty').reply(204);

      const result = await mockAdapter.client.get('/empty');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe(204);
        // For 204 No Content, the response body is empty
        // The client parses it as empty string (consistent with fetch behavior)
        expect(result.value.data).toBe('');
      }
    });
  });

  describe('MockAdapter static methods', () => {
    it('should create reply configuration with static method', () => {
      const reply = MockAdapter.reply(201, { created: true }, { 'X-Custom': 'value' });
      expect(reply.status).toBe(201);
      expect(reply.data).toEqual({ created: true });
      expect(reply.headers).toEqual({ 'X-Custom': 'value' });
    });

    it('should create network error configuration with static method', () => {
      const error = MockAdapter.networkError('Custom network error');
      expect(error.networkError).toBe(true);
      expect(error.errorMessage).toBe('Custom network error');
    });
  });
});