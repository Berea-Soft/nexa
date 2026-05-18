import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createDevOverlay,
  destroyDevOverlay,
  defaultDevOverlayConfig,
} from '../src/dev-overlay'

function createMockLocalStorage() {
  let store: Record<string, string> = {}
  return {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null
    },
    setItem(key: string, value: string) {
      store[key] = String(value)
    },
    removeItem(key: string) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  }
}

describe('Dev Overlay persistence', () => {
  beforeEach(() => {
    destroyDevOverlay()
    ;(globalThis as any).localStorage = createMockLocalStorage()
  })

  afterEach(() => {
    destroyDevOverlay()
    try {
      delete (globalThis as any).localStorage
    } catch {}
  })

  it('applies persisted config from localStorage when present', () => {
    const persisted = {
      position: 'top-left',
      theme: 'light',
      floatingButtonSize: 36,
    }
    // Persisted should override provided config when creating the overlay
    globalThis.localStorage.setItem(
      'nexa.devOverlay.config',
      JSON.stringify(persisted),
    )

    const { tracker } = createDevOverlay({
      position: 'bottom-right',
      theme: 'dark',
    })
    const cfg = tracker.getConfig()
    expect(cfg.position).toBe('top-left')
    expect(cfg.theme).toBe('light')
    expect(cfg.floatingButtonSize).toBe(36)

    // panel should reflect theme in DOM (only when running in a DOM-enabled env)
    if (typeof document !== 'undefined') {
      const panel = document.getElementById('nexa-dev-overlay')
      expect(panel).not.toBeNull()
      expect(panel?.classList.contains('nexa-theme-light')).toBe(true)
    }
  })

  it('falls back to defaults when no persisted config exists', () => {
    // ensure storage is empty
    globalThis.localStorage.clear()
    const { tracker } = createDevOverlay()
    const cfg = tracker.getConfig()
    expect(cfg.position).toBe(defaultDevOverlayConfig.position)
    expect(cfg.theme).toBe(defaultDevOverlayConfig.theme)
    expect(cfg.floatingButtonSize).toBe(
      defaultDevOverlayConfig.floatingButtonSize,
    )
  })

  it('persists updates to config via tracker.updateConfig', () => {
    const { tracker } = createDevOverlay()
    tracker.updateConfig({ position: 'top-right', theme: 'light' })
    const raw = globalThis.localStorage.getItem('nexa.devOverlay.config')
    expect(raw).not.toBeNull()
    const stored = JSON.parse(raw as string)
    expect(stored.position).toBe('top-right')
    expect(stored.theme).toBe('light')
  })

  it('reapplies persisted config on subsequent createDevOverlay calls (HMR)', () => {
    // initial create with defaults
    const first = createDevOverlay()
    expect(first.tracker.getConfig().position).toBe(
      defaultDevOverlayConfig.position,
    )

    // simulate persisted change from a previous session / HMR
    const persisted = {
      position: 'top-left',
      theme: 'light',
      floatingButtonSize: 36,
    }
    globalThis.localStorage.setItem(
      'nexa.devOverlay.config',
      JSON.stringify(persisted),
    )

    // calling createDevOverlay again should reapply persisted values to existing instance
    const second = createDevOverlay()
    const cfg = second.tracker.getConfig()
    expect(cfg.position).toBe('top-left')
    expect(cfg.theme).toBe('light')
    expect(cfg.floatingButtonSize).toBe(36)
    // ensure UI updated its theme class (only in DOM-enabled env)
    if (typeof document !== 'undefined') {
      const panel = document.getElementById('nexa-dev-overlay')
      expect(panel).not.toBeNull()
      expect(panel?.classList.contains('nexa-theme-light')).toBe(true)
    }
  })
})
