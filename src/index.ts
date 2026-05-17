/**
 * Nexa - Ultra-fast, ultra-light HTTP client plugin
 * Combines fetch power + axios convenience with SOLID principles
 */

export * from './http-client'
export * from './types'
export * from './utils'
export {
  createDevOverlay,
  getDevOverlay,
  destroyDevOverlay,
} from './dev-overlay'
export type {
  TrackedRequest,
  DevMetrics,
  DevOverlayConfig,
} from './dev-overlay'
export { RequestTracker } from './dev-overlay'
