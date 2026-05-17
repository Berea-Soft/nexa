/**
 * Mocking utilities for Nexa HTTP Client.
 * Provides axios-mock-adapter-like functionality for testing.
 */

import type { IHttpClient, HttpRequestConfig } from '../types/index.js';

/**
 * Configuration for a mocked response
 */
export interface MockResponse {
  /** HTTP status code (default: 200) */
  status?: number;
  /** HTTP status text (default: 'OK') */
  statusText?: string;
  /** Response headers (default: { 'content-type': 'application/json' }) */
  headers?: Record<string, string>;
  /** Response body (will be JSON.stringified if object/array) */
  data?: any;
  /** Optional delay in milliseconds before responding */
  delay?: number;
  /** Throw a network error instead of returning a response */
  networkError?: boolean;
  /** Error message for network error */
  errorMessage?: string;
}

/**
 * Mock route configuration
 */
interface MockRoute {
  /** HTTP method (uppercase) */
  method: string;
  /** URL pattern (string or RegExp) */
  urlPattern: string | RegExp;
  /** Response handler */
  response: MockResponse | ((config: HttpRequestConfig) => MockResponse | Promise<MockResponse>);
  /** Number of times this route has been called */
  timesCalled: number;
  /** Maximum number of times this route should match (0 = unlimited) */
  times?: number;
}

/**
 * Options for creating a mock client
 */
export interface MockClientOptions {
  /** Base URL to match against (optional) */
  baseURL?: string;
  /** Default delay for all responses (optional) */
  delay?: number;
  /** Whether to pass through unmatched requests to original adapter (default: false) */
  passthrough?: boolean;
}

/**
 * Route builder returned by onGet(), onPost(), etc.
 * Allows fluent API like mockAdapter.onGet('/users').reply(200, users)
 */
class RouteBuilder {
  private adapter: MockAdapter;
  private method: string;
  private urlPattern: string | RegExp;

  constructor(adapter: MockAdapter, method: string, urlPattern: string | RegExp) {
    this.adapter = adapter;
    this.method = method;
    this.urlPattern = urlPattern;
  }

  /**
   * Configure a response for this route
   */
  reply(status: number, data?: any, headers?: Record<string, string>): MockAdapter;
  reply(response: MockResponse): MockAdapter;
  reply(arg1: number | MockResponse, data?: any, headers?: Record<string, string>): MockAdapter {
    let response: MockResponse;
    if (typeof arg1 === 'number') {
      response = { status: arg1, data, headers };
    } else {
      response = arg1;
    }
    this.adapter.addRoute(this.method, this.urlPattern, response);
    return this.adapter;
  }

  /**
   * Configure a response that will only be used once
   */
  replyOnce(status: number, data?: any, headers?: Record<string, string>): MockAdapter;
  replyOnce(response: MockResponse): MockAdapter;
  replyOnce(arg1: number | MockResponse, data?: any, headers?: Record<string, string>): MockAdapter {
    let response: MockResponse;
    if (typeof arg1 === 'number') {
      response = { status: arg1, data, headers };
    } else {
      response = arg1;
    }
    this.adapter.addRoute(this.method, this.urlPattern, response, { times: 1 });
    return this.adapter;
  }

  /**
   * Configure a network error for this route
   */
  networkError(errorMessage: string = 'Network Error'): MockAdapter {
    this.adapter.addRoute(this.method, this.urlPattern, {
      networkError: true,
      errorMessage,
    });
    return this.adapter;
  }

  /**
   * Configure a timeout error for this route
   */
  timeout(): MockAdapter {
    this.adapter.addRoute(this.method, this.urlPattern, {
      status: 408,
      statusText: 'Request Timeout',
    });
    return this.adapter;
  }
}

/**
 * Mock adapter that intercepts HTTP requests and returns configured responses.
 * Similar to axios-mock-adapter.
 */
export class MockAdapter {
  private routes: MockRoute[] = [];
  private originalAdapter?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  private mockClient: IHttpClient;
  private options: MockClientOptions;
  private defaultResponse: MockResponse = {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
  };

  /**
   * Create a new MockAdapter and attach it to a client.
   * The original client is not modified. Instead, a new client with the mock adapter is created.
   * Use the `client` property to access the mock-enabled client.
   */
  constructor(client: IHttpClient, options: MockClientOptions = {}) {
    this.options = options;
    
    // Create mock adapter function
    const adapter = this.createAdapter();
    
    // Try to extend the client with the mock adapter
    // We assume the client has an `extend` method (HttpClient does)
    if (typeof (client as any).extend === 'function') {
      this.mockClient = (client as any).extend({ adapter });
    } else {
      // Fallback: create a new HttpClient with mock adapter
      // This requires importing HttpClient, but we want to avoid circular dependencies
      // For now, throw an error suggesting to use HttpClient instance
      throw new Error('MockAdapter requires an HttpClient instance with extend() method');
    }
  }

