import { get, post, put, del, USE_MOCK } from './request'
import { mockSimulatorApi } from './mock'

// 设备管理
export const deviceApi = {
  list: (params?: any) =>
    USE_MOCK ? mockSimulatorApi.getDevices() : get<any>('/simulator/devices', params),
  create: (data: any) =>
    USE_MOCK ? Promise.resolve(data) : post<any>('/simulator/devices', data),
  update: (id: string, data: any) =>
    USE_MOCK ? Promise.resolve(data) : put<any>(`/simulator/devices/${id}`, data),
  delete: (id: string) =>
    USE_MOCK ? Promise.resolve() : del(`/simulator/devices/${id}`),
  reset: (id: string) =>
    USE_MOCK ? Promise.resolve() : post(`/simulator/devices/${id}/reset`),
}

// 充电模拟
export const chargingApi = {
  start: (data: any) =>
    USE_MOCK ? mockSimulatorApi.startCharging(data.chargePointId || data.deviceId, data) : post<any>('/simulator/charging/start', data),
  stop: (id: string) =>
    USE_MOCK ? mockSimulatorApi.stopCharging(id) : post<any>(`/simulator/charging/${id}/stop`),
  status: (id: string) =>
    USE_MOCK ? Promise.resolve({ id, status: 'charging', soc: 50, power: 45.5 }) : get<any>(`/simulator/charging/${id}/status`),
}

// 场景管理
export const scenarioApi = {
  list: (params?: any) =>
    USE_MOCK ? Promise.resolve([
      { id: 'SC001', name: '正常充电流程测试', description: '模拟完整充电流程', status: 'idle', deviceCount: 3, stepCount: 5 },
      { id: 'SC002', name: '高并发压力测试', description: '模拟8台设备同时充电', status: 'idle', deviceCount: 8, stepCount: 10 },
      { id: 'SC003', name: '故障注入测试', description: '模拟充电过程中设备故障', status: 'idle', deviceCount: 2, stepCount: 8 },
    ]) : get<any>('/simulator/scenarios', params),
  create: (data: any) =>
    USE_MOCK ? Promise.resolve(data) : post<any>('/simulator/scenarios', data),
  update: (id: string, data: any) =>
    USE_MOCK ? Promise.resolve(data) : put<any>(`/simulator/scenarios/${id}`, data),
  delete: (id: string) =>
    USE_MOCK ? Promise.resolve() : del(`/simulator/scenarios/${id}`),
  execute: (id: string) =>
    USE_MOCK ? Promise.resolve() : post(`/simulator/scenarios/${id}/execute`),
  stop: (id: string) =>
    USE_MOCK ? Promise.resolve() : post(`/simulator/scenarios/${id}/stop`),
}

// OCPP消息
export const ocppApi = {
  send: (data: any) =>
    USE_MOCK ? mockSimulatorApi.sendMessage(data.chargePointId, data.action) : post<any>('/simulator/ocpp/send', data),
  history: (params?: any) =>
    USE_MOCK ? mockSimulatorApi.getMessageHistory(params?.limit || 50) : get<any>('/simulator/ocpp/history', params),
}

// 系统状态
export const systemApi = {
  stats: () =>
    USE_MOCK ? mockSimulatorApi.getStats() : get<any>('/simulator/stats'),
  health: () =>
    USE_MOCK ? Promise.resolve({ status: 'UP', devices: 4, uptime: '99.9%' }) : get<any>('/simulator/health'),
}
