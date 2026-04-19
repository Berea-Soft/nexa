/**
 * Node.js HTTP/1.1 adapter using native http/https modules.
 * Supports keep-alive, connection pooling, and other Node-specific options.
 */

import type { NodeTransportOptions } from '../types/index.js';

// Lazy load Node.js modules
let http: typeof import('http') | undefined;
let https: typeof import('https') | undefined;
let http2: typeof import('http2') | undefined;

// HTTP/2 Session Pool
interface Http2SessionInfo {
  session: import('http2').ClientHttp2Session;
  lastUsed: number;
  requestCount: number;
  origin: string;
  closing?: boolean;
}

class Http2SessionPool {
  private sessions = new Map<string, Http2SessionInfo>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly maxIdleTime = 30000; // 30 seconds idle timeout
  private readonly maxRequestsPerSession = 1000; // Max requests per session before recycling

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => this.cleanup(), 10000); // Check every 10 seconds
  }

  private cleanup() {
    const now = Date.now();
    for (const info of this.sessions.values()) {
      // Close idle sessions
      if (!info.closing && now - info.lastUsed > this.maxIdleTime) {
        this.closeSession(info, 'idle timeout');
      }
      // Close sessions that have exceeded request count
      if (!info.closing && info.requestCount >= this.maxRequestsPerSession) {
        this.closeSession(info, 'max requests exceeded');
      }
    }
  }

  private closeSession(info: Http2SessionInfo, _reason: string) {
    info.closing = true;
    info.session.close();
    this.sessions.delete(info.origin);
  }

  async getSession(origin: string, options?: NodeTransportOptions): Promise<import('http2').ClientHttp2Session> {
    // Check for existing session
    let info = this.sessions.get(origin);
    
    if (info && !info.session.closed && !info.session.destroyed) {
      info.lastUsed = Date.now();
      info.requestCount++;
      return info.session;
    }

    // Create new session
    const http2Module = await getHttp2();
    const session = http2Module.connect(origin, {
      settings: options?.http2Settings,
    });

    // Set up error handling for the session
    session.on('error', (_err) => {
      // Remove broken session from pool
      this.sessions.delete(origin);
    });

    session.on('close', () => {
      this.sessions.delete(origin);
    });

    info = {
      session,
      lastUsed: Date.now(),
      requestCount: 1,
      origin,
      closing: false,
    };

    this.sessions.set(origin, info);
    return session;
  }

  releaseSession(origin: string) {
    const info = this.sessions.get(origin);
    if (info) {
      info.lastUsed = Date.now();
    }
  }

  getStats() {
    return {
      sessionCount: this.sessions.size,
      origins: Array.from(this.sessions.keys()),
      sessions: Array.from(this.sessions.values()).map(info => ({
        origin: info.origin,
        requestCount: info.requestCount,
        lastUsed: info.lastUsed,
        closing: info.closing,
        sessionAlive: !info.session.closed && !info.session.destroyed,
      })),
    };
  }

  closeAll() {
    for (const info of this.sessions.values()) {
      if (!info.closing) {
        info.session.close();
      }
    }
    this.sessions.clear();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global session pool instance
const http2SessionPool = new Http2SessionPool();

async function getHttp() {
  if (!http) {
    http = await import('http');
    https = await import('https');
  }
  return { http: http!, https: https! };
}

async function getHttp2() {
  if (!http2) {
    http2 = await import('http2');
  }
  return http2!;
}

/**
 * Extract request information from RequestInfo and RequestInit
 */
function extractRequestInfo(input: RequestInfo, init?: RequestInit): {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
} {
  let url: string;
  let method: string;
  let headers: Record<string, string>;
  let body: unknown | undefined;
  let signal: AbortSignal | undefined;

  if (typeof input === 'string') {
    url = input;
    method = init?.method || 'GET';
    headers = (init?.headers as Record<string, string>) || {};
    body = init?.body;
    signal = init?.signal !== null ? init?.signal : undefined;
  } else {
    // input is a Request object
    url = input.url;
    method = init?.method || input.method || 'GET';
    // Merge headers: Request headers take precedence? Actually, init overrides request.
    const inputHeaders = new Headers(input.headers);
    const initHeaders = new Headers(init?.headers);
    const mergedHeaders = new Headers(inputHeaders);
    initHeaders.forEach((value, key) => mergedHeaders.set(key, value));
    headers = Object.fromEntries(mergedHeaders.entries());
    body = init?.body ?? input.body ?? undefined;
    signal = init?.signal !== null ? init?.signal : input.signal;
  }

  return { url, method, headers, body, signal };
}

/**
 * Create agent with keep-alive configuration
 */
function createAgent(
  url: string,
  http: typeof import('http'),
  https: typeof import('https'),
  options?: NodeTransportOptions,
  isHttp2: boolean = false
): any {
  if (isHttp2) {
    // HTTP/2 session management is more complex - for simplicity we don't pool here
    return null;
  }
  
  // For HTTP/1.1, create a custom agent
  const Agent = url.startsWith('https:') ? https.Agent : http.Agent;
  const agentOptions: any = {
    keepAlive: options?.keepAlive ?? true,
    maxSockets: options?.maxSockets ?? 50,
    maxFreeSockets: options?.maxFreeSockets ?? 10,
    timeout: options?.timeout ?? 60000,
  };
  if (options?.maxRequestsPerSocket !== undefined) {
    agentOptions.maxRequestsPerSocket = options.maxRequestsPerSocket;
  }
  return new Agent(agentOptions);
}

/**
 * Convert Node.js IncomingMessage to Fetch Response
 */
async function createResponse(nodeRes: import('http').IncomingMessage): Promise<Response> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeRes.headers)) {
    if (Array.isArray(value)) {
      value.forEach(v => headers.append(key, v));
    } else if (value !== undefined) {
      headers.set(key, String(value));
    }
  }

  // Collect body chunks
  const chunks: Buffer[] = [];
  nodeRes.on('data', (chunk) => chunks.push(chunk));
  
  return new Promise<Response>((resolve) => {
    nodeRes.on('end', () => {
      const body = Buffer.concat(chunks);
      resolve(new Response(body, {
        status: nodeRes.statusCode || 200,
        statusText: nodeRes.statusMessage || 'OK',
        headers,
      }));
    });
  });
}

