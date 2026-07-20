import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export interface Workorder {
  id: string
  orderId: string
  title: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'pending' | 'accepted' | 'processing' | 'completed' | 'closed'
  stationName?: string
  assignee?: string
  deadline?: string
  createdAt: string
  updatedAt: string
}

export const useWorkorderStore = defineStore('workorder', () => {
  const workorders = ref<Workorder[]>([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  const pendingWorkorders = computed(() => workorders.value.filter(w => w.status === 'pending'))
  const myWorkorders = computed(() => workorders.value.filter(w => w.status === 'processing' || w.status === 'accepted'))

  async function fetchWorkorders(params?: Record<string, any>) {
    loading.value = true
    try {
      const res = await api.getWorkorders({ page: currentPage.value, size: pageSize.value, ...params })
      workorders.value = res.records || res
      total.value = res.total || 0
    } catch (error) {
      console.error('获取工单列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  async function acceptWorkorder(id: string) {
    try {
      await api.acceptWorkorder(id)
      const index = workorders.value.findIndex(w => w.id === id)
      if (index !== -1) {
        workorders.value[index].status = 'accepted'
      }
      uni.showToast({ title: '接单成功', icon: 'success' })
    } catch (error) {
      console.error('接单失败:', error)
      throw error
    }
  }

  async function completeWorkorder(id: string, data: any) {
    try {
      await api.completeWorkorder(id, data)
      const index = workorders.value.findIndex(w => w.id === id)
      if (index !== -1) {
        workorders.value[index].status = 'completed'
      }
      uni.showToast({ title: '完成工单', icon: 'success' })
    } catch (error) {
      console.error('完成工单失败:', error)
      throw error
    }
  }

  function setPage(page: number) {
    currentPage.value = page
  }

  function reset() {
    workorders.value = []
    total.value = 0
    currentPage.value = 1
  }

  return {
    workorders, loading, total, currentPage, pageSize,
    pendingWorkorders, myWorkorders,
    fetchWorkorders, acceptWorkorder, completeWorkorder, setPage, reset,
  }
})
