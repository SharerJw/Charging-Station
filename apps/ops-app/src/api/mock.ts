// ==================== 运维端 Mock API ====================

export interface Alert {
  id: string
  level: 'P0' | 'P1' | 'P2' | 'P3'
  title: string
  description: string
  stationName: string
  deviceCode: string
  status: 'pending' | 'processing' | 'resolved' | 'ignored'
  createTime: string
  handler?: string
  handleTime?: string
  handleResult?: string
}

export interface WorkOrder {
  id: string
  orderNo: string
  type: 'repair' | 'maintenance' | 'inspection'
  title: string
  description: string
  stationName: string
  deviceCode: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'accepted' | 'processing' | 'completed' | 'closed'
  creator: string
  assignee?: string
  createTime: string
  acceptTime?: string
  completeTime?: string
  result?: string
}

export interface InspectionTask {
  id: string
  name: string
  stationName: string
  deviceCount: string
  itemCount: string
  status: 'pending' | 'in_progress' | 'completed'
  planTime: string
  startTime?: string
  completeTime?: string
  inspector?: string
}

export interface OpsStats {
  onlineDevices: number
  pendingAlerts: number
  pendingWorkorders: number
  todayInspections: number
  completedInspections: number
}

// 模拟数据
const MOCK_ALERTS: Alert[] = [
  { id: 'A001', level: 'P0', title: '设备离线告警', description: '充电站 北京朝阳充电站 的充电桩 BJ-CY-001-CP03 已离线超过 10 分钟', stationName: '北京朝阳充电站', deviceCode: 'BJ-CY-001-CP03', status: 'pending', createTime: '2026-07-13 10:15:00' },
  { id: 'A002', level: 'P1', title: '充电中断告警', description: '充电站 上海浦东快充站 的充电桩 SH-PD-001-CP01 充电过程中异常中断', stationName: '上海浦东快充站', deviceCode: 'SH-PD-001-CP01', status: 'processing', createTime: '2026-07-13 09:30:00', handler: '张工' },
  { id: 'A003', level: 'P2', title: '温度过高告警', description: '充电桩 CP002 温度达到 52°C，超过预警阈值', stationName: '北京朝阳充电站', deviceCode: 'BJ-CY-001-CP02', status: 'pending', createTime: '2026-07-13 09:00:00' },
  { id: 'A004', level: 'P3', title: '心跳超时告警', description: '充电桩 CP003 心跳间隔超过 60 秒', stationName: '深圳南山超充站', deviceCode: 'SZ-NS-001-CP01', status: 'resolved', createTime: '2026-07-12 18:00:00', handler: '李工', handleTime: '2026-07-12 18:30:00', handleResult: '设备已恢复正常' },
]

const MOCK_WORKORDERS: WorkOrder[] = [
  { id: 'W001', orderNo: 'WO-20260713-001', type: 'repair', title: '充电桩故障维修', description: '充电桩 CP003 出现充电中断故障，需要现场排查', stationName: '北京朝阳充电站', deviceCode: 'BJ-CY-001-CP03', priority: 'high', status: 'pending', creator: '系统自动', createTime: '2026-07-13 10:20:00' },
  { id: 'W002', orderNo: 'WO-20260713-002', type: 'maintenance', title: '季度保养维护', description: '按计划对充电站所有设备进行季度保养', stationName: '上海浦东快充站', deviceCode: '全部设备', priority: 'medium', status: 'accepted', creator: '王主管', assignee: '张工', createTime: '2026-07-13 08:00:00', acceptTime: '2026-07-13 08:15:00' },
  { id: 'W003', orderNo: 'WO-20260712-001', type: 'repair', title: '充电枪锁止故障', description: '充电枪无法正常锁止，需要更换锁止机构', stationName: '深圳南山超充站', deviceCode: 'SZ-NS-001-CP01', priority: 'medium', status: 'completed', creator: '系统自动', assignee: '李工', createTime: '2026-07-12 14:00:00', acceptTime: '2026-07-12 14:10:00', completeTime: '2026-07-12 16:30:00', result: '已更换锁止机构，测试正常' },
]

