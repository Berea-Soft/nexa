import type { TrackedRequest, DevOverlayConfig } from './types'
import type { RequestTracker } from './tracker'

import { ICONS, STYLES } from './theme'
import { isDevelopmentEnv } from './env'
import {
  filterRequests,
  renderRequestListHtml,
  renderMetricsHtml,
  renderDetailHtml,
} from './render'
import type { FilterType } from './render'

export class DevOverlayUI {
  private panel: HTMLElement | null = null
  private floatingIcon: HTMLElement | null = null
  private tracker: RequestTracker
  private visible = false
  private selectedRequest: TrackedRequest | null = null
  private config: Required<DevOverlayConfig>
  private searchQuery = ''
  private filterType: FilterType = 'all'
  private removeTrackerListener: (() => void) | null = null
  private keyboardShortcutHandler: ((e: KeyboardEvent) => void) | null = null
  private globalKeyboardHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(tracker: RequestTracker) {
    this.tracker = tracker
    this.config = tracker.getConfig()
    if (!this.canUseDOM()) {
      return
    }
    this.setupKeyboardShortcut()
    this.createPanel()
  }

  show(): void {
    if (!this.panel) {
      return
    }
    this.panel.style.display = 'flex'
    this.panel.style.opacity = '0'
    this.panel.style.transform = 'scale(0.96) translateY(8px)'
    const animate =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (callback: FrameRequestCallback) => setTimeout(callback, 0)
    animate(() => {
      this.panel!.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      this.panel!.style.opacity = '1'
      this.panel!.style.transform = 'scale(1) translateY(0)'
    })
    this.visible = true
    // hide floating icon when panel is visible
    this.hideFloatingIcon()
  }

  hide(): void {
    if (!this.panel) {
      return
    }
    this.panel.style.transition = 'all 0.15s ease-out'
    this.panel.style.opacity = '0'
    this.panel.style.transform = 'scale(0.96) translateY(8px)'
    setTimeout(() => {
      if (this.panel) {
        this.panel.style.display = 'none'
      }
    }, 150)
    this.visible = false
    // show floating icon when panel is hidden (if enabled and dev-only policy allows)
    if (this.config.enabled && (!this.config.devOnly || isDevelopmentEnv())) {
      this.showFloatingIcon()
    }
  }

  toggle(): void {
    this.visible ? this.hide() : this.show()
  }

  destroy(): void {
    if (this.keyboardShortcutHandler) {
      document.removeEventListener('keydown', this.keyboardShortcutHandler)
      this.keyboardShortcutHandler = null
    }
    if (this.globalKeyboardHandler) {
      document.removeEventListener('keydown', this.globalKeyboardHandler)
      this.globalKeyboardHandler = null
    }
    this.removeTrackerListener?.()
    this.removeTrackerListener = null
    this.panel?.remove()
    this.panel = null
    this.visible = false
    this.selectedRequest = null
    if (this.floatingIcon) {
      this.floatingIcon.remove()
      this.floatingIcon = null
    }
  }

  private setupKeyboardShortcut(): void {
    const keys = this.config.keyboardShortcut.split('+')
    const requiredKeys = new Set(keys.map((k) => k.toLowerCase()))
    this.keyboardShortcutHandler = (e: KeyboardEvent) => {
      const pressed = new Set<string>()
      if (e.ctrlKey) {
        pressed.add('ctrl')
      }
      if (e.metaKey) {
        pressed.add('meta')
        pressed.add('cmd')
        pressed.add('ctrl')
      }
      if (e.shiftKey) {
        pressed.add('shift')
      }
      if (e.altKey) {
        pressed.add('alt')
      }
      if (e.key && e.key.length === 1) {
        pressed.add(e.key.toLowerCase())
      } else if (e.key.length > 1) {
        pressed.add(e.key.toLowerCase())
      }
      let match = true
      for (const k of requiredKeys) {
        if (!pressed.has(k)) {
          match = false
          break
        }
      }
      if (match && pressed.size === requiredKeys.size) {
        e.preventDefault()
        this.toggle()
      }
    }
    document.addEventListener('keydown', this.keyboardShortcutHandler)
  }

  private createPanel(): void {
    if (!this.canUseDOM()) {
      return
    }
    // Prevent duplicate overlays from being mounted (HMR, multiple inits)
    try {
      const existing = document.getElementById('nexa-dev-overlay')
      if (existing) {
        existing.remove()
      }
    } catch {
      // ignore
    }
    this.panel = document.createElement('div')
    this.panel.id = 'nexa-dev-overlay'

    const pos = this.config.position
    const isBottom = pos.includes('bottom')
    const isRight = pos.includes('right')
    const offsetPx = `${this.config.floatingButtonOffset ?? 24}px`

    const branding = this.config.branding || 'Nexa DevTools'
    const icon =
      this.config.icon ||
      'https://raw.githubusercontent.com/Berea-Soft/nexa/refs/heads/main/src/assets/faviconNew.png'

    this.panel.style.cssText = `
      position: fixed;
      ${isBottom ? `bottom: ${offsetPx};` : `top: ${offsetPx};`}
      ${isRight ? `right: ${offsetPx};` : `left: ${offsetPx};`}
      width: 420px;
      max-height: 70vh;
      z-index: 2147483649;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `
    this.panel.innerHTML = `<style>${STYLES}</style>

      <div class="nexa-header">
        <div class="nexa-header-left">
          <div class="nexa-logo">
            <img src="${icon}" alt="${branding}" style="width:100%;height:auto;object-fit:cover;border-radius:8px;display:block;" />
          </div>
          <span class="nexa-title">${branding}</span>
        </div>
        <div class="nexa-header-actions">
          <button class="nexa-icon-btn nexa-btn-export" title="Export history (JSON)">${ICONS.download}</button>
          <button class="nexa-icon-btn nexa-btn-settings" title="Settings">${ICONS.gear}</button>
          <button class="nexa-icon-btn nexa-btn-clear" title="Clear history">${ICONS.clear}</button>
          <button class="nexa-icon-btn nexa-btn-close" title="Close (Esc)">${ICONS.close}</button>
        </div>
      </div>

      <div class="nexa-notification"></div>

      <div class="nexa-settings-panel" style="display:none">
        <div class="nexa-settings-row">
          <label for="nexa-pos">Position</label>
          <select id="nexa-pos" data-setting="position">
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>
        <div class="nexa-settings-row">
          <label for="nexa-theme">Theme</label>
          <select id="nexa-theme" data-setting="theme">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="nexa-btn nexa-btn-save">Save</button>
          <button class="nexa-btn nexa-btn-cancel">Cancel</button>
        </div>
      </div>

      <div class="nexa-metrics-bar">
        <div class="nexa-metric"><span class="nexa-metric-value" data-metric="total">0</span><span class="nexa-metric-label">Requests</span></div>
        <div class="nexa-metric"><span class="nexa-metric-value" data-metric="avg">0ms</span><span class="nexa-metric-label">Avg</span></div>
        <div class="nexa-metric"><span class="nexa-metric-value" data-metric="rate">0/s</span><span class="nexa-metric-label">Throughput</span></div>
        <div class="nexa-metric nexa-metric-ok"><span class="nexa-metric-value" data-metric="success">0</span><span class="nexa-metric-label">Success</span></div>
        <div class="nexa-metric nexa-metric-err"><span class="nexa-metric-value" data-metric="fail">0</span><span class="nexa-metric-label">Failed</span></div>
      </div>

      <div class="nexa-search">
        <span class="nexa-search-icon">${ICONS.search}</span>
        <input type="text" class="nexa-search-input" placeholder="Filter by URL, method, or status..." />
      </div>

      <div class="nexa-filters">
        <div class="nexa-filter-chip nexa-filter-chip-active" data-filter="all">All</div>
        <div class="nexa-filter-chip" data-filter="err">Errors</div>
        <div class="nexa-filter-chip" data-filter="xhr">JSON</div>
        <div class="nexa-filter-chip" data-filter="slow">Slow</div>
      </div>

      <div class="nexa-tabs">
        <button class="nexa-tab nexa-tab-active" data-tab="requests"><span>Requests</span><span class="nexa-tab-count" data-count="requests">0</span></button>
        <button class="nexa-tab" data-tab="metrics"><span>Metrics</span></button>
      </div>

      <div class="nexa-body">
        <div class="nexa-panel nexa-panel-active" data-panel="requests"><div class="nexa-request-list"></div></div>
        <div class="nexa-panel" data-panel="metrics"><div class="nexa-metrics-content"></div></div>
      </div>

      <div class="nexa-detail" style="display:none">
        <div class="nexa-detail-header">
          <button class="nexa-btn nexa-btn-back">${ICONS.back} Back</button>
          <div class="nexa-btn-group">
            <button class="nexa-btn nexa-btn-copy">${ICONS.copy} Copy as fetch</button>
            <button class="nexa-btn nexa-btn-retry">${ICONS.retry} Retry</button>
          </div>
        </div>
        <div class="nexa-detail-body"></div>
      </div>
    `

    document.body.appendChild(this.panel)
    // Apply theme class immediately so initial render reflects persisted theme
    if (this.config.theme === 'light') {
      this.panel.classList.add('nexa-theme-light')
    } else {
      this.panel.classList.remove('nexa-theme-light')
    }
    this.bindEvents()
    this.removeTrackerListener = this.tracker.onChange(() => this.render())
    const canShowFloating = !this.config.devOnly || isDevelopmentEnv()
    if (this.config.enabled && canShowFloating) {
      this.createFloatingIcon()
    }
    this.updateHeaderActionsVisibility()
    this.hide()

    this.globalKeyboardHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.visible) {
        this.hide()
        return
      }
      if (
        this.visible &&
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === 'f'
      ) {
        e.preventDefault()
        const searchInput = this.panel?.querySelector(
          '.nexa-search-input',
        ) as HTMLInputElement | null
        searchInput?.focus()
        searchInput?.select()
      }
    }
    document.addEventListener('keydown', this.globalKeyboardHandler)
  }

  private bindEvents(): void {
    if (!this.panel) {
      return
    }
    this.panel
      .querySelector('.nexa-btn-close')
      ?.addEventListener('click', () => this.hide())
    this.panel
      .querySelector('.nexa-btn-export')
      ?.addEventListener('click', () => this.exportHistory())
    this.panel
      .querySelector('.nexa-btn-copy')
      ?.addEventListener('click', () => this.copyAsFetch())
    this.panel
      .querySelector('.nexa-btn-clear')
      ?.addEventListener('click', () => {
        this.tracker.clear()
        this.render()
      })
    this.panel
      .querySelector('.nexa-btn-back')
      ?.addEventListener('click', () => this.showMainView())
    this.panel
      .querySelector('.nexa-btn-retry')
      ?.addEventListener('click', () => this.retrySelected())

    const searchInput = this.panel.querySelector(
      '.nexa-search-input',
    ) as HTMLInputElement
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase()
      this.renderRequestList()
    })

    this.panel.querySelectorAll('.nexa-filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.panel!.querySelectorAll('.nexa-filter-chip').forEach((c) =>
          c.classList.remove('nexa-filter-chip-active'),
        )
        ;(chip as HTMLElement).classList.add('nexa-filter-chip-active')
        this.filterType = (chip as HTMLElement).dataset.filter as FilterType
        this.renderRequestList()
      })
    })

    this.panel.querySelectorAll('.nexa-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.panel!.querySelectorAll('.nexa-tab').forEach((t) =>
          t.classList.remove('nexa-tab-active'),
        )
        this.panel!.querySelectorAll('.nexa-panel').forEach((p) =>
          p.classList.remove('nexa-panel-active'),
        )
        ;(tab as HTMLElement).classList.add('nexa-tab-active')
        const panel = this.panel!.querySelector(
          `[data-panel="${(tab as HTMLElement).dataset.tab}"]`,
        )
        panel?.classList.add('nexa-panel-active')
        if ((tab as HTMLElement).dataset.tab === 'metrics') {
          this.renderMetrics()
        }
      })
    })

    // Settings button
    this.panel
      .querySelector('.nexa-btn-settings')
      ?.addEventListener('click', () => {
        const sp = this.panel!.querySelector(
          '.nexa-settings-panel',
        ) as HTMLElement | null
        if (!sp) {
          return
        }
        // toggle as modal (use flex so layout inside works)
        const posSel = this.panel!.querySelector(
          '[data-setting="position"]',
        ) as HTMLSelectElement | null
        const themeSel = this.panel!.querySelector(
          '[data-setting="theme"]',
        ) as HTMLSelectElement | null
        const isOpen = sp.style.display === 'flex'
        sp.style.display = isOpen ? 'none' : 'flex'
        if (!isOpen) {
          // opening: hide the floating button so modal is not obstructed
          this.hideFloatingIcon()
          if (posSel) {
            posSel.value = this.config.position
          }
          if (themeSel) {
            themeSel.value = this.config.theme
          }
          posSel?.focus()
        }
      })

    this.panel
      .querySelector('.nexa-btn-save')
      ?.addEventListener('click', () => {
        const posSel = this.panel!.querySelector(
          '[data-setting="position"]',
        ) as HTMLSelectElement | null
        const themeSel = this.panel!.querySelector(
          '[data-setting="theme"]',
        ) as HTMLSelectElement | null
        const newPos = posSel?.value as DevOverlayConfig['position'] | undefined
        const newTheme = themeSel?.value as
          | DevOverlayConfig['theme']
          | undefined
        const partial: Partial<DevOverlayConfig> = {}
        if (newPos !== undefined) {
          partial.position = newPos
        }
        if (newTheme !== undefined) {
          partial.theme = newTheme
        }
        const newConfig = this.tracker.updateConfig(partial)
        this.applyConfigToUI(newConfig)
        const sp = this.panel!.querySelector(
          '.nexa-settings-panel',
        ) as HTMLElement | null
        if (sp) {
          sp.style.display = 'none'
        }
      })

    this.panel
      .querySelector('.nexa-btn-cancel')
      ?.addEventListener('click', () => {
        const sp = this.panel!.querySelector(
          '.nexa-settings-panel',
        ) as HTMLElement | null
        if (sp) {
          sp.style.display = 'none'
        }
      })
  }

  private render(): void {
    if (!this.panel || !this.visible) {
      return
    }
    this.renderMetricsBar()
    this.renderRequestList()
  }

  private renderMetricsBar(): void {
    const m = this.tracker.getMetrics()
    const el = this.panel
    if (!el) {
      return
    }
    el.querySelector('[data-metric="total"]')!.textContent = String(
      m.totalRequests,
    )
    el.querySelector('[data-metric="avg"]')!.textContent =
      `${m.avgDuration.toFixed(0)}ms`
    el.querySelector('[data-metric="rate"]')!.textContent =
      `${m.requestsPerSecond.toFixed(1)}`
    el.querySelector('[data-metric="success"]')!.textContent = String(
      m.successfulRequests,
    )
    el.querySelector('[data-metric="fail"]')!.textContent = String(
      m.failedRequests,
    )
    el.querySelector('[data-count="requests"]')!.textContent = String(
      m.totalRequests,
    )
    this.updateHeaderActionsVisibility()
  }

  private updateHeaderActionsVisibility(): void {
    const history = this.tracker.getHistory()
    const hasData = history.length > 0
    const exportBtn = this.panel?.querySelector(
      '.nexa-btn-export',
    ) as HTMLElement
    const clearBtn = this.panel?.querySelector('.nexa-btn-clear') as HTMLElement

    if (exportBtn) {
      exportBtn.style.display = hasData ? 'flex' : 'none'
    }
    if (clearBtn) {
      clearBtn.style.display = hasData ? 'flex' : 'none'
    }
  }

  private renderRequestList(): void {
    const list = this.panel?.querySelector('.nexa-request-list')
    if (!list) {
      return
    }

    const requests = filterRequests(
      this.tracker.getHistory(),
      this.filterType,
      this.searchQuery,
    )

    list.innerHTML = renderRequestListHtml(requests, this.searchQuery)

    list.querySelectorAll('.nexa-request-item').forEach((item) => {
      item.addEventListener('click', () => {
        const id = (item as HTMLElement).dataset.id
        const request = requests.find((r) => r.id === id)
        if (request) {
          this.showDetail(request)
        }
      })
    })
  }

  private renderMetrics(): void {
    const el = this.panel?.querySelector('.nexa-metrics-content')
    if (!el) {
      return
    }
    el.innerHTML = renderMetricsHtml(this.tracker.getMetrics())
  }

  private showDetail(request: TrackedRequest): void {
    this.selectedRequest = request
    if (!this.panel) {
      return
    }
    const body = this.panel.querySelector('.nexa-body') as HTMLElement | null
    const detail = this.panel.querySelector(
      '.nexa-detail',
    ) as HTMLElement | null
    const content = this.panel.querySelector('.nexa-detail-body')
    if (!body || !detail || !content) {
      return
    }

    this.panel.classList.add('nexa-view-detail')
    body.style.display = 'none'
    detail.style.display = 'flex'

    content.innerHTML = renderDetailHtml(request)
  }

  private showMainView(): void {
    if (this.panel) {
      this.panel.classList.remove('nexa-view-detail')
    }
    const body = this.panel?.querySelector('.nexa-body') as HTMLElement | null
    const detail = this.panel?.querySelector(
      '.nexa-detail',
    ) as HTMLElement | null
    if (body) {
      body.style.display = 'flex'
    }
    if (detail) {
      detail.style.display = 'none'
    }
    this.selectedRequest = null
  }

  private retrySelected(): void {
    if (!this.selectedRequest) {
      return
    }
    const { method, url, body, headers } = this.selectedRequest
    const startTime = performance.now()
    fetch(url, {
      method,
      headers: headers as Record<string, string>,
      body: body ? JSON.stringify(body) : undefined,
    })
      .then((res) => {
        const tracked = this.tracker.track({
          method,
          url,
          status: res.status,
          duration: performance.now() - startTime,
          cached: false,
          ok: res.ok,
          headers,
          body,
          retryCount: 0,
        })
        this.showDetail(tracked)
      })
      .catch(() => {
        const tracked = this.tracker.track({
          method,
          url,
          duration: performance.now() - startTime,
          cached: false,
          ok: false,
          code: 'NETWORK_ERROR',
          headers,
          body,
          retryCount: 0,
        })
        this.showDetail(tracked)
      })
  }

  private exportHistory(): void {
    const history = this.tracker.getHistory()
    const data = JSON.stringify(history, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexa-history-${new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    this.showNotification('History exported as JSON')
  }

  private copyAsFetch(): void {
    if (!this.selectedRequest) {
      return
    }
    const r = this.selectedRequest
    const headers = { ...r.headers }
    delete headers['host'] // often not needed/allowed in manual fetch

    let code = `fetch("${r.url}", {\n`
    code += `  "method": "${r.method}",\n`
    if (Object.keys(headers).length > 0) {
      code += `  "headers": ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},\n`
    }
    if (r.body) {
      code += `  "body": ${JSON.stringify(r.body, null, 4).replace(/\n/g, '\n  ')},\n`
    }
    code += `});`

    navigator.clipboard
      .writeText(code)
      .then(() => {
        this.showNotification('Copied as fetch to clipboard')
      })
      .catch(() => {
        this.showNotification('Failed to copy to clipboard')
      })
  }

  private showNotification(message: string): void {
    const el = this.panel?.querySelector('.nexa-notification') as HTMLElement
    if (!el) {
      return
    }
    el.textContent = message
    el.classList.add('nexa-notification-show')
    setTimeout(() => {
      el.classList.remove('nexa-notification-show')
    }, 2500)
  }

  private canUseDOM(): boolean {
    return (
      typeof document !== 'undefined' &&
      typeof document.createElement === 'function' &&
      !!document.body
    )
  }

  // Floating icon helpers
  private createFloatingIcon(): void {
    if (!this.canUseDOM()) {
      return
    }

    // Remove any existing floating element to avoid duplicates (HMR or multiple inits)
    try {
      const existingBtn = document.getElementById(
        'nexa-dev-overlay-floating',
      ) as HTMLElement | null
      if (existingBtn) {
        existingBtn.remove()
      }
    } catch {
      // ignore
    }
    if (this.floatingIcon) {
      this.floatingIcon.remove()
      this.floatingIcon = null
    }

    const btn = document.createElement('button')
    btn.id = 'nexa-dev-overlay-floating'
    btn.title = 'Toggle Nexa DevTools'

    const size = this.config.floatingButtonSize ?? 48
    const offset = this.config.floatingButtonOffset ?? 24
    const pos = this.config.position || 'bottom-right'
    const isBottom = pos.includes('bottom')
    const isRight = pos.includes('right')
    const posStyles = `${isBottom ? `bottom: ${offset}px;` : `top: ${offset}px;`} ${isRight ? `right: ${offset}px;` : `left: ${offset}px;`}`

    const floatingTheme =
      this.config.floatingButtonTheme === 'inherit'
        ? this.config.theme
        : this.config.floatingButtonTheme

    let bg = 'linear-gradient(135deg,#0ea5e9,#8b5cf6)'
    let color = '#ffffff'
    let boxShadow = '0 16px 36px rgba(2,6,23,0.34)'
    let border = 'none'

    if (floatingTheme === 'light') {
      bg = 'linear-gradient(135deg,#f8fbff,#e0f2fe)'
      color = '#0f172a'
      boxShadow = '0 14px 30px rgba(15,23,42,0.16)'
      border = '1px solid #d8e4f2'
    }

    const branding = this.config.branding || 'Nexa DevTools'
    const icon =
      this.config.icon ||
      'https://raw.githubusercontent.com/Berea-Soft/nexa/refs/heads/main/src/assets/faviconNew.png'

    btn.style.cssText = `
      position: fixed;
      ${posStyles}
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${border};
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483648;
      cursor: pointer;
      box-shadow: ${boxShadow};
      background: ${bg};
      color: ${color};
      font-weight: 700;
      font-size: ${Math.max(12, Math.floor(size / 3))}px;
    `

    btn.innerHTML = `<img src="${icon}" alt="${branding}" style="width:${size - 10}px;height:auto;object-fit:cover;border-radius:999px;display:block;" />`

    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggle()
    })

    btn.addEventListener('mousedown', (ev) => ev.preventDefault())

    document.body.appendChild(btn)
    // If the panel is currently visible, keep the floating button hidden
    btn.style.display = this.visible ? 'none' : 'flex'
    this.floatingIcon = btn
  }

  private showFloatingIcon(): void {
    if (!this.floatingIcon) {
      if (this.config.enabled) {
        this.createFloatingIcon()
      }
      return
    }
    this.floatingIcon.style.display = 'flex'
  }

  private hideFloatingIcon(): void {
    if (!this.floatingIcon) {
      return
    }
    this.floatingIcon.style.display = 'none'
  }

  private applyConfigToUI(newConfig?: Required<DevOverlayConfig>): void {
    this.config = newConfig ?? this.tracker.getConfig()
    const pos = this.config.position
    const isBottom = pos.includes('bottom')
    const isRight = pos.includes('right')
    const offsetPx = `${this.config.floatingButtonOffset ?? 24}px`

    if (this.panel) {
      this.panel.style.bottom = isBottom ? offsetPx : ''
      this.panel.style.top = isBottom ? '' : offsetPx
      this.panel.style.right = isRight ? offsetPx : ''
      this.panel.style.left = isRight ? '' : offsetPx
      if (this.config.theme === 'light') {
        this.panel.classList.add('nexa-theme-light')
      } else {
        this.panel.classList.remove('nexa-theme-light')
      }

      // Update branding and icon if changed
      const logoImg = this.panel.querySelector(
        '.nexa-logo img',
      ) as HTMLImageElement
      const titleSpan = this.panel.querySelector('.nexa-title') as HTMLElement
      const branding = this.config.branding || 'Nexa DevTools'
      const icon =
        this.config.icon ||
        'https://raw.githubusercontent.com/Berea-Soft/nexa/refs/heads/main/src/assets/faviconNew.png'

      if (logoImg) {
        logoImg.src = icon
        logoImg.alt = branding
      }
      if (titleSpan) {
        titleSpan.textContent = branding
      }
    }

    // Recreate floating icon to apply new size/position/theme
    if (this.floatingIcon) {
      this.floatingIcon.remove()
      this.floatingIcon = null
    }
    if (this.config.enabled && (!this.config.devOnly || isDevelopmentEnv())) {
      this.createFloatingIcon()
    }
  }

  // Public helper to allow external callers (e.g. HMR or createDevOverlay)
  // to request the UI to refresh according to the tracker config.
  public refreshConfig(newConfig?: Required<DevOverlayConfig>): void {
    this.applyConfigToUI(newConfig)
  }
}
