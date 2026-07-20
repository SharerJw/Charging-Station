import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Device } from '@/types'

export type { Device } from '@/types'

export const useSimulatorStore = defineStore('simulator', () => {
  const devices = ref<Device[]>([])

  const connected = ref(true)

  /** Normalize device list: ensure id is always set (backend may return null for id) */
  function setDevices(list: any[]) {
    devices.value = list.map(d => ({ ...d, id: d.id || d.ocppId }))
  }

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

  return { devices, connected, setDevices, updateDeviceStatus, updateDeviceMetrics }
})
