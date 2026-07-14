import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSimulatorStore } from './simulator'

describe('useSimulatorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态应有3台设备', () => {
    const store = useSimulatorStore()
    expect(store.devices).toHaveLength(3)
    expect(store.devices[0].id).toBe('CP001')
  })

  it('初始状态应有正确的设备状态分布', () => {
    const store = useSimulatorStore()
    const statuses = store.devices.map(d => d.status)
    expect(statuses).toContain('online')
    expect(statuses).toContain('charging')
    expect(statuses).toContain('offline')
  })

  it('应能更新设备状态', () => {
    const store = useSimulatorStore()
    store.updateDeviceStatus('CP001', 'charging')
    expect(store.devices[0].status).toBe('charging')
  })

  it('应能更新设备指标', () => {
    const store = useSimulatorStore()
    store.updateDeviceMetrics('CP001', { power: 45.2, soc: 65 })
    expect(store.devices[0].power).toBe(45.2)
    expect(store.devices[0].soc).toBe(65)
  })

  it('更新不存在的设备不应报错', () => {
    const store = useSimulatorStore()
    const originalLength = store.devices.length
    store.updateDeviceStatus('NONEXIST', 'online')
    expect(store.devices).toHaveLength(originalLength)
  })

  it('connected 初始值应为 true', () => {
    const store = useSimulatorStore()
    expect(store.connected).toBe(true)
  })
})
