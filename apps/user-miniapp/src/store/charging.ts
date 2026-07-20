import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'
import type { ChargingSession } from '@/types'

export const useChargingStore = defineStore('charging', () => {
  // ==================== 状态 ====================
  const currentSession = ref<ChargingSession | null>(null)
  const loading = ref(false)
  const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null)

  // ==================== 计算属性 ====================

  /** 是否正在充电 */
  const isCharging = computed(() => {
    return currentSession.value?.status === 'charging'
  })

  /** 充电进度（SOC 百分比） */
  const progress = computed(() => {
    return currentSession.value?.currentSoc ?? 0
  })

  /** 当前功率 */
  const currentPower = computed(() => {
    return currentSession.value?.power ?? 0
  })

  /** 预估充满时间 */
  const estimatedFullTime = computed(() => {
    if (!currentSession.value) return ''
    const remainingSoc = 100 - currentSession.value.currentSoc
    if (remainingSoc <= 0) return '即将'
    const power = currentSession.value.power || 60
    const estimatedMinutes = Math.round((remainingSoc / 100) * 60 * (60 / power))
    if (estimatedMinutes < 60) return `${estimatedMinutes}分钟`
    const hours = Math.floor(estimatedMinutes / 60)
    const mins = estimatedMinutes % 60
    return `${hours}小时${mins}分钟`
  })

  // ==================== Actions ====================

  /**
   * 查询当前充电状态
   * @param orderId 订单 ID，不传则查询当前充电会话
   */
  async function fetchStatus(orderId = 'current'): Promise<ChargingSession | null> {
    loading.value = true
    try {
      const session = await api.getChargingStatus(orderId)
      if (session && session.status === 'charging') {
        currentSession.value = session
        return session
      }
      currentSession.value = null
      return null
    } catch {
      currentSession.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 启动充电
   */
  async function startCharging(params: {
    stationId: string
    deviceCode: string
    connectorId: string
  }): Promise<ChargingSession | null> {
    loading.value = true
    try {
      const result = await api.startCharging(params)
      if (result) {
        currentSession.value = result as ChargingSession
        return currentSession.value
      }
      return null
    } catch (error) {
      console.error('[chargingStore] 启动充电失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 停止充电
   */
  async function stopCharging(orderId: string): Promise<ChargingSession | null> {
    loading.value = true
    try {
      const result = await api.stopCharging(orderId)
      currentSession.value = result
      return result
    } catch (error) {
      console.error('[chargingStore] 停止充电失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 开始轮询充电状态（每 3 秒刷新一次）
   */
  function startPolling(orderId = 'current'): void {
    stopPolling()
    // 立即查询一次
    fetchStatus(orderId)
    pollingTimer.value = setInterval(() => {
      fetchStatus(orderId)
    }, 3000)
  }

  /**
   * 停止轮询
   */
  function stopPolling(): void {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value)
      pollingTimer.value = null
    }
  }

  /**
   * 清空当前会话
   */
  function clearSession(): void {
    stopPolling()
    currentSession.value = null
  }

  return {
    // state
    currentSession,
    loading,
    // computed
    isCharging,
    progress,
    currentPower,
    estimatedFullTime,
    // actions
    fetchStatus,
    startCharging,
    stopCharging,
    startPolling,
    stopPolling,
    clearSession,
  }
})
