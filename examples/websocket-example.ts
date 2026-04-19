/**
 * WebSocket Client Example
 * 
 * This example demonstrates how to use Nexa's WebSocket client for real-time communication.
 * The client includes automatic reconnection, heartbeat, and plugin support.
 */

import { createWebSocketClient } from '@bereasoftware/nexa';

async function runWebSocketExample() {
  console.log('=== Nexa WebSocket Client Example ===\n');

  // Create a WebSocket client with reconnection and heartbeat
  const client = createWebSocketClient('wss://echo.websocket.org', {
    protocols: ['echo-protocol'],
    headers: {
      'User-Agent': 'Nexa-WebSocket-Client/1.0',
    },
    reconnect: {
      enabled: true,
      baseDelay: 1000,
      maxDelay: 30000,
      maxAttempts: 10,
      onReconnecting: (attempt, delay) => {
        console.log(`⏳ Reconnecting attempt ${attempt} in ${delay}ms...`);
      },
    },
    heartbeat: {
      interval: 30000,
      timeout: 5000,
      pingMessage: 'ping',
      pongMessage: 'pong',
    },
    onOpen: (event) => {
      console.log('✅ WebSocket connection opened');
    },
    onClose: (event) => {
      console.log(`❌ WebSocket connection closed: ${event.code} ${event.reason}`);
    },
    onError: (event) => {
      console.error('⚠️ WebSocket error:', event);
    },
  });

  // Subscribe to messages
  const unsubscribe = client.onMessage((event) => {
    console.log(`📨 Message received:`, {
      data: event.data,
      type: event.type,
      timestamp: new Date(event.timestamp).toISOString(),
    });
  });

  // Subscribe to specific message types (for JSON messages)
  const unsubscribeJson = client.onMessageType('json', (data) => {
    console.log('📊 JSON message:', data);
  });

  try {
    // Connect to the server
    console.log('🔗 Connecting to WebSocket server...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Send a text message
    console.log('📤 Sending "Hello, WebSocket!"');
    client.send('Hello, WebSocket!');

    // Send JSON data
    console.log('📤 Sending JSON data');
    client.sendJson({ type: 'greeting', message: 'Hello from Nexa!' });

    // Check connection status
    console.log('📊 Connection status:', client.getStatus());

    // Get statistics
    console.log('📈 Statistics:', client.getStats());

    // Wait a bit to see potential responses
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Disconnect after 5 seconds
    setTimeout(() => {
      console.log('\n🔌 Disconnecting...');
      client.disconnect();
      console.log('✅ Disconnected');
      console.log('\n📊 Final statistics:', client.getStats());
    }, 5000);

  } catch (error) {
    console.error('❌ Connection failed:', error);
  }

  // Clean up subscriptions when done
  // unsubscribe();
  // unsubscribeJson();
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runWebSocketExample().catch(console.error);
}

export { runWebSocketExample };