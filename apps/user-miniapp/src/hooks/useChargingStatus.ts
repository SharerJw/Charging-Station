/**
 * 充电状态 Hook
 * 用于订阅和管理充电状态更新
 */

import { ref, onUnmounted } from 'vue'
import WebSocketManager, { MessageType, ConnectionState } from '../utils/websocket'

// 充电状态接口
export interface ChargingStatus {
  orderId: string
  stationName: string
  deviceCode: string
  status: 'charging' | 'completed' | 'stopped' | 'error'
  currentSoc: number
  power: number
  energy: number
  duration: number
  cost: number
  startTime: string
  lastUpdateTime: string
}

// Hook 返回值接口
export interface UseChargingStatusReturn {
  /** 当前充电状态 */
  chargingStatus: ReturnType<typeof ref<ChargingStatus | null>>
  /** 是否正在充电 */
  isCharging: ReturnType<typeof ref<boolean>>
  /** 连接状态 */
  connectionState: ReturnType<typeof ref<ConnectionState>>
  /** 是否已连接 */
  isConnected: ReturnType<typeof ref<boolean>>
  /** 连接 WebSocket */
  connect: (url: string) => void
  /** 断开连接 */
  disconnect: () => void
  /** 订阅充电状态更新 */
  subscribeChargingStatus: (callback: (status: ChargingStatus) => void) => () => void
  /** 发送消息 */
  send: (data: Record<string, unknown>) => void
}

/**
 * 充电状态 Hook
 * @param wsUrl WebSocket 地址（可选，如果已经在其他地方初始化了 WebSocketManager 则不需要）
 */
export function useChargingStatus(wsUrl?: string): UseChargingStatusReturn {
  const chargingStatus = ref<ChargingStatus | null>(null)
  const isCharging = ref(false)
  const connectionState = ref<ConnectionState>(ConnectionState.DISCONNECTED)
  const isConnected = ref(false)

  // 获取 WebSocket 管理器实例
  const getManager = () => {
    if (wsUrl) {
      return WebSocketManager.getInstance({ url: wsUrl })
    }
    // 如果没有提供 URL，尝试获取已存在的实例
    try {
      return WebSocketManager.getInstance()
    } catch {
      console.warn('[useChargingStatus] WebSocketManager 未初始化，请先调用 connect 或提供 wsUrl')
      return null
    }
  }

  // 订阅连接状态变化
  let unsubscribeConnected: (() => void) | null = null
  let unsubscribeDisconnected: (() => void) | null = null
  let unsubscribeCharging: (() => void) | null = null
  let unsubscribeOrder: (() => void) | null = null

  /**
   * 连接 WebSocket
   */
  const connect = (url: string) => {
    const manager = WebSocketManager.getInstance({ url })
    connectionState.value = manager.getState()
    isConnected.value = manager.isConnected()

    // 订阅连接状态变化
    unsubscribeConnected = manager.subscribe(MessageType.CONNECTED, () => {
      connectionState.value = ConnectionState.CONNECTED
      isConnected.value = true
    })

    unsubscribeDisconnected = manager.subscribe(MessageType.DISCONNECTED, () => {
      connectionState.value = ConnectionState.DISCONNECTED
      isConnected.value = false
    })

    // 订阅充电状态更新
    unsubscribeCharging = manager.subscribe(MessageType.CHARGING_STATUS, (data) => {
      const status = data as unknown as ChargingStatus
      chargingStatus.value = status
      isCharging.value = status.status === 'charging'
    })

    // 订阅订单状态更新
    unsubscribeOrder = manager.subscribe(MessageType.ORDER_STATUS, (data) => {
      console.log('[useChargingStatus] 订单状态更新:', data)
      // 可以在这里处理订单状态变化
    })

    // 建立连接
    manager.connect()
  }

  /**
   * 断开连接
   */
  const disconnect = () => {
    const manager = getManager()
    if (manager) {
      manager.disconnect()
    }
    cleanup()
  }

  /**
   * 订阅充电状态更新
   */
  const subscribeChargingStatus = (callback: (status: ChargingStatus) => void): (() => void) => {
    const manager = getManager()
    if (!manager) {
      return () => {}
    }

    return manager.subscribe(MessageType.CHARGING_STATUS, (data) => {
      const status = data as unknown as ChargingStatus
      callback(status)
    })
  }

  /**
   * 发送消息
   */
  const send = (data: Record<string, unknown>) => {
    const manager = getManager()
    if (manager) {
      manager.send(data)
    }
  }

  /**
   * 清理订阅
   */
  const cleanup = () => {
    if (unsubscribeConnected) {
      unsubscribeConnected()
      unsubscribeConnected = null
    }
    if (unsubscribeDisconnected) {
      unsubscribeDisconnected()
      unsubscribeDisconnected = null
    }
    if (unsubscribeCharging) {
      unsubscribeCharging()
      unsubscribeCharging = null
    }
    if (unsubscribeOrder) {
      unsubscribeOrder()
      unsubscribeOrder = null
    }
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    chargingStatus,
    isCharging,
    connectionState,
    isConnected,
    connect,
    disconnect,
    subscribeChargingStatus,
    send,
  }
}

export default useChargingStatus