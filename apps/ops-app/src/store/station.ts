import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export interface Station {
  id: string
  name: string
  address: string
  status: 'online' | 'offline' | 'maintenance'
  deviceCount: number
  onlineDeviceCount: number
  createdAt: string
}

export const useStationStore = defineStore('station', () => {
  const stations = ref<Station[]>([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const currentStation = ref<Station | null>(null)

  const onlineStations = computed(() => stations.value.filter(s => s.status === 'online'))
  const offlineStations = computed(() => stations.value.filter(s => s.status === 'offline'))

  async function fetchStations(params?: Record<string, any>) {
    loading.value = true
    try {
      const res = await api.getStations({ page: currentPage.value, size: pageSize.value, ...params })
      stations.value = res.records || res
      total.value = res.total || 0
    } catch (error) {
      console.error('获取站点列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchStationDetail(id: string) {
    loading.value = true
    try {
      const res = await api.getStationDetail(id)
      currentStation.value = res
      return res
    } catch (error) {
      console.error('获取站点详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  function setPage(page: number) {
    currentPage.value = page
  }

  function reset() {
    stations.value = []
    total.value = 0
    currentPage.value = 1
    currentStation.value = null
  }

  return {
    stations, loading, total, currentPage, pageSize, currentStation,
    onlineStations, offlineStations,
    fetchStations, fetchStationDetail, setPage, reset,
  }
})
