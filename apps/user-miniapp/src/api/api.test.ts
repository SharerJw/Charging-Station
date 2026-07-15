import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './index'

// Mock uni global
let lastRequest: any = null
global.uni = {
  getStorageSync: vi.fn().mockReturnValue('mock-token'),
  request: vi.fn().mockImplementation((options) => {
    lastRequest = options
    if (options.success) {
      options.success({
        statusCode: 200,
        data: {
          code: 0,
          data: { id: '1', nickname: '测试用户' },
        },
      })
    }
  }),
  showToast: vi.fn(),
  removeStorageSync: vi.fn(),
  navigateTo: vi.fn(),
} as any

describe('User MiniApp API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastRequest = null
  })

  describe('充电站相关', () => {
    it('getStations 应调用 GET /api/v1/stations', async () => {
      await api.getStations({ page: 1 })
      expect(lastRequest.url).toContain('/api/v1/stations')
      expect(lastRequest.method).toBe('GET')
    })

    it('getStationDetail 应传递 id', async () => {
      await api.getStationDetail('S001')
      expect(lastRequest.url).toContain('/api/v1/stations/S001')
    })
  })

  describe('充电相关', () => {
    it('startCharging 应调用 POST', async () => {
      await api.startCharging({ stationId: 'S001', deviceId: 'D001' })
      expect(lastRequest.url).toContain('/api/v1/charging/start')
      expect(lastRequest.method).toBe('POST')
    })

    it('stopCharging 应调用 POST', async () => {
      await api.stopCharging('ORD-001')
      expect(lastRequest.url).toContain('/api/v1/charging/ORD-001/stop')
      expect(lastRequest.method).toBe('POST')
    })

    it('getChargingStatus 应调用 GET', async () => {
      await api.getChargingStatus('ORD-001')
      expect(lastRequest.url).toContain('/api/v1/charging/ORD-001/status')
      expect(lastRequest.method).toBe('GET')
    })
  })

  describe('订单相关', () => {
    it('getOrders 应调用 GET /api/v1/orders', async () => {
      await api.getOrders({ page: 1, status: 'PAID' })
      expect(lastRequest.url).toContain('/api/v1/orders')
      expect(lastRequest.data).toEqual({ page: 1, status: 'PAID' })
    })

    it('getOrderDetail 应传递 id', async () => {
      await api.getOrderDetail('ORD-001')
      expect(lastRequest.url).toContain('/api/v1/orders/ORD-001')
    })
  })

  describe('用户相关', () => {
    it('login 应调用 POST /api/v1/auth/login', async () => {
      await api.login({ phone: '13800138000', code: '123456' })
      expect(lastRequest.url).toContain('/api/v1/auth/login')
      expect(lastRequest.method).toBe('POST')
      expect(lastRequest.data).toEqual({ phone: '13800138000', code: '123456' })
    })

    it('getUserInfo 应调用 GET /api/v1/user/profile', async () => {
      await api.getUserInfo()
      expect(lastRequest.url).toContain('/api/v1/user/profile')
      expect(lastRequest.method).toBe('GET')
    })
  })

  describe('认证处理', () => {
    it('应携带 Authorization token', async () => {
      await api.getUserInfo()
      expect(lastRequest.header.Authorization).toBe('Bearer mock-token')
    })

    it('无 token 时不应携带 Authorization', async () => {
      (uni.getStorageSync as any).mockReturnValueOnce('')
      await api.getUserInfo()
      expect(lastRequest.header.Authorization).toBe('')
    })

    it('401 响应应清除 token 并跳转登录', async () => {
      (uni.request as any).mockImplementationOnce((options: any) => {
        options.success({ statusCode: 401, data: { code: 0 } })
      })
      await expect(api.getUserInfo()).rejects.toThrow('未登录')
      expect(uni.removeStorageSync).toHaveBeenCalledWith('token')
      expect(uni.navigateTo).toHaveBeenCalledWith({ url: '/pages/login/index' })
    })

    it('非 200 响应应抛出错误', async () => {
      (uni.request as any).mockImplementationOnce((options: any) => {
        options.success({ statusCode: 500, data: { message: '服务器错误' } })
      })
      await expect(api.getUserInfo()).rejects.toThrow('服务器错误')
    })

    it('code 非 0 应显示 toast 并抛出错误', async () => {
      (uni.request as any).mockImplementationOnce((options: any) => {
        options.success({ statusCode: 200, data: { code: 1001, message: '参数错误' } })
      })
      await expect(api.getUserInfo()).rejects.toThrow('参数错误')
      expect(uni.showToast).toHaveBeenCalledWith({ title: '参数错误', icon: 'none' })
    })

    it('网络错误应抛出错误', async () => {
      (uni.request as any).mockImplementationOnce((options: any) => {
        options.fail({ errMsg: 'request:fail' })
      })
      await expect(api.getUserInfo()).rejects.toThrow()
    })
  })
})
