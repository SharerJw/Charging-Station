import { get, post, put, del } from './request'

// ==================== 认证 ====================
export const authApi = {
  login: (data: { username: string; password: string }) =>
    post<any>('/auth/login', data),
  logout: () =>
    post('/auth/logout'),
  profile: () =>
    get<any>('/auth/profile'),
}

// ==================== 仪表盘 ====================
export const dashboardApi = {
  getStats: () =>
    get<any>('/dashboard/overview'),
  getChartData: (days?: number) =>
    get<any>('/dashboard/trend', { days }),
  getRecentOrders: (limit?: number) =>
    get<any>('/dashboard/recent-orders', { limit }),
  getStationRank: (params?: { limit?: number; sortBy?: string }) =>
    get<any>('/dashboard/station-rank', params),
  getTodoCounts: () =>
    get<any>('/dashboard/todo-counts'),
}

// ==================== 充电站管理 ====================
export const stationApi = {
  list: (params?: any) =>
    get<any>('/stations', params),
  detail: (id: string) =>
    get<any>(`/stations/${id}`),
  create: (data: any) =>
    post<any>('/stations', data),
  update: (id: string, data: any) =>
    put<any>(`/stations/${id}`, data),
  delete: (id: string) =>
    del(`/stations/${id}`),
  updateStatus: (id: string, status: string) =>
    put(`/stations/${id}/status`, { status }),
}

// ==================== 设备管理 ====================
export const deviceApi = {
  list: (params?: any) =>
    get<any>('/devices', params),
  detail: (id: string) =>
    get<any>(`/devices/${id}`),
  update: (id: string, data: any) =>
    put<any>(`/devices/${id}`, data),
  reset: (id: string) =>
    post(`/devices/${id}/reset`),
  unlock: (id: string, connectorId: number) =>
    post(`/devices/${id}/connectors/${connectorId}/unlock`),
  stationDevices: (stationId: string) =>
    get<any>(`/stations/${stationId}/devices`),
}

// ==================== 订单管理 ====================
export const orderApi = {
  list: (params?: any) =>
    get<any>('/orders', params),
  detail: (id: string) =>
    get<any>(`/orders/${id}`),
  refund: (id: string, amount: number, reason: string) =>
    post(`/orders/${id}/refund`, { amount, reason }),
}

// ==================== 用户管理 ====================
export const userApi = {
  list: (params?: any) =>
    get<any>('/users', params),
  detail: (id: string) =>
    get<any>(`/users/${id}`),
  updateStatus: (id: string, status: string) =>
    put(`/users/${id}/status`, { status }),
}

// ==================== 财务管理 ====================
export const financeApi = {
  summary: (params?: any) =>
    get<any>('/finance/overview', params),
  bills: (params?: any) =>
    get<any>('/finance/transactions', params),
  settlements: (params?: any) =>
    get<any>('/finance/settlement', params),
}
