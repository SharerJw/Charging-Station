// === Station ===
export interface Station {
  id: string
  name: string
  address: string
  deviceCount: number
  onlineCount: number
  price: number
  longitude: number
  latitude: number
}

// === Alert ===
export interface Alert {
  id: string
  level: string
  title: string
  description: string
  stationName: string
  deviceCode: string
  status: string
  handler?: string
  handleResult?: string
  createTime: string
}

export interface SnapshotItem {
  label: string
  value: string
  abnormal: boolean
}

export interface HistoryItem {
  id: string
  level: string
  title: string
  status: string
  createTime: string
}

export interface TrendItem {
  label: string
  total: number
  P0: number
  P1: number
  P2: number
  P3: number
}

export interface TypeItem {
  name: string
  count: number
  percent: string
  color: string
}

export interface TopCode {
  code: string
  name: string
  count: number
  trend: number
}

export interface MetricsData {
  totalAlerts: number
  resolvedCount: number
  pendingCount: number
  resolveRate: string
  avgResponseTime: string
  avgResolveTime: string
  p0AvgResponse: string
  timeoutCount: number
}

// === Ops ===
export interface OpsStats {
  onlineDevices: number
  pendingAlerts: number
  pendingWorkorders: number
  todayInspections: number
  completedInspections: number
}

// === WorkOrder ===
export interface WorkOrder {
  id: string
  orderNo: string
  type: string
  title: string
  description: string
  stationName: string
  deviceCode: string
  priority: string
  status: string
  creator: string
  assignee?: string
  result?: string
  createTime: string
}

export interface SlaNode {
  label: string
  time: string
  active: boolean
  current: boolean
}

export interface WorkorderComment {
  user: string
  time: string
  action: string
  content?: string
}

export interface WorkorderDetail {
  id: string
  orderNo: string
  type: string
  title: string
  description: string
  stationName: string
  stationAddress?: string
  stationCode?: string
  deviceCode: string
  deviceModel?: string
  deviceStatus: string
  devicePosition?: string
  faultCode?: string
  faultImages?: string[]
  priority: string
  status: string
  creator: string
  creatorPhone?: string
  assignee?: string
  result?: string
  createTime: string
  acceptTime?: string
  completeTime?: string
  slaDeadline?: string
}

export interface CauseItem {
  id: string
  name: string
  children?: CauseItem[]
}

export interface WorkorderSparePart {
  name: string
  quantity: string
}

export interface TestItem {
  name: string
  pass: boolean | null
}

export interface TypeDistItem {
  name: string
  value: number
  percent: number
  color: string
}

export interface WorkorderTrendItem {
  label: string
  created: number
  completed: number
}

export interface RankItem {
  name: string
  completed: number
  avgTime: number
  efficiency: number
}

// === Inspection ===
export interface InspectionTask {
  id: string
  name: string
  stationName: string
  deviceCount: number
  itemCount: number
  status: string
  planTime: string
  startTime?: string
  completeTime?: string
  inspector?: string
}

export interface StationInfo {
  name: string
  code: string
  address: string
  deviceCount: number
  planDate: string
}

export interface CheckItem {
  id: string
  deviceId: string
  category: string
  name: string
  result: '' | 'pass' | 'fail'
  remark: string
  photos: string[]
}

export interface InspectionDevice {
  id: string
  name: string
  code: string
  model: string
  status: string
}

export interface Anomaly {
  deviceName: string
  itemName: string
  severity: string
  remark: string
  photos: string[]
}

export interface ReportDevice {
  id: string
  name: string
  code: string
}

export interface InspectionCheckResult {
  deviceId: string
  category: string
  name: string
  result: 'pass' | 'fail'
}

export interface InspectionReport {
  taskId: string
  stationName: string
  inspector: string
  startTime: string
  endTime: string
  duration: string
  deviceCount: number
  totalItems: number
  passItems: number
  failItems: number
  passRate: string
  anomalies: Anomaly[]
  devices: ReportDevice[]
  checkResults: InspectionCheckResult[]
}

// === RemoteControl ===
export interface RemoteDevice {
  id: string
  name: string
  code: string
  stationName: string
  online: boolean
}

export interface RealtimeParams {
  voltage: number
  current: number
  power: number
  temperature: number
  soc: number
  connectorStatus: string
}

export interface OperationRecord {
  id: string
  action: string
  detail: string
  operator: string
  success: boolean
  time: string
}

// === SparePart ===
export interface SparePartItem {
  id: string
  code: string
  name: string
  spec: string
  quantity: number
  minQuantity: number
  location: string
}

export interface ConsumptionRecord {
  id: string
  partName: string
  spec: string
  quantity: number
  type: 'consume' | 'return'
  workorderNo: string
  time: string
}

export interface SparePartRequestRecord {
  id: string
  partName: string
  quantity: number
  reason: string
  status: string
  time: string
}

// === Dispatch ===
export interface AutoRule {
  id: string
  name: string
  enabled: boolean
  conditions: string[]
  triggerCount: number
  successRate: string
  lastTrigger: string
  assigneeName: string
}

export interface Personnel {
  id: string
  name: string
  title: string
  availability: string
  skills: string[]
  distance: string
  distanceScore: number
  skillScore: number
  workloadScore: number
  totalScore: number
  activeOrders: number
}

export interface BatchAlert {
  id: string
  title: string
  level: string
  stationName: string
  selected: boolean
}

export interface DispatchRecord {
  id: string
  alertTitle: string
  alertLevel: string
  assigneeName: string
  type: string
  dispatchTime: string
  status: string
  acceptTime?: string
  acceptDuration?: string
}

// === ShiftHandover ===
export interface UnfinishedOrder {
  id: string
  no: string
  description: string
  progress: string
  priority: string
}

export interface AbnormalDevice {
  deviceName: string
  description: string
  severity: string
}

export interface SparePartCount {
  name: string
  quantity: string
}

export interface ToolCheckItem {
  name: string
  checked: boolean
  missing: boolean
}

// === Knowledge ===
export interface KnowledgeCategory {
  id: string
  name: string
  icon: string
  count: number
}

export interface Article {
  id: string
  title: string
  categoryName: string
  summary: string
  content?: string
  views: number
  date: string
}

// === Message ===
export interface OpsMessage {
  id: string
  type: string
  title: string
  content: string
  extra?: string
  read: boolean
  time: string
  relatedId?: string
  relatedType?: string
}

// === Profile ===
export interface UserProfile {
  nickname: string
  role: string
  stats: {
    workorders: number
    completionRate: string
    rating: number
    inspections: number
  }
}

export interface InspectionRecord {
  name: string
  status: string
  time: string
  result: string
}
