import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'

export interface InspectionTask {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  stationName?: string
  assignee?: string
  scheduledDate: string
  completedDate?: string
  items: InspectionItem[]
}

export interface InspectionItem {
  id: string
  name: string
  result: 'pass' | 'fail' | 'skip' | null
  remark?: string
}

export const useInspectionStore = defineStore('inspection', () => {
  const inspections = ref<InspectionTask[]>([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const currentInspection = ref<InspectionTask | null>(null)

  async function fetchInspections(params?: Record<string, any>) {
    loading.value = true
    try {
      const res = await api.getInspections({ page: currentPage.value, size: pageSize.value, ...params })
      inspections.value = res.records || res
      total.value = res.total || 0
    } catch (error) {
      console.error('获取巡检列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchInspectionDetail(id: string) {
    loading.value = true
    try {
      const res = await api.getInspectionDetail(id)
      currentInspection.value = res
      return res
    } catch (error) {
      console.error('获取巡检详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function submitInspection(id: string, data: any) {
    try {
      await api.submitInspection(id, data)
      const index = inspections.value.findIndex(i => i.id === id)
      if (index !== -1) {
        inspections.value[index].status = 'completed'
      }
      uni.showToast({ title: '提交成功', icon: 'success' })
    } catch (error) {
      console.error('提交巡检失败:', error)
      throw error
    }
  }

  async function submitInspectionItems(id: string, data: any) {
    try {
      await api.submitInspectionItems(id, data)
      uni.showToast({ title: '保存成功', icon: 'success' })
    } catch (error) {
      console.error('保存巡检项失败:', error)
      throw error
    }
  }

  function setPage(page: number) {
    currentPage.value = page
  }

  function reset() {
    inspections.value = []
    total.value = 0
    currentPage.value = 1
    currentInspection.value = null
  }

  return {
    inspections, loading, total, currentPage, pageSize, currentInspection,
    fetchInspections, fetchInspectionDetail, submitInspection, submitInspectionItems,
    setPage, reset,
  }
})
