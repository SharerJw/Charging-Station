import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOpsStore } from './ops'

// Mock API
vi.mock('@/api', () => ({
  api: {
    getAlerts: vi.fn().mockResolvedValue([
      { id: '1', level: 'P0', title: '设备离线', status: 'pending' },
      { id: '2', level: 'P1', title: '温度过高', status: 'processing' },
    ]),
    getWorkorders: vi.fn().mockResolvedValue([
      { id: '1', type: 'repair', title: '设备维修', status: 'pending' },
    ]),
    getInspections: vi.fn().mockResolvedValue([
      { id: '1', name: '巡检任务', status: 'completed' },
    ]),
    handleAlert: vi.fn().mockResolvedValue({ success: true }),
    acceptWorkorder: vi.fn().mockResolvedValue({ success: true }),
    completeWorkorder: vi.fn().mockResolvedValue({ success: true }),
  },
}))

describe('useOpsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态应为空', () => {
    const store = useOpsStore()
    expect(store.alerts).toHaveLength(0)
    expect(store.workorders).toHaveLength(0)
    expect(store.inspections).toHaveLength(0)
  })

  it('fetchAlerts 应加载告警数据', async () => {
    const store = useOpsStore()
    await store.fetchAlerts()
    expect(store.alerts).toHaveLength(2)
    expect(store.alerts[0].level).toBe('P0')
  })

  it('fetchWorkorders 应加载工单数据', async () => {
    const store = useOpsStore()
    await store.fetchWorkorders()
    expect(store.workorders).toHaveLength(1)
    expect(store.workorders[0].type).toBe('repair')
  })

  it('fetchInspections 应加载巡检数据', async () => {
    const store = useOpsStore()
    await store.fetchInspections()
    expect(store.inspections).toHaveLength(1)
  })

  it('handleAlert 应调用 API', async () => {
    const store = useOpsStore()
    const { api } = await import('@/api')
    await store.handleAlert('1', { result: '已处理' })
    expect(api.handleAlert).toHaveBeenCalledWith('1', { result: '已处理' })
  })
})
