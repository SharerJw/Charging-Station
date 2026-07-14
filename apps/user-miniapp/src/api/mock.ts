// ==================== 用户端 Mock API ====================
// 模拟后端API，使小程序可以独立运行

export interface Station {
  id: string
  name: string
  address: string
  distance: number
  availableCount: number
  totalCount: number
  electricityPrice: number
  servicePrice: number
  latitude: number
  longitude: number
}

export interface ChargingSession {
  orderId: string
  stationName: string
  deviceCode: string
  status: 'charging' | 'completed' | 'error'
  currentSoc: number
  power: number
  energy: number
  duration: number
  cost: number
  startTime: string
}

export interface Order {
  id: string
  orderNo: string
  stationName: string
  status: 'charging' | 'completed' | 'refunded' | 'abnormal'
  consumedEnergy: number
  totalAmount: number
  startTime: string
  endTime: string
}

export interface UserInfo {
  id: string
  nickname: string
  phone: string
  avatar: string
  balance: number
  couponCount: number
}

// 模拟数据
const MOCK_STATIONS: Station[] = [
  { id: 'S001', name: '北京朝阳充电站', address: '朝阳区建国路88号', distance: 350, availableCount: 5, totalCount: 12, electricityPrice: 1.2, servicePrice: 0.5, latitude: 39.92, longitude: 116.46 },
  { id: 'S002', name: '北京国贸快充站', address: '朝阳区光华路12号', distance: 820, availableCount: 2, totalCount: 8, electricityPrice: 1.5, servicePrice: 0.6, latitude: 39.91, longitude: 116.46 },
  { id: 'S003', name: '北京三里屯充电站', address: '朝阳区三里屯路19号', distance: 1200, availableCount: 8, totalCount: 10, electricityPrice: 1.3, servicePrice: 0.5, latitude: 39.93, longitude: 116.45 },
  { id: 'S004', name: '北京望京超充站', address: '朝阳区望京街道', distance: 2500, availableCount: 0, totalCount: 6, electricityPrice: 1.0, servicePrice: 0.4, latitude: 39.99, longitude: 116.47 },
]

const MOCK_ORDERS: Order[] = [
  { id: 'O001', orderNo: 'ORD-20260713-001', stationName: '北京朝阳充电站', status: 'completed', consumedEnergy: 45.5, totalAmount: 77.35, startTime: '2026-07-13 09:30:00', endTime: '2026-07-13 11:00:00' },
  { id: 'O002', orderNo: 'ORD-20260712-001', stationName: '北京国贸快充站', status: 'completed', consumedEnergy: 32.0, totalAmount: 62.40, startTime: '2026-07-12 14:00:00', endTime: '2026-07-12 15:30:00' },
  { id: 'O003', orderNo: 'ORD-20260711-001', stationName: '北京朝阳充电站', status: 'refunded', consumedEnergy: 10.5, totalAmount: 17.85, startTime: '2026-07-11 20:00:00', endTime: '2026-07-11 21:00:00' },
]

function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const mockApi = {
  // 获取充电站列表
  async getStations(params?: { keyword?: string; latitude?: number; longitude?: number }): Promise<Station[]> {
    await delay(300)
    let stations = [...MOCK_STATIONS]
    if (params?.keyword?.trim()) {
      const kw = params.keyword.trim().toLowerCase()
      stations = stations.filter(s => s.name.toLowerCase().includes(kw) || s.address.toLowerCase().includes(kw))
    }
    return stations.sort((a, b) => a.distance - b.distance)
  },

  // 获取充电站详情
  async getStationDetail(id: string): Promise<Station> {
    await delay(200)
    const station = MOCK_STATIONS.find(s => s.id === id)
    if (!station) throw new Error('充电站不存在')
    return { ...station }
  },

  // 开始充电
  async startCharging(data: { stationId: string; deviceCode: string; connectorId: number }): Promise<ChargingSession> {
    await delay(500)
    const station = MOCK_STATIONS.find(s => s.id === data.stationId)
    return {
      orderId: `O${Date.now()}`,
      stationName: station?.name || '充电站',
      deviceCode: data.deviceCode,
      status: 'charging',
      currentSoc: 20 + Math.floor(Math.random() * 20),
      power: 45 + Math.random() * 20,
      energy: 0,
      duration: 0,
      cost: 0,
      startTime: new Date().toISOString(),
    }
  },

  // 停止充电
  async stopCharging(orderId: string): Promise<ChargingSession> {
    await delay(300)
    return {
      orderId,
      stationName: '北京朝阳充电站',
      deviceCode: 'BJ-CY-001-CP01',
      status: 'completed',
      currentSoc: 75,
      power: 0,
      energy: 45.5,
      duration: 5400,
      cost: 77.35,
      startTime: new Date(Date.now() - 5400000).toISOString(),
    }
  },

  // 获取充电状态
  async getChargingStatus(orderId: string): Promise<ChargingSession> {
    await delay(200)
    return {
      orderId,
      stationName: '北京朝阳充电站',
      deviceCode: 'BJ-CY-001-CP01',
      status: 'charging',
      currentSoc: 45 + Math.floor(Math.random() * 20),
      power: 50 + Math.random() * 15,
      energy: 15 + Math.random() * 10,
      duration: 1800 + Math.floor(Math.random() * 3600),
      cost: 25 + Math.random() * 20,
      startTime: new Date(Date.now() - 3600000).toISOString(),
    }
  },

  // 获取订单列表
  async getOrders(params?: { status?: string; page?: number }): Promise<Order[]> {
    await delay(300)
    let orders = [...MOCK_ORDERS]
    if (params?.status && params.status !== 'all') {
      orders = orders.filter(o => o.status === params.status)
    }
    return orders
  },

  // 获取订单详情
  async getOrderDetail(id: string): Promise<Order> {
    await delay(200)
    const order = MOCK_ORDERS.find(o => o.id === id)
    if (!order) throw new Error('订单不存在')
    return { ...order }
  },

  // 用户登录
  async login(data: { phone: string; code: string }): Promise<{ token: string; user: UserInfo }> {
    await delay(500)
    if (data.code !== '123456') throw new Error('验证码错误')
    return {
      token: 'mock_user_token_' + Date.now(),
      user: {
        id: 'U001',
        nickname: '张三',
        phone: data.phone,
        avatar: '',
        balance: 150.00,
        couponCount: 3,
      },
    }
  },

  // 获取用户信息
  async getUserInfo(): Promise<UserInfo> {
    await delay(200)
    return {
      id: 'U001',
      nickname: '张三',
      phone: '13812341234',
      avatar: '',
      balance: 150.00,
      couponCount: 3,
    }
  },
}
