import type { PageResult, Station, Device, Order, User, DashboardStats, ChartData, StationForm, StationQuery, OrderQuery } from '@/types'
import { StationStatus, DeviceStatus, DeviceType, OrderStatus, ConnectorStatus, ConnectorType, UserStatus, PayMethod } from '@/types'

// ==================== 模拟数据 ====================

const MOCK_STATIONS: Station[] = [
  { id: 'S001', name: '北京朝阳充电站', code: 'BJ-CY-001', address: '北京市朝阳区建国路88号', province: '北京市', city: '北京市', district: '朝阳区', longitude: 116.46, latitude: 39.92, contactName: '张经理', contactPhone: '13800001111', deviceCount: 12, onlineCount: 10, status: StationStatus.ACTIVE, businessHours: '00:00-24:00', parkingFee: 0, electricityPrice: 1.2, servicePrice: 0.5, tenantId: 'T001', createTime: '2024-01-15 10:00:00', updateTime: '2026-07-13 08:00:00' },
  { id: 'S002', name: '上海浦东快充站', code: 'SH-PD-001', address: '上海市浦东新区张江高科技园区', province: '上海市', city: '上海市', district: '浦东新区', longitude: 121.59, latitude: 31.22, contactName: '李站长', contactPhone: '13900002222', deviceCount: 8, onlineCount: 7, status: StationStatus.ACTIVE, businessHours: '06:00-23:00', parkingFee: 5, electricityPrice: 1.5, servicePrice: 0.6, tenantId: 'T001', createTime: '2024-03-20 14:00:00', updateTime: '2026-07-12 18:00:00' },
  { id: 'S003', name: '深圳南山超充站', code: 'SZ-NS-001', address: '深圳市南山区科技园南路', province: '广东省', city: '深圳市', district: '南山区', longitude: 113.94, latitude: 22.53, contactName: '王主管', contactPhone: '13700003333', deviceCount: 6, onlineCount: 6, status: StationStatus.ACTIVE, businessHours: '00:00-24:00', parkingFee: 0, electricityPrice: 1.0, servicePrice: 0.4, tenantId: 'T002', createTime: '2024-05-10 09:00:00', updateTime: '2026-07-13 10:00:00' },
  { id: 'S004', name: '广州天河充电站', code: 'GZ-TH-001', address: '广州市天河区体育西路', province: '广东省', city: '广州市', district: '天河区', longitude: 113.33, latitude: 23.13, contactName: '赵经理', contactPhone: '13600004444', deviceCount: 15, onlineCount: 0, status: StationStatus.INACTIVE, businessHours: '08:00-22:00', parkingFee: 8, electricityPrice: 1.3, servicePrice: 0.5, tenantId: 'T002', createTime: '2024-02-28 11:00:00', updateTime: '2026-06-01 16:00:00' },
  { id: 'S005', name: '杭州西湖慢充站', code: 'HZ-XH-001', address: '杭州市西湖区文三路', province: '浙江省', city: '杭州市', district: '西湖区', longitude: 120.13, latitude: 30.27, contactName: '孙站长', contactPhone: '13500005555', deviceCount: 20, onlineCount: 18, status: StationStatus.ACTIVE, businessHours: '00:00-24:00', parkingFee: 0, electricityPrice: 0.8, servicePrice: 0.3, tenantId: 'T001', createTime: '2024-04-15 08:00:00', updateTime: '2026-07-13 09:30:00' },
]

const MOCK_DEVICES: Device[] = [
  { id: 'D001', stationId: 'S001', stationName: '北京朝阳充电站', code: 'BJ-CY-001-CP01', ocppId: 'EVSE-BJ-001', model: 'DC-120kW-V3', type: DeviceType.DC, power: 120, connectorCount: 2, connectors: [{ id: 'C001', connectorId: 1, type: ConnectorType.CCS, status: ConnectorStatus.CHARGING, power: 95.5, currentTransactionId: 'TX-20260713001' }, { id: 'C002', connectorId: 2, type: ConnectorType.GB_T, status: ConnectorStatus.AVAILABLE, power: 0 }], status: DeviceStatus.CHARGING, firmwareVersion: '3.2.1', lastHeartbeat: '2026-07-13 10:30:00', createTime: '2024-01-20 10:00:00' },
  { id: 'D002', stationId: 'S001', stationName: '北京朝阳充电站', code: 'BJ-CY-001-CP02', ocppId: 'EVSE-BJ-002', model: 'AC-7kW-V2', type: DeviceType.AC, power: 7, connectorCount: 1, connectors: [{ id: 'C003', connectorId: 1, type: ConnectorType.TYPE2, status: ConnectorStatus.AVAILABLE, power: 0 }], status: DeviceStatus.ONLINE, firmwareVersion: '2.5.0', lastHeartbeat: '2026-07-13 10:30:05', createTime: '2024-01-20 10:00:00' },
  { id: 'D003', stationId: 'S001', stationName: '北京朝阳充电站', code: 'BJ-CY-001-CP03', ocppId: 'EVSE-BJ-003', model: 'DC-60kW-V2', type: DeviceType.DC, power: 60, connectorCount: 1, connectors: [{ id: 'C004', connectorId: 1, type: ConnectorType.CCS, status: ConnectorStatus.FAULTED, power: 0 }], status: DeviceStatus.FAULT, firmwareVersion: '2.8.3', lastHeartbeat: '2026-07-13 09:15:00', createTime: '2024-02-10 14:00:00' },
  { id: 'D004', stationId: 'S002', stationName: '上海浦东快充站', ocppId: 'EVSE-SH-001', code: 'SH-PD-001-CP01', model: 'DC-240kW-V1', type: DeviceType.DC, power: 240, connectorCount: 2, connectors: [{ id: 'C005', connectorId: 1, type: ConnectorType.CCS, status: ConnectorStatus.CHARGING, power: 180.2, currentTransactionId: 'TX-20260713002' }, { id: 'C006', connectorId: 2, type: ConnectorType.GB_T, status: ConnectorStatus.AVAILABLE, power: 0 }], status: DeviceStatus.CHARGING, firmwareVersion: '1.5.0', lastHeartbeat: '2026-07-13 10:30:10', createTime: '2024-03-25 09:00:00' },
  { id: 'D005', stationId: 'S003', stationName: '深圳南山超充站', ocppId: 'EVSE-SZ-001', code: 'SZ-NS-001-CP01', model: 'DC-360kW-V1', type: DeviceType.DC, power: 360, connectorCount: 2, connectors: [{ id: 'C007', connectorId: 1, type: ConnectorType.CCS, status: ConnectorStatus.AVAILABLE, power: 0 }, { id: 'C008', connectorId: 2, type: ConnectorType.CCS, status: ConnectorStatus.AVAILABLE, power: 0 }], status: DeviceStatus.ONLINE, firmwareVersion: '1.0.2', lastHeartbeat: '2026-07-13 10:30:15', createTime: '2024-05-15 10:00:00' },
]

const MOCK_ORDERS: Order[] = [
  { id: 'O001', orderNo: 'ORD-20260713-001', userId: 'U001', userName: '张三', userPhone: '138****1234', stationId: 'S001', stationName: '北京朝阳充电站', deviceId: 'D001', deviceCode: 'BJ-CY-001-CP01', connectorId: 1, transactionId: 1001, status: OrderStatus.CHARGING, startSoc: 20, endSoc: 0, startMeterValue: 12345.6, endMeterValue: 0, consumedEnergy: 0, electricityAmount: 0, serviceAmount: 0, parkingAmount: 0, totalAmount: 0, discountAmount: 0, payableAmount: 0, startTime: '2026-07-13 09:30:00', endTime: '', duration: 0, createTime: '2026-07-13 09:30:00' },
  { id: 'O002', orderNo: 'ORD-20260713-002', userId: 'U002', userName: '李四', userPhone: '139****5678', stationId: 'S002', stationName: '上海浦东快充站', deviceId: 'D004', deviceCode: 'SH-PD-001-CP01', connectorId: 1, transactionId: 1002, status: OrderStatus.CHARGING, startSoc: 15, endSoc: 0, startMeterValue: 8901.2, endMeterValue: 0, consumedEnergy: 0, electricityAmount: 0, serviceAmount: 0, parkingAmount: 0, totalAmount: 0, discountAmount: 0, payableAmount: 0, startTime: '2026-07-13 10:00:00', endTime: '', duration: 0, createTime: '2026-07-13 10:00:00' },
  { id: 'O003', orderNo: 'ORD-20260712-001', userId: 'U001', userName: '张三', userPhone: '138****1234', stationId: 'S001', stationName: '北京朝阳充电站', deviceId: 'D002', deviceCode: 'BJ-CY-001-CP02', connectorId: 1, transactionId: 998, status: OrderStatus.PAID, startSoc: 30, endSoc: 85, startMeterValue: 12200.0, endMeterValue: 12245.5, consumedEnergy: 45.5, electricityAmount: 54.60, serviceAmount: 22.75, parkingAmount: 0, totalAmount: 77.35, discountAmount: 5.00, payableAmount: 72.35, startTime: '2026-07-12 14:00:00', endTime: '2026-07-12 15:30:00', duration: 5400, payTime: '2026-07-12 15:31:00', payMethod: PayMethod.WECHAT, createTime: '2026-07-12 14:00:00' },
  { id: 'O004', orderNo: 'ORD-20260712-002', userId: 'U003', userName: '王五', userPhone: '137****9012', stationId: 'S003', stationName: '深圳南山超充站', deviceId: 'D005', deviceCode: 'SZ-NS-001-CP01', connectorId: 1, transactionId: 997, status: OrderStatus.PAID, startSoc: 10, endSoc: 90, startMeterValue: 5678.0, endMeterValue: 5746.0, consumedEnergy: 68.0, electricityAmount: 68.00, serviceAmount: 27.20, parkingAmount: 0, totalAmount: 95.20, discountAmount: 0, payableAmount: 95.20, startTime: '2026-07-12 16:00:00', endTime: '2026-07-12 17:15:00', duration: 4500, payTime: '2026-07-12 17:16:00', payMethod: PayMethod.ALIPAY, createTime: '2026-07-12 16:00:00' },
  { id: 'O005', orderNo: 'ORD-20260711-001', userId: 'U002', userName: '李四', userPhone: '139****5678', stationId: 'S005', stationName: '杭州西湖慢充站', deviceId: 'D006', deviceCode: 'HZ-XH-001-CP01', connectorId: 1, transactionId: 995, status: OrderStatus.REFUNDING, startSoc: 50, endSoc: 65, startMeterValue: 3456.0, endMeterValue: 3466.5, consumedEnergy: 10.5, electricityAmount: 8.40, serviceAmount: 3.15, parkingAmount: 0, totalAmount: 11.55, discountAmount: 0, payableAmount: 11.55, startTime: '2026-07-11 20:00:00', endTime: '2026-07-11 21:30:00', duration: 5400, payTime: '2026-07-11 21:31:00', payMethod: PayMethod.WECHAT, createTime: '2026-07-11 20:00:00' },
  { id: 'O006', orderNo: 'ORD-20260711-002', userId: 'U004', userName: '赵六', userPhone: '136****3456', stationId: 'S001', stationName: '北京朝阳充电站', deviceId: 'D001', deviceCode: 'BJ-CY-001-CP01', connectorId: 2, transactionId: 993, status: OrderStatus.ABNORMAL, startSoc: 45, endSoc: 52, startMeterValue: 12100.0, endMeterValue: 12107.0, consumedEnergy: 7.0, electricityAmount: 8.40, serviceAmount: 3.50, parkingAmount: 0, totalAmount: 11.90, discountAmount: 0, payableAmount: 11.90, startTime: '2026-07-11 10:00:00', endTime: '2026-07-11 10:25:00', duration: 1500, createTime: '2026-07-11 10:00:00' },
]

