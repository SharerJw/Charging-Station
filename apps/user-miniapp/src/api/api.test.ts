import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './index'

// Mock uni global
global.uni = {
  getStorageSync: vi.fn().mockReturnValue('mock-token'),
  request: vi.fn().mockImplementation(({ success }) => {
    success({
      statusCode: 200,
      data: {
        code: 0,
        data: { id: '1', nickname: '测试用户' },
      },
    })
  }),
  showToast: vi.fn(),
  removeStorageSync: vi.fn(),
  navigateTo: vi.fn(),
} as any

describe('User MiniApp API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getStations 应调用正确端点', async () => {
    await api.getStations({ page: 1 })
    expect(uni.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/api/v1/stations'),
        method: 'GET',
      })
    )
  })

  it('login 应调用 POST /api/v1/auth/login', async () => {
    await api.login({ phone: '13800138000', code: '123456' })
    expect(uni.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/api/v1/auth/login'),
        method: 'POST',
        data: { phone: '13800138000', code: '123456' },
      })
    )
  })

  it('getUserInfo 应调用 GET /api/v1/user/profile', async () => {
    await api.getUserInfo()
    expect(uni.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/api/v1/user/profile'),
        method: 'GET',
      })
    )
  })

  it('getOrders 应调用 GET /api/v1/orders', async () => {
    await api.getOrders({ page: 1 })
    expect(uni.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/api/v1/orders'),
        method: 'GET',
      })
    )
  })

  it('startCharging 应调用 POST', async () => {
    await api.startCharging({ stationId: 'S001', deviceId: 'D001' })
    expect(uni.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/api/v1/charging/start'),
        method: 'POST',
      })
    )
  })

  it('应携带 Authorization token', async () => {
    await api.getUserInfo()
    expect(uni.request).toHaveBeenCalledWith(
      expect.objectContaining({
        header: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
      })
    )
  })
})
