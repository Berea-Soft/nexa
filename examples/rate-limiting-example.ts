/**
 * Rate Limiting and Circuit Breaker Example
 * 
 * This example demonstrates how to use Nexa's rate limiting and circuit breaker
 * middlewares to build resilient HTTP clients.
 */

import { createHttpClient, createRateLimitMiddleware, createCircuitBreakerMiddleware } from '@bereasoftware/nexa';
import { createMockClient } from '@bereasoftware/nexa/testing';
import { createPipeline } from '@bereasoftware/nexa';

async function runRateLimitingExample() {
  console.log('=== Nexa Rate Limiting & Circuit Breaker Example ===\n');

  // Create a mock client for testing (no real server needed)
  const mockClient = createMockClient({
    passthrough: false, // All requests will be handled by mocks
  });

  // Mock some endpoints
  mockClient
    .onGet('/api/data')
    .reply(200, { data: 'success' })
    .onGet('/api/unstable')
    .reply(500, { error: 'Internal Server Error' });

  // Create rate limiting middleware: max 3 requests per 10 seconds per endpoint
  const rateLimitMiddleware = createRateLimitMiddleware({
    maxRequests: 3,
    windowMs: 10000, // 10 seconds
    errorResponse: {
      status: 429,
      body: { error: 'Rate limit exceeded', retryAfter: 10 },
    },
  });

  // Create circuit breaker middleware: open after 2 failures, reset after 30 seconds
  const circuitBreakerMiddleware = createCircuitBreakerMiddleware({
    failureThreshold: 2,
    resetTimeout: 30000,
    isFailure: (ctx) => ctx.response?.status >= 500,
  });

  // Create a middleware pipeline
  const pipeline = createPipeline([rateLimitMiddleware, circuitBreakerMiddleware]);

  // Create a custom adapter that uses the middleware pipeline
  const customAdapter = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method || 'GET';
    
    // Create HTTP context
    const ctx = {
      request: {
        method,
        url,
        headers: (init?.headers as Record<string, string>) || {},
        body: init?.body,
      },
      response: {
        status: 200,
        headers: {},
        body: undefined,
      },
      state: {},
    };

    try {
      // Execute middleware pipeline
      await pipeline(ctx);
      
      // If middleware didn't set a response, use the mock client
      if (ctx.response.status === 200 && !ctx.response.body) {
        return mockClient.createAdapter()(input, init);
      }
      
      // Return response from middleware (e.g., rate limit or circuit breaker error)
      return new Response(
        typeof ctx.response.body === 'string' 
          ? ctx.response.body 
          : JSON.stringify(ctx.response.body),
        {
          status: ctx.response.status,
          headers: ctx.response.headers,
        }
      );
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Middleware error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };

  // Create HTTP client with custom adapter
  const client = createHttpClient({
    baseURL: 'https://api.example.com',
    adapter: customAdapter,
  });

  console.log('🔄 Testing rate limiting...');

  // Make multiple requests quickly to trigger rate limit
  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`📤 Request ${i} to /api/data...`);
      const result = await client.get('/api/data');
      
      if (result.ok) {
        console.log(`✅ Request ${i} succeeded:`, result.value.data);
      } else {
        console.log(`❌ Request ${i} failed:`, result.error.message);
        if (result.error.status === 429) {
          console.log('   ⚠️ Rate limit triggered!');
        }
      }
    } catch (error) {
      console.error(`💥 Request ${i} threw error:`, error);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🔄 Testing circuit breaker...');

  // Make requests to unstable endpoint to trigger circuit breaker
  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`📤 Request ${i} to /api/unstable...`);
      const result = await client.get('/api/unstable');
      
      if (result.ok) {
        console.log(`✅ Request ${i} succeeded:`, result.value.data);
      } else {
        console.log(`❌ Request ${i} failed:`, result.error.message);
        if (result.error.status === 503) {
          console.log('   ⚡ Circuit breaker is open!');
          break;
        }
      }
    } catch (error) {
      console.error(`💥 Request ${i} threw error:`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎯 Example completed!');
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRateLimitingExample().catch(console.error);
}

export { runRateLimitingExample };