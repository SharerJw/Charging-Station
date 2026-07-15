import { get, post, put, del } from './request'

// 设备管理
export const deviceApi = {
  list: (params?: any) =>
    get<any>('/simulator/devices', params),
  create: (data: any) =>
    post<any>('/simulator/devices', data),
  update: (id: string, data: any) =>
    put<any>(`/simulator/devices/${id}`, data),
  delete: (id: string) =>
    del(`/simulator/devices/${id}`),
  reset: (id: string) =>
    post(`/simulator/devices/${id}/reset`),
}

// 充电模拟
export const chargingApi = {
  start: (data: any) =>
    post<any>('/simulator/charging/start', data),
  stop: (id: string) =>
    post<any>(`/simulator/charging/${id}/stop`),
  status: (id: string) =>
    get<any>(`/simulator/charging/${id}/status`),
}

// 场景管理
export const scenarioApi = {
  list: (params?: any) =>
    get<any>('/simulator/scenarios', params),
  create: (data: any) =>
    post<any>('/simulator/scenarios', data),
  update: (id: string, data: any) =>
    put<any>(`/simulator/scenarios/${id}`, data),
  delete: (id: string) =>
    del(`/simulator/scenarios/${id}`),
  execute: (id: string) =>
    post(`/simulator/scenarios/${id}/execute`),
  stop: (id: string) =>
    post(`/simulator/scenarios/${id}/stop`),
}

// OCPP消息
export const ocppApi = {
  send: (data: any) =>
    post<any>('/simulator/ocpp/send', data),
  history: (params?: any) =>
    get<any>('/simulator/ocpp/history', params),
}

// 系统状态
export const systemApi = {
  stats: () =>
    get<any>('/simulator/stats'),
  health: () =>
    get<any>('/simulator/health'),
}
