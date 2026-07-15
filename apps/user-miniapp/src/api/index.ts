const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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

export interface Station {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  distance: number
  availableCount: number
  totalCount: number
  electricityPrice: number
  servicePrice: number
}

export interface UserInfo {
  id: string
  nickname: string
  phone: string
  avatar: string
  balance: number
  couponCount: number
}

export interface Order {
  id: string
  orderNo: string
  stationName: string
  status: string
  startTime: string
  consumedEnergy: number
  totalAmount: number
}

export interface ChargingSession {
  orderId: string
  stationName: string
  deviceCode: string
  status: 'charging' | 'completed'
  currentSoc: number
  power: number
  energy: number
  duration: number
  cost: number
  startTime: string
}

export const api = {
  // 充电站相关
  getStations: (params?: any) =>
    request({ url: '/api/v1/stations', data: params }),
  getStationDetail: (id: string) =>
    request({ url: `/api/v1/stations/${id}` }),

  // 充电相关
  startCharging: (data: any) =>
    request({ url: '/api/v1/charging/start', method: 'POST', data }),
  stopCharging: (orderId: string) =>
    request({ url: `/api/v1/charging/${orderId}/stop`, method: 'POST' }),
  getChargingStatus: (orderId: string) =>
    request({ url: `/api/v1/charging/${orderId}/status` }),

  // 订单相关
  getOrders: (params?: any) =>
    request({ url: '/api/v1/orders', data: params }),
  getOrderDetail: (id: string) =>
    request({ url: `/api/v1/orders/${id}` }),

  // 用户相关
  login: (data: { phone: string; code: string }) =>
    request({ url: '/api/v1/auth/login', method: 'POST', data }),
  getUserInfo: () =>
    request({ url: '/api/v1/user/profile' }),
}
