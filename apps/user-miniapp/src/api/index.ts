import { mockApi } from './mock'

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
    const token = uni.getStorageSync('token')
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
          uni.removeStorageSync('token')
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
  // 充电站相关
  getStations: (params?: any) =>
    USE_MOCK ? mockApi.getStations(params) : request({ url: '/api/v1/stations', data: params }),
  getStationDetail: (id: string) =>
    USE_MOCK ? mockApi.getStationDetail(id) : request({ url: `/api/v1/stations/${id}` }),

  // 充电相关
  startCharging: (data: any) =>
    USE_MOCK ? mockApi.startCharging(data) : request({ url: '/api/v1/charging/start', method: 'POST', data }),
  stopCharging: (orderId: string) =>
    USE_MOCK ? mockApi.stopCharging(orderId) : request({ url: `/api/v1/charging/${orderId}/stop`, method: 'POST' }),
  getChargingStatus: (orderId: string) =>
    USE_MOCK ? mockApi.getChargingStatus(orderId) : request({ url: `/api/v1/charging/${orderId}/status` }),

  // 订单相关
  getOrders: (params?: any) =>
    USE_MOCK ? mockApi.getOrders(params) : request({ url: '/api/v1/orders', data: params }),
  getOrderDetail: (id: string) =>
    USE_MOCK ? mockApi.getOrderDetail(id) : request({ url: `/api/v1/orders/${id}` }),

  // 用户相关
  login: (data: { phone: string; code: string }) =>
    USE_MOCK ? mockApi.login(data) : request({ url: '/api/v1/auth/login', method: 'POST', data }),
  getUserInfo: () =>
    USE_MOCK ? mockApi.getUserInfo() : request({ url: '/api/v1/user/profile' }),
}
