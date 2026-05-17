import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Http2SessionPool } from '../src/http-client/node-http-adapter.js';

// Mock http2 module
const mockConnect = vi.fn();
const mockSession = {
  closed: false,
  destroyed: false,
  close: vi.fn(),
  on: vi.fn(),
};

vi.mock('http2', () => ({
  connect: mockConnect,
}));

describe('Http2SessionPool', () => {
  let pool: Http2SessionPool;

  beforeEach(() => {
    pool = new Http2SessionPool();
    vi.clearAllMocks();
    // Reset mock session state
    mockSession.closed = false;
    mockSession.destroyed = false;
    mockSession.close.mockClear();
    mockSession.on.mockClear();
    mockConnect.mockClear();
  });

  afterEach(() => {
    pool.closeAll();
  });

  describe('getSession', () => {
    it('should create a new session when none exists', async () => {
      mockConnect.mockReturnValue(mockSession);
      
      const session = await pool.getSession('http://localhost:3000');
      
      expect(mockConnect).toHaveBeenCalledWith('http://localhost:3000', {
        settings: undefined,
      });
      expect(session).toBe(mockSession);
      expect(mockSession.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSession.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should reuse existing session for same origin', async () => {
      mockConnect.mockReturnValue(mockSession);
      
      const session1 = await pool.getSession('http://localhost:3000');
      const session2 = await pool.getSession('http://localhost:3000');
      
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(session1).toBe(mockSession);
      expect(session2).toBe(mockSession);
    });

    it('should create new session if previous session is closed', async () => {
      mockConnect.mockReturnValue(mockSession);
      
      await pool.getSession('http://localhost:3000');
      // Simulate session closed
      mockSession.closed = true;
      
      const session2 = await pool.getSession('http://localhost:3000');
      
      expect(mockConnect).toHaveBeenCalledTimes(2);
      expect(session2).toBe(mockSession);
    });

    it('should increment request count on reuse', async () => {
      mockConnect.mockReturnValue(mockSession);
      
      await pool.getSession('http://localhost:3000');
      await pool.getSession('http://localhost:3000');
      await pool.getSession('http://localhost:3000');
      
      const stats = pool.getStats();
      const sessionInfo = stats.sessions[0];
      expect(sessionInfo.requestCount).toBe(3);
    });
  });

  describe('cleanup', () => {
    it('should close idle sessions after maxIdleTime', async () => {
      vi.useFakeTimers();
      mockConnect.mockReturnValue(mockSession);
      
      await pool.getSession('http://localhost:3000');
      
      // Fast-forward time beyond maxIdleTime (30s)
      vi.advanceTimersByTime(31000);
      
      // Trigger cleanup manually
      (pool as any).cleanup();
      
      expect(mockSession.close).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should close sessions exceeding maxRequestsPerSession', async () => {
      mockConnect.mockReturnValue(mockSession);
      
      // Create session and simulate many requests
      for (let i = 0; i < 1001; i++) {
        await pool.getSession('http://localhost:3000');
      }
      
      // Trigger cleanup manually
      (pool as any).cleanup();
      
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('releaseSession', () => {
    it('should update lastUsed timestamp', async () => {
      mockConnect.mockReturnValue(mockSession);
      
      await pool.getSession('http://localhost:3000');
      const before = Date.now();
      
      pool.releaseSession('http://localhost:3000');
      
      const stats = pool.getStats();
      const sessionInfo = stats.sessions[0];
      expect(sessionInfo.lastUsed).toBeGreaterThanOrEqual(before);
    });
  });

  describe('getStats', () => {
    it('should return correct session count and origins', async () => {
      mockConnect.mockReturnValue(mockSession);
      
      await pool.getSession('http://localhost:3000');
      await pool.getSession('http://localhost:4000');
      
      const stats = pool.getStats();
      
      expect(stats.sessionCount).toBe(2);
      expect(stats.origins).toEqual([
        'http://localhost:3000',
        'http://localhost:4000',
      ]);
      expect(stats.sessions).toHaveLength(2);
      expect(stats.sessions[0]).toMatchObject({
        origin: 'http://localhost:3000',
        requestCount: 1,
        closing: false,
        sessionAlive: true,
      });
    });
  });

  describe('closeAll', () => {
    it('should close all sessions and clear interval', async () => {
      mockConnect.mockReturnValue(mockSession);
      
      await pool.getSession('http://localhost:3000');
      await pool.getSession('http://localhost:4000');
      
      pool.closeAll();
      
      expect(mockSession.close).toHaveBeenCalledTimes(2);
      // Interval should be cleared
      const stats = pool.getStats();
      expect(stats.sessionCount).toBe(0);
    });
  });
});