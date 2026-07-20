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
export interface TrendData {
  daily: number
  weekly: number
}

export interface DashboardStats {
  stationCount: number
  deviceCount: number
  onlineDeviceCount: number
  todayOrderCount: number
  todayRevenue: number
  monthRevenue: number
  totalEnergy: number
  todayEnergy: number
  trends?: Record<string, TrendData>
}

export interface ChartData {
  dates: string[]
  orderCounts: number[]
  revenues: number[]
  energies: number[]
}

// ==================== 运维模块类型 ====================

// 工单
export const WorkOrderStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  COMPLETED: 'completed',
  CLOSED: 'closed',
} as const
export type WorkOrderStatus = typeof WorkOrderStatus[keyof typeof WorkOrderStatus]

export const WorkOrderType = {
  REPAIR: 'repair',
  MAINTENANCE: 'maintenance',
  INSPECTION: 'inspection',
} as const
export type WorkOrderType = typeof WorkOrderType[keyof typeof WorkOrderType]

export const WorkOrderPriority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const
export type WorkOrderPriority = typeof WorkOrderPriority[keyof typeof WorkOrderPriority]

export interface WorkOrder {
  id: string
  orderNo: string
  type: WorkOrderType
  title: string
  description: string
  stationId: string
  stationName: string
  deviceId: string
  deviceCode: string
  priority: WorkOrderPriority
  status: WorkOrderStatus
  assigneeId: string
  assigneeName: string
  creatorId: string
  creatorName: string
  result: string
  slaDeadline: string
  acceptTime?: string
  completeTime?: string
  closeTime?: string
  createTime: string
  updateTime: string
}

export interface WorkOrderQuery {
  keyword?: string
  type?: WorkOrderType
  status?: WorkOrderStatus
  priority?: WorkOrderPriority
  stationId?: string
  assigneeId?: string
  startTime?: string
  endTime?: string
  page: number
  size: number
}

// 巡检
export const InspectionStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const
export type InspectionStatus = typeof InspectionStatus[keyof typeof InspectionStatus]

export interface Inspection {
  id: string
  name: string
  stationId: string
  stationName: string
  deviceCount: number
  itemCount: number
  status: InspectionStatus
  inspectorId: string
  inspectorName: string
  scheduledDate: string
  startTime?: string
  completeTime?: string
  remark: string
  createTime: string
}

export interface InspectionQuery {
  keyword?: string
  status?: InspectionStatus
  stationId?: string
  inspectorId?: string
  startTime?: string
  endTime?: string
  page: number
  size: number
}

// 备件
export interface SparePart {
  id: string
  code: string
  name: string
  specification: string
  category: string
  unit: string
  stock: number
  safetyStock: number
  unitPrice: number
  supplier: string
  remark: string
  createTime: string
  updateTime: string
}

export interface SparePartQuery {
  keyword?: string
  category?: string
  stockWarning?: boolean
  page: number
  size: number
}

// ==================== 告警管理模块类型 ====================

export const AlertLevel = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
} as const
export type AlertLevel = typeof AlertLevel[keyof typeof AlertLevel]

export const AlertStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  RESOLVED: 'resolved',
  IGNORED: 'ignored',
} as const
export type AlertStatus = typeof AlertStatus[keyof typeof AlertStatus]

export interface Alert {
  id: string
  level: AlertLevel
  title: string
  description: string
  stationName: string
  deviceCode: string
  status: AlertStatus
  handler?: string
  handleTime?: string
  handleResult?: string
  createTime: string
}

export interface AlertQuery {
  level?: AlertLevel
  status?: AlertStatus
  keyword?: string
  stationId?: string
  startTime?: string
  endTime?: string
  page?: number
  size?: number
}

// ==================== 定价策略相关类型 ====================

export const PricingStrategyType = {
  UNIFORM: 'UNIFORM',
  TIME_OF_USE: 'TIME_OF_USE',
  TIERED: 'TIERED',
} as const
export type PricingStrategyType = typeof PricingStrategyType[keyof typeof PricingStrategyType]

export const PricingStrategyStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type PricingStrategyStatus = typeof PricingStrategyStatus[keyof typeof PricingStrategyStatus]

export interface TimePeriod {
  id?: string
  startTime: string
  endTime: string
  electricityFee: number
  serviceFee: number
  periodType?: 'PEAK' | 'FLAT' | 'VALLEY' | 'SUPER_PEAK'
}

export interface MemberDiscount {
  level: string
  discountRate: number
  description?: string
}