const MOCK_INSPECTIONS: InspectionTask[] = [
  { id: 'I001', name: '北京朝阳充电站日常巡检', stationName: '北京朝阳充电站', deviceCount: '12台', itemCount: '24项', status: 'pending', planTime: '2026-07-13 09:00:00' },
  { id: 'I002', name: '上海浦东快充站日常巡检', stationName: '上海浦东快充站', deviceCount: '8台', itemCount: '16项', status: 'completed', planTime: '2026-07-13 08:00:00', startTime: '2026-07-13 08:05:00', completeTime: '2026-07-13 09:30:00', inspector: '张工' },
  { id: 'I003', name: '深圳南山超充站日常巡检', stationName: '深圳南山超充站', deviceCount: '6台', itemCount: '12项', status: 'pending', planTime: '2026-07-13 10:00:00' },
]

function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const mockOpsApi = {
  // 获取统计数据
  async getStats(): Promise<OpsStats> {
    await delay(200)
    return {
      onlineDevices: 128,
      pendingAlerts: MOCK_ALERTS.filter(a => a.status === 'pending').length,
      pendingWorkorders: MOCK_WORKORDERS.filter(w => w.status === 'pending').length,
      todayInspections: MOCK_INSPECTIONS.length,
      completedInspections: MOCK_INSPECTIONS.filter(i => i.status === 'completed').length,
    }
  },

  // 告警管理
  async getAlerts(params?: { level?: string; status?: string }): Promise<Alert[]> {
    await delay(300)
    let alerts = [...MOCK_ALERTS]
    if (params?.level) alerts = alerts.filter(a => a.level === params.level)
    if (params?.status) alerts = alerts.filter(a => a.status === params.status)
    return alerts.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
  },

  async handleAlert(id: string, data: { result: string }): Promise<Alert> {
    await delay(400)
    const alert = MOCK_ALERTS.find(a => a.id === id)
    if (!alert) throw new Error('告警不存在')
    alert.status = 'resolved'
    alert.handler = '当前运维'
    alert.handleTime = new Date().toISOString()
    alert.handleResult = data.result
    return alert
  },

  async ignoreAlert(id: string): Promise<void> {
    await delay(300)
    const alert = MOCK_ALERTS.find(a => a.id === id)
    if (alert) alert.status = 'ignored'
  },

  // 工单管理
  async getWorkorders(params?: { status?: string }): Promise<WorkOrder[]> {
    await delay(300)
    let orders = [...MOCK_WORKORDERS]
    if (params?.status) orders = orders.filter(w => w.status === params.status)
    return orders
  },

  async acceptWorkorder(id: string): Promise<WorkOrder> {
    await delay(400)
    const order = MOCK_WORKORDERS.find(w => w.id === id)
    if (!order) throw new Error('工单不存在')
    order.status = 'accepted'
    order.assignee = '当前运维'
    order.acceptTime = new Date().toISOString()
    return order
  },

  async completeWorkorder(id: string, result: string): Promise<WorkOrder> {
    await delay(400)
    const order = MOCK_WORKORDERS.find(w => w.id === id)
    if (!order) throw new Error('工单不存在')
    order.status = 'completed'
    order.completeTime = new Date().toISOString()
    order.result = result
    return order
  },

  // 巡检管理
  async getInspections(): Promise<InspectionTask[]> {
    await delay(300)
    return [...MOCK_INSPECTIONS]
  },

  async startInspection(id: string): Promise<InspectionTask> {
    await delay(400)
    const task = MOCK_INSPECTIONS.find(t => t.id === id)
    if (!task) throw new Error('巡检任务不存在')
    task.status = 'in_progress'
    task.startTime = new Date().toISOString()
    task.inspector = '当前运维'
    return task
  },

  async completeInspection(id: string): Promise<InspectionTask> {
    await delay(400)
    const task = MOCK_INSPECTIONS.find(t => t.id === id)
    if (!task) throw new Error('巡检任务不存在')
    task.status = 'completed'
    task.completeTime = new Date().toISOString()
    return task
  },
}
