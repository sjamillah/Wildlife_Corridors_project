/**
 * WebSocket Service for Real-time Animal Tracking
 * 
 * Handles connection management, heartbeat, reconnection, and message types:
 * - initial_data: Sent on connect with all animal data
 * - position_update: Live position updates
 * - alert: Notifications for animals leaving corridors or entering danger zones
 * - state_change: Backend status updates
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.listeners = new Map();
    this.isConnecting = false;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000; // Start with 3 seconds
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.heartbeatInterval = 90000; // 90 seconds (increased from 30s - backend rate-limits pings)
    this.lastConnectionStatus = 'disconnected'; // Track last status to prevent flickering
    this.isSharedConnection = false; // Track if this is a shared connection
  }

  /**
   * Get WebSocket URL from environment
   */
  getWebSocketUrl() {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    console.log('WebSocket URL Construction:');
    console.log('  REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('  Base API URL:', apiUrl);

    // Convert HTTP(S) URL to WS(S) URL
    let wsUrl = apiUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');

    // Add WebSocket endpoint
    wsUrl = `${wsUrl}/ws/animals/tracking/`;

    console.log('  Final WebSocket URL:', wsUrl);

    return wsUrl;
  }

  /**
   * Connect to WebSocket server - SINGLE SHARED CONNECTION
   */
  connect() {
    // CRITICAL: Check if WebSocket is already connected (shared connection check)
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ WebSocket already connected - reusing shared connection');
        }
        this.isSharedConnection = true;
        // Emit connection event for new listeners
        this.emit('connection', { status: 'connected' });
        return;
      }
      if (this.ws.readyState === WebSocket.CONNECTING) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('⏳ WebSocket connection in progress - waiting for shared connection');
        }
        return;
      }
    }

    // Prevent duplicate connection attempts
    if (this.isConnecting) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('⏳ Connection already in progress');
      }
      return;
    }

    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl();
    
    console.log(`Connecting to WebSocket: ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen(event) {
    console.log('WebSocket connected successfully');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 3000;

    // Only notify if status actually changed
    if (this.lastConnectionStatus !== 'connected') {
      console.log('Connection status changed: disconnected -> connected');
      this.lastConnectionStatus = 'connected';
      this.emit('connection', { status: 'connected' });
    }

    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      const messageType = data.type;

      console.log(`WebSocket message received: ${messageType}`, data.animals ? `(${data.animals.length} animals)` : '');

      // Handle pong response (heartbeat acknowledgment)
      if (messageType === 'pong') {
        console.log('Heartbeat acknowledged');
        return;
      }

      // Process message based on type
      switch (messageType) {
        case 'initial_data':
          console.log('Received initial data:', data.animals?.length || 0, 'animals');
          break;
        case 'position_update':
          console.log('Received position update:', data.animals?.length || 0, 'animals');
          break;
        case 'alert':
          // New format: { type: 'alert', timestamp: '...', alert: { ... } }
          const alertData = data.alert || data;
          console.log('Alert received:', alertData.title || alertData.message, 'Animal:', alertData.animal_name || alertData.animalName, 'Severity:', alertData.severity);
          break;
        case 'state_change':
          console.log('State change:', data.status, data.message);
          break;
        default:
          console.log('Unknown message type:', messageType);
      }

      // Emit to specific message type listeners
      this.emit(messageType, data);

      // Also emit to general message listener
      this.emit('message', data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket error
   */
  handleError(event) {
    console.error('WebSocket error:', event);
    this.emit('error', { error: event });
  }

  /**
   * Handle WebSocket close event
   */
  handleClose(event) {
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    this.isConnecting = false;
    this.stopHeartbeat();

    // Only notify if status actually changed
    if (this.lastConnectionStatus !== 'disconnected') {
      console.log('Connection status changed: connected -> disconnected');
      this.lastConnectionStatus = 'disconnected';
      this.emit('connection', { status: 'disconnected', code: event.code, reason: event.reason });
    }

    // Reconnect if not intentionally closed (but only if backend exists)
    if (this.shouldReconnect && event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule automatic reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached - Backend WebSocket not available');
      console.error('WebSocket connection failed, using REST API fallback');
      if (this.lastConnectionStatus !== 'failed') {
        this.lastConnectionStatus = 'failed';
        this.emit('connection', { status: 'failed', message: 'Backend WebSocket not available' });
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay);

    console.log(`Reconnecting in ${delay / 1000} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start sending heartbeat pings (90 second interval - backend rate-limits pings)
   */
  startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('💓 Sending heartbeat ping (90s interval)');
        }
        this.send({ type: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Send message to WebSocket server
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('WebSocket not connected. Unable to send message.');
      return false;
    }
  }

  /**
   * Subscribe to specific animal updates
   */
  subscribeToAnimal(animalId) {
    this.send({
      type: 'subscribe_animal',
      animal_id: animalId,
    });
  }

  /**
   * Unsubscribe from specific animal updates
   */
  unsubscribeFromAnimal(animalId) {
    this.send({
      type: 'unsubscribe_animal',
      animal_id: animalId,
    });
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      if (process.env.NODE_ENV !== 'production' && (event === 'position_update' || event === 'initial_data' || event === 'alert')) {
        console.warn(`⚠️ No listeners registered for event: ${event}`);
      }
      return;
    }

    const callbacks = this.listeners.get(event);
    // Create a copy to avoid issues if callbacks are modified during iteration
    const callbacksCopy = [...callbacks];
    console.log(`📡 Emitting ${event} to ${callbacksCopy.length} listener(s)`);
    callbacksCopy.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
        // Don't rethrow - prevent one bad listener from crashing the app
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState() {
    if (!this.ws) return 'CLOSED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }
}

// Export singleton instance
const websocketService = new WebSocketService();

export default websocketService;

