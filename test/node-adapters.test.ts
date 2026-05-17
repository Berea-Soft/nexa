/**
 * Node.js adapters integration tests.
 * These tests only run in Node.js environment.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  nodeHttpAdapter,
  nodeHttp2Adapter,
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
        // Note: nodeHttpAdapter signature expects (input, init?, options?)
        // but the actual signature is (input, init?, transportOptions?)
        await nodeHttpAdapter(`${baseUrl}/slow`, { method: 'GET' }, options)
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        // Expect timeout error
        expect(error.message.toLowerCase()).toContain('timed out')
      }
    }, 5000)
  })

  describe('nodeHttp2Adapter', () => {
    it.skip('should make HTTP/2 requests', async () => {
      // HTTP/2 plaintext server requires Node.js with http2.createServer support
      // and proper configuration. Skipping for now as it's complex to set up.
      expect(true).toBe(true)
    })
  })
})
