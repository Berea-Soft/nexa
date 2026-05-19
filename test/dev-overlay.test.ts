import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { RequestTracker } from '../src/dev-overlay/tracker.js'
import {
  createDevOverlay,
  destroyDevOverlay,
  getDevOverlay,
} from '../src/dev-overlay/index.js'
import { DevOverlayUI } from '../src/dev-overlay/overlay.js'

type Listener = (event: any) => void

class MockElement {
  id = ''
  style: Record<string, string> & { cssText?: string } = {}
  dataset: Record<string, string> = {}
  innerHTML = ''
  textContent = ''
  classList = {
    add: vi.fn(),
    remove: vi.fn(),
  }
  private listeners = new Map<string, Listener[]>()
  private singletons = new Map<string, MockElement>()
  private collections = new Map<string, MockElement[]>()

  addEventListener(type: string, listener: Listener) {
    const entries = this.listeners.get(type) ?? []
    entries.push(listener)
    this.listeners.set(type, entries)
  }

  removeEventListener(type: string, listener: Listener) {
    const entries = this.listeners.get(type) ?? []
    this.listeners.set(
      type,
      entries.filter((entry) => entry !== listener),
    )
  }

  dispatchEvent(type: string, event: any = {}) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event)
    }
  }

  querySelector(selector: string) {
    return this.singletons.get(selector) ?? null
  }

  querySelectorAll(selector: string) {
    return this.collections.get(selector) ?? []
  }

  registerSelector(selector: string, element: MockElement) {
    this.singletons.set(selector, element)
  }

  registerCollection(selector: string, elements: MockElement[]) {
    this.collections.set(selector, elements)
  }

  appendChild() {}

  remove() {}

  focus() {}

  select() {}
}

function createPanelElement() {
  const panel = new MockElement()
  const closeButton = new MockElement()
  const clearButton = new MockElement()
  const backButton = new MockElement()
  const retryButton = new MockElement()
  const searchInput = new MockElement()
  const requestList = new MockElement()
  const metricsContent = new MockElement()
  const body = new MockElement()
  const detail = new MockElement()
  const detailBody = new MockElement()
  const totalMetric = new MockElement()
  const avgMetric = new MockElement()
  const rateMetric = new MockElement()
  const successMetric = new MockElement()
  const failMetric = new MockElement()
  const requestCount = new MockElement()
  const requestsTab = new MockElement()
  const metricsTab = new MockElement()
  const requestsPanel = new MockElement()
  const metricsPanel = new MockElement()
  const exportButton = new MockElement()
  const copyButton = new MockElement()
  const settingsButton = new MockElement()
  const saveButton = new MockElement()
  const cancelButton = new MockElement()
  const filterChips = [
    new MockElement(),
    new MockElement(),
    new MockElement(),
    new MockElement(),
  ]

  requestsTab.dataset.tab = 'requests'
  metricsTab.dataset.tab = 'metrics'

  panel.registerSelector('.nexa-btn-close', closeButton)
  panel.registerSelector('.nexa-btn-clear', clearButton)
  panel.registerSelector('.nexa-btn-back', backButton)
  panel.registerSelector('.nexa-btn-retry', retryButton)
  panel.registerSelector('.nexa-btn-export', exportButton)
  panel.registerSelector('.nexa-btn-copy', copyButton)
  panel.registerSelector('.nexa-btn-settings', settingsButton)
  panel.registerSelector('.nexa-btn-save', saveButton)
  panel.registerSelector('.nexa-btn-cancel', cancelButton)
  panel.registerSelector('.nexa-search-input', searchInput)
  panel.registerSelector('.nexa-request-list', requestList)
  panel.registerSelector('.nexa-metrics-content', metricsContent)
  panel.registerSelector('.nexa-body', body)
  panel.registerSelector('.nexa-detail', detail)
  panel.registerSelector('.nexa-detail-body', detailBody)
  panel.registerSelector('[data-metric="total"]', totalMetric)
  panel.registerSelector('[data-metric="avg"]', avgMetric)
  panel.registerSelector('[data-metric="rate"]', rateMetric)
  panel.registerSelector('[data-metric="success"]', successMetric)
  panel.registerSelector('[data-metric="fail"]', failMetric)
  panel.registerSelector('[data-count="requests"]', requestCount)
  panel.registerSelector('[data-panel="requests"]', requestsPanel)
  panel.registerSelector('[data-panel="metrics"]', metricsPanel)
  panel.registerSelector('.nexa-notification', new MockElement())
  panel.registerCollection('.nexa-tab', [requestsTab, metricsTab])
  panel.registerCollection('.nexa-panel', [requestsPanel, metricsPanel])
  panel.registerCollection('.nexa-filter-chip', filterChips)

  return panel
}

