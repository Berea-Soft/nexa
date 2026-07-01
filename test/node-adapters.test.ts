/**
 * Node.js adapters integration tests.
 * These tests only run in Node.js environment.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  nodeHttpAdapter,
  nodeHttp2Adapter,
  closeHttp2SessionPool,
} from '../src/http-client/node-http-adapter.js'
import type { NodeTransportOptions } from '../src/types/index.js'

// Check if we're in Node.js environment
const isNode = typeof process !== 'undefined' && process.versions?.node

// Skip tests if not in Node.js
const runNodeTests = isNode ? describe : describe.skip

runNodeTests('Node.js HTTP Adapters', () => {
  describe('nodeHttpAdapter', () => {
    let server: import('http').Server
    let port: number
    let baseUrl: string

    beforeAll(async () => {
      const http = await import('http')
      return new Promise<void>((resolve) => {
        server = http.createServer((req, res) => {
          // Simple echo server
          if (req.url === '/echo') {
            let body = ''
            req.on('data', (chunk) => (body += chunk))
            req.on('end', () => {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(
                JSON.stringify({ method: req.method, url: req.url, body }),
              )
            })
          } else if (req.url === '/json') {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true }))
          } else if (req.url === '/error') {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Internal Server Error' }))
          } else if (req.url === '/slow') {
            setTimeout(() => {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ delayed: true }))
            }, 100)
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Not Found' }))
          }
        })

        server.listen(0, () => {
          const address = server.address()
          if (address && typeof address === 'object') {
            port = address.port
          } else if (typeof address === 'string') {
            // Unix socket, not used
            port = 0
          } else {
            port = 0
          }
          baseUrl = `http://localhost:${port}`
          resolve()
        })
      })
    })

    afterAll(() => {
      return new Promise<void>((resolve) => {
        if (server) {
          server.close(() => resolve())
        } else {
          resolve()
        }
      })
    })

    it('should make a simple GET request', async () => {
      const response = await nodeHttpAdapter(`${baseUrl}/json`, {
        method: 'GET',
      })
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data).toEqual({ success: true })
    })

    it('should handle POST with body', async () => {
      const body = JSON.stringify({ foo: 'bar' })
      const response = await nodeHttpAdapter(`${baseUrl}/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.method).toBe('POST')
      expect(data.url).toBe('/echo')
      expect(data.body).toBe(body)
    })

    it('should handle the QUERY method with a JSON body (safe, body-carrying request)', async () => {
      const body = JSON.stringify({ term: 'nexa' })
      const response = await nodeHttpAdapter(`${baseUrl}/echo`, {
        method: 'QUERY',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.method).toBe('QUERY')
      expect(data.body).toBe(body)
    })

    it('should handle HTTP errors', async () => {
      const response = await nodeHttpAdapter(`${baseUrl}/error`, {
        method: 'GET',
      })
      expect(response.status).toBe(500)
      expect(response.ok).toBe(false)
      const data = await response.json()
      expect(data).toEqual({ error: 'Internal Server Error' })
    })

    it('should respect timeout option', async () => {
      // Use a very short timeout
      const options: NodeTransportOptions = { timeout: 10 } // 10ms timeout
      try {
        await nodeHttpAdapter(`${baseUrl}/slow`, { method: 'GET' }, options)
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message.toLowerCase()).toContain('timed out')
      }
    }, 5000)

    it('should handle AbortSignal', async () => {
      const controller = new AbortController()
      const promise = nodeHttpAdapter(`${baseUrl}/slow`, {
        method: 'GET',
        signal: controller.signal,
      })

      setTimeout(() => controller.abort(), 20)

      try {
        await promise
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.name).toBe('AbortError')
      }
    })

    it('should reject FormData bodies with a clear, explicit error instead of sending an empty body', async () => {
      const form = new FormData()
      form.append('a', 'b')

      await expect(
        nodeHttpAdapter(`${baseUrl}/echo`, { method: 'POST', body: form }),
      ).rejects.toThrow(/Unsupported request body type.*FormData/i)
    })

    it('should reject URLSearchParams bodies with a clear, explicit error', async () => {
      const params = new URLSearchParams({ a: 'b' })

      await expect(
        nodeHttpAdapter(`${baseUrl}/echo`, { method: 'POST', body: params }),
      ).rejects.toThrow(/Unsupported request body type.*URLSearchParams/i)
    })
  })

  describe('nodeHttp2Adapter', () => {
    let server: import('http2').Http2Server
    let port: number
    let baseUrl: string

    beforeAll(async () => {
      const http2 = await import('http2')
      return new Promise<void>((resolve) => {
        server = http2.createServer()

        server.on('stream', (stream, headers) => {
          const path = headers[':path']
          const method = headers[':method']

          if (path === '/json' && method === 'GET') {
            stream.respond({
              ':status': 200,
              'content-type': 'application/json',
            })
            stream.end(JSON.stringify({ success: true, protocol: 'h2' }))
            return
          }

          if (path === '/slow') {
            setTimeout(() => {
              if (!stream.closed) {
                stream.respond({ ':status': 200 })
                stream.end(JSON.stringify({ slow: true }))
              }
            }, 100)
            return
          }

          stream.respond({
            ':status': 404,
            'content-type': 'application/json',
          })
          stream.end(JSON.stringify({ error: 'Not Found' }))
        })

        server.listen(0, () => {
          const address = server.address()
          if (address && typeof address === 'object') {
            port = address.port
          } else {
            port = 0
          }
          baseUrl = `http://localhost:${port}`
          resolve()
        })
      })
    })

    afterAll(() => {
      closeHttp2SessionPool()
      return new Promise<void>((resolve) => {
        if (server) {
          server.close(() => resolve())
        } else {
          resolve()
        }
      })
    })

    it('should make HTTP/2 requests', async () => {
      const response = await nodeHttp2Adapter(`${baseUrl}/json`, {
        method: 'GET',
      })

      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data).toEqual({ success: true, protocol: 'h2' })
    })

    it('should respect timeout in HTTP/2', async () => {
      try {
        await nodeHttp2Adapter(
          `${baseUrl}/slow`,
          { method: 'GET' },
          { timeout: 10 },
        )
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message.toLowerCase()).toContain('timed out')
      }
    })

    it('should handle AbortSignal in HTTP/2', async () => {
      const controller = new AbortController()
      const promise = nodeHttp2Adapter(`${baseUrl}/slow`, {
        method: 'GET',
        signal: controller.signal,
      })

      setTimeout(() => controller.abort(), 20)

      try {
        await promise
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.name).toBe('AbortError')
      }
    })

    it('should reject FormData bodies with a clear, explicit error', async () => {
      const form = new FormData()
      form.append('a', 'b')

      await expect(
        nodeHttp2Adapter(`${baseUrl}/json`, { method: 'POST', body: form }),
      ).rejects.toThrow(/Unsupported request body type.*FormData/i)
    })
  })
})
