/**
 * OCPP WebSocket Client (simulator-web)
 *
 * Singleton WebSocket connection with:
 * - Auto-reconnect with exponential backoff (1s -> 2s -> 4s -> ... -> 30s max)
 * - Application-level heartbeat (ping/pong every 30s)
 * - Type-safe message dispatch via callbacks
 * - Graceful lifecycle (connect / disconnect / destroy)
 */
import { ref } from 'vue'

/** Incoming OCPP message envelope from the server */
export interface OcppWsMessage {
  messageId: string
  action: string
  type: 'Call' | 'CallResult' | 'CallError'
  payload: Record<string, unknown>
  timestamp: string
  direction: 'inbound' | 'outbound'
  chargePointId: string
}

/** Callback map for message dispatch */
export interface OcppWsCallbacks {
  onOpen?: () => void
  onClose?: () => void
  onError?: (event: Event) => void
  onMessage?: (message: OcppWsMessage) => void
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void
}

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let intentionalClose = false
let reconnectAttempts = 0

const BASE_RECONNECT_DELAY = 1000   // 1 s
const MAX_RECONNECT_DELAY = 30000   // 30 s
const MAX_RECONNECT_ATTEMPTS = 20
const HEARTBEAT_INTERVAL = 30000    // 30 s
const DEFAULT_URL = '/ws/ocpp'

/** Reactive connection status for UI binding */
export const wsStatus = ref<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected')

// Keep callbacks in module scope so reconnects reuse them
let callbacks: OcppWsCallbacks = {}

// ---------------------------------------------------------------------------
// Heartbeat
// ---------------------------------------------------------------------------

function startHeartbeat(): void {
  stopHeartbeat()
  heartbeatTimer = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }))
    }
  }, HEARTBEAT_INTERVAL)
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

// ---------------------------------------------------------------------------
// Reconnect logic
// ---------------------------------------------------------------------------

function scheduleReconnect(): void {
  if (intentionalClose || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return

  const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY)
  reconnectAttempts++

  wsStatus.value = 'reconnecting'
  callbacks.onStatusChange?.('reconnecting')

  reconnectTimer = setTimeout(() => {
    connect(callbacks)
  }, delay)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Establish a WebSocket connection.
 * Calling this while already connected is a no-op unless force=true.
 */
export function connect(wsCallbacks: OcppWsCallbacks = {}, url = DEFAULT_URL, force = false): void {
  if (socket && socket.readyState === WebSocket.OPEN && !force) return

  // Store callbacks for reconnect use
  callbacks = wsCallbacks

  // Close existing socket if forcing reconnect
  if (force && socket) {
    intentionalClose = true
    socket.close()
    socket = null
    intentionalClose = false
  }

  intentionalClose = false
  wsStatus.value = 'connecting'
  callbacks.onStatusChange?.('connecting')

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = url.startsWith('ws') ? url : `${protocol}//${window.location.host}${url}`
    socket = new WebSocket(wsUrl)
  } catch {
    scheduleReconnect()
    return
  }

  socket.onopen = () => {
    reconnectAttempts = 0
    wsStatus.value = 'connected'
    startHeartbeat()
    callbacks.onOpen?.()
    callbacks.onStatusChange?.('connected')
  }

  socket.onclose = () => {
    stopHeartbeat()
    if (!intentionalClose) {
      wsStatus.value = 'disconnected'
      callbacks.onClose?.()
      scheduleReconnect()
    } else {
      wsStatus.value = 'disconnected'
      callbacks.onClose?.()
    }
  }

  socket.onerror = (event) => {
    callbacks.onError?.(event)
  }

  socket.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string)
      // Ignore pong responses
      if (data.type === 'pong') return
      callbacks.onMessage?.(data as OcppWsMessage)
    } catch {
      // Non-JSON messages are silently ignored
    }
  }
}

/**
 * Gracefully close the connection.
 * Does NOT trigger reconnect.
 */
export function disconnect(): void {
  intentionalClose = true
  stopHeartbeat()
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (socket) {
    socket.close()
    socket = null
  }
  reconnectAttempts = 0
  wsStatus.value = 'disconnected'
  callbacks.onStatusChange?.('disconnected')
}

/**
 * Send a typed message through the socket.
 */
export function send(data: Record<string, unknown>): boolean {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data))
    return true
  }
  return false
}

/**
 * Whether the socket is currently open.
 */
export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN
}
