/**
 * Real-time plugin for Nexa
 * Provides WebSocket and SSE integration with the plugin system
 */

import type { Plugin, PluginManager } from '../utils/index.js';

/**
 * Real-time plugin that adds WebSocket and SSE event listeners to the plugin manager
 */
export class RealtimePlugin implements Plugin {
  name = 'realtime';

  setup(manager: PluginManager): void {
    // Add event listeners for real-time communication
    manager.on('websocket:connect:start', (...args: unknown[]) => {
      const url = args[0] as string;
      manager.emit('realtime:connect:start', 'websocket', url);
    });

    manager.on('websocket:connect:success', (...args: unknown[]) => {
      const url = args[0] as string;
      manager.emit('realtime:connect:success', 'websocket', url);
    });

    manager.on('websocket:message:received', (...args: unknown[]) => {
      const url = args[0] as string;
      const message = args[1] as unknown;
      manager.emit('realtime:message', 'websocket', url, message);
    });

    manager.on('sse:connect:start', (...args: unknown[]) => {
      const url = args[0] as string;
      manager.emit('realtime:connect:start', 'sse', url);
    });

    manager.on('sse:connect:success', (...args: unknown[]) => {
      const url = args[0] as string;
      manager.emit('realtime:connect:success', 'sse', url);
    });

    manager.on('sse:message:received', (...args: unknown[]) => {
      const url = args[0] as string;
      const message = args[1] as unknown;
      manager.emit('realtime:message', 'sse', url, message);
    });
  }
}

/**
 * Create a realtime plugin instance
 */
export function createRealtimePlugin(): RealtimePlugin {
  return new RealtimePlugin();
}