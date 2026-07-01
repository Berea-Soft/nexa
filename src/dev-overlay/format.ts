export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function truncateUrl(url: string, max = 35): string {
  try {
    const parsed = new URL(url)
    return parsed.pathname + (parsed.search || '')
  } catch {
    return url.length > max ? url.slice(0, max) + '...' : url
  }
}

export function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
