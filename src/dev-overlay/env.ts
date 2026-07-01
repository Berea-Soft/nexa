export function isDevelopmentEnv(): boolean {
  try {
    if (typeof process !== 'undefined') {
      const proc = process as unknown as { env?: { NODE_ENV?: string } }
      if (proc.env && typeof proc.env.NODE_ENV === 'string') {
        return proc.env.NODE_ENV === 'development'
      }
    }
  } catch {
    // ignore
  }
  try {
    if (typeof location !== 'undefined' && location.hostname) {
      const host = location.hostname
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
        return true
      }
    }
  } catch {
    // ignore
  }
  return false
}
