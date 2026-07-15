import { get, post, put, del } from './request'
import {
  mockAuthApi,
  mockStationApi,
  mockDeviceApi,
  mockOrderApi,
  mockUserApi,
  mockDashboardApi,
} from './mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// ==================== 认证 ====================
export const authApi = {
  login: (data: { username: string; password: string }) =>
    USE_MOCK ? mockAuthApi.login(data) : post<any>('/auth/login', data),
  logout: () =>
    USE_MOCK ? Promise.resolve() : post('/auth/logout'),
  profile: () =>
    USE_MOCK ? mockAuthApi.login({ username: 'admin', password: 'admin123' }).then(r => r.user) : get<any>('/auth/profile'),
}

// ==================== 仪表盘 ====================
export const dashboardApi = {
  getStats: () =>
    USE_MOCK ? mockDashboardApi.getStats() : get<any>('/dashboard/overview'),
  getChartData: (days?: number) =>
    USE_MOCK ? mockDashboardApi.getChartData(days) : get<any>('/dashboard/trend', { days }),
  getRecentOrders: (limit?: number) =>
    USE_MOCK ? mockDashboardApi.getRecentOrders(limit) : get<any>('/dashboard/recent-orders', { limit }),
  getStationRank: (params?: { limit?: number; sortBy?: string }) =>
    USE_MOCK ? mockDashboardApi.getStationRank(params) : get<any>('/dashboard/station-rank', params),
  getTodoCounts: () =>
    USE_MOCK ? mockDashboardApi.getTodoCounts() : get<any>('/dashboard/todo-counts'),
}

// ==================== 充电站管理 ====================
export const stationApi = {
  list: (params?: any) =>
    USE_MOCK ? mockStationApi.list(params) : get<any>('/stations', params),
  detail: (id: string) =>
    USE_MOCK ? mockStationApi.detail(id) : get<any>(`/stations/${id}`),
  create: (data: any) =>
    USE_MOCK ? mockStationApi.create(data) : post<any>('/stations', data),
  update: (id: string, data: any) =>
    USE_MOCK ? mockStationApi.update(id, data) : put<any>(`/stations/${id}`, data),
  delete: (id: string) =>
    USE_MOCK ? mockStationApi.delete(id) : del(`/stations/${id}`),
  updateStatus: (id: string, status: string) =>
    USE_MOCK ? mockStationApi.updateStatus(id, status) : put(`/stations/${id}/status`, { status }),
}

// ==================== 设备管理 ====================
export const deviceApi = {
  list: (params?: any) =>
    USE_MOCK ? mockDeviceApi.list(params) : get<any>('/devices', params),
  detail: (id: string) =>
    USE_MOCK ? mockDeviceApi.detail(id) : get<any>(`/devices/${id}`),
  update: (id: string, data: any) =>
    USE_MOCK ? Promise.resolve() : put<any>(`/devices/${id}`, data),
  reset: (id: string) =>
    USE_MOCK ? mockDeviceApi.reset(id) : post(`/devices/${id}/reset`),
  unlock: (id: string, connectorId: number) =>
    USE_MOCK ? Promise.resolve() : post(`/devices/${id}/connectors/${connectorId}/unlock`),
  stationDevices: (stationId: string) =>
    USE_MOCK ? mockDeviceApi.list({ stationId }) : get<any>(`/stations/${stationId}/devices`),
}

// ==================== 订单管理 ====================
export const orderApi = {
  list: (params?: any) =>
    USE_MOCK ? mockOrderApi.list(params) : get<any>('/orders', params),
  detail: (id: string) =>
    USE_MOCK ? mockOrderApi.detail(id) : get<any>(`/orders/${id}`),
  refund: (id: string, amount: number, reason: string) =>
    USE_MOCK ? mockOrderApi.refund(id, amount, reason) : post(`/orders/${id}/refund`, { amount, reason }),
}

// ==================== 用户管理 ====================
export const userApi = {
  list: (params?: any) =>
    USE_MOCK ? mockUserApi.list(params) : get<any>('/users', params),
  detail: (id: string) =>
    USE_MOCK ? mockUserApi.detail(id) : get<any>(`/users/${id}`),
  updateStatus: (id: string, status: string) =>
    USE_MOCK ? mockUserApi.updateStatus(id, status) : put(`/users/${id}/status`, { status }),
}

// ==================== 财务管理 ====================
export const financeApi = {
  summary: (params?: any) =>
    USE_MOCK ? Promise.resolve({ totalRevenue: 456789, totalElectricityFee: 320000, totalServiceFee: 136789, totalOrderCount: 1234, totalEnergyWh: 1234567, avgOrderAmount: 370, refundAmount: 12500, refundCount: 8 }) : get<any>('/finance/overview', params),
  bills: (params?: any) =>
    USE_MOCK ? mockOrderApi.list(params) : get<any>('/finance/transactions', params),
  settlements: (params?: any) =>
    USE_MOCK ? mockOrderApi.list(params) : get<any>('/finance/settlement', params),
}
