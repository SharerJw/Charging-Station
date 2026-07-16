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
  status: 'charging' | 'completed' | 'stopped'
  currentSoc: number
  power: number
  energy: number
  duration: number
  cost: number
  startTime: string
}

/** 从后端原始数据映射为 Station */
function mapStation(s: any): Station {
  return {
    id: String(s.id || ''),
    name: s.name || '',
    address: s.address || '',
    latitude: s.latitude || 0,
    longitude: s.longitude || 0,
    distance: s.distance || Math.round(Math.random() * 5000 + 500),
    availableCount: Number(s.availablePorts ?? s.onlineDeviceCount ?? s.deviceCount ?? 0),
    totalCount: Number(s.deviceCount ?? s.totalPorts ?? 0),
    electricityPrice: s.electricityPrice || 0,
    servicePrice: s.servicePrice || 0,
  }
}

export const api = {
  // 充电站相关
  async getStations(params?: any): Promise<Station[]> {
    const data = await request<any>({ url: '/api/v1/stations', data: params })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    return list.map(mapStation)
  },

  async getStationDetail(id: string): Promise<Station> {
    const data = await request<any>({ url: `/api/v1/stations/${id}` })
    return mapStation(data)
  },

  // 充电相关
  startCharging: (data: any) =>
    request<ChargingSession>({ url: '/api/v1/charging/start', method: 'POST', data }),

  async stopCharging(orderId: string): Promise<ChargingSession> {
    return request<ChargingSession>({ url: `/api/v1/charging/${orderId}/stop`, method: 'POST' })
  },

  async getChargingStatus(orderId: string): Promise<ChargingSession | null> {
    try {
      return await request<ChargingSession>({ url: `/api/v1/charging/${orderId}/status` })
    } catch (e) {
      return null
    }
  },

  // 订单相关
  async getOrders(params?: any): Promise<Order[]> {
    try {
      const data = await request<any>({ url: '/api/v1/orders', data: params })
      const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
      return list.map((o: any) => ({
        id: String(o.id || ''),
        orderNo: o.orderNo || '',
        stationName: o.stationName || '',
        status: o.status || '',
        startTime: o.startTime || o.createdAt || '',
        consumedEnergy: o.consumedEnergy || o.energy || 0,
        totalAmount: o.totalAmount || o.amount || 0,
      }))
    } catch (e) {
      return []
    }
  },

  // 用户相关
  login: (data: { phone: string; code: string }) =>
    request<{ token: string; user: any }>({ url: '/api/v1/auth/login', method: 'POST', data }),

  async getUserInfo(): Promise<UserInfo> {
    const data = await request<any>({ url: '/api/v1/user/profile' })
    return {
      id: String(data?.id || ''),
      nickname: data?.nickname || data?.username || '',
      phone: data?.phone || '',
      avatar: data?.avatar || '',
      balance: (data?.balance || 0) / 100, // 分转元
      couponCount: data?.couponCount || 0,
    }
  },
}
