import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSimulatorStore } from './simulator'

describe('useSimulatorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态应为空设备列表', () => {
    const store = useSimulatorStore()
    expect(store.devices).toHaveLength(0)
  })

  it('初始状态 connected 应为 true', () => {
    const store = useSimulatorStore()
    expect(store.connected).toBe(true)
  })

  it('应能添加设备', () => {
    const store = useSimulatorStore()
    store.devices = [
      { id: 'CP001', name: '充电桩-001', ocppId: 'EVSE-001', model: 'DC-120kW', status: 'online', power: 0, voltage: 0, current: 0, soc: 0, temperature: 0, lastHeartbeat: '' },
      { id: 'CP002', name: '充电桩-002', ocppId: 'EVSE-002', model: 'AC-7kW', status: 'charging', power: 45.5, voltage: 220, current: 32, soc: 65, temperature: 35, lastHeartbeat: '' },
    ]
    expect(store.devices).toHaveLength(2)
  })

  it('应能更新设备状态', () => {
    const store = useSimulatorStore()
    store.devices = [
      { id: 'CP001', name: '充电桩-001', ocppId: 'EVSE-001', model: 'DC-120kW', status: 'online', power: 0, voltage: 0, current: 0, soc: 0, temperature: 0, lastHeartbeat: '' },
    ]
    store.updateDeviceStatus('CP001', 'charging')
    expect(store.devices[0].status).toBe('charging')
  })

  it('应能更新设备指标', () => {
    const store = useSimulatorStore()
    store.devices = [
      { id: 'CP001', name: '充电桩-001', ocppId: 'EVSE-001', model: 'DC-120kW', status: 'online', power: 0, voltage: 0, current: 0, soc: 0, temperature: 0, lastHeartbeat: '' },
    ]
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
})
