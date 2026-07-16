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

  // --- getStations ---
  describe('getStations', () => {
    it('应调用 GET /api/v1/stations', async () => {
      await api.getStations({ page: 1 })
      expect(lastRequest.url).toContain('/api/v1/stations')
      expect(lastRequest.method).toBe('GET')
    })

    it('应将后端字段映射为 Station 接口', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: [
              {
                id: 'S001',
                name: '阳光充电站',
                address: '北京市朝阳区XX路',
                latitude: 39.9,
                longitude: 116.4,
                distance: 1200,
                availablePorts: 5,
                totalPorts: 10,
                electricityPrice: 1.2,
                servicePrice: 0.5,
              },
            ],
          },
        })
      })

      const stations = await api.getStations()
      expect(stations).toHaveLength(1)
      const s = stations[0]
      expect(s.id).toBe('S001')
      expect(s.name).toBe('阳光充电站')
      expect(s.availableCount).toBe(5)
      expect(s.totalCount).toBe(10)
      expect(s.electricityPrice).toBe(1.2)
      expect(s.servicePrice).toBe(0.5)
    })

    it('后端返回 { list: [...] } 时也应正确解析', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: { list: [{ id: 'S002', name: 'A站' }] },
          },
        })
      })
      const stations = await api.getStations()
      expect(stations).toHaveLength(1)
      expect(stations[0].id).toBe('S002')
    })
  })

  // --- getUserInfo ---
  describe('getUserInfo', () => {
    it('应调用 GET /api/v1/user/profile', async () => {
      await api.getUserInfo()
      expect(lastRequest.url).toContain('/api/v1/user/profile')
      expect(lastRequest.method).toBe('GET')
    })

    it('余额应从分转换为元 (÷100)', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: { id: '1', nickname: '用户A', balance: 5000, couponCount: 3 },
          },
        })
      })

      const user = await api.getUserInfo()
      expect(user.balance).toBe(50)
      expect(user.couponCount).toBe(3)
    })

    it('后端无 balance 字段时余额默认为 0', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({
          statusCode: 200,
          data: { code: 0, data: { id: '2' } },
        })
      })

      const user = await api.getUserInfo()
      expect(user.balance).toBe(0)
    })
  })

  // --- startCharging ---
  describe('startCharging', () => {
    it('应调用 POST /api/v1/charging/start 并携带完整参数', async () => {
      const payload = {
        stationId: 'S001',
        deviceCode: 'DEV-0001',
        connectorId: '1',
      }
      await api.startCharging(payload)
      expect(lastRequest.url).toContain('/api/v1/charging/start')
      expect(lastRequest.method).toBe('POST')
      expect(lastRequest.data).toEqual(payload)
    })
  })

  // --- getChargingStatus ---
  describe('getChargingStatus', () => {
    it('正常响应应返回 ChargingSession', async () => {
      const mockSession = {
        orderId: 'ORD-001',
        stationName: 'A站',
        deviceCode: 'DEV-0001',
        status: 'charging',
        currentSoc: 60,
        power: 60000,
        energy: 30000,
        duration: 1800,
        cost: 4500,
        startTime: '2026-07-16T10:00:00',
      }
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({ statusCode: 200, data: { code: 0, data: mockSession } })
      })

      const result = await api.getChargingStatus('ORD-001')
      expect(result).not.toBeNull()
      expect(result!.orderId).toBe('ORD-001')
      expect(result!.status).toBe('charging')
    })

    it('请求失败时应返回 null', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({
          statusCode: 200,
          data: { code: 1001, message: '订单不存在' },
        })
      })

      const result = await api.getChargingStatus('BAD-ID')
      expect(result).toBeNull()
    })

    it('网络错误时应返回 null', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.fail({ errMsg: 'request:fail timeout' })
      })

      const result = await api.getChargingStatus('ORD-002')
      expect(result).toBeNull()
    })
  })

  // --- getOrders ---
  describe('getOrders', () => {
    it('应调用 GET /api/v1/orders', async () => {
      await api.getOrders({ page: 1, status: 'PAID' })
      expect(lastRequest.url).toContain('/api/v1/orders')
      expect(lastRequest.data).toEqual({ page: 1, status: 'PAID' })
    })

    it('应映射后端字段到 Order 接口', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: [
              {
                id: '10',
                orderNo: 'ORD20260716',
                stationName: 'B站',
                status: 'completed',
                startTime: '2026-07-16T14:00:00',
                consumedEnergy: 35.5,
                totalAmount: 4260,
              },
            ],
          },
        })
      })

      const orders = await api.getOrders()
      expect(orders).toHaveLength(1)
      expect(orders[0].orderNo).toBe('ORD20260716')
      expect(orders[0].totalAmount).toBe(4260)
    })

    it('请求失败时应返回空数组', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({
          statusCode: 200,
          data: { code: 1001, message: '错误' },
        })
      })

      const orders = await api.getOrders()
      expect(orders).toEqual([])
    })
  })

  // --- 认证处理 ---
  describe('认证处理', () => {
    it('应携带 Authorization token', async () => {
      await api.getUserInfo()
      expect(lastRequest.header.Authorization).toBe('Bearer mock-token')
    })

    it('无 token 时不应携带 Authorization', async () => {
      ;(uni.getStorageSync as any).mockReturnValueOnce('')
      await api.getUserInfo()
      expect(lastRequest.header.Authorization).toBe('')
    })

    it('401 响应应清除 token 并跳转登录', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({ statusCode: 401, data: { code: 0 } })
      })
      await expect(api.getUserInfo()).rejects.toThrow('未登录')
      expect(uni.removeStorageSync).toHaveBeenCalledWith('token')
      expect(uni.navigateTo).toHaveBeenCalledWith({ url: '/pages/login/index' })
    })

    it('非 200 响应应抛出错误', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({ statusCode: 500, data: { message: '服务器错误' } })
      })
      await expect(api.getUserInfo()).rejects.toThrow('服务器错误')
    })

    it('code 非 0 应显示 toast 并抛出错误', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.success({ statusCode: 200, data: { code: 1001, message: '参数错误' } })
      })
      await expect(api.getUserInfo()).rejects.toThrow('参数错误')
      expect(uni.showToast).toHaveBeenCalledWith({ title: '参数错误', icon: 'none' })
    })

    it('网络错误应抛出错误', async () => {
      ;(uni.request as any).mockImplementationOnce((options: any) => {
        options.fail({ errMsg: 'request:fail' })
      })
      await expect(api.getUserInfo()).rejects.toThrow()
    })
  })
})
