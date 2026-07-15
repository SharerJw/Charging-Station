import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from './dashboard'

// Mock API
vi.mock('@/api', () => ({
  dashboardApi: {
    getStats: vi.fn().mockResolvedValue({
      stationCount: 100,
      deviceCount: 500,
      onlineDeviceCount: 450,
      todayOrderCount: 1234,
      todayRevenue: 567800,
      monthRevenue: 12345678,
      totalEnergy: 9876543,
      todayEnergy: 123456,
    }),
    getChartData: vi.fn().mockResolvedValue({
      dates: ['01/01', '01/02'],
      orderCounts: [100, 120],
      revenues: [5000, 6000],
      energies: [3000, 3500],
    }),
    getRecentOrders: vi.fn().mockResolvedValue([
      { id: '1', orderNo: 'ORD-001', status: 'PAID' },
      { id: '2', orderNo: 'ORD-002', status: 'CHARGING' },
    ]),
    getStationRank: vi.fn().mockResolvedValue([
      { stationId: '1', stationName: 'Station A', revenue: 100000 },
    ]),
    getTodoCounts: vi.fn().mockResolvedValue({
      pendingAlerts: 5,
      pendingWorkOrders: 3,
      settledOrders: 10,
      refundingOrders: 2,
    }),
  },
}))

describe('useDashboardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态应为空', () => {
    const store = useDashboardStore()
    expect(store.stats.stationCount).toBe(0)
    expect(store.stats.deviceCount).toBe(0)
    expect(store.loading).toBe(false)
  })

  it('fetchStats 应更新统计数据', async () => {
    const store = useDashboardStore()
    await store.fetchStats()
    expect(store.stats.stationCount).toBe(100)
    expect(store.stats.deviceCount).toBe(500)
    expect(store.stats.todayOrderCount).toBe(1234)
  })

  it('fetchChartData 应更新图表数据', async () => {
    const store = useDashboardStore()
    await store.fetchChartData(7)
    expect(store.chartData.dates).toHaveLength(2)
    expect(store.chartData.orderCounts).toHaveLength(2)
  })

  it('fetchRecentOrders 应更新最近订单', async () => {
    const store = useDashboardStore()
    await store.fetchRecentOrders(5)
    expect(store.recentOrders).toHaveLength(2)
    expect(store.recentOrders[0].orderNo).toBe('ORD-001')
  })

  it('fetchStationRank 应更新站点排行', async () => {
    const store = useDashboardStore()
    await store.fetchStationRank(5)
    expect(store.stationRank).toHaveLength(1)
    expect(store.stationRank[0].stationName).toBe('Station A')
  })

  it('fetchTodoCounts 应更新待办事项', async () => {
    const store = useDashboardStore()
    await store.fetchTodoCounts()
    expect(store.todoCounts.pendingAlerts).toBe(5)
    expect(store.todoCounts.settledOrders).toBe(10)
  })

  it('fetchAll 应并行加载所有数据', async () => {
    const store = useDashboardStore()
    await store.fetchAll()
    expect(store.stats.stationCount).toBe(100)
    expect(store.chartData.dates).toHaveLength(2)
    expect(store.recentOrders).toHaveLength(2)
    expect(store.stationRank).toHaveLength(1)
    expect(store.todoCounts.pendingAlerts).toBe(5)
  })

  it('loading 状态应正确切换', async () => {
    const store = useDashboardStore()
    expect(store.loading).toBe(false)
    const promise = store.fetchAll()
    expect(store.loading).toBe(true)
    await promise
    expect(store.loading).toBe(false)
  })
})
