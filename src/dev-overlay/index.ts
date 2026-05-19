export { RequestTracker } from './tracker'
export { DevOverlayUI } from './overlay'
export type { TrackedRequest, DevMetrics, DevOverlayConfig } from './types'

import { RequestTracker, loadPersistedConfig } from './tracker'
import { DevOverlayUI } from './overlay'
import type { DevOverlayConfig } from './types'

let overlayInstance: DevOverlayUI | null = null
let trackerInstance: RequestTracker | null = null

export const defaultDevOverlayConfig: DevOverlayConfig = {
  enabled: true,
  maxHistory: 500,
  keyboardShortcut: 'ctrl+shift+n',
  position: 'bottom-right',
  theme: 'dark',
  devOnly: true,
  floatingButtonSize: 48,
  floatingButtonOffset: 24,
  floatingButtonTheme: 'inherit',
  branding: 'Nexa DevTools',
  icon: 'https://raw.githubusercontent.com/Berea-Soft/nexa/refs/heads/main/src/assets/faviconNew.png',
}

/**
 * Create (or return) the singleton Dev Overlay instances.
 *
 * The `config` object overrides defaults exposed via `defaultDevOverlayConfig`.
 */
export function createDevOverlay(config: DevOverlayConfig = {}): {
  tracker: RequestTracker
  ui: DevOverlayUI
  config: Required<DevOverlayConfig>
} {
  if (overlayInstance && trackerInstance) {
    // If overlay already exists (HMR or repeated init), re-load persisted config
    // and apply it to the existing tracker/UI so settings persist across reloads.
    const persisted = loadPersistedConfig()
    const merged = { ...defaultDevOverlayConfig, ...config, ...persisted }
    const newCfg = trackerInstance.updateConfig(merged)
    // Ask UI to refresh to apply position/theme/size changes
    try {
      // `refreshConfig` is a public helper on DevOverlayUI
      overlayInstance.refreshConfig(newCfg)
    } catch {
      // ignore if UI cannot be refreshed
    }

    return {
      tracker: trackerInstance,
      ui: overlayInstance,
      config: newCfg,
    }
  }

  // Load persisted settings from localStorage and merge so persisted values take precedence:
  // defaults <- provided <- persisted (persisted wins)
  const persisted = loadPersistedConfig()
  const merged = { ...defaultDevOverlayConfig, ...config, ...persisted }
  trackerInstance = new RequestTracker(merged)
  overlayInstance = new DevOverlayUI(trackerInstance)
  // Do not open the panel by default; the UI will expose a floating icon when enabled

  return {
    tracker: trackerInstance,
    ui: overlayInstance,
    config: trackerInstance.getConfig(),
  }
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
