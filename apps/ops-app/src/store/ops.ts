// 兼容旧版 - 重新导出 auth store
export { useAuthStore as useOpsStore } from './auth'

// 业务 store 导出
export { useAlertStore } from './alert'
export { useWorkorderStore } from './workorder'
export { useInspectionStore } from './inspection'
export { useStationStore } from './station'
