const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'
const REQUEST_TIMEOUT = 15000 // 15秒请求超时

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const fullUrl = `${BASE_URL}${options.url}`
    console.log(`[api] ${options.method || 'GET'} ${fullUrl}`)
    uni.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data,
      timeout: REQUEST_TIMEOUT,
      header: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...options.header,
      },
      success: (res: any) => {
        console.log(`[api] ${options.url} → ${res.statusCode}`)
        const body = res.data
        if (res.statusCode === 200 && body && body.code === 0) {
          resolve(body.data as T)
        } else if (res.statusCode === 200 && body && body.code !== 0) {
          reject(new Error(body.message || '请求失败'))
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          reject(new Error('未登录'))
        } else {
          reject(new Error(body?.message || `HTTP ${res.statusCode}`))
        }
      },
      fail: (err: any) => {
        console.error(`[request] ${options.method || 'GET'} ${options.url} failed:`, err)
        reject(new Error(err?.errMsg || err?.message || '网络请求失败'))
      },
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

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  icon: string
  description: string
  amount: number
  time: string
}

export interface UserStats {
  chargeCount: number
  totalEnergy: number
  totalSaved: number
  carbonReduction: number
}

export const api = {
  // 充电站相关
  async getStations(params?: any): Promise<Station[]> {
    const queryStr = params
      ? '?' + Object.entries(params)
          .filter(([_, v]) => v != null)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&')
      : ''
    const data = await request<any>({ url: '/api/v1/stations' + queryStr })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    return list.map(mapStation)
  },

  async getStationDetail(id: string): Promise<Station> {
    const data = await request<any>({ url: `/api/v1/stations/${id}` })
    return mapStation(data)
  },

  async getChargingPoints(stationId: string): Promise<any[]> {
    const data = await request<any>({ url: `/api/v1/stations/${stationId}/charging-points` })
    return Array.isArray(data) ? data : (data?.list || data?.records || [])
  },

  async getStationReviews(stationId: string): Promise<any[]> {
    const data = await request<any>({ url: `/api/v1/stations/${stationId}/reviews` })
    return Array.isArray(data) ? data : (data?.list || data?.records || [])
  },

  // 充电相关
  startCharging: (data: any) =>
    request<ChargingSession>({ url: '/api/v1/charging/start', method: 'POST', data }),

  startChargingWithOptions: (data: any) =>
    request<any>({ url: '/api/v1/charging/start-with-options', method: 'POST', data }),

  async getChargingSettlement(orderId: string): Promise<any> {
    return request<any>({ url: `/api/v1/charging/${orderId}/settlement` })
  },

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

  // 认证相关
  login: (data: { phone: string; code: string }) =>
    request<{ token: string; user: any }>({ url: '/api/v1/auth/login', method: 'POST', data }),

  sendSmsCode: (phone: string) =>
    request<void>({ url: '/api/v1/auth/sms-code', method: 'POST', data: { phone } }),

  loginByPhone: (data: { phone: string; code: string }) =>
    request<{ token: string; user: any; isNewUser?: boolean }>({ url: '/api/v1/auth/login', method: 'POST', data }),

  loginByWechat: (data: { code: string; userInfo?: any }) =>
    request<{ token: string; user: any; isNewUser?: boolean }>({ url: '/api/v1/auth/wechat-login', method: 'POST', data }),

  getPhoneNumber: (code: string) =>
    request<{ token: string; user: any; isNewUser?: boolean }>({ url: '/api/v1/auth/phone-number-login', method: 'POST', data: { code } }),

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

  /** 更新用户资料（昵称/头像） */
  async updateProfile(data: { nickname?: string; avatar?: string }): Promise<void> {
    await request<void>({ url: '/api/v1/user/profile', method: 'PUT', data })
  },

  async getUserStats(): Promise<UserStats> {
    try {
      const data = await request<any>({ url: '/api/v1/user/stats' })
      return {
        chargeCount: data?.chargeCount || 0,
        totalEnergy: data?.totalEnergy || 0,
        totalSaved: data?.totalSaved || 0,
        carbonReduction: data?.carbonReduction || 0,
      }
    } catch {
      return { chargeCount: 0, totalEnergy: 0, totalSaved: 0, carbonReduction: 0 }
    }
  },

  // 钱包相关
  async getWallet(): Promise<any> {
    return request<any>({ url: '/api/v1/wallet' })
  },

  async recharge(data: { amount: number }): Promise<any> {
    return request<any>({ url: '/api/v1/wallet/recharge', method: 'POST', data: { amount: Math.round(data.amount * 100) } })
  },

  async getTransactions(params?: { page?: number; size?: number }): Promise<Transaction[]> {
    const data = await request<any>({ url: '/api/v1/wallet/transactions', data: { page: 1, size: 5, ...params } })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    return list.map((t: any) => ({
      id: String(t.id || ''),
      type: (t.amount || t.amountYuan || 0) >= 0 ? 'income' : 'expense',
      category: t.category || t.type || '',
      icon: t.icon || '',
      description: t.description || t.title || t.remark || '',
      amount: Math.abs((t.amount || t.amountYuan || 0) / (t.amount > 100 ? 100 : 1)),
      time: t.time || t.createdAt || t.createTime || '',
    }))
  },

  // 优惠券相关
  async getCoupons(status?: string): Promise<any[]> {
    const params: any = {}
    if (status) params.status = status
    const data = await request<any>({ url: '/api/v1/coupons', data: params })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    return list.map((c: any) => ({
      id: String(c.id || ''),
      name: c.name || '',
      description: c.description || '',
      type: c.type || 'fixed', // fixed | discount | energy
      amount: c.amount || 0,
      discount: c.discount || 0, // 折扣值（type=discount 时使用）
      energyKwh: c.energyKwh || 0, // 免费电量（type=energy 时使用）
      minAmount: c.minAmount || c.threshold || 0,
      scope: c.scope || '全场通用', // 适用范围
      startTime: c.startTime || c.beginTime || '',
      endTime: c.endTime || c.expireTime || '',
      status: c.status || 'available',
      usedTime: c.usedTime || '',
    }))
  },

  async redeemCoupon(code: string): Promise<any> {
    return request<any>({ url: '/api/v1/coupons/redeem', method: 'POST', data: { code } })
  },

  // 车辆相关
  async getVehicles(): Promise<any[]> {
    const data = await request<any>({ url: '/api/v1/vehicles' })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    return list.map((v: any) => ({
      id: String(v.id || ''),
      brand: v.brand || '',
      model: v.model || '',
      plateNumber: v.plateNumber || v.plate || '',
      batteryCapacity: v.batteryCapacity || 0,
      range: v.range || v.mileage || 0,
      type: v.type || '纯电动',
      isDefault: Boolean(v.isDefault || v.defaultFlag),
    }))
  },

  async addVehicle(data: any): Promise<any> {
    return request<any>({ url: '/api/v1/vehicles', method: 'POST', data })
  },

  async updateVehicle(id: string, data: any): Promise<any> {
    return request<any>({ url: `/api/v1/vehicles/${id}`, method: 'PUT', data })
  },

  async deleteVehicle(id: string): Promise<void> {
    return request<void>({ url: `/api/v1/vehicles/${id}`, method: 'DELETE' })
  },

  // 设置相关
  async getSettings(): Promise<any> {
    return request<any>({ url: '/api/v1/user/settings' })
  },

  async updateSettings(data: any): Promise<void> {
    return request<void>({ url: '/api/v1/user/settings', method: 'PUT', data })
  },

  // 会员相关
  async getMembership(): Promise<any> {
    return request<any>({ url: '/api/v1/membership' })
  },

  // 积分相关
  async getPoints(): Promise<any> {
    return request<any>({ url: '/api/v1/points' })
  },

  async getPointItems(): Promise<any[]> {
    const data = await request<any>({ url: '/api/v1/points/items' })
    return Array.isArray(data) ? data : (data?.list || data?.records || [])
  },

  async redeemPoint(data: { itemId: string; points: number }): Promise<any> {
    return request<any>({ url: '/api/v1/points/redeem', method: 'POST', data })
  },

  async getPointsProducts(params?: { category?: string; keyword?: string }): Promise<any[]> {
    const data = await request<any>({ url: '/api/v1/points/products', data: params })
    return Array.isArray(data) ? data : (data?.list || data?.records || [])
  },

  async redeemPoints(data: { itemId: string; quantity?: number; points: number }): Promise<any> {
    return request<any>({ url: '/api/v1/points/redeem', method: 'POST', data })
  },

  async getPointsHistory(params?: { status?: string; page?: number; size?: number }): Promise<any[]> {
    const data = await request<any>({ url: '/api/v1/points/history', data: params })
    return Array.isArray(data) ? data : (data?.list || data?.records || [])
  },

  // 收藏相关
  async getFavorites(): Promise<Station[]> {
    const data = await request<any>({ url: '/api/v1/favorites' })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    return list.map(mapStation)
  },

  async toggleFavorite(stationId: string): Promise<void> {
    return request<void>({ url: `/api/v1/favorites/${stationId}/toggle`, method: 'POST' })
  },

  async removeFavorite(stationId: string): Promise<void> {
    return request<void>({ url: `/api/v1/favorites/${stationId}`, method: 'DELETE' })
  },

  async reorderFavorites(stationIds: string[]): Promise<void> {
    return request<void>({ url: '/api/v1/favorites/reorder', method: 'PUT', data: { stationIds } })
  },

  // 退款相关
  async applyRefund(data: { orderId: string; amount: number; reason: string; notes?: string; photos?: string[] }): Promise<any> {
    return request<any>({ url: '/api/v1/refunds', method: 'POST', data: { ...data, amount: Math.round(data.amount * 100) } })
  },

  // 发票相关
  async getInvoices(): Promise<any[]> {
    const data = await request<any>({ url: '/api/v1/invoices' })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    return list.map((inv: any) => ({
      id: String(inv.id || ''),
      title: inv.title || inv.invoiceTitle || '',
      amount: (inv.amount || 0) / 100,
      status: inv.status || 'pending',
      createTime: inv.createTime || inv.createdAt || '',
    }))
  },

  async createInvoice(data: { orderIds: string[]; type: string; email: string; company?: any }): Promise<any> {
    return request<any>({ url: '/api/v1/invoices', method: 'POST', data })
  },

  async submitInvoice(data: any): Promise<any> {
    return request<any>({ url: '/api/v1/invoices/submit', method: 'POST', data })
  },

  async getInvoiceHeaders(): Promise<any[]> {
    const data = await request<any>({ url: '/api/v1/invoices/headers' })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    return list.map((h: any) => ({
      id: String(h.id || ''),
      companyName: h.companyName || h.name || '',
      taxNumber: h.taxNumber || h.taxNo || '',
      address: h.address || '',
      phone: h.phone || '',
      bankName: h.bankName || h.bank || '',
      bankAccount: h.bankAccount || '',
    }))
  },

  // 订单详情
  async getOrderDetail(orderId: string): Promise<any> {
    return request<any>({ url: `/api/v1/orders/${orderId}` })
  },

  // 退款
  async requestRefund(orderId: string): Promise<any> {
    return request<any>({ url: `/api/v1/orders/${orderId}/refund`, method: 'POST' })
  },

  // 支付
  async payOrder(orderId: string): Promise<any> {
    return request<any>({ url: `/api/v1/orders/${orderId}/pay`, method: 'POST' })
  },

  // 优惠券 - 可用
  async getAvailableCoupons(): Promise<any[]> {
    const data = await request<any>({ url: '/api/v1/coupons/available' })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    return list.map((c: any) => ({
      id: String(c.id || ''),
      name: c.name || '',
      amount: c.amount || 0,
      minAmount: c.minAmount || c.threshold || 0,
      expireDate: c.endTime || c.expireTime || '',
    }))
  },

  // 消息中心
  async getMessages(params?: any): Promise<any> {
    return request<any>({ url: '/api/v1/messages', data: params })
  },

  async markMessageRead(messageId: string): Promise<void> {
    return request<void>({ url: `/api/v1/messages/${messageId}/read`, method: 'POST' })
  },

  async markAsRead(messageId: string): Promise<void> {
    return request<void>({ url: `/api/v1/messages/${messageId}/read`, method: 'POST' })
  },

  async markAllAsRead(category?: string): Promise<void> {
    return request<void>({ url: '/api/v1/messages/read-all', method: 'POST', data: { category } })
  },

  async deleteMessage(messageId: string): Promise<void> {
    return request<void>({ url: `/api/v1/messages/${messageId}`, method: 'DELETE' })
  },
}
