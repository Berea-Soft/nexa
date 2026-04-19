/**
 * Nexa - Ultra-fast, ultra-light HTTP client plugin
 * Combines fetch power + axios convenience with SOLID principles
 */

export * from './http-client';

// Realtime communication
export * from './realtime/index.js';

// Testing utilities
export { createMockClient, MockAdapter } from './testing/index.js';
export type { MockResponse, MockClientOptions } from './testing/index.js';