function createMockDocument() {
  const listeners = new Map<string, Listener[]>()
  const body = new MockElement()

  return {
    body,
    listeners,
    createElement: vi.fn(() => createPanelElement()),
    addEventListener(type: string, listener: Listener) {
      const entries = listeners.get(type) ?? []
      entries.push(listener)
      listeners.set(type, entries)
    },
    removeEventListener(type: string, listener: Listener) {
      const entries = listeners.get(type) ?? []
      listeners.set(
        type,
        entries.filter((entry) => entry !== listener),
      )
    },
  }
}

describe('RequestTracker', () => {
  it('should track requests and compute metrics', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-17T10:00:00Z'))

    const tracker = new RequestTracker()

    tracker.track({
      method: 'GET',
      url: 'https://api.example.com/users',
      status: 200,
      duration: 100,
      cached: false,
      ok: true,
      headers: {},
      retryCount: 0,
    })

    vi.setSystemTime(new Date('2026-05-17T10:00:02Z'))

    tracker.track({
      method: 'POST',
      url: 'https://api.example.com/users',
      status: 500,
      duration: 300,
      cached: true,
      ok: false,
      headers: {},
      retryCount: 2,
    })

    const metrics = tracker.getMetrics()

    expect(metrics.totalRequests).toBe(2)
    expect(metrics.successfulRequests).toBe(1)
    expect(metrics.failedRequests).toBe(1)
    expect(metrics.cachedRequests).toBe(1)
    expect(metrics.avgDuration).toBe(200)
    expect(metrics.minDuration).toBe(100)
    expect(metrics.maxDuration).toBe(300)
    expect(metrics.requestsPerSecond).toBe(1)
    expect(metrics.slowestRequests[0]?.duration).toBe(300)

    vi.useRealTimers()
  })

  it('should reset history and metrics on clear', () => {
    const tracker = new RequestTracker()

    tracker.track({
      method: 'GET',
      url: 'https://api.example.com/users',
      status: 200,
      duration: 100,
      cached: false,
      ok: true,
      headers: {},
      retryCount: 0,
    })

    tracker.clear()

    expect(tracker.getHistory()).toEqual([])
    expect(tracker.getMetrics().totalRequests).toBe(0)
  })
})

describe('Dev Overlay lifecycle', () => {
  const originalDocument = globalThis.document
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame

  beforeEach(() => {
    destroyDevOverlay()
  })

  afterEach(() => {
    destroyDevOverlay()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    if (originalDocument === undefined) {
      delete (globalThis as { document?: Document }).document
    } else {
      globalThis.document = originalDocument
    }
    if (originalRequestAnimationFrame === undefined) {
      delete (
        globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }
      ).requestAnimationFrame
    } else {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
    }
  })

  it('should create a singleton overlay instance and reset it on destroy', () => {
    const mockDocument = createMockDocument()
    vi.stubGlobal('document', mockDocument)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 0
    })

    const first = createDevOverlay()
    const second = createDevOverlay()

    expect(first.tracker).toBe(second.tracker)
    expect(first.ui).toBe(second.ui)
    expect(getDevOverlay().ui).toBe(first.ui)

    destroyDevOverlay()

    expect(getDevOverlay()).toEqual({ tracker: null, ui: null })
  })

  it('should remove global keydown listeners on destroy', () => {
    const mockDocument = createMockDocument()
    vi.stubGlobal('document', mockDocument)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 0
    })

    const tracker = new RequestTracker()
    const ui = new DevOverlayUI(tracker)

    expect(mockDocument.listeners.get('keydown')).toHaveLength(2)

    ui.destroy()

    expect(mockDocument.listeners.get('keydown')).toEqual([])
  })

  it('should not fail when created without DOM globals', () => {
    delete (globalThis as { document?: Document }).document

    const overlay = createDevOverlay()

    expect(overlay.tracker).toBeInstanceOf(RequestTracker)
    expect(overlay.ui).toBeInstanceOf(DevOverlayUI)
  })
})
