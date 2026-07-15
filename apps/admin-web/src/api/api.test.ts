import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardApi, stationApi, orderApi } from './index'

// Mock request module
vi.mock('./request', () => ({
  get: vi.fn().mockResolvedValue({ data: 'test' }),
  post: vi.fn().mockResolvedValue({ data: 'test' }),
  put: vi.fn().mockResolvedValue({ data: 'test' }),
  del: vi.fn().mockResolvedValue({ data: 'test' }),
}))

describe('API Modules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('dashboardApi', () => {
    it('getStats 应调用 GET /dashboard/overview', async () => {
      const { get } = await import('./request')
      await dashboardApi.getStats()
      expect(get).toHaveBeenCalledWith('/dashboard/overview')
    })

    it('getChartData 应传递 days 参数', async () => {
      const { get } = await import('./request')
      await dashboardApi.getChartData(7)
      expect(get).toHaveBeenCalledWith('/dashboard/trend', { days: 7 })
    })

    it('getRecentOrders 应传递 limit 参数', async () => {
      const { get } = await import('./request')
      await dashboardApi.getRecentOrders(5)
      expect(get).toHaveBeenCalledWith('/dashboard/recent-orders', { limit: 5 })
    })

    it('getStationRank 应传递参数', async () => {
      const { get } = await import('./request')
      await dashboardApi.getStationRank({ limit: 5, sortBy: 'revenue' })
      expect(get).toHaveBeenCalledWith('/dashboard/station-rank', { limit: 5, sortBy: 'revenue' })
    })

    it('getTodoCounts 应调用正确端点', async () => {
      const { get } = await import('./request')
      await dashboardApi.getTodoCounts()
      expect(get).toHaveBeenCalledWith('/dashboard/todo-counts')
    })
  })

  describe('stationApi', () => {
    it('list 应调用 GET /stations', async () => {
      const { get } = await import('./request')
      await stationApi.list({ page: 1, size: 10 })
      expect(get).toHaveBeenCalledWith('/stations', { page: 1, size: 10 })
    })

    it('create 应调用 POST /stations', async () => {
      const { post } = await import('./request')
      const data = { name: 'Test Station', code: 'ST-001' }
      await stationApi.create(data)
      expect(post).toHaveBeenCalledWith('/stations', data)
    })
  })

  describe('orderApi', () => {
    it('list 应调用 GET /orders', async () => {
      const { get } = await import('./request')
      await orderApi.list({ page: 1, status: 'PAID' })
      expect(get).toHaveBeenCalledWith('/orders', { page: 1, status: 'PAID' })
    })

    it('detail 应传递 id', async () => {
      const { get } = await import('./request')
      await orderApi.detail('ORD-001')
      expect(get).toHaveBeenCalledWith('/orders/ORD-001')
    })

    it('refund 应调用 POST', async () => {
      const { post } = await import('./request')
      await orderApi.refund('ORD-001', 1000, '用户申请')
      expect(post).toHaveBeenCalledWith('/orders/ORD-001/refund', { amount: 1000, reason: '用户申请' })
    })
  })
})
