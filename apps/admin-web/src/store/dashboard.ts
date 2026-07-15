import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/api'
import type { DashboardStats, ChartData, Order } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats>({
    stationCount: 0,
    deviceCount: 0,
    onlineDeviceCount: 0,
    todayOrderCount: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    totalEnergy: 0,
    todayEnergy: 0,
  })
  const chartData = ref<ChartData>({ dates: [], orderCounts: [], revenues: [], energies: [] })
  const recentOrders = ref<Order[]>([])
  const stationRank = ref<any[]>([])
  const todoCounts = ref<any>({
    pendingAlerts: 0,
    pendingWorkOrders: 0,
    settledOrders: 0,
    refundingOrders: 0,
  })
  const loading = ref(false)

  async function fetchStats() {
    loading.value = true
    try {
      stats.value = await dashboardApi.getStats()
    } finally {
      loading.value = false
    }
  }

  async function fetchChartData(days?: number) {
    chartData.value = await dashboardApi.getChartData(days)
  }

  async function fetchRecentOrders(limit?: number) {
    recentOrders.value = await dashboardApi.getRecentOrders(limit)
  }

  async function fetchStationRank(limit?: number) {
    stationRank.value = await dashboardApi.getStationRank({ limit })
  }

  async function fetchTodoCounts() {
    todoCounts.value = await dashboardApi.getTodoCounts()
  }

  async function fetchAll() {
    loading.value = true
    try {
      await Promise.all([
        fetchStats(),
        fetchChartData(7),
        fetchRecentOrders(5),
        fetchStationRank(5),
        fetchTodoCounts(),
      ])
    } finally {
      loading.value = false
    }
  }

  return {
    stats, chartData, recentOrders, stationRank, todoCounts, loading,
    fetchStats, fetchChartData, fetchRecentOrders, fetchStationRank, fetchTodoCounts, fetchAll,
  }
})
