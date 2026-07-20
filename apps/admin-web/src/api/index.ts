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
  invoices: (params?: any) =>
    get<any>('/finance/invoices', params),
  fundFlows: (params?: any) =>
    get<any>('/finance/fund-flows', params),
  revenueTrend: (params?: any) =>
    get<any>('/finance/revenue-trend', params),
  paymentChannelStats: (params?: any) =>
    get<any>('/finance/payment-channel-stats', params),
  exportBills: (params?: any) =>
    get<Blob>('/finance/bills/export', { ...params, responseType: 'blob' }),
  exportSettlements: (params?: any) =>
    get<Blob>('/finance/settlements/export', { ...params, responseType: 'blob' }),
  exportFundFlows: (params?: any) =>
    get<Blob>('/finance/fund-flows/export', { ...params, responseType: 'blob' }),
  batchInvoice: (data: { settlementIds: string[] }) =>
    post<any>('/finance/invoices/batch', data),
  confirmSettlement: (id: string) =>
    put<any>(`/finance/settlement/${id}/confirm`),
}

// ==================== 运维管理 ====================
export const opsApi = {
  // 工单
  workorders: {
    list: (params?: any) =>
      get<any>('/ops/workorders', params),
    detail: (id: string) =>
      get<any>(`/ops/workorders/${id}`),
    create: (data: any) =>
      post<any>('/ops/workorders', data),
    accept: (id: string) =>
      put<any>(`/ops/workorders/${id}/accept`),
    complete: (id: string, data: { result: string }) =>
      put<any>(`/ops/workorders/${id}/complete`, data),
    transfer: (id: string, data: { assigneeId: string; reason: string }) =>
      put<any>(`/ops/workorders/${id}/transfer`, data),
    close: (id: string) =>
      put<any>(`/ops/workorders/${id}/close`),
  },
  // 巡检
  inspections: {
    list: (params?: any) =>
      get<any>('/ops/inspections', params),
    detail: (id: string) =>
      get<any>(`/ops/inspections/${id}`),
    create: (data: any) =>
      post<any>('/ops/inspections', data),
    start: (id: string) =>
      put<any>(`/ops/inspections/${id}/start`),
    complete: (id: string, data: { remark: string }) =>
      put<any>(`/ops/inspections/${id}/complete`, data),
  },
  // 备件
  spareParts: {
    list: (params?: any) =>
      get<any>('/ops/spare-parts', params),
    detail: (id: string) =>
      get<any>(`/ops/spare-parts/${id}`),
    create: (data: any) =>
      post<any>('/ops/spare-parts', data),
    update: (id: string, data: any) =>
      put<any>(`/ops/spare-parts/${id}`, data),
    delete: (id: string) =>
      del(`/ops/spare-parts/${id}`),
    inbound: (id: string, data: { quantity: number; remark: string }) =>
      post<any>(`/ops/spare-parts/${id}/inbound`, data),
  },
  // 运维人员列表（用于下拉选择）
  staffList: () =>
    get<any>('/ops/staff'),
}

// ==================== 定价策略 ====================
export const pricingApi = {
  // 策略列表
  listStrategies: (params?: any) =>
    get<any>('/pricing/strategies', params),
  // 策略详情
  strategyDetail: (id: string) =>
    get<any>(`/pricing/strategies/${id}`),
  // 创建策略
  createStrategy: (data: any) =>
    post<any>('/pricing/strategies', data),
  // 更新策略
  updateStrategy: (id: string, data: any) =>
    put<any>(`/pricing/strategies/${id}`, data),
  // 删除策略
  deleteStrategy: (id: string) =>
    del(`/pricing/strategies/${id}`),
  // 切换策略状态
  toggleStrategyStatus: (id: string, status: string) =>
    put(`/pricing/strategies/${id}/status`, { status }),
  // 站点定价列表
  listStationPricing: (params?: any) =>
    get<any>('/pricing/stations', params),
  // 站点定价覆盖
  updateStationPricing: (stationId: string, data: any) =>
    put<any>(`/pricing/stations/${stationId}`, data),
  // 应用策略到站点
  applyToStations: (strategyId: string, stationIds: string[]) =>
    post(`/pricing/strategies/${strategyId}/apply`, { stationIds }),
}

// ==================== 数据分析 ====================
export const analyticsApi = {
  // 用户分析
  getUserGrowth: (params?: { period?: string }) =>
    get<any>('/analytics/users/growth', params),
  getUserRetention: (params?: { period?: string }) =>
    get<any>('/analytics/users/retention', params),
  getUserRfm: (params?: { period?: string }) =>
    get<any>('/analytics/users/rfm', params),
  // 站点分析
  getStationRevenueRanking: (params?: { period?: string; limit?: number }) =>
    get<any>('/analytics/stations/revenue-ranking', params),
  getStationUtilization: (params?: { period?: string; stationId?: string }) =>
    get<any>('/analytics/stations/utilization', params),
  getStationGeoDistribution: (params?: { period?: string }) =>
    get<any>('/analytics/stations/geo-distribution', params),
  // 充电分析
  getChargingPeakHours: (params?: { period?: string }) =>
    get<any>('/analytics/charging/peak-hours', params),
  getChargingDuration: (params?: { period?: string }) =>
    get<any>('/analytics/charging/duration', params),
  getChargingSoc: (params?: { period?: string }) =>
    get<any>('/analytics/charging/soc', params),
  getChargingEnergyTrend: (params?: { period?: string }) =>
    get<any>('/analytics/charging/energy-trend', params),
}