export interface PricingStrategy {
  id: string
  name: string
  type: PricingStrategyType
  deviceType: DeviceType
  status: PricingStrategyStatus
  electricityFee: number
  serviceFee: number
  timePeriods: TimePeriod[]
  memberDiscounts: MemberDiscount[]
  stationCount: number
  tenantId: string
  createTime: string
  updateTime: string
}

export interface PricingStrategyForm {
  name: string
  type: PricingStrategyType
  deviceType: DeviceType
  status: PricingStrategyStatus
  electricityFee: number
  serviceFee: number
  timePeriods: TimePeriod[]
  memberDiscounts: MemberDiscount[]
}

export interface PricingStrategyQuery {
  keyword?: string
  type?: PricingStrategyType
  status?: PricingStrategyStatus
  deviceType?: DeviceType
  page: number
  size: number
}

export interface StationPricingOverride {
  id: string
  stationId: string
  stationName: string
  strategyId: string
  strategyName: string
  electricityFee: number
  serviceFee: number
  overrideElectricityFee?: number
  overrideServiceFee?: number
  effectiveFee: number
  status: PricingStrategyStatus
  updateTime: string
}

export interface StationPricingQuery {
  keyword?: string
  strategyId?: string
  page: number
  size: number
}

// ==================== 系统管理模块类型 ====================

// 组织架构
export interface OrgNode {
  id: string
  label: string
  parentId: string | null
  sort: number
  leaderName: string
  leaderPhone: string
  stationCount: number
  memberCount: number
  status: string
  children: OrgNode[]
  createTime: string
}

export interface OrgForm {
  parentId: string | null
  label: string
  sort: number
  leaderName: string
  leaderPhone: string
  status: string
}

// 角色管理
export interface Role {
  id: string
  name: string
  code: string
  description: string
  userCount: number
  menuIds: string[]
  buttonIds: string[]
  status: string
  createTime: string
  updateTime: string
}

export interface RoleForm {
  name: string
  code: string
  description: string
  status: string
}

export interface RoleQuery {
  keyword?: string
  status?: string
  page: number
  size: number
}

// 权限菜单树节点
export interface MenuPermissionNode {
  id: string
  label: string
  type: string
  children: MenuPermissionNode[]
}

// 管理员账号
export interface AdminUser {
  id: string
  username: string
  nickname: string
  phone: string
  email: string
  roleId: string
  roleName: string
  orgId: string
  orgName: string
  status: string
  lastLoginTime: string
  lastLoginIp: string
  createTime: string
  updateTime: string
}

export interface AdminUserForm {
  username: string
  nickname: string
  phone: string
  email: string
  roleId: string
  orgId: string
  password?: string
  status: string
}

export interface AdminUserQuery {
  keyword?: string
  roleId?: string
  orgId?: string
  status?: string
  page: number
  size: number
}

// 审计日志
export interface AuditLog {
  id: string
  operatorId: string
  operatorName: string
  module: string
  action: string
  content: string
  ip: string
  userAgent: string
  requestMethod: string
  requestUrl: string
  duration: number
  status: string
  errorMessage: string
  createTime: string
}

export interface AuditLogQuery {
  operatorName?: string
  module?: string
  action?: string
  status?: string
  startTime?: string
  endTime?: string
  page: number
  size: number
}

// 系统配置
export interface SystemConfig {
  // 基础配置
  platformName: string
  platformLogo: string
  customerServicePhone: string
  customerServiceEmail: string
  icpNumber: string
  // 充电配置
  defaultElectricityPrice: number
  defaultServicePrice: number
  orderTimeout: number
  heartbeatInterval: number
  maxChargingDuration: number
  socFullThreshold: number
  autoStopEnabled: boolean
  // 支付配置
  payTimeout: number
  minRechargeAmount: number
  maxRechargeAmount: number
  refundEnabled: boolean
  refundDeadlineDays: number
  wechatPayEnabled: boolean
  alipayEnabled: boolean
  balancePayEnabled: boolean
  // 通知配置
  smsEnabled: boolean
  smsProvider: string
  pushEnabled: boolean
  emailEnabled: boolean
  alertNotifyEnabled: boolean
  orderNotifyEnabled: boolean
  // 地图配置
  mapProvider: string
  mapKey: string
  defaultLongitude: number
  defaultLatitude: number
  defaultZoom: number
  // 安全配置
  loginFailLock: number
  loginFailLockMinutes: number
  passwordMinLength: number
  passwordExpireDays: number
  sessionTimeout: number
  ipWhitelist: string
  apiRateLimit: number
}
