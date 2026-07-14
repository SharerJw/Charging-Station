import { describe, it, expect } from 'vitest'
import { mockSimulatorApi } from './mock'

describe('mockSimulatorApi', () => {
  it('getDevices 应返回设备列表', async () => {
    const devices = await mockSimulatorApi.getDevices()
    expect(devices.length).toBeGreaterThan(0)
    expect(devices[0]).toHaveProperty('id')
    expect(devices[0]).toHaveProperty('name')
    expect(devices[0]).toHaveProperty('ocppId')
    expect(devices[0]).toHaveProperty('status')
  })

  it('getStats 应返回统计数据', async () => {
    const stats = await mockSimulatorApi.getStats()
    expect(stats).toHaveProperty('totalDevices')
    expect(stats).toHaveProperty('onlineDevices')
    expect(stats).toHaveProperty('chargingDevices')
    expect(stats).toHaveProperty('totalEnergy')
    expect(stats.totalDevices).toBeGreaterThan(0)
  })

  it('startCharging 应返回活跃事务', async () => {
    const devices = await mockSimulatorApi.getDevices()
    const tx = await mockSimulatorApi.startCharging(devices[0].id, { targetSoc: 80, maxPower: 60 })
    expect(tx.status).toBe('active')
    expect(tx.chargePointId).toBe(devices[0].ocppId)
  })

  it('stopCharging 应返回已完成事务', async () => {
    const tx = await mockSimulatorApi.stopCharging('TX-123')
    expect(tx.status).toBe('completed')
  })

  it('getMessageHistory 应返回消息列表', async () => {
    const messages = await mockSimulatorApi.getMessageHistory(10)
    expect(messages.length).toBe(10)
    expect(messages[0]).toHaveProperty('messageId')
    expect(messages[0]).toHaveProperty('action')
    expect(messages[0]).toHaveProperty('direction')
  })
})
