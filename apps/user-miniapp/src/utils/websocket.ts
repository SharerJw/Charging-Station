/**
 * WebSocket 管理器
 * 支持自动重连、心跳检测、事件订阅/取消订阅
 */

// 消息类型枚举
export enum MessageType {
  CHARGING_STATUS = 'CHARGING_STATUS',
  ORDER_STATUS = 'ORDER_STATUS',
  ALERT = 'ALERT',
  PONG = 'PONG',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

// WebSocket 连接状态
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}

// 消息接口
export interface WebSocketMessage {
  type: MessageType
  data: Record<string, unknown>
  timestamp: number
}

// 事件回调类型
type EventCallback = (data: Record<string, unknown>) => void

// 配置接口
interface WebSocketConfig {
  url: string
  heartbeatInterval?: number
  maxReconnectAttempts?: number
  reconnectBaseDelay?: number
  reconnectMaxDelay?: number
}

class WebSocketManager {
  private static instance: WebSocketManager | null = null
  private ws: UniApp.SocketTask | null = null
  private config: WebSocketConfig
  private state: ConnectionState = ConnectionState.DISCONNECTED
  private reconnectAttempts = 0
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private eventListeners: Map<MessageType, Set<EventCallback>> = new Map()
  private messageQueue: WebSocketMessage[] = []

  private constructor(config: WebSocketConfig) {
    this.config = {
      heartbeatInterval: 30000,
      maxReconnectAttempts: 5,
      reconnectBaseDelay: 1000,
      reconnectMaxDelay: 30000,
      ...config,
    }
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: WebSocketConfig): WebSocketManager {
    if (!WebSocketManager.instance) {
      if (!config) {
        throw new Error('WebSocketManager 初始化需要提供配置')
      }
      WebSocketManager.instance = new WebSocketManager(config)
    }
    return WebSocketManager.instance
  }

  /**
   * 重置单例实例（用于测试或重新初始化）
   */
  static resetInstance(): void {
    if (WebSocketManager.instance) {
      WebSocketManager.instance.disconnect()
      WebSocketManager.instance = null
    }
  }

  /**
   * 获取当前连接状态
   */
  getState(): ConnectionState {
    return this.state
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED
  }

  /**
   * 建立连接
   */
  connect(): void {
    if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
      console.log('[WebSocket] 已连接或正在连接中，跳过')
      return
    }

    this.state = ConnectionState.CONNECTING
    console.log('[WebSocket] 正在连接:', this.config.url)

    try {
      this.ws = uni.connectSocket({
        url: this.config.url,
        success: () => {
          console.log('[WebSocket] 连接请求已发送')
        },
        fail: (err) => {
          console.error('[WebSocket] 连接失败:', err)
          this.state = ConnectionState.DISCONNECTED
          this.scheduleReconnect()
        },
      })

      this.setupEventHandlers()
    } catch (error) {
      console.error('[WebSocket] 连接异常:', error)
      this.state = ConnectionState.DISCONNECTED
      this.scheduleReconnect()
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onOpen(() => {
      console.log('[WebSocket] 连接成功')
      this.state = ConnectionState.CONNECTED
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.flushMessageQueue()
      this.emitEvent(MessageType.CONNECTED, {})
    })

    this.ws.onMessage((res) => {
      try {
        const message = JSON.parse(res.data as string) as WebSocketMessage
        console.log('[WebSocket] 收到消息:', message.type)

        // 处理 PONG 消息
        if (message.type === MessageType.PONG) {
          console.log('[WebSocket] 收到心跳响应')
          return
        }

        // 分发消息到订阅者
        this.emitEvent(message.type, message.data)
      } catch (error) {
        console.error('[WebSocket] 消息解析失败:', error)
      }
    })

    this.ws.onClose((res) => {
      console.log('[WebSocket] 连接关闭:', res.code, res.reason)
      this.state = ConnectionState.DISCONNECTED
      this.stopHeartbeat()
      this.emitEvent(MessageType.DISCONNECTED, { code: res.code, reason: res.reason })

      // 非正常关闭时尝试重连
      if (res.code !== 1000) {
        this.scheduleReconnect()
      }
    })

    this.ws.onError((err) => {
      console.error('[WebSocket] 连接错误:', err)
      this.state = ConnectionState.DISCONNECTED
      this.stopHeartbeat()
      this.emitEvent(MessageType.ERROR, { error: err })
      this.scheduleReconnect()
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.stopHeartbeat()
    this.clearReconnectTimer()
    this.reconnectAttempts = 0

    if (this.ws) {
      this.ws.close({
        code: 1000,
        reason: '主动断开',
        success: () => {
          console.log('[WebSocket] 已主动断开连接')
        },
      })
      this.ws = null
    }

    this.state = ConnectionState.DISCONNECTED
  }

  /**
   * 发送消息
   */
  send(data: Record<string, unknown>): void {
    const message: WebSocketMessage = {
      type: data.type as MessageType || MessageType.CHARGING_STATUS,
      data,
      timestamp: Date.now(),
    }

    if (this.state !== ConnectionState.CONNECTED) {
      console.log('[WebSocket] 未连接，消息加入队列')
      this.messageQueue.push(message)
      return
    }

    this.ws?.send({
      data: JSON.stringify(message),
      success: () => {
        console.log('[WebSocket] 消息发送成功')
      },
      fail: (err) => {
        console.error('[WebSocket] 消息发送失败:', err)
        this.messageQueue.push(message)
      },
    })
  }

  /**
   * 刷新消息队列
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.ws?.send({
          data: JSON.stringify(message),
          fail: (err) => {
            console.error('[WebSocket] 队列消息发送失败:', err)
            this.messageQueue.unshift(message)
            break
          },
        })
      }
    }
  }

  /**
   * 订阅事件
   */
  subscribe(type: MessageType, callback: EventCallback): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type)!.add(callback)

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(type, callback)
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(type: MessageType, callback: EventCallback): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.eventListeners.delete(type)
      }
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(type: MessageType, data: Record<string, unknown>): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[WebSocket] 事件回调执行错误 (${type}):`, error)
        }
      })
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.state === ConnectionState.CONNECTED) {
        this.send({ type: MessageType.PONG, timestamp: Date.now() })
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer()

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.log('[WebSocket] 达到最大重连次数，停止重连')
      return
    }

    this.state = ConnectionState.RECONNECTING
    const delay = Math.min(
      this.config.reconnectBaseDelay! * Math.pow(2, this.reconnectAttempts),
      this.config.reconnectMaxDelay!
    )

    console.log(`[WebSocket] 将在 ${delay}ms 后重连 (第 ${this.reconnectAttempts + 1} 次)`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

export default WebSocketManager