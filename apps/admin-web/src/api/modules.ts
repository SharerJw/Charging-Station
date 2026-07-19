import { get, post, put, del } from './request'
import type { PageResult, Station, StationForm, StationQuery, Device, Order, OrderQuery, User, DashboardStats, ChartData } from '@/types'

// 仪表盘
export const dashboardApi = {
  getStats: () => get<DashboardStats>('/dashboard/stats'),
  getChartData: (days?: number) => get<ChartData>('/dashboard/chart', { days }),
  getRecentOrders: (limit?: number) => get<Order[]>('/dashboard/recent-orders', { limit }),
  getStationRank: (params?: { limit?: number; sortBy?: string }) => get<any[]>('/dashboard/station-rank', params),
  getTodoCounts: () => get<any>('/dashboard/todo-counts'),
  getAlerts: (limit?: number) => get<any[]>('/dashboard/alerts', { limit }),
}

// 充电站管理
export const stationApi = {
  list: (params: StationQuery) => get<PageResult<Station>>('/stations', params),
  detail: (id: string) => get<Station>(`/stations/${id}`),
  create: (data: StationForm) => post<Station>('/stations', data),
  update: (id: string, data: Partial<StationForm>) => put<Station>(`/stations/${id}`, data),
  delete: (id: string) => del<void>(`/stations/${id}`),
  updateStatus: (id: string, status: string) => put<void>(`/stations/${id}/status`, { status }),
  getDevices: (stationId: string) => get<Device[]>(`/stations/${stationId}/devices`),
}

// 设备管理
export const deviceApi = {
  list: (params: any) => get<PageResult<Device>>('/devices', params),
  detail: (id: string) => get<Device>(`/devices/${id}`),
  update: (id: string, data: any) => put<Device>(`/devices/${id}`, data),
  reset: (id: string) => post<void>(`/devices/${id}/reset`),
  unlock: (id: string, connectorId: number) => post<void>(`/devices/${id}/connectors/${connectorId}/unlock`),
  updateFirmware: (id: string, url: string) => post<void>(`/devices/${id}/firmware`, { url }),
  getTelemetry: (id: string) => get<any>(`/devices/${id}/telemetry`),
}

// 订单管理
export const orderApi = {
  list: (params: OrderQuery) => get<PageResult<Order>>('/orders', params),
  detail: (id: string) => get<Order>(`/orders/${id}`),
  refund: (id: string, amount: number, reason: string) => post<void>(`/orders/${id}/refund`, { amount, reason }),
  export: (params: OrderQuery) => get<Blob>('/orders/export', { ...params, responseType: 'blob' }),
}

// 用户管理
export const userApi = {
  list: (params: any) => get<PageResult<User>>('/users', params),
  detail: (id: string) => get<User>(`/users/${id}`),
  updateStatus: (id: string, status: string) => put<void>(`/users/${id}/status`, { status }),
  getOrders: (userId: string, params?: any) => get<PageResult<Order>>(`/users/${userId}/orders`, params),
  recharge: (userId: string, amount: number) => post<void>(`/users/${userId}/recharge`, { amount }),
}

// 财务管理
export const financeApi = {
  getSummary: (params?: { startTime?: string; endTime?: string }) => get<any>('/finance/summary', params),
  getBills: (params: any) => get<PageResult<any>>('/finance/bills', params),
  getSettlements: (params: any) => get<PageResult<any>>('/finance/settlements', params),
  getInvoices: (params: any) => get<PageResult<any>>('/finance/invoices', params),
  getFundFlows: (params: any) => get<PageResult<any>>('/finance/fund-flows', params),
  getRevenueTrend: (params: any) => get<any>('/finance/revenue-trend', params),
  getPaymentChannelStats: (params?: any) => get<any>('/finance/payment-channel-stats', params),
  exportBills: (params: any) => get<Blob>('/finance/bills/export', params),
  exportSettlements: (params: any) => get<Blob>('/finance/settlements/export', params),
  exportFundFlows: (params: any) => get<Blob>('/finance/fund-flows/export', params),
  batchInvoice: (data: { settlementIds: string[] }) => post<any>('/finance/invoices/batch', data),
  confirmSettlement: (id: string) => put<any>(`/finance/settlement/${id}/confirm`),
}

// 认证
export const authApi = {
  login: (data: { username: string; password: string }) => post<{ token: string; user: any }>('/auth/login', data),
  logout: () => post<void>('/auth/logout'),
  profile: () => get<any>('/auth/profile'),
  refreshToken: () => post<{ token: string }>('/auth/refresh'),
}
