import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardApi, stationApi, deviceApi, orderApi, userApi, financeApi, authApi } from './index'

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

  describe('authApi', () => {
    it('login 应调用 POST /auth/login', async () => {
      const { post } = await import('./request')
      await authApi.login({ username: 'admin', password: '123456' })
      expect(post).toHaveBeenCalledWith('/auth/login', { username: 'admin', password: '123456' })
    })

    it('logout 应调用 POST /auth/logout', async () => {
      const { post } = await import('./request')
      await authApi.logout()
      expect(post).toHaveBeenCalledWith('/auth/logout')
    })

    it('profile 应调用 GET /auth/profile', async () => {
      const { get } = await import('./request')
      await authApi.profile()
      expect(get).toHaveBeenCalledWith('/auth/profile')
    })
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

    it('detail 应传递 id', async () => {
      const { get } = await import('./request')
      await stationApi.detail('S001')
      expect(get).toHaveBeenCalledWith('/stations/S001')
    })

    it('create 应调用 POST /stations', async () => {
      const { post } = await import('./request')
      const data = { name: 'Test Station', code: 'ST-001' }
      await stationApi.create(data)
      expect(post).toHaveBeenCalledWith('/stations', data)
    })

    it('update 应调用 PUT /stations/:id', async () => {
      const { put } = await import('./request')
      const data = { name: 'Updated Station' }
      await stationApi.update('S001', data)
      expect(put).toHaveBeenCalledWith('/stations/S001', data)
    })

    it('delete 应调用 DELETE /stations/:id', async () => {
      const { del } = await import('./request')
      await stationApi.delete('S001')
      expect(del).toHaveBeenCalledWith('/stations/S001')
    })

    it('updateStatus 应调用 PUT', async () => {
      const { put } = await import('./request')
      await stationApi.updateStatus('S001', 'ACTIVE')
      expect(put).toHaveBeenCalledWith('/stations/S001/status', { status: 'ACTIVE' })
    })
  })

  describe('deviceApi', () => {
    it('list 应调用 GET /devices', async () => {
      const { get } = await import('./request')
      await deviceApi.list({ stationId: 'S001' })
      expect(get).toHaveBeenCalledWith('/devices', { stationId: 'S001' })
    })

    it('detail 应传递 id', async () => {
      const { get } = await import('./request')
      await deviceApi.detail('D001')
      expect(get).toHaveBeenCalledWith('/devices/D001')
    })

    it('update 应调用 PUT', async () => {
      const { put } = await import('./request')
      await deviceApi.update('D001', { name: 'Updated Device' })
      expect(put).toHaveBeenCalledWith('/devices/D001', { name: 'Updated Device' })
    })

    it('reset 应调用 POST', async () => {
      const { post } = await import('./request')
      await deviceApi.reset('D001')
      expect(post).toHaveBeenCalledWith('/devices/D001/reset')
    })

    it('unlock 应调用 POST', async () => {
      const { post } = await import('./request')
      await deviceApi.unlock('D001', 1)
      expect(post).toHaveBeenCalledWith('/devices/D001/connectors/1/unlock')
    })

    it('stationDevices 应调用正确端点', async () => {
      const { get } = await import('./request')
      await deviceApi.stationDevices('S001')
      expect(get).toHaveBeenCalledWith('/stations/S001/devices')
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

  describe('userApi', () => {
    it('list 应调用 GET /users', async () => {
      const { get } = await import('./request')
      await userApi.list({ page: 1 })
      expect(get).toHaveBeenCalledWith('/users', { page: 1 })
    })

    it('detail 应传递 id', async () => {
      const { get } = await import('./request')
      await userApi.detail('U001')
      expect(get).toHaveBeenCalledWith('/users/U001')
    })

    it('updateStatus 应调用 PUT', async () => {
      const { put } = await import('./request')
      await userApi.updateStatus('U001', 'ACTIVE')
      expect(put).toHaveBeenCalledWith('/users/U001/status', { status: 'ACTIVE' })
    })
  })

  describe('financeApi', () => {
    it('summary 应调用 GET /finance/overview', async () => {
      const { get } = await import('./request')
      await financeApi.summary({ startTime: '2026-01-01', endTime: '2026-07-15' })
      expect(get).toHaveBeenCalledWith('/finance/overview', { startTime: '2026-01-01', endTime: '2026-07-15' })
    })

    it('bills 应调用 GET /finance/transactions', async () => {
      const { get } = await import('./request')
      await financeApi.bills({ page: 1 })
      expect(get).toHaveBeenCalledWith('/finance/transactions', { page: 1 })
    })

    it('settlements 应调用 GET /finance/settlement', async () => {
      const { get } = await import('./request')
      await financeApi.settlements({ page: 1 })
      expect(get).toHaveBeenCalledWith('/finance/settlement', { page: 1 })
    })
  })
})
