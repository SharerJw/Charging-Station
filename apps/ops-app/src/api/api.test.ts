import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock uni global before importing api
const mockRequest = vi.fn()
;(global as any).uni = {
  request: mockRequest,
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  showToast: vi.fn(),
  navigateTo: vi.fn(),
}

// Clear module cache and re-import
let api: typeof import('./index').api

beforeEach(async () => {
  vi.clearAllMocks()
  mockRequest.mockImplementation((_opts: any) => {
    _opts.success?.({ statusCode: 200, data: { code: 0, data: null } })
  })
  vi.resetModules()
  const mod = await import('./index')
  api = mod.api
})

describe('api', () => {
  describe('getStations', () => {
    it('应发送 GET 请求到 /api/v1/ops/stations', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: { list: [] } } })
      })
      await api.getStations()
      expect(mockRequest).toHaveBeenCalledTimes(1)
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/stations')
      expect(call.method).toBe('GET')
    })

    it('应传递查询参数', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: { list: [] } } })
      })
      await api.getStations({ keyword: '朝阳' })
      const call = mockRequest.mock.calls[0][0]
      expect(call.data).toEqual({ keyword: '朝阳' })
    })
  })

  describe('getStationDetail', () => {
    it('应发送 GET 请求到 /api/v1/ops/stations/:id', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: {} } })
      })
      await api.getStationDetail('station-123')
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/stations/station-123')
    })
  })

  describe('getAlerts', () => {
    it('应发送 GET 请求到 /api/v1/ops/alerts', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: { list: [] } } })
      })
      await api.getAlerts()
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/alerts')
      expect(call.method).toBe('GET')
    })

    it('应传递告警级别过滤参数', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: { list: [] } } })
      })
      await api.getAlerts({ level: 'P0', status: 'pending' })
      const call = mockRequest.mock.calls[0][0]
      expect(call.data).toEqual({ level: 'P0', status: 'pending' })
    })
  })

  describe('handleAlert', () => {
    it('应发送 POST 请求处理告警', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: {} } })
      })
      await api.handleAlert('alert-1', { result: '已处理' })
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/alerts/alert-1/handle')
      expect(call.method).toBe('POST')
      expect(call.data).toEqual({ result: '已处理' })
    })
  })

  describe('getWorkorders', () => {
    it('应发送 GET 请求到 /api/v1/ops/workorders', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: { list: [] } } })
      })
      await api.getWorkorders()
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/workorders')
      expect(call.method).toBe('GET')
    })

    it('应传递分页参数', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: { list: [] } } })
      })
      await api.getWorkorders({ page: 1, size: 20, status: 'pending' })
      const call = mockRequest.mock.calls[0][0]
      expect(call.data).toEqual({ page: 1, size: 20, status: 'pending' })
    })
  })

  describe('acceptWorkorder', () => {
    it('应发送 POST 请求接单', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: {} } })
      })
      await api.acceptWorkorder('wo-1')
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/workorders/wo-1/accept')
      expect(call.method).toBe('POST')
    })
  })

  describe('completeWorkorder', () => {
    it('应发送 POST 请求完成工单', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: {} } })
      })
      await api.completeWorkorder('wo-1', { result: '维修完成' })
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/workorders/wo-1/complete')
      expect(call.method).toBe('POST')
      expect(call.data).toEqual({ result: '维修完成' })
    })
  })

  describe('getInspections', () => {
    it('应发送 GET 请求到 /api/v1/ops/inspections', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: { list: [] } } })
      })
      await api.getInspections()
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/inspections')
      expect(call.method).toBe('GET')
    })
  })

  describe('submitInspection', () => {
    it('应发送 POST 请求提交巡检', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: {} } })
      })
      await api.submitInspection('insp-1', { status: 'completed' })
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/inspections/insp-1/submit')
      expect(call.method).toBe('POST')
      expect(call.data).toEqual({ status: 'completed' })
    })
  })

  describe('login', () => {
    it('应发送 POST 请求到 /api/v1/ops/auth/login', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: { token: 'xxx' } } })
      })
      await api.login({ username: 'ops1', password: 'ops123' })
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/auth/login')
      expect(call.method).toBe('POST')
      expect(call.data).toEqual({ username: 'ops1', password: 'ops123' })
    })
  })

  describe('getUserInfo', () => {
    it('应发送 GET 请求到 /api/v1/ops/user/profile', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: { nickname: '测试' } } })
      })
      await api.getUserInfo()
      const call = mockRequest.mock.calls[0][0]
      expect(call.url).toContain('/api/v1/ops/user/profile')
      expect(call.method).toBe('GET')
    })
  })

  describe('请求失败处理', () => {
    it('业务错误码应抛出异常', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 500, message: '服务器错误' } })
      })
      await expect(api.getAlerts()).rejects.toThrow('服务器错误')
    })

    it('401 应跳转登录页', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 401, data: { message: '未授权' } })
      })
      await expect(api.getAlerts()).rejects.toThrow('未登录')
      expect((global as any).uni.navigateTo).toHaveBeenCalledWith({
        url: '/pages/login/index',
      })
    })

    it('网络失败应抛出异常', async () => {
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.fail?.({ errMsg: 'request:fail' })
      })
      await expect(api.getAlerts()).rejects.toThrow()
    })
  })

  describe('请求头', () => {
    it('应包含 Authorization Bearer token', async () => {
      ;(global as any).uni.getStorageSync.mockReturnValue('my-token')
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: {} } })
      })
      await api.getAlerts()
      const call = mockRequest.mock.calls[0][0]
      expect(call.header.Authorization).toBe('Bearer my-token')
    })

    it('无 token 时 Authorization 应为空', async () => {
      ;(global as any).uni.getStorageSync.mockReturnValue('')
      mockRequest.mockImplementationOnce((opts: any) => {
        opts.success?.({ statusCode: 200, data: { code: 0, data: {} } })
      })
      await api.getAlerts()
      const call = mockRequest.mock.calls[0][0]
      expect(call.header.Authorization).toBe('')
    })
  })
})
