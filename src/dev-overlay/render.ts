import type { TrackedRequest, DevMetrics } from './types'
import { ICONS, COLORS } from './theme'
import { escapeHtml, truncateUrl, formatJson } from './format'

export type FilterType = 'all' | 'xhr' | 'fetch' | 'err' | 'slow'

export function filterRequests(
  requests: TrackedRequest[],
  filterType: FilterType,
  searchQuery: string,
): TrackedRequest[] {
  let result = requests

  if (filterType === 'err') {
    result = result.filter((r) => !r.ok)
  } else if (filterType === 'xhr') {
    // JSON requests
    result = result.filter(
      (r) =>
        (r.headers['content-type'] &&
          r.headers['content-type'].includes('json')) ||
        (r.responseHeaders &&
          r.responseHeaders['content-type'] &&
          r.responseHeaders['content-type'].includes('json')),
    )
  } else if (filterType === 'slow') {
    result = result.filter((r) => r.duration > 500)
  }

  if (searchQuery) {
    result = result.filter(
      (r) =>
        r.url.toLowerCase().includes(searchQuery) ||
        r.method.toLowerCase().includes(searchQuery) ||
        String(r.status).includes(searchQuery),
    )
  }

  return result
}

export function renderRequestListHtml(
  requests: TrackedRequest[],
  searchQuery: string,
): string {
  if (requests.length === 0) {
    return `
        <div class="nexa-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
          </svg>
          <p>${searchQuery ? 'No matching requests' : 'No requests yet'}</p>
          <span>${searchQuery ? 'Try a different search term' : 'Make a request to see it here'}</span>
        </div>`
  }

  return requests
    .map(
      (r, i) => `
      <div class="nexa-request-item" data-id="${r.id}" style="animation-delay: ${Math.min(i * 20, 300)}ms">
        <div class="nexa-req-left">
          <span class="nexa-method nexa-method-${r.method.toLowerCase()}">${r.method}</span>
          <span class="nexa-status ${r.ok ? 'nexa-ok' : 'nexa-err'}">${r.status || 'ERR'}</span>
          <span class="nexa-url" title="${escapeHtml(r.url)}">${escapeHtml(truncateUrl(r.url))}</span>
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
}

export function renderMetricsHtml(m: DevMetrics): string {
  const successRate =
    m.totalRequests > 0
      ? ((m.successfulRequests / m.totalRequests) * 100).toFixed(1)
      : '0'

  return `
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
              <span><span class="nexa-method nexa-method-${r.method.toLowerCase()}" style="font-size:10px;padding:2px 5px;">${r.method}</span> ${escapeHtml(truncateUrl(r.url, 25))}</span>
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

export function renderDetailHtml(request: TrackedRequest): string {
  return `
      <div class="nexa-card">
        <h3>Request</h3>
        <div class="nexa-row"><span>Method</span><strong style="color:${request.method === 'GET' ? COLORS.get : request.method === 'POST' ? COLORS.post : request.method === 'DELETE' ? COLORS.delete : COLORS.warning}">${request.method}</strong></div>
        <div class="nexa-row"><span>URL</span><span class="nexa-url-full">${escapeHtml(request.url)}</span></div>
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
          <pre class="nexa-code">${escapeHtml(formatJson(request.body))}</pre>
        </div>
      `
          : ''
      }
      ${
        Object.keys(request.headers).length > 0
          ? `
        <div class="nexa-card">
          <h3>Headers</h3>
          <pre class="nexa-code">${escapeHtml(formatJson(request.headers))}</pre>
        </div>
      `
          : ''
      }`
}
