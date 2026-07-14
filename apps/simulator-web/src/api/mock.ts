import type { Device } from '@/store/simulator'

// ==================== OCPP 消息类型 ====================
export interface OcppMessage {
  messageId: string
  action: string
  type: 'Call' | 'CallResult' | 'CallError'
  payload: any
  timestamp: string
  direction: 'inbound' | 'outbound'
  chargePointId: string
}

// ==================== 充电事务 ====================
export interface Transaction {
  id: string
  transactionId: number
  chargePointId: string
  connectorId: number
  idTag: string
  status: 'active' | 'completed' | 'error'
  startTimestamp: string
  stopTimestamp?: string
  meterStart: number
  meterStop?: number
  energy: number
  power: number
  soc: number
  voltage: number
  current: number
}

// ==================== 模拟器状态 ====================
export interface SimulatorState {
  devices: Device[]
  transactions: Transaction[]
  messages: OcppMessage[]
  isRunning: boolean
}

// ==================== Mock 设备数据 ====================
const MOCK_DEVICES: Device[] = [
  {
    id: 'CP001',
    name: '充电桩-001',
    ocppId: 'EVSE-BJ-001',
    model: 'DC-120kW',
    status: 'online',
    power: 0,
    voltage: 0,
    current: 0,
    soc: 0,
    temperature: 25,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'CP002',
    name: '充电桩-002',
    ocppId: 'EVSE-BJ-002',
    model: 'DC-60kW',
    status: 'charging',
    power: 45.2,
    voltage: 400,
    current: 113,
    soc: 65,
    temperature: 38,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'CP003',
    name: '充电桩-003',
    ocppId: 'EVSE-SH-001',
    model: 'AC-7kW',
    status: 'online',
    power: 0,
    voltage: 0,
    current: 0,
    soc: 0,
    temperature: 22,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'CP004',
    name: '充电桩-004',
    ocppId: 'EVSE-SZ-001',
    model: 'DC-240kW',
    status: 'offline',
    power: 0,
    voltage: 0,
    current: 0,
    soc: 0,
    temperature: 20,
    lastHeartbeat: new Date(Date.now() - 300000).toISOString(),
  },
]

// ==================== 模拟消息流 ====================
const OCPP_ACTIONS = [
  'BootNotification', 'Heartbeat', 'StatusNotification', 'StartTransaction',
  'StopTransaction', 'MeterValues', 'RemoteStartTransaction', 'RemoteStopTransaction',
  'Reset', 'UnlockConnector', 'ChangeConfiguration', 'GetConfiguration',
]

function generateMessage(deviceId: string, action: string, direction: 'inbound' | 'outbound'): OcppMessage {
  const payloads: Record<string, any> = {
    BootNotification: { chargePointVendor: 'EV-Charge', chargePointModel: 'DC-120kW', firmwareVersion: '3.2.1' },
    Heartbeat: {},
    StatusNotification: { connectorId: 1, status: 'Available', errorCode: 'NoError' },
    StartTransaction: { connectorId: 1, idTag: 'USER-001', meterStart: 12345, timestamp: new Date().toISOString() },
    StopTransaction: { transactionId: 1001, meterStop: 12400, timestamp: new Date().toISOString(), reason: 'Remote' },
    MeterValues: { connectorId: 1, meterValue: [{ timestamp: new Date().toISOString(), sampledValue: [{ value: '45.2', unit: 'W', measurand: 'Power.Active.Import' }] }] },
    Reset: { type: 'Hard' },
    UnlockConnector: { connectorId: 1 },
  }

  return {
    messageId: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    action,
    type: direction === 'inbound' ? 'Call' : 'CallResult',
    payload: payloads[action] || {},
    timestamp: new Date().toISOString(),
    direction,
    chargePointId: deviceId,
  }
}

// ==================== 模拟 API 服务 ====================
export const mockSimulatorApi = {
  // 获取设备列表
  async getDevices(): Promise<Device[]> {
    await new Promise(r => setTimeout(r, 200))
    return [...MOCK_DEVICES]
  },

  // 启动充电模拟
  async startCharging(deviceId: string, _config: { targetSoc: number; maxPower: number }): Promise<Transaction> {
    await new Promise(r => setTimeout(r, 500))
    const device = MOCK_DEVICES.find(d => d.id === deviceId)
    if (!device) throw new Error('设备不存在')

    const transaction: Transaction = {
      id: `TX-${Date.now()}`,
      transactionId: Math.floor(Math.random() * 10000),
      chargePointId: device.ocppId,
      connectorId: 1,
      idTag: `USER-${Math.floor(Math.random() * 1000)}`,
      status: 'active',
      startTimestamp: new Date().toISOString(),
      meterStart: 12345 + Math.floor(Math.random() * 1000),
      energy: 0,
      power: 0,
      soc: Math.floor(Math.random() * 30) + 10,
      voltage: device.model.includes('DC') ? 400 : 220,
      current: 0,
    }

    device.status = 'charging'
    device.soc = transaction.soc
    return transaction
  },

  // 停止充电
  async stopCharging(transactionId: string): Promise<Transaction> {
    await new Promise(r => setTimeout(r, 300))
    return {
      id: transactionId,
      transactionId: 1001,
      chargePointId: 'EVSE-BJ-001',
      connectorId: 1,
      idTag: 'USER-001',
      status: 'completed',
      startTimestamp: new Date(Date.now() - 3600000).toISOString(),
      stopTimestamp: new Date().toISOString(),
      meterStart: 12345,
      meterStop: 12400,
      energy: 55,
      power: 0,
      soc: 80,
      voltage: 400,
      current: 0,
    }
  },

  // 发送 OCPP 消息
  async sendMessage(deviceId: string, action: string): Promise<OcppMessage> {
    await new Promise(r => setTimeout(r, 200))
    return generateMessage(deviceId, action, 'outbound')
  },

  // 获取消息历史
  async getMessageHistory(limit: number = 50): Promise<OcppMessage[]> {
    await new Promise(r => setTimeout(r, 200))
    const messages: OcppMessage[] = []
    for (let i = 0; i < limit; i++) {
      const action = OCPP_ACTIONS[Math.floor(Math.random() * OCPP_ACTIONS.length)]
      const device = MOCK_DEVICES[Math.floor(Math.random() * MOCK_DEVICES.length)]
      messages.push(generateMessage(device.ocppId, action, Math.random() > 0.5 ? 'inbound' : 'outbound'))
    }
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  },

  // 获取统计数据
  async getStats() {
    await new Promise(r => setTimeout(r, 200))
    return {
      totalDevices: MOCK_DEVICES.length,
      onlineDevices: MOCK_DEVICES.filter(d => d.status !== 'offline').length,
      chargingDevices: MOCK_DEVICES.filter(d => d.status === 'charging').length,
      faultDevices: MOCK_DEVICES.filter(d => d.status === 'fault').length,
      totalEnergy: 12345.67,
      totalTransactions: 567,
      averageChargingTime: 45,
      peakPower: 180.5,
    }
  },
}
