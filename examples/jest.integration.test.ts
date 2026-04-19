/**
 * Jest Integration Example
 * 
 * This file demonstrates how to use Nexa HTTP Client with Jest for testing.
 * It shows similar patterns to the Vitest example but adapted for Jest.
 * 
 * Note: Jest requires configuration to handle ES modules. Ensure your Jest config
 * includes transforms for TypeScript/ES modules.
 * 
 * Run with: npm test -- examples/jest.integration.test.ts
 * (assuming Jest is configured in your project)
 */

// Jest globals (if using @jest/globals, import them)
// import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
// For simplicity, we assume Jest globals are available

import { createHttpClient } from '../src/http-client/index.js';
import { createMockClient } from '../src/testing/index.js';
import type { MockAdapter } from '../src/testing/index.js';

// If using Jest's built-in globals, no import needed
// If using @jest/globals, uncomment the import above and use those

describe('Nexa HTTP Client - Jest Integration Examples', () => {
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
    // Clear Jest mocks
    jest.clearAllMocks();
  });

  describe('Basic Mocking with Jest', () => {
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

    it('should mock error responses and verify error structure', async () => {
      // Arrange
      mockAdapter.onGet('/not-found').reply(404, { error: 'Not Found' });

      // Act
      const result = await mockAdapter.client.get('/not-found');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('HTTP_ERROR');
        expect(result.error.status).toBe(404);
        expect(result.error.message).toContain('404');
      }
    });
  });

  describe('Mocking Network Errors', () => {
    it('should simulate network failures', async () => {
      // Arrange
      mockAdapter.onGet('/unreachable').networkError('Connection refused');

      // Act
      const result = await mockAdapter.client.get('/unreachable');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // The client converts network errors to NETWORK_ERROR code
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.message).toContain('Connection');
      }
    });
  });

  describe('Testing with Jest Mocks', () => {
    it('should use Jest mocks to verify interceptor calls', async () => {
      // Arrange
      const requestInterceptor = jest.fn((config) => {
        config.headers = { ...config.headers, 'X-Jest-Test': 'true' };
        return config;
      });

      client.interceptors.request.use(requestInterceptor);

      mockAdapter.onGet('/jest-test').reply(200, { jest: true });

      // Act
      await mockAdapter.client.get('/jest-test');

      // Assert
      expect(requestInterceptor).toHaveBeenCalledTimes(1);
      const interceptedConfig = requestInterceptor.mock.calls[0][0];
      expect(interceptedConfig.headers['X-Jest-Test']).toBe('true');
    });

    it('should mock fetch directly for integration tests', async () => {
      // In some cases, you might want to mock global fetch instead of using MockAdapter
      // This example shows how to do that with Jest
      
      // Save original fetch
      const originalFetch = global.fetch;
      
      try {
        // Mock global fetch
        global.fetch = jest.fn().mockResolvedValue(
          new Response(JSON.stringify({ mocked: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );

        // Create a client that uses the mocked global fetch
        const clientWithMockedFetch = createHttpClient();
        
        // Act
        const result = await clientWithMockedFetch.get('https://api.example.com/data');
        
        // Assert
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.data).toEqual({ mocked: true });
        }
      } finally {
        // Restore original fetch
        global.fetch = originalFetch;
      }
    });
  });

  describe('Snapshot Testing', () => {
    it('should match response snapshots', async () => {
      // Arrange
      const mockData = {
        id: 1,
        name: 'Test Item',
        nested: {
          value: 'deep',
        },
      };
      mockAdapter.onGet('/snapshot').reply(200, mockData);

      // Act
      const result = await mockAdapter.client.get('/snapshot');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Use Jest snapshot testing
        expect(result.value.data).toMatchSnapshot();
      }
    });
  });

  describe('Testing Async Behavior', () => {
    it('should handle delayed responses', async () => {
      // Arrange
      mockAdapter.onGet('/delayed').reply(200, { delayed: true }, { delay: 100 });

      // Act & Assert - Should not timeout
      const result = await mockAdapter.client.get('/delayed');
      expect(result.ok).toBe(true);
    });

    it('should timeout when delay exceeds client timeout', async () => {
      // This test requires a client with a short timeout
      const fastClient = createHttpClient({
        baseURL: 'https://api.example.com',
        timeout: 50, // 50ms timeout
      });
      const fastMock = createMockClient(fastClient);
      
      // Mock with longer delay than client timeout
      fastMock.onGet('/slow').reply(200, { slow: true }, { delay: 200 });

      // Act
      const result = await fastMock.client.get('/slow');

      // Assert - Should timeout (returns HTTP error 408 from mock)
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('HTTP_ERROR');
        expect(result.error.status).toBe(408);
      }
    });
  });
});