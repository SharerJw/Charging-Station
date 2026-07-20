import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export interface Alert {
  id: string
  level: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'pending' | 'processing' | 'resolved' | 'ignored'
  title: string
  description?: string
  stationName?: string
  deviceCode?: string
  createdAt: string
  updatedAt: string
}

export const useAlertStore = defineStore('alert', () => {
  const alerts = ref<Alert[]>([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  const pendingAlerts = computed(() => alerts.value.filter(a => a.status === 'pending'))
  const processingAlerts = computed(() => alerts.value.filter(a => a.status === 'processing'))

  async function fetchAlerts(params?: Record<string, any>) {
    loading.value = true
    try {
      const res = await api.getAlerts({ page: currentPage.value, size: pageSize.value, ...params })
      alerts.value = res.records || res
      total.value = res.total || 0
    } catch (error) {
      console.error('获取告警列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  async function handleAlert(id: string, data: any) {
    try {
      await api.handleAlert(id, data)
      const index = alerts.value.findIndex(a => a.id === id)
      if (index !== -1) {
        alerts.value[index].status = 'processing'
      }
      uni.showToast({ title: '处理成功', icon: 'success' })
    } catch (error) {
      console.error('处理告警失败:', error)
      throw error
    }
  }

  function setPage(page: number) {
    currentPage.value = page
  }

  function reset() {
    alerts.value = []
    total.value = 0
    currentPage.value = 1
  }

  return {
    alerts, loading, total, currentPage, pageSize,
    pendingAlerts, processingAlerts,
    fetchAlerts, handleAlert, setPage, reset,
  }
})
