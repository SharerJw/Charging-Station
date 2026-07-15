import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Device {
  id: string
  name: string
  ocppId: string
  model: string
  status: 'online' | 'offline' | 'charging' | 'fault'
  power: number
  voltage: number
  current: number
  soc: number
  temperature: number
  lastHeartbeat: string
}

export const useSimulatorStore = defineStore('simulator', () => {
  const devices = ref<Device[]>([])

  const connected = ref(true)

  function updateDeviceStatus(id: string, status: Device['status']) {
    const device = devices.value.find(d => d.id === id)
    if (device) {
      device.status = status
    }
  }

  function updateDeviceMetrics(id: string, metrics: Partial<Device>) {
    const device = devices.value.find(d => d.id === id)
    if (device) {
      Object.assign(device, metrics)
    }
  }

  return { devices, connected, updateDeviceStatus, updateDeviceMetrics }
})
