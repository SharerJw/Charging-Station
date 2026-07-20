import { ref, onUnmounted, type Ref } from 'vue'
import { chargingApi, deviceApi } from '@/api'
import { useSimulatorStore } from '@/store/simulator'
import { ElMessage } from 'element-plus'
import type { ChargingData } from '@/types'

function createDefaults(): ChargingData {
  return {
    currentSoc: 0,
    power: 0,
    energy: 0,
    voltage: 0,
    current: 0,
    temperature: 0,
    durationSeconds: 0,
    cost: 0,
  }
}

export function useChargingLogic(selectedDevice: Ref<string>) {
  const simulatorStore = useSimulatorStore()
  const isCharging = ref(false)
  const chargingData = ref<ChargingData>(createDefaults())
  let chargingTimer: ReturnType<typeof setInterval> | null = null

  function updateFromDevice(device: any) {
    chargingData.value.currentSoc = device.soc || 0
    chargingData.value.power = device.power || 0
    chargingData.value.voltage = device.voltage || 0
    chargingData.value.current = device.current || 0
    chargingData.value.temperature = device.temperature || 0
  }

  function startPolling() {
    if (chargingTimer) clearInterval(chargingTimer)
    chargingTimer = setInterval(async () => {
      try {
        const devicesResponse = await deviceApi.list()
        const devices = devicesResponse?.list || devicesResponse || []
        simulatorStore.setDevices(devices)
        const device = devices.find((d: any) => d.id === selectedDevice.value)
        if (device) {
          updateFromDevice(device)
          chargingData.value.durationSeconds += 1
          chargingData.value.energy = (chargingData.value.energy || 0) + (device.power || 0) / 3600
          chargingData.value.cost = chargingData.value.energy * 1.7
        }
      } catch (_e) {
        // silent
      }
    }, 1000)
  }

  async function startCharging(config: { targetSoc: number; maxPower: number }) {
    if (!selectedDevice.value) {
      ElMessage.warning('请先选择设备')
      return
    }
    try {
      const tx = await chargingApi.start({
        chargePointId: selectedDevice.value,
        targetSoc: config.targetSoc,
        maxPower: config.maxPower,
      })
      isCharging.value = true
      chargingData.value.currentSoc = tx.soc || 0
      chargingData.value.voltage = tx.voltage || 0
      chargingData.value.energy = 0
      chargingData.value.durationSeconds = 0
      chargingData.value.cost = 0

      startPolling()
      ElMessage.success('充电已启动')
      return tx
    } catch (error: any) {
      ElMessage.error(error.message || '启动失败')
      throw error
    }
  }

  async function stopCharging() {
    if (chargingTimer) {
      clearInterval(chargingTimer)
      chargingTimer = null
    }
    isCharging.value = false
    const device = simulatorStore.devices.find(d => d.id === selectedDevice.value)
    if (device) {
      device.power = 0
      device.status = 'online'
    }
  }

  function cleanup() {
    if (chargingTimer) {
      clearInterval(chargingTimer)
      chargingTimer = null
    }
  }

  onUnmounted(cleanup)

  return {
    isCharging,
    chargingData,
    updateFromDevice,
    startCharging,
    stopCharging,
    startPolling,
    cleanup,
  }
}