const MOCK_USERS: User[] = [
  { id: 'U001', nickname: '张三', phone: '13812341234', avatar: '', balance: 150.00, totalConsumption: 2345.60, orderCount: 45, status: UserStatus.ACTIVE, createTime: '2024-01-05 10:00:00' },
  { id: 'U002', nickname: '李四', phone: '13956785678', avatar: '', balance: 80.50, totalConsumption: 1567.80, orderCount: 32, status: UserStatus.ACTIVE, createTime: '2024-02-10 14:00:00' },
  { id: 'U003', nickname: '王五', phone: '13790129012', avatar: '', balance: 500.00, totalConsumption: 5678.90, orderCount: 78, status: UserStatus.ACTIVE, createTime: '2023-12-20 09:00:00' },
  { id: 'U004', nickname: '赵六', phone: '13634563456', avatar: '', balance: 0, totalConsumption: 234.50, orderCount: 8, status: UserStatus.DISABLED, createTime: '2024-06-15 16:00:00' },
  { id: 'U005', nickname: '孙七', phone: '13578907890', avatar: '', balance: 320.00, totalConsumption: 4567.20, orderCount: 56, status: UserStatus.ACTIVE, createTime: '2024-03-01 11:00:00' },
]

// ==================== Mock 工具函数 ====================

function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function paginate<T>(list: T[], page: number, size: number): PageResult<T> {
  const start = (page - 1) * size
  return {
    list: list.slice(start, start + size),
    total: list.length,
    page,
    size,
  }
}

// ==================== Mock API 服务 ====================

export const mockDashboardApi = {
  async getStats(): Promise<DashboardStats> {
    await delay(200)
    return {
      stationCount: MOCK_STATIONS.length,
      deviceCount: MOCK_DEVICES.length,
      onlineDeviceCount: MOCK_DEVICES.filter(d => d.status !== DeviceStatus.OFFLINE).length,
      todayOrderCount: 128,
      todayRevenue: 15678.90,
      monthRevenue: 456789.00,
      totalEnergy: 1234567.8,
      todayEnergy: 8901.2,
    }
  },

  async getChartData(days: number = 7): Promise<ChartData> {
    await delay(300)
    const dates: string[] = []
    const orderCounts: number[] = []
    const revenues: number[] = []
    const energies: number[] = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(`${d.getMonth() + 1}/${d.getDate()}`)
      orderCounts.push(Math.floor(80 + Math.random() * 80))
      revenues.push(Math.floor(8000 + Math.random() * 10000))
      energies.push(Math.floor(5000 + Math.random() * 5000))
    }
    return { dates, orderCounts, revenues, energies }
  },

  async getRecentOrders(limit: number = 5): Promise<Order[]> {
    await delay(200)
    return MOCK_ORDERS.slice(0, limit)
  },
}

export const mockStationApi = {
  async list(params: StationQuery): Promise<PageResult<Station>> {
    await delay(300)
    let filtered = [...MOCK_STATIONS]
    if (params.keyword) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter(s => s.name.toLowerCase().includes(kw) || s.address.toLowerCase().includes(kw) || s.code.toLowerCase().includes(kw))
    }
    if (params.status) {
      filtered = filtered.filter(s => s.status === params.status)
    }
    return paginate(filtered, params.page, params.size)
  },

  async detail(id: string): Promise<Station> {
    await delay(200)
    const station = MOCK_STATIONS.find(s => s.id === id)
    if (!station) throw new Error('充电站不存在')
    return { ...station }
  },

  async create(data: StationForm): Promise<Station> {
    await delay(500)
    const newStation: Station = {
      ...data,
      id: `S${String(MOCK_STATIONS.length + 1).padStart(3, '0')}`,
      deviceCount: 0,
      onlineCount: 0,
      status: StationStatus.ACTIVE,
      tenantId: 'T001',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    }
    MOCK_STATIONS.push(newStation)
    return newStation
  },

  async update(id: string, data: Partial<StationForm>): Promise<Station> {
    await delay(400)
    const idx = MOCK_STATIONS.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('充电站不存在')
    Object.assign(MOCK_STATIONS[idx], data, { updateTime: new Date().toISOString() })
    return MOCK_STATIONS[idx]
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const idx = MOCK_STATIONS.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('充电站不存在')
    MOCK_STATIONS.splice(idx, 1)
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await delay(200)
    const station = MOCK_STATIONS.find(s => s.id === id)
    if (station) station.status = status as StationStatus
  },
}

export const mockDeviceApi = {
  async list(params: any): Promise<PageResult<Device>> {
    await delay(300)
    let filtered = [...MOCK_DEVICES]
    if (params.keyword) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter(d => d.code.toLowerCase().includes(kw) || d.ocppId.toLowerCase().includes(kw))
    }
    if (params.stationId) {
      filtered = filtered.filter(d => d.stationId === params.stationId)
    }
    if (params.status) {
      filtered = filtered.filter(d => d.status === params.status)
    }
    return paginate(filtered, params.page || 1, params.size || 10)
  },

  async detail(id: string): Promise<Device> {
    await delay(200)
    const device = MOCK_DEVICES.find(d => d.id === id)
    if (!device) throw new Error('设备不存在')
    return { ...device }
  },

  async reset(id: string): Promise<void> {
    await delay(500)
    const device = MOCK_DEVICES.find(d => d.id === id)
    if (device) {
      device.status = DeviceStatus.ONLINE
      device.connectors.forEach(c => {
        c.status = ConnectorStatus.AVAILABLE
        c.power = 0
        c.currentTransactionId = undefined
      })
    }
  },
}

export const mockOrderApi = {
  async list(params: OrderQuery): Promise<PageResult<Order>> {
    await delay(300)
    let filtered = [...MOCK_ORDERS]
    if (params.orderNo) {
      filtered = filtered.filter(o => o.orderNo.includes(params.orderNo!))
    }
    if (params.status) {
      filtered = filtered.filter(o => o.status === params.status)
    }
    if (params.stationId) {
      filtered = filtered.filter(o => o.stationId === params.stationId)
    }
    return paginate(filtered, params.page, params.size)
  },

  async detail(id: string): Promise<Order> {
    await delay(200)
    const order = MOCK_ORDERS.find(o => o.id === id)
    if (!order) throw new Error('订单不存在')
    return { ...order }
  },

  async refund(id: string, _amount: number, _reason: string): Promise<void> {
    await delay(500)
    const order = MOCK_ORDERS.find(o => o.id === id)
    if (order) {
      order.status = OrderStatus.REFUNDING
    }
  },
}

export const mockUserApi = {
  async list(params: any): Promise<PageResult<User>> {
    await delay(300)
    let filtered = [...MOCK_USERS]
    if (params.keyword) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter(u => u.nickname.toLowerCase().includes(kw) || u.phone.includes(kw))
    }
    if (params.status) {
      filtered = filtered.filter(u => u.status === params.status)
    }
    return paginate(filtered, params.page || 1, params.size || 10)
  },

  async detail(id: string): Promise<User> {
    await delay(200)
    const user = MOCK_USERS.find(u => u.id === id)
    if (!user) throw new Error('用户不存在')
    return { ...user }
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await delay(300)
    const user = MOCK_USERS.find(u => u.id === id)
    if (user) user.status = status as UserStatus
  },
}

export const mockAuthApi = {
  async login(data: { username: string; password: string }): Promise<{ token: string; user: any }> {
    await delay(500)
    if (data.username === 'admin' && data.password === 'admin123') {
      return {
        token: 'mock_jwt_token_' + Date.now(),
        user: { id: 'A001', username: 'admin', nickname: '超级管理员', roles: ['admin'] },
      }
    }
    throw new Error('用户名或密码错误')
  },
}