// ==================== 营销管理 ====================
export const marketingApi = {
  // --- 优惠券 ---
  couponList: (params?: any) =>
    get<any>('/marketing/coupons', params),
  couponDetail: (id: string) =>
    get<any>(`/marketing/coupons/${id}`),
  couponCreate: (data: any) =>
    post<any>('/marketing/coupons', data),
  couponUpdate: (id: string, data: any) =>
    put<any>(`/marketing/coupons/${id}`, data),
  couponDelete: (id: string) =>
    del(`/marketing/coupons/${id}`),
  couponToggle: (id: string, status: string) =>
    put(`/marketing/coupons/${id}/status`, { status }),

  // --- 活动 ---
  activityList: (params?: any) =>
    get<any>('/marketing/activities', params),
  activityDetail: (id: string) =>
    get<any>(`/marketing/activities/${id}`),
  activityCreate: (data: any) =>
    post<any>('/marketing/activities', data),
  activityUpdate: (id: string, data: any) =>
    put<any>(`/marketing/activities/${id}`, data),
  activityDelete: (id: string) =>
    del(`/marketing/activities/${id}`),
  activityToggle: (id: string, status: string) =>
    put(`/marketing/activities/${id}/status`, { status }),

  // --- 充值套餐 ---
  rechargePackageList: (params?: any) =>
    get<any>('/marketing/recharge-packages', params),
  rechargePackageDetail: (id: string) =>
    get<any>(`/marketing/recharge-packages/${id}`),
  rechargePackageCreate: (data: any) =>
    post<any>('/marketing/recharge-packages', data),
  rechargePackageUpdate: (id: string, data: any) =>
    put<any>(`/marketing/recharge-packages/${id}`, data),
  rechargePackageDelete: (id: string) =>
    del(`/marketing/recharge-packages/${id}`),
  rechargePackageToggle: (id: string, status: string) =>
    put(`/marketing/recharge-packages/${id}/status`, { status }),
}

// ==================== 告警管理 ====================
export const alertApi = {
  list: (params?: any) =>
    get<any>('/ops/alerts', params),
  detail: (id: string) =>
    get<any>(`/ops/alerts/${id}`),
  handle: (id: string, data: { result: string }) =>
    put<any>(`/ops/alerts/${id}/handle`, data),
  ignore: (id: string) =>
    put<any>(`/ops/alerts/${id}/ignore`),
  getRules: (params?: any) =>
    get<any>('/ops/alert-rules', params),
  createRule: (data: any) =>
    post<any>('/ops/alert-rules', data),
  updateRule: (id: string, data: any) =>
    put<any>(`/ops/alert-rules/${id}`, data),
  deleteRule: (id: string) =>
    del(`/ops/alert-rules/${id}`),
  toggleRuleStatus: (id: string, status: string) =>
    put(`/ops/alert-rules/${id}/status`, { status }),
}

// ==================== 系统管理 ====================
export const systemApi = {
  // 组织架构
  org: {
    tree: () =>
      get<any>('/system/org/tree'),
    create: (data: any) =>
      post<any>('/system/org', data),
    update: (id: string, data: any) =>
      put<any>(`/system/org/${id}`, data),
    delete: (id: string) =>
      del(`/system/org/${id}`),
  },
  // 角色管理
  roles: {
    list: (params?: any) =>
      get<any>('/system/roles', params),
    detail: (id: string) =>
      get<any>(`/system/roles/${id}`),
    create: (data: any) =>
      post<any>('/system/roles', data),
    update: (id: string, data: any) =>
      put<any>(`/system/roles/${id}`, data),
    delete: (id: string) =>
      del(`/system/roles/${id}`),
    permissionTree: () =>
      get<any>('/system/roles/permission-tree'),
    assignPermissions: (id: string, data: { menuIds: string[]; buttonIds: string[] }) =>
      put(`/system/roles/${id}/permissions`, data),
  },
  // 管理员账号
  adminUsers: {
    list: (params?: any) =>
      get<any>('/system/admin-users', params),
    detail: (id: string) =>
      get<any>(`/system/admin-users/${id}`),
    create: (data: any) =>
      post<any>('/system/admin-users', data),
    update: (id: string, data: any) =>
      put<any>(`/system/admin-users/${id}`, data),
    delete: (id: string) =>
      del(`/system/admin-users/${id}`),
    resetPassword: (id: string) =>
      put(`/system/admin-users/${id}/reset-password`),
    toggleStatus: (id: string, status: string) =>
      put(`/system/admin-users/${id}/status`, { status }),
  },
  // 审计日志
  auditLogs: {
    list: (params?: any) =>
      get<any>('/system/audit-logs', params),
    detail: (id: string) =>
      get<any>(`/system/audit-logs/${id}`),
  },
  // 系统配置
  config: {
    get: () =>
      get<any>('/system/config'),
    update: (data: any) =>
      put<any>('/system/config', data),
  },
}
