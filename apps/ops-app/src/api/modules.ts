import { request } from './request'

export const stationApi = {
  getStations: (params?: any) =>
    request({ url: '/api/v1/ops/stations', data: params }),
  getStationDetail: (id: string) =>
    request({ url: `/api/v1/ops/stations/${id}` }),
}

export const alertApi = {
  getAlerts: (params?: any) =>
    request({ url: '/api/v1/ops/alerts', data: params }),
  handleAlert: (id: string, data: any) =>
    request({ url: `/api/v1/ops/alerts/${id}/handle`, method: 'POST', data }),
  getAlertDetail: (id: string) =>
    request({ url: `/api/v1/ops/alerts/${id}` }),
  getAlertStats: (params?: any) =>
    request({ url: '/api/v1/ops/alerts/stats', data: params }),
}

export const workorderApi = {
  getWorkorders: (params?: any) =>
    request({ url: '/api/v1/ops/workorders', data: params }),
  acceptWorkorder: (id: string) =>
    request({ url: `/api/v1/ops/workorders/${id}/accept`, method: 'POST' }),
  completeWorkorder: (id: string, data: any) =>
    request({ url: `/api/v1/ops/workorders/${id}/complete`, method: 'POST', data }),
  getWorkorderDetail: (id: string) =>
    request({ url: `/api/v1/ops/workorders/${id}` }),
  processWorkorder: (id: string, data: any) =>
    request({ url: `/api/v1/ops/workorders/${id}/process`, method: 'POST', data }),
  getWorkorderStats: (params?: any) =>
    request({ url: '/api/v1/ops/workorders/stats', data: params }),
}

export const inspectionApi = {
  getInspections: (params?: any) =>
    request({ url: '/api/v1/ops/inspections', data: params }),
  submitInspection: (id: string, data: any) =>
    request({ url: `/api/v1/ops/inspections/${id}/submit`, method: 'POST', data }),
  getInspectionDetail: (id: string) =>
    request({ url: `/api/v1/ops/inspections/${id}` }),
  submitInspectionItems: (id: string, data: any) =>
    request({ url: `/api/v1/ops/inspections/${id}/items`, method: 'POST', data }),
  getInspectionReport: (id: string) =>
    request({ url: `/api/v1/ops/inspections/${id}/report` }),
}

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request({ url: '/api/v1/ops/auth/login', method: 'POST', data }),
  getUserInfo: () =>
    request({ url: '/api/v1/ops/user/profile' }),
}

export const deviceApi = {
  getDeviceControl: (params?: any) =>
    request({ url: '/api/v1/ops/devices/control', data: params }),
  executeRemoteCommand: (data: { deviceId: string; action: string; securityLevel: number; password?: string; requestApproval?: boolean }) =>
    request({ url: '/api/v1/ops/devices/control/execute', method: 'POST', data }),
}

export const sparePartApi = {
  getSpareParts: (params?: any) =>
    request({ url: '/api/v1/ops/spare-parts', data: params }),
  requestSparePart: (data: { partName: string; partCode: string; quantity: number; reason: string }) =>
    request({ url: '/api/v1/ops/spare-parts/request', method: 'POST', data }),
}

export const knowledgeApi = {
  getKnowledgeArticles: (params?: any) =>
    request({ url: '/api/v1/ops/knowledge/articles', data: params }),
  getKnowledgeCategories: () =>
    request({ url: '/api/v1/ops/knowledge/categories' }),
}

export const shiftApi = {
  submitHandover: (data: any) =>
    request({ url: '/api/v1/ops/shift-handover', method: 'POST', data }),
}

export const messageApi = {
  getMessages: (params?: any) =>
    request({ url: '/api/v1/ops/messages', data: params }),
}

export const dispatchApi = {
  getDispatchList: (params?: any) =>
    request({ url: '/api/v1/ops/dispatch', data: params }),
  dispatchAlert: (data: { alertIds: string[]; assigneeId: string; remark?: string }) =>
    request({ url: '/api/v1/ops/dispatch', method: 'POST', data }),
}
