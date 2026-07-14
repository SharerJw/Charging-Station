import { mockOpsApi } from './mock'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('ops_token')
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...options.header,
      },
      success: (res: any) => {
        const body = res.data
        if (res.statusCode === 200 && body && body.code === 0) {
          resolve(body.data as T)
        } else if (res.statusCode === 200 && body && body.code !== 0) {
          uni.showToast({ title: body.message || '请求失败', icon: 'none' })
          reject(new Error(body.message || '请求失败'))
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('ops_token')
          uni.navigateTo({ url: '/pages/login/index' })
          reject(new Error('未登录'))
        } else {
          reject(new Error(body?.message || '请求失败'))
        }
      },
      fail: (err: any) => reject(err),
    })
  })
}

export const api = {
  // 充电站管理
  getStations: (params?: any) =>
    USE_MOCK ? Promise.resolve([]) : request({ url: '/api/v1/ops/stations', data: params }),
  getStationDetail: (id: string) =>
    USE_MOCK ? Promise.resolve({}) : request({ url: `/api/v1/ops/stations/${id}` }),

  // 告警管理
  getAlerts: (params?: any) =>
    USE_MOCK ? mockOpsApi.getAlerts(params) : request({ url: '/api/v1/ops/alerts', data: params }),
  handleAlert: (id: string, data: any) =>
    USE_MOCK ? mockOpsApi.handleAlert(id, data) : request({ url: `/api/v1/ops/alerts/${id}/handle`, method: 'POST', data }),

  // 工单管理
  getWorkorders: (params?: any) =>
    USE_MOCK ? mockOpsApi.getWorkorders(params) : request({ url: '/api/v1/ops/workorders', data: params }),
  acceptWorkorder: (id: string) =>
    USE_MOCK ? mockOpsApi.acceptWorkorder(id) : request({ url: `/api/v1/ops/workorders/${id}/accept`, method: 'POST' }),
  completeWorkorder: (id: string, data: any) =>
    USE_MOCK ? mockOpsApi.completeWorkorder(id, data.result) : request({ url: `/api/v1/ops/workorders/${id}/complete`, method: 'POST', data }),

  // 巡检管理
  getInspections: (params?: any) =>
    USE_MOCK ? mockOpsApi.getInspections() : request({ url: '/api/v1/ops/inspections', data: params }),
  submitInspection: (id: string, data: any) =>
    USE_MOCK ? mockOpsApi.completeInspection(id) : request({ url: `/api/v1/ops/inspections/${id}/submit`, method: 'POST', data }),

  // 用户认证
  login: (data: { username: string; password: string }) =>
    USE_MOCK ? Promise.resolve({ token: 'mock_ops_token', user: { id: 'OPS001', username: data.username, nickname: '运维工程师', roles: ['ops'] } }) : request({ url: '/api/v1/ops/auth/login', method: 'POST', data }),
  getUserInfo: () =>
    USE_MOCK ? Promise.resolve({ id: 'OPS001', username: 'ops1', nickname: '运维工程师', roles: ['ops'], phone: '13900139000' }) : request({ url: '/api/v1/ops/user/profile' }),
}
