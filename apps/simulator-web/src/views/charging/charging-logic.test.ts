import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'

vi.mock('@/api', () => ({
  chargingApi: {
    start: vi.fn(),
    stop: vi.fn(),
    status: vi.fn(),
  },
  deviceApi: {
    list: vi.fn(),
  },
}))

vi.mock('@/store/simulator', () => ({
  useSimulatorStore: () => ({
    devices: [],
    updateDeviceStatus: vi.fn(),
  }),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

import { useChargingLogic } from './useChargingLogic'
import { chargingApi, deviceApi } from '@/api'
import { ElMessage } from 'element-plus'

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})

describe('useChargingLogic', () => {
  function createComposable(deviceId = '') {
    const selectedDevice = ref(deviceId)
    return { ...useChargingLogic(selectedDevice), selectedDevice }
  }

  // 1. updateFromDevice normal update
  it('updateFromDevice updates all fields from device object', () => {
    const { chargingData, updateFromDevice } = createComposable()
    updateFromDevice({
      soc: 55,
      power: 60,
      voltage: 400,
      current: 150,
      temperature: 32,
    })
    expect(chargingData.value.currentSoc).toBe(55)
    expect(chargingData.value.power).toBe(60)
    expect(chargingData.value.voltage).toBe(400)
    expect(chargingData.value.current).toBe(150)
    expect(chargingData.value.temperature).toBe(32)
  })

  // 2. updateFromDevice missing fields default 0
  it('updateFromDevice defaults missing fields to 0', () => {
    const { chargingData, updateFromDevice } = createComposable()
    updateFromDevice({})
    expect(chargingData.value.currentSoc).toBe(0)
    expect(chargingData.value.power).toBe(0)
    expect(chargingData.value.voltage).toBe(0)
    expect(chargingData.value.current).toBe(0)
    expect(chargingData.value.temperature).toBe(0)
  })

  // 3. startCharging no device selected
  it('startCharging shows warning when no device is selected', async () => {
    const { startCharging } = createComposable('')
    await startCharging({ targetSoc: 80, maxPower: 60 })
    expect(ElMessage.warning).toHaveBeenCalledWith('请先选择设备')
    expect(chargingApi.start).not.toHaveBeenCalled()
  })

  // 4. startCharging normal start
  it('startCharging sets isCharging true and calls API', async () => {
    vi.mocked(chargingApi.start).mockResolvedValue({ soc: 10, voltage: 400 })
    const { isCharging, startCharging, selectedDevice } = createComposable()
    selectedDevice.value = 'cp-001'
    await startCharging({ targetSoc: 80, maxPower: 60 })
    expect(isCharging.value).toBe(true)
    expect(chargingApi.start).toHaveBeenCalledWith({
      chargePointId: 'cp-001',
      targetSoc: 80,
      maxPower: 60,
    })
    expect(ElMessage.success).toHaveBeenCalledWith('充电已启动')
  })

  // 5. startCharging API failure
  it('startCharging shows error on API failure', async () => {
    vi.mocked(chargingApi.start).mockRejectedValue(new Error('网络错误'))
    const { isCharging, startCharging, selectedDevice } = createComposable()
    selectedDevice.value = 'cp-001'
    await startCharging({ targetSoc: 80, maxPower: 60 }).catch(() => {})
    expect(isCharging.value).toBe(false)
    expect(ElMessage.error).toHaveBeenCalledWith('网络错误')
  })

  // 6. stopCharging normal stop
  it('stopCharging sets isCharging false and resets device status', async () => {
    const { isCharging, startCharging, stopCharging, selectedDevice } = createComposable()
    vi.mocked(chargingApi.start).mockResolvedValue({ soc: 10 })
    selectedDevice.value = 'cp-001'
    await startCharging({ targetSoc: 80, maxPower: 60 })
    expect(isCharging.value).toBe(true)
    await stopCharging()
    expect(isCharging.value).toBe(false)
  })

  // 7. stopCharging clears timer
  it('stopCharging clears the polling timer', async () => {
    const { startCharging, stopCharging, selectedDevice } = createComposable()
    vi.mocked(chargingApi.start).mockResolvedValue({ soc: 10 })
    vi.mocked(deviceApi.list).mockResolvedValue([])
    selectedDevice.value = 'cp-001'
    await startCharging({ targetSoc: 80, maxPower: 60 })
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    await stopCharging()
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  // 8. startPolling calls deviceApi.list every second
  it('startPolling calls deviceApi.list every second', async () => {
    vi.mocked(deviceApi.list).mockResolvedValue([])
    const { startPolling, selectedDevice } = createComposable('cp-001')
    startPolling()
    await vi.advanceTimersByTimeAsync(3000)
    expect(deviceApi.list).toHaveBeenCalledTimes(3)
  })

  // 9. cleanup clears timer
  it('cleanup clears the polling timer', async () => {
    vi.mocked(deviceApi.list).mockResolvedValue([])
    const { startPolling, cleanup } = createComposable('cp-001')
    startPolling()
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    cleanup()
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  // 10. multiple startPolling does not create multiple timers
  it('multiple startPolling calls do not create multiple timers', async () => {
    vi.mocked(deviceApi.list).mockResolvedValue([])
    const { startPolling, selectedDevice } = createComposable('cp-001')
    startPolling()
    startPolling()
    await vi.advanceTimersByTimeAsync(2000)
    expect(deviceApi.list).toHaveBeenCalledTimes(2)
  })
})