/**
 * Node.js HTTP/1.1 adapter
 */
export async function nodeHttpAdapter(
  input: RequestInfo,
  init?: RequestInit,
  options?: NodeTransportOptions
): Promise<Response> {
  const { http, https } = await getHttp();
  const { url, method, headers, body, signal } = extractRequestInfo(input, init);
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === 'https:';
  const module = isHttps ? https : http;
  
  const agent = createAgent(url, http, https, options, false);
  
  return new Promise((resolve, reject) => {
    const req = module.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers,
      agent,
    });

    // Handle abort signal
    if (signal) {
      if (signal.aborted) {
        req.destroy();
        reject(new Error('Request aborted'));
        return;
      }
      const onAbort = () => {
        req.destroy();
        reject(new Error('Request aborted'));
      };
      signal.addEventListener('abort', onAbort);
      // Clean up listener when request completes or errors
      const cleanup = () => signal.removeEventListener('abort', onAbort);
      req.on('close', cleanup);
      req.on('error', cleanup);
    }
    
    req.setTimeout(options?.timeout ?? 60000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    
    req.on('response', async (res) => {
      try {
        const response = await createResponse(res);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
    
    req.on('error', reject);
    
    // Write body if present
    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else if (body instanceof Uint8Array) {
        req.write(Buffer.from(body));
      } else if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === 'object') {
        req.write(JSON.stringify(body));
      }
      // Note: ReadableStream not supported in this simple adapter
    }
    
    req.end();
  });
}

/**
 * Node.js HTTP/2 adapter (basic implementation)
 */
export async function nodeHttp2Adapter(
  input: RequestInfo,
  init?: RequestInit,
  options?: NodeTransportOptions
): Promise<Response> {
  const { url, method, headers, body, signal } = extractRequestInfo(input, init);
  const parsedUrl = new URL(url);
  const origin = parsedUrl.origin;
  
  return new Promise(async (resolve, reject) => {
    let session: import('http2').ClientHttp2Session;
    let req: import('http2').ClientHttp2Stream;
    let released = false;

    const releaseSession = () => {
      if (!released) {
        released = true;
        http2SessionPool.releaseSession(origin);
      }
    };

    const cleanupAndReject = (error: Error) => {
      releaseSession();
      reject(error);
    };

    const cleanupAndResolve = (response: Response) => {
      releaseSession();
      resolve(response);
    };

    try {
      // Get session from pool
      session = await http2SessionPool.getSession(origin, options);
      
      // Handle abort signal before making request
      if (signal?.aborted) {
        cleanupAndReject(new Error('Request aborted'));
        return;
      }

      req = session.request({
        ':path': parsedUrl.pathname + parsedUrl.search,
        ':method': method,
        ...headers,
      });

      // Set timeout for the request
      if (options?.timeout) {
        req.setTimeout(options.timeout, () => {
          req.close();
          cleanupAndReject(new Error('Request timed out'));
        });
      }

      // Handle abort signal
      if (signal) {
        const onAbort = () => {
          req.close();
          cleanupAndReject(new Error('Request aborted'));
        };
        signal.addEventListener('abort', onAbort);
        // Clean up listener when request completes or errors
        const cleanup = () => signal.removeEventListener('abort', onAbort);
        req.on('close', cleanup);
        req.on('error', cleanup);
      }
      
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      
      req.on('response', (headers) => {
        const status = Number(headers[':status']) || 200;
        const responseHeaders = new Headers();
        
        for (const [key, value] of Object.entries(headers)) {
          if (key.startsWith(':')) continue;
          if (Array.isArray(value)) {
            value.forEach(v => responseHeaders.append(key, v));
          } else if (value !== undefined) {
            responseHeaders.set(key, String(value));
          }
        }
        
        req.on('end', () => {
          const body = Buffer.concat(chunks);
          cleanupAndResolve(new Response(body, {
            status,
            statusText: 'OK',
            headers: responseHeaders,
          }));
        });
      });
      
      req.on('error', (err) => {
        // Stream error - reject the request but keep session alive (might be reusable)
        cleanupAndReject(err);
      });

      if (body) {
        if (typeof body === 'string') {
          req.write(body);
        } else if (body instanceof Uint8Array || Buffer.isBuffer(body)) {
          req.write(body);
        } else if (typeof body === 'object') {
          req.write(JSON.stringify(body));
        }
      }
      
      req.end();
    } catch (error) {
      cleanupAndReject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

/**
 * Close all HTTP/2 sessions in the pool.
 * Useful for cleanup in tests or when shutting down the application.
 */
export function closeHttp2SessionPool(): void {
  http2SessionPool.closeAll();
}

/**
 * Get statistics about the HTTP/2 session pool.
 */
export function getHttp2SessionPoolStats(): {
  sessionCount: number;
  origins: string[];
} {
  const stats = http2SessionPool.getStats();
  return {
    sessionCount: stats.sessionCount,
    origins: stats.origins,
  };
}

export { Http2SessionPool };