import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'
import type { Order, OrderDetailData } from '@/types'

export const useOrderStore = defineStore('order', () => {
  // ==================== 状态 ====================
  const orders = ref<Order[]>([])
  const currentOrder = ref<OrderDetailData | null>(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const currentPage = ref(1)
  const allLoaded = ref(false)
  const statusFilter = ref('')

  // ==================== Actions ====================

  /**
   * 获取订单列表
   * @param reset 是否重置分页（默认 true）
   */
  async function fetchOrders(reset = true): Promise<void> {
    if (loading.value) return

    loading.value = true
    try {
      if (reset) {
        currentPage.value = 1
        allLoaded.value = false
      }

      const params: Record<string, any> = {
        page: currentPage.value,
        size: 10,
      }
      if (statusFilter.value) {
        params.status = statusFilter.value
      }

      const result = await api.getOrders(params).catch(() => [])

      if (reset) {
        orders.value = result
      } else {
        orders.value.push(...result)
      }

      if (result.length < 10) {
        allLoaded.value = true
      }
    } catch (error) {
      console.error('[orderStore] 加载订单列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载更多订单
   */
  async function loadMore(): Promise<void> {
    if (loadingMore.value || allLoaded.value || loading.value) return

    loadingMore.value = true
    try {
      currentPage.value++
      await fetchOrders(false)
    } finally {
      loadingMore.value = false
    }
  }

  /**
   * 按状态筛选订单
   */
  async function filterByStatus(status: string): Promise<void> {
    statusFilter.value = status
    await fetchOrders(true)
  }

  /**
   * 获取订单详情
   */
  async function fetchOrderDetail(orderId: string): Promise<OrderDetailData | null> {
    loading.value = true
    try {
      const data = await api.getOrderDetail(orderId)
      if (data) {
        currentOrder.value = {
          id: '',
          orderNo: '',
          stationName: '',
          stationAddress: '',
          deviceCode: '',
          connectorId: '',
          status: '',
          startTime: '',
          endTime: '',
          duration: 0,
          totalEnergy: 0,
          socStart: 0,
          socEnd: 0,
          electricityFee: 0,
          serviceFee: 0,
          couponDiscount: 0,
          memberDiscount: 0,
          actualAmount: 0,
          originalAmount: 0,
          powerCurve: [],
          timeSegments: [],
          ecoData: { co2Offset: 0, treeEquivalent: 0 },
          pointsEarned: 0,
          ...data,
        }
        return currentOrder.value
      }
      return null
    } catch (error) {
      console.error('[orderStore] 加载订单详情失败:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 支付订单
   */
  async function payOrder(orderId: string): Promise<any> {
    loading.value = true
    try {
      const result = await api.payOrder(orderId)
      return result
    } catch (error) {
      console.error('[orderStore] 支付订单失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 申请退款
   */
  async function requestRefund(orderId: string): Promise<any> {
    loading.value = true
    try {
      const result = await api.requestRefund(orderId)
      // 更新本地订单状态
      if (currentOrder.value?.id === orderId) {
        currentOrder.value.status = 'REFUNDING'
      }
      const idx = orders.value.findIndex(o => o.id === orderId)
      if (idx >= 0) {
        orders.value[idx] = { ...orders.value[idx], status: 'REFUNDING' }
      }
      return result
    } catch (error) {
      console.error('[orderStore] 申请退款失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 清空当前订单详情
   */
  function clearCurrentOrder(): void {
    currentOrder.value = null
  }

  /**
   * 重置所有状态
   */
  function reset(): void {
    orders.value = []
    currentOrder.value = null
    loading.value = false
    loadingMore.value = false
    currentPage.value = 1
    allLoaded.value = false
    statusFilter.value = ''
  }

  return {
    // state
    orders,
    currentOrder,
    loading,
    loadingMore,
    currentPage,
    allLoaded,
    statusFilter,
    // actions
    fetchOrders,
    loadMore,
    filterByStatus,
    fetchOrderDetail,
    payOrder,
    requestRefund,
    clearCurrentOrder,
    reset,
  }
})
