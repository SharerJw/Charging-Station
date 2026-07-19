const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('ops_token')
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...options.header,
      },
      success: (res: any) => {
        const body = res.data
        if (res.statusCode === 200 && body && body.code === 0) {
          resolve(body.data as T)
        } else if (res.statusCode === 200 && body && body.code !== 0) {
          uni.showToast({ title: body.message || '请求失败', icon: 'none' })
          reject(new Error(body.message || '请求失败'))
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('ops_token')
          uni.navigateTo({ url: '/pages/login/index' })
          reject(new Error('未登录'))
        } else {
          reject(new Error(body?.message || '请求失败'))
        }
      },
      fail: (err: any) => reject(err),
    })
  })
}

export const api = {
  // 充电站管理
  getStations: (params?: any) =>
    request({ url: '/api/v1/ops/stations', data: params }),
  getStationDetail: (id: string) =>
    request({ url: `/api/v1/ops/stations/${id}` }),

  // 告警管理
  getAlerts: (params?: any) =>
    request({ url: '/api/v1/ops/alerts', data: params }),
  handleAlert: (id: string, data: any) =>
    request({ url: `/api/v1/ops/alerts/${id}/handle`, method: 'POST', data }),
  getAlertDetail: (id: string) =>
    request({ url: `/api/v1/ops/alerts/${id}` }),
  getAlertStats: (params?: any) =>
    request({ url: '/api/v1/ops/alerts/stats', data: params }),

  // 工单管理
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

  // 巡检管理
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

  // 用户认证
  login: (data: { username: string; password: string }) =>
    request({ url: '/api/v1/ops/auth/login', method: 'POST', data }),
  getUserInfo: () =>
    request({ url: '/api/v1/ops/user/profile' }),

  // 远程控制
  getDeviceControl: (params?: any) =>
    request({ url: '/api/v1/ops/devices/control', data: params }),
  executeRemoteCommand: (data: { deviceId: string; action: string; securityLevel: number; password?: string; requestApproval?: boolean }) =>
    request({ url: '/api/v1/ops/devices/control/execute', method: 'POST', data }),

  // 备件管理
  getSpareParts: (params?: any) =>
    request({ url: '/api/v1/ops/spare-parts', data: params }),
  requestSparePart: (data: { partName: string; partCode: string; quantity: number; reason: string }) =>
    request({ url: '/api/v1/ops/spare-parts/request', method: 'POST', data }),

  // 知识库
  getKnowledgeArticles: (params?: any) =>
    request({ url: '/api/v1/ops/knowledge/articles', data: params }),
  getKnowledgeCategories: () =>
    request({ url: '/api/v1/ops/knowledge/categories' }),

  // 交接班
  submitHandover: (data: any) =>
    request({ url: '/api/v1/ops/shift-handover', method: 'POST', data }),

  // 消息中心
  getMessages: (params?: any) =>
    request({ url: '/api/v1/ops/messages', data: params }),

  // 派单中心
  getDispatchList: (params?: any) =>
    request({ url: '/api/v1/ops/dispatch', data: params }),
  dispatchAlert: (data: { alertIds: string[]; assigneeId: string; remark?: string }) =>
    request({ url: '/api/v1/ops/dispatch', method: 'POST', data }),
}
