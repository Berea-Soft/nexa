/**
 * Server-Sent Events (SSE) Client Example
 * 
 * This example demonstrates how to use Nexa's SSE client for receiving real-time events.
 * SSE is a server-push technology enabling servers to send updates to clients over HTTP.
 */

import { createSSEClient } from '@bereasoftware/nexa';

async function runSSEExample() {
  console.log('=== Nexa SSE Client Example ===\n');

  // Create an SSE client for Wikimedia recent changes stream
  // This is a public stream of Wikipedia edits
  const client = createSSEClient('https://stream.wikimedia.org/v2/stream/recentchange', {
    headers: {
      'User-Agent': 'Nexa-SSE-Client/1.0',
      'Accept': 'text/event-stream',
    },
    reconnect: {
      enabled: true,
      baseDelay: 2000,
      maxDelay: 60000,
      maxAttempts: Infinity,
      onReconnecting: (attempt, delay) => {
        console.log(`⏳ SSE reconnection attempt ${attempt} in ${delay}ms...`);
      },
    },
    onOpen: (event) => {
      console.log('✅ SSE connection opened');
    },
    onError: (event) => {
      console.error('⚠️ SSE error:', event);
    },
    onClose: () => {
      console.log('❌ SSE connection closed');
    },
  });

  // Subscribe to all messages
  const unsubscribe = client.onMessage((event) => {
    console.log(`📨 SSE message received:`, {
      type: event.type,
      timestamp: new Date(event.timestamp).toISOString(),
      data: typeof event.data === 'string' ? event.data.substring(0, 100) + '...' : event.data,
    });
  });

  // Subscribe to specific event types (Wikimedia sends events with type 'message')
  const unsubscribeEvents = client.onEvent('message', (data) => {
    try {
      if (typeof data === 'string') {
        const event = JSON.parse(data);
        console.log('📊 Wikipedia edit:', {
          wiki: event.wiki,
          title: event.title,
          user: event.user,
          timestamp: event.timestamp,
        });
      }
    } catch (error) {
      // Not JSON, ignore
    }
  });

  try {
    // Connect to the server
    console.log('🔗 Connecting to Wikimedia SSE stream...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Check connection status
    console.log('📊 Connection status:', client.getStatus());
    console.log('📈 Last event ID:', client.lastEventId);

    // Get statistics
    console.log('📈 Statistics:', client.getStats());

    // Wait for 10 seconds to receive events
    console.log('\n⏳ Listening for Wikipedia edits (10 seconds)...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Disconnect
    console.log('\n🔌 Disconnecting...');
    client.disconnect();
    console.log('✅ Disconnected');
    console.log('\n📊 Final statistics:', client.getStats());

  } catch (error) {
    console.error('❌ Connection failed:', error);
  }

  // Clean up subscriptions when done
  // unsubscribe();
  // unsubscribeEvents();
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSSEExample().catch(console.error);
}

export { runSSEExample };