import type { TrackedRequest, DevOverlayConfig } from './types'
import type { RequestTracker } from './tracker'

const ICONS = {
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  chevron: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`,
  back: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
  retry: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>`,
  clear: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
  clock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  zap: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
}

const COLORS = {
  bg: '#09090b',
  bgElevated: '#18181b',
  border: '#27272a',
  borderFocus: '#3f3f46',
  text: '#fafafa',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  accent: '#3b82f6',
  accentHover: '#2563eb',
  success: '#22c55e',
  successBg: 'rgba(34, 197, 94, 0.1)',
  error: '#ef4444',
  errorBg: 'rgba(239, 68, 68, 0.1)',
  warning: '#f59e0b',
  get: '#22c55e',
  post: '#3b82f6',
  put: '#f59e0b',
  patch: '#a855f7',
  delete: '#ef4444',
}

const STYLES = `
  #nexa-dev-overlay * { margin: 0; padding: 0; box-sizing: border-box; }
  #nexa-dev-overlay {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${COLORS.bg};
    color: ${COLORS.text};
    border: 1px solid ${COLORS.border};
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.03);
    overflow: hidden;
  }
  #nexa-dev-overlay .nexa-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid ${COLORS.border};
    background: ${COLORS.bgElevated};
  }
  #nexa-dev-overlay .nexa-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  #nexa-dev-overlay .nexa-logo {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${COLORS.bgElevated};
    border-radius: 8px;
    overflow: hidden;
  }
  #nexa-dev-overlay .nexa-title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  #nexa-dev-overlay .nexa-header-actions {
    display: flex;
    gap: 4px;
  }
  #nexa-dev-overlay .nexa-icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: ${COLORS.textMuted};
    cursor: pointer;
    transition: all 0.15s;
  }
  #nexa-dev-overlay .nexa-icon-btn:hover {
    background: ${COLORS.border};
    color: ${COLORS.text};
  }
  #nexa-dev-overlay .nexa-metrics-bar {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    background: ${COLORS.bg};
    border-bottom: 1px solid ${COLORS.border};
  }
  #nexa-dev-overlay .nexa-metric {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 12px;
    background: ${COLORS.bgElevated};
    border-radius: 10px;
    transition: all 0.2s;
  }
  #nexa-dev-overlay .nexa-metric:hover {
    background: ${COLORS.border};
  }
  #nexa-dev-overlay .nexa-metric-value {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: ${COLORS.text};
  }
  #nexa-dev-overlay .nexa-metric-ok .nexa-metric-value { color: ${COLORS.success}; }
  #nexa-dev-overlay .nexa-metric-err .nexa-metric-value { color: ${COLORS.error}; }
  #nexa-dev-overlay .nexa-metric-label {
    font-size: 11px;
    color: ${COLORS.textDim};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  #nexa-dev-overlay .nexa-search {
    padding: 12px 16px;
    border-bottom: 1px solid ${COLORS.border};
    position: relative;
  }
  #nexa-dev-overlay .nexa-search-icon {
    position: absolute;
    left: 28px;
    top: 50%;
    transform: translateY(-50%);
    color: ${COLORS.textDim};
  }
  #nexa-dev-overlay .nexa-search-input {
    width: 100%;
    padding: 10px 12px 10px 38px;
    background: ${COLORS.bg};
    border: 1px solid ${COLORS.border};
    border-radius: 10px;
    color: ${COLORS.text};
    font-size: 13px;
    outline: none;
    transition: all 0.15s;
  }
  #nexa-dev-overlay .nexa-search-input:focus {
    border-color: ${COLORS.accent};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
  #nexa-dev-overlay .nexa-search-input::placeholder { color: ${COLORS.textDim}; }
  #nexa-dev-overlay .nexa-tabs {
    display: flex;
    gap: 4px;
    padding: 8px 16px;
    border-bottom: 1px solid ${COLORS.border};
  }
  #nexa-dev-overlay .nexa-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: ${COLORS.textMuted};
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  #nexa-dev-overlay .nexa-tab:hover { color: ${COLORS.text}; background: ${COLORS.bgElevated}; }
  #nexa-dev-overlay .nexa-tab-active { color: ${COLORS.text}; background: ${COLORS.accent} !important; }
  #nexa-dev-overlay .nexa-tab-count {
    font-size: 11px;
    padding: 2px 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
  }
  #nexa-dev-overlay .nexa-body { flex: 1; overflow: hidden; display: flex; }
  #nexa-dev-overlay .nexa-panel { display: none; width: 100%; overflow-y: auto; }
  #nexa-dev-overlay .nexa-panel-active { display: block; }
  #nexa-dev-overlay .nexa-request-list {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  #nexa-dev-overlay .nexa-request-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: ${COLORS.bgElevated};
    border: 1px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s;
    animation: nexaFadeIn 0.2s ease forwards;
    opacity: 0;
  }
  @keyframes nexaFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  #nexa-dev-overlay .nexa-request-item:hover {
    background: ${COLORS.border};
    border-color: ${COLORS.borderFocus};
    transform: translateX(2px);
  }
  #nexa-dev-overlay .nexa-req-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  #nexa-dev-overlay .nexa-method {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  #nexa-dev-overlay .nexa-method-get { background: ${COLORS.successBg}; color: ${COLORS.get}; }
  #nexa-dev-overlay .nexa-method-post { background: rgba(59, 130, 246, 0.15); color: ${COLORS.post}; }
  #nexa-dev-overlay .nexa-method-put { background: rgba(245, 158, 11, 0.15); color: ${COLORS.put}; }
  #nexa-dev-overlay .nexa-method-patch { background: rgba(168, 85, 247, 0.15); color: ${COLORS.patch}; }
  #nexa-dev-overlay .nexa-method-delete { background: ${COLORS.errorBg}; color: ${COLORS.delete}; }
  #nexa-dev-overlay .nexa-status {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    min-width: 36px;
    text-align: center;
  }
  #nexa-dev-overlay .nexa-ok { background: ${COLORS.successBg}; color: ${COLORS.success}; }
  #nexa-dev-overlay .nexa-err { background: ${COLORS.errorBg}; color: ${COLORS.error}; }
  #nexa-dev-overlay .nexa-url {
    font-size: 13px;
    color: ${COLORS.textMuted};
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  #nexa-dev-overlay .nexa-req-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  #nexa-dev-overlay .nexa-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 6px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  #nexa-dev-overlay .nexa-badge-cache { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
  #nexa-dev-overlay .nexa-badge-retry { background: rgba(245, 158, 11, 0.15); color: ${COLORS.warning}; }
  #nexa-dev-overlay .nexa-duration {
    font-size: 12px;
    font-weight: 600;
    color: ${COLORS.textDim};
    font-variant-numeric: tabular-nums;
  }
  #nexa-dev-overlay .nexa-slow { color: ${COLORS.warning}; }
  #nexa-dev-overlay .nexa-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    color: ${COLORS.textDim};
  }
  #nexa-dev-overlay .nexa-empty svg { margin-bottom: 16px; opacity: 0.4; }
  #nexa-dev-overlay .nexa-empty p { font-size: 14px; color: ${COLORS.textMuted}; margin-bottom: 4px; }
  #nexa-dev-overlay .nexa-empty span { font-size: 12px; color: ${COLORS.textDim}; }
  #nexa-dev-overlay .nexa-detail {
    flex-direction: column;
    padding: 16px;
    display: none;
    overflow-y: auto;
    max-height: 100%;
  }
  #nexa-dev-overlay .nexa-detail-active { display: flex; }
  #nexa-dev-overlay .nexa-detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  #nexa-dev-overlay .nexa-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: ${COLORS.bgElevated};
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    color: ${COLORS.textMuted};
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  #nexa-dev-overlay .nexa-btn:hover { background: ${COLORS.border}; color: ${COLORS.text}; }
  #nexa-dev-overlay .nexa-btn-retry { background: ${COLORS.successBg}; border-color: transparent; color: ${COLORS.success}; }
  #nexa-dev-overlay .nexa-btn-retry:hover { background: ${COLORS.success}; color: white; }
  #nexa-dev-overlay .nexa-card {
    background: ${COLORS.bgElevated};
    border: 1px solid ${COLORS.border};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
  }
  #nexa-dev-overlay .nexa-card h3 {
    font-size: 12px;
    font-weight: 600;
    color: ${COLORS.textDim};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  #nexa-dev-overlay .nexa-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
    border-bottom: 1px solid ${COLORS.border};
  }
  #nexa-dev-overlay .nexa-row:last-child { border-bottom: none; }
  #nexa-dev-overlay .nexa-row span { color: ${COLORS.textMuted}; }
  #nexa-dev-overlay .nexa-row strong { color: ${COLORS.text}; font-weight: 500; font-variant-numeric: tabular-nums; }
  #nexa-dev-overlay .nexa-row .nexa-ok { color: ${COLORS.success}; }
  #nexa-dev-overlay .nexa-row .nexa-err { color: ${COLORS.error}; }
  #nexa-dev-overlay .nexa-code {
    background: ${COLORS.bg};
    border-radius: 8px;
    padding: 12px;
    font-size: 11px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    color: ${COLORS.textMuted};
    overflow-x: auto;
    white-space: pre;
    max-height: 200px;
    line-height: 1.6;
  }
  #nexa-dev-overlay .nexa-url-full {
    font-size: 12px;
    word-break: break-all;
    color: ${COLORS.accent};
  }
  #nexa-dev-overlay .nexa-metrics-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  #nexa-dev-overlay .nexa-slow-req {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

export class DevOverlayUI {
  private panel: HTMLElement | null = null
  private tracker: RequestTracker
  private visible = false
  private selectedRequest: TrackedRequest | null = null
  private config: Required<DevOverlayConfig>
  private searchQuery = ''

  constructor(tracker: RequestTracker) {
    this.tracker = tracker
    this.config = tracker.getConfig()
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
    requestAnimationFrame(() => {
      this.panel!.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      this.panel!.style.opacity = '1'
      this.panel!.style.transform = 'scale(1) translateY(0)'
    })
    this.visible = true
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
  }

  toggle(): void {
    this.visible ? this.hide() : this.show()
  }

  destroy(): void {
    this.panel?.remove()
    this.panel = null
  }

  private setupKeyboardShortcut(): void {
    const keys = this.config.keyboardShortcut.split('+')
    const requiredKeys = new Set(keys.map((k) => k.toLowerCase()))
    document.addEventListener('keydown', (e) => {
      const pressed = new Set<string>()
      if (e.ctrlKey) {
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
    })
  }

  private createPanel(): void {
    this.panel = document.createElement('div')
    this.panel.id = 'nexa-dev-overlay'

    const pos = this.config.position
    const isBottom = pos.includes('bottom')
    const isRight = pos.includes('right')

    this.panel.style.cssText = `
      position: fixed;
      ${isBottom ? 'bottom: 24px;' : 'top: 24px;'}
      ${isRight ? 'right: 24px;' : 'left: 24px;'}
      width: 420px;
      max-height: 70vh;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `

    this.panel.innerHTML = `<style>${STYLES}</style>

      <div class="nexa-header">
<div class="nexa-header-left">
          <div class="nexa-logo">
            <img src="/src/assets/faviconNew.png" width="18" height="18" style="border-radius:4px;object-fit:contain;display:block;" alt="Nexa" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
            <span style="display:none;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;background:linear-gradient(135deg,#3b82f6,#238636);width:18px;height:18px;border-radius:4px;">N</span>
          </div>
          <span class="nexa-title">Nexa DevTools</span>
        </div>
        <div class="nexa-header-actions">
          <button class="nexa-icon-btn nexa-btn-clear" title="Clear history">${ICONS.clear}</button>
          <button class="nexa-icon-btn nexa-btn-close" title="Close (Esc)">${ICONS.close}</button>
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
          <button class="nexa-btn nexa-btn-retry">${ICONS.retry} Retry</button>
        </div>
        <div class="nexa-detail-body"></div>
      </div>
    `

    document.body.appendChild(this.panel)
    this.bindEvents()
    this.tracker.onChange(() => this.render())
    this.hide()

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.visible) {
        this.hide()
      }
    })
  }

  private bindEvents(): void {
    if (!this.panel) {
      return
    }
    this.panel
      .querySelector('.nexa-btn-close')
      ?.addEventListener('click', () => this.hide())
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
  }

  private renderRequestList(): void {
    const list = this.panel?.querySelector('.nexa-request-list')
    if (!list) {
      return
    }

    let requests = this.tracker.getHistory()
    if (this.searchQuery) {
      requests = requests.filter(
        (r) =>
          r.url.toLowerCase().includes(this.searchQuery) ||
          r.method.toLowerCase().includes(this.searchQuery) ||
          String(r.status).includes(this.searchQuery),
      )
    }

    if (requests.length === 0) {
      list.innerHTML = `
        <div class="nexa-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
          </svg>
          <p>${this.searchQuery ? 'No matching requests' : 'No requests yet'}</p>
          <span>${this.searchQuery ? 'Try a different search term' : 'Make a request to see it here'}</span>
        </div>`
      return
    }

    list.innerHTML = requests
      .map(
        (r, i) => `
      <div class="nexa-request-item" data-id="${r.id}" style="animation-delay: ${Math.min(i * 20, 300)}ms">
        <div class="nexa-req-left">
          <span class="nexa-method nexa-method-${r.method.toLowerCase()}">${r.method}</span>
          <span class="nexa-status ${r.ok ? 'nexa-ok' : 'nexa-err'}">${r.status || 'ERR'}</span>
          <span class="nexa-url" title="${r.url}">${this.truncateUrl(r.url)}</span>
        </div>
        <div class="nexa-req-right">
          ${r.cached ? '<span class="nexa-badge nexa-badge-cache">Cache</span>' : ''}
          ${r.retryCount > 0 ? `<span class="nexa-badge nexa-badge-retry">${r.retryCount}R</span>` : ''}
          <span class="nexa-duration ${r.duration > 500 ? 'nexa-slow' : ''}">${r.duration.toFixed(0)}ms</span>
          ${ICONS.chevron}
        </div>
      </div>
    `,
      )
      .join('')

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
    const m = this.tracker.getMetrics()
    const el = this.panel?.querySelector('.nexa-metrics-content')
    if (!el) {
      return
    }

    const successRate =
      m.totalRequests > 0
        ? ((m.successfulRequests / m.totalRequests) * 100).toFixed(1)
        : '0'

    el.innerHTML = `
      <div class="nexa-card">
        <h3>Overview</h3>
        <div class="nexa-row"><span>Total Requests</span><strong>${m.totalRequests}</strong></div>
        <div class="nexa-row"><span>Successful</span><strong class="nexa-ok">${m.successfulRequests}</strong></div>
        <div class="nexa-row"><span>Failed</span><strong class="nexa-err">${m.failedRequests}</strong></div>
        <div class="nexa-row"><span>Cached</span><strong>${m.cachedRequests}</strong></div>
        <div class="nexa-row"><span>Success Rate</span><strong>${successRate}%</strong></div>
      </div>
      <div class="nexa-card">
        <h3>Performance</h3>
        <div class="nexa-row"><span>Average</span><strong>${m.avgDuration.toFixed(1)}ms</strong></div>
        <div class="nexa-row"><span>Fastest</span><strong class="nexa-ok">${m.minDuration.toFixed(1)}ms</strong></div>
        <div class="nexa-row"><span>Slowest</span><strong class="nexa-err">${m.maxDuration.toFixed(1)}ms</strong></div>
        <div class="nexa-row"><span>Throughput</span><strong>${m.requestsPerSecond.toFixed(2)} req/s</strong></div>
      </div>
      ${
        m.slowestRequests.length > 0
          ? `
        <div class="nexa-card">
          <h3>Slowest Requests</h3>
          ${m.slowestRequests
            .map(
              (r) => `
            <div class="nexa-row nexa-slow-req">
              <span><span class="nexa-method nexa-method-${r.method.toLowerCase()}" style="font-size:10px;padding:2px 5px;">${r.method}</span> ${this.truncateUrl(r.url, 25)}</span>
              <strong class="nexa-err">${r.duration.toFixed(0)}ms</strong>
            </div>
          `,
            )
            .join('')}
        </div>
      `
          : ''
      }`
  }

  private showDetail(request: TrackedRequest): void {
    this.selectedRequest = request
    const body = this.panel?.querySelector('.nexa-body') as HTMLElement | null
    const detail = this.panel?.querySelector(
      '.nexa-detail',
    ) as HTMLElement | null
    const content = this.panel?.querySelector('.nexa-detail-body')
    if (!body || !detail || !content) {
      return
    }

    body.style.display = 'none'
    detail.style.display = 'flex'

    content.innerHTML = `
      <div class="nexa-card">
        <h3>Request</h3>
        <div class="nexa-row"><span>Method</span><strong style="color:${request.method === 'GET' ? COLORS.get : request.method === 'POST' ? COLORS.post : request.method === 'DELETE' ? COLORS.delete : COLORS.warning}">${request.method}</strong></div>
        <div class="nexa-row"><span>URL</span><span class="nexa-url-full">${request.url}</span></div>
        <div class="nexa-row"><span>Status</span><strong class="${request.ok ? 'nexa-ok' : 'nexa-err'}">${request.status || 'N/A'}</strong></div>
        <div class="nexa-row"><span>Duration</span><strong>${request.duration.toFixed(1)}ms</strong></div>
        <div class="nexa-row"><span>Cached</span><strong>${request.cached ? 'Yes' : 'No'}</strong></div>
        <div class="nexa-row"><span>Retries</span><strong>${request.retryCount}</strong></div>
        <div class="nexa-row"><span>Timestamp</span><strong>${new Date(request.timestamp).toLocaleTimeString()}</strong></div>
      </div>
      ${
        request.body !== undefined
          ? `
        <div class="nexa-card">
          <h3>Request Body</h3>
          <pre class="nexa-code">${this.formatJson(request.body)}</pre>
        </div>
      `
          : ''
      }
      ${
        Object.keys(request.headers).length > 0
          ? `
        <div class="nexa-card">
          <h3>Headers</h3>
          <pre class="nexa-code">${this.formatJson(request.headers)}</pre>
        </div>
      `
          : ''
      }`
  }

  private showMainView(): void {
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
    fetch(url, {
      method,
      headers: headers as Record<string, string>,
      body: body ? JSON.stringify(body) : undefined,
    })
      .then(async (res) => {
        if (this.selectedRequest) {
          this.selectedRequest = {
            ...this.selectedRequest,
            status: res.status,
            ok: res.ok,
            duration: this.selectedRequest.duration,
            timestamp: Date.now(),
          }
          this.showDetail(this.selectedRequest)
        }
      })
      .catch(() => {})
  }

  private truncateUrl(url: string, max = 35): string {
    try {
      const parsed = new URL(url)
      return parsed.pathname + (parsed.search || '')
    } catch {
      return url.length > max ? url.slice(0, max) + '...' : url
    }
  }

  private formatJson(data: unknown): string {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }
}
