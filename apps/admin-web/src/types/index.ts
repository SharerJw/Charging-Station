// 充电站相关类型
export interface Station {
  id: string
  name: string
  code: string
  address: string
  province: string
  city: string
  district: string
  longitude: number
  latitude: number
  contactName: string
  contactPhone: string
  deviceCount: number
  onlineCount: number
  status: StationStatus
  businessHours: string
  parkingFee: number
  electricityPrice: number
  servicePrice: number
  tenantId: string
  createTime: string
  updateTime: string
}

export const StationStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
} as const
export type StationStatus = typeof StationStatus[keyof typeof StationStatus]

export interface StationQuery {
  keyword?: string
  status?: StationStatus
  city?: string
  page: number
  size: number
}

export interface StationForm {
  name: string
  code: string
  address: string
  province: string
  city: string
  district: string
  longitude: number
  latitude: number
  contactName: string
  contactPhone: string
  businessHours: string
  parkingFee: number
  electricityPrice: number
  servicePrice: number
}

// 设备相关类型
export interface Device {
  id: string
  stationId: string
  stationName: string
  code: string
  ocppId: string
  model: string
  type: DeviceType
  power: number
  connectorCount: number
  connectors: Connector[]
  status: DeviceStatus
  firmwareVersion: string
  lastHeartbeat: string
  createTime: string
}

export const DeviceType = {
  AC: 'AC',
  DC: 'DC',
} as const
export type DeviceType = typeof DeviceType[keyof typeof DeviceType]

export const DeviceStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  CHARGING: 'CHARGING',
  FAULT: 'FAULT',
  MAINTENANCE: 'MAINTENANCE',
} as const
export type DeviceStatus = typeof DeviceStatus[keyof typeof DeviceStatus]

export interface Connector {
  id: string
  connectorId: number
  type: ConnectorType
  status: ConnectorStatus
  power: number
  currentTransactionId?: string
}

export const ConnectorType = {
  TYPE2: 'TYPE2',
  CCS: 'CCS',
  CHADEMO: 'CHADEMO',
  GB_T: 'GB_T',
} as const
export type ConnectorType = typeof ConnectorType[keyof typeof ConnectorType]

export const ConnectorStatus = {
  AVAILABLE: 'AVAILABLE',
  PREPARING: 'PREPARING',
  CHARGING: 'CHARGING',
  SUSPENDED_EVSE: 'SUSPENDED_EVSE',
  SUSPENDED_EV: 'SUSPENDED_EV',
  FINISHING: 'FINISHING',
  RESERVED: 'RESERVED',
  UNAVAILABLE: 'UNAVAILABLE',
  FAULTED: 'FAULTED',
} as const
export type ConnectorStatus = typeof ConnectorStatus[keyof typeof ConnectorStatus]

// 订单相关类型
export interface Order {
  id: string
  orderNo: string
  userId: string
  userName: string
  userPhone: string
  stationId: string
  stationName: string
  deviceId: string
  deviceCode: string
  connectorId: number
  transactionId: number
  status: OrderStatus
  startSoc: number
  endSoc: number
  startMeterValue: number
  endMeterValue: number
  consumedEnergy: number
  electricityAmount: number
  serviceAmount: number
  parkingAmount: number
  totalAmount: number
  discountAmount: number
  payableAmount: number
  startTime: string
  endTime: string
  duration: number
  payTime?: string
  payMethod?: PayMethod
  createTime: string
}

export const OrderStatus = {
  CREATED: 'CREATED',
  CHARGING: 'CHARGING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  SETTLING: 'SETTLING',
  SETTLED: 'SETTLED',
  PAYING: 'PAYING',
  PAID: 'PAID',
  REFUNDING: 'REFUNDING',
  ABNORMAL: 'ABNORMAL',
  CANCELLED: 'CANCELLED',
} as const
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus]

export const PayMethod = {
  WECHAT: 'WECHAT',
  ALIPAY: 'ALIPAY',
  BALANCE: 'BALANCE',
} as const
export type PayMethod = typeof PayMethod[keyof typeof PayMethod]

export interface OrderQuery {
  orderNo?: string
  status?: OrderStatus
  stationId?: string
  userId?: string
  startTime?: string
  endTime?: string
  page: number
  size: number
}

// 用户相关类型
export interface User {
  id: string
  nickname: string
  phone: string
  avatar: string
  balance: number
  totalConsumption: number
  orderCount: number
  status: UserStatus
  createTime: string
}

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const
export type UserStatus = typeof UserStatus[keyof typeof UserStatus]

// 通用类型
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 仪表盘统计
export interface DashboardStats {
  stationCount: number
  deviceCount: number
  onlineDeviceCount: number
  todayOrderCount: number
  todayRevenue: number
  monthRevenue: number
  totalEnergy: number
  todayEnergy: number
}

export interface ChartData {
  dates: string[]
  orderCounts: number[]
  revenues: number[]
  energies: number[]
}