  /**
   * Get the mock-enabled client
   */
  get client(): IHttpClient {
    return this.mockClient;
  }

  /**
   * Create a mock adapter that can be used as a standalone adapter.
   * This adapter can be set on any HttpClient via config.adapter.
   */
  createAdapter(): (input: RequestInfo, init?: RequestInit) => Promise<Response> {
    return async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      // Convert RequestInfo to URL string
      const url = typeof input === 'string' ? input : input.url;
      
      // Convert RequestInit to HttpRequestConfig-like object
      const method = init?.method || 'GET';
      const config: HttpRequestConfig = {
        url,
        method: method as any,
        headers: init?.headers as Record<string, string>,
        body: init?.body,
        signal: init?.signal ?? undefined,
      };

      // Find matching route
      const route = this.findMatchingRoute(method, url);
      
      if (!route) {
        if (this.options.passthrough) {
          // Use original adapter or global fetch
          const adapter = this.originalAdapter || fetch;
          return adapter(input, init);
        }
        // No route matched and no passthrough - return 404
        return new Response(JSON.stringify({ error: 'No mock route matched' }), {
          status: 404,
          statusText: 'Not Found',
          headers: { 'content-type': 'application/json' },
        });
      }

      route.timesCalled++;

      // Get response configuration
      let responseConfig: MockResponse;
      if (typeof route.response === 'function') {
        responseConfig = await route.response(config);
      } else {
        responseConfig = route.response;
      }

      // Handle network error
      if (responseConfig.networkError) {
        throw new TypeError(responseConfig.errorMessage || 'Network Error');
      }

      // Apply default values - filter out undefined properties from responseConfig
      const filteredConfig = Object.fromEntries(
        Object.entries(responseConfig).filter(([_, v]) => v !== undefined)
      );
      const finalResponse: MockResponse = {
        ...this.defaultResponse,
        ...filteredConfig,
      };
      // Determine if user explicitly provided content-type
      const userProvidedContentType = responseConfig.headers && 'content-type' in responseConfig.headers;
      if (!userProvidedContentType) {
        // Set appropriate content-type based on data type
        if (finalResponse.data instanceof Uint8Array || ArrayBuffer.isView(finalResponse.data)) {
          finalResponse.headers = { ...finalResponse.headers, 'content-type': 'application/octet-stream' };
        } else if (finalResponse.data && typeof finalResponse.data === 'object') {
          finalResponse.headers = { ...finalResponse.headers, 'content-type': 'application/json' };
        }
      }

      // Apply delay if specified, with abort support
      if (finalResponse.delay || this.options.delay) {
        const delay = finalResponse.delay ?? this.options.delay;
        if (delay && delay > 0) {
          const signal = init?.signal;
          if (signal) {
            // Check if already aborted
            signal.throwIfAborted();
            // Wait for delay or abort
            await new Promise<void>((resolve, reject) => {
              const timeoutId = setTimeout(resolve, delay);
              const onAbort = () => {
                clearTimeout(timeoutId);
                reject(new DOMException('Aborted', 'AbortError'));
              };
              signal.addEventListener('abort', onAbort, { once: true });
              // Cleanup on timeout completion
              setTimeout(() => {
                signal.removeEventListener('abort', onAbort);
              }, delay);
            });
          } else {
            // No signal, just delay
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Create and adjust headers
      const headers = new Headers(finalResponse.headers);
      const data = finalResponse.data;
      

      
      // Adjust for status codes that shouldn't have a body
      if (finalResponse.status === 204 || finalResponse.status === 205) {
        // 204 No Content and 205 Reset Content must not have a body
        // Remove content-type header for these statuses
        headers.delete('content-type');
      }

      // Prepare body
      let body: string;
      if (data === undefined || data === null) {
        body = '';
      } else if (typeof data === 'string') {
        body = data;
      } else if (data instanceof Uint8Array || ArrayBuffer.isView(data)) {
        // Convert to ArrayBuffer for Response constructor
        let buffer: ArrayBuffer;
        if (data.buffer instanceof ArrayBuffer) {
          buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        } else {
          // SharedArrayBuffer - copy to a new ArrayBuffer
          const uint8 = new Uint8Array(data.byteLength);
          uint8.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
          buffer = uint8.buffer;
        }
        return new Response(buffer, {
          status: finalResponse.status,
          statusText: finalResponse.statusText,
          headers,
        });
      } else {
        body = JSON.stringify(data);
      }

      // Adjust body for status codes that shouldn't have a body
      let responseBody: string | null = body;
      if (finalResponse.status === 204 || finalResponse.status === 205) {
        // 204 No Content and 205 Reset Content must not have a body
        responseBody = null;
      } else if (responseBody === '') {
        // Empty string body can be set to null to avoid issues
        responseBody = null;
      }

      // Remove content-type header if there's no body
      if (responseBody === null) {
        headers.delete('content-type');
      }

      return new Response(responseBody, {
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers,
      });
    };
  }

  /**
   * Add a route for GET requests
   */
  onGet(urlPattern: string | RegExp): RouteBuilder {
    return new RouteBuilder(this, 'GET', urlPattern);
  }

  /**
   * Add a route for POST requests
   */
  onPost(urlPattern: string | RegExp): RouteBuilder {
    return new RouteBuilder(this, 'POST', urlPattern);
  }

  /**
   * Add a route for PUT requests
   */
  onPut(urlPattern: string | RegExp): RouteBuilder {
    return new RouteBuilder(this, 'PUT', urlPattern);
  }

  /**
   * Add a route for PATCH requests
   */
  onPatch(urlPattern: string | RegExp): RouteBuilder {
    return new RouteBuilder(this, 'PATCH', urlPattern);
  }

  /**
   * Add a route for DELETE requests
   */
  onDelete(urlPattern: string | RegExp): RouteBuilder {
    return new RouteBuilder(this, 'DELETE', urlPattern);
  }

  /**
   * Add a route for any HTTP method
   */
  onAny(urlPattern: string | RegExp): RouteBuilder {
    return new RouteBuilder(this, 'ANY', urlPattern);
  }

  /**
   * Add a route with a specific HTTP method and response
   */
  addRoute(
    method: string,
    urlPattern: string | RegExp,
    response: MockResponse | ((config: HttpRequestConfig) => MockResponse | Promise<MockResponse>),
    options?: { times?: number }
  ): this {
    this.routes.push({
      method: method.toUpperCase(),
      urlPattern,
      response,
      timesCalled: 0,
      times: options?.times,
    });
    return this;
  }

  /**
   * Reset all mock routes
   */
  reset(): void {
    this.routes = [];
  }

  /**
   * Restore original adapter (if any)
   */
  restore(): void {
    // Currently, we don't modify the original client, so nothing to restore
  }

  /**
   * Helper to create a response configuration
   */
  static reply(status: number, data?: any, headers?: Record<string, string>): MockResponse {
    return { status, data, headers };
  }

  /**
   * Helper to create a network error response
   */
  static networkError(message: string = 'Network Error'): MockResponse {
    return { networkError: true, errorMessage: message };
  }

  private findMatchingRoute(method: string, url: string): MockRoute | null {
    // Normalize URL by removing baseURL if specified
    let normalizedUrl = url;
    if (this.options.baseURL && url.startsWith(this.options.baseURL)) {
      normalizedUrl = url.slice(this.options.baseURL.length);
    } else {
      // If URL is absolute (contains ://), extract pathname + search
      // This allows matching patterns like '/users' against 'https://api.example.com/users'
      try {
        if (normalizedUrl.includes('://')) {
          const urlObj = new URL(normalizedUrl);
          normalizedUrl = urlObj.pathname + urlObj.search;
        }
      } catch {
        // URL parsing failed, use as-is
      }
    }

    for (const route of this.routes) {
      // Skip routes that have reached their call limit
      if (route.times && route.timesCalled >= route.times) {
        continue;
      }

      // Check method
      if (route.method !== 'ANY' && route.method !== method.toUpperCase()) {
        continue;
      }

      // Check URL pattern
      let matches = false;
      if (typeof route.urlPattern === 'string') {
        // Simple string match (exact or startsWith)
        matches = normalizedUrl === route.urlPattern || normalizedUrl.startsWith(route.urlPattern);
      } else if (route.urlPattern instanceof RegExp) {
        matches = route.urlPattern.test(normalizedUrl);
      }

      if (matches) {
        return route;
      }
    }

    return null;
  }
}

/**
 * Create a mock client with axios-mock-adapter-like API
 * 
 * @example
 * ```typescript
 * import { createHttpClient } from '@bereasoftware/nexa';
 * import { createMockClient } from '@bereasoftware/nexa/testing';
 * 
 * const client = createHttpClient({ baseURL: 'https://api.example.com' });
 * const mockClient = createMockClient(client);
 * 
 * mockClient.onGet('/users').reply(200, [{ id: 1 }]);
 * mockClient.onPost('/users').reply(201, { id: 2 });
 * 
 * // Use mockClient.client for making requests
 * const result = await mockClient.client.get('/users');
 * ```
 */
export function createMockClient(client: IHttpClient, options: MockClientOptions = {}): MockAdapter {
  return new MockAdapter(client, options);
}