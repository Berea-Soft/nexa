export { RequestTracker } from './tracker'
export { DevOverlayUI } from './overlay'
export type { TrackedRequest, DevMetrics, DevOverlayConfig } from './types'

import { RequestTracker } from './tracker'
import { DevOverlayUI } from './overlay'
import type { DevOverlayConfig } from './types'

let overlayInstance: DevOverlayUI | null = null
let trackerInstance: RequestTracker | null = null

export function createDevOverlay(config: DevOverlayConfig = {}): {
  tracker: RequestTracker
  ui: DevOverlayUI
} {
  if (overlayInstance) {
    return { tracker: trackerInstance!, ui: overlayInstance }
  }

  trackerInstance = new RequestTracker(config)
  overlayInstance = new DevOverlayUI(trackerInstance)
  overlayInstance.show()

  return { tracker: trackerInstance, ui: overlayInstance }
}

export function getDevOverlay(): {
  tracker: RequestTracker | null
  ui: DevOverlayUI | null
} {
  return { tracker: trackerInstance, ui: overlayInstance }
}

export function destroyDevOverlay(): void {
  overlayInstance?.destroy()
  overlayInstance = null
  trackerInstance = null
}
