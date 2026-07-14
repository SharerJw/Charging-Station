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
  const devices = ref<Device[]>([
    {
      id: 'CP001',
      name: '充电桩-001',
      ocppId: 'EVSE-001',
      model: 'AC-7kW',
      status: 'online',
      power: 0,
      voltage: 220,
      current: 0,
      soc: 0,
      temperature: 25,
      lastHeartbeat: new Date().toISOString(),
    },
    {
      id: 'CP002',
      name: '充电桩-002',
      ocppId: 'EVSE-002',
      model: 'DC-60kW',
      status: 'charging',
      power: 45.2,
      voltage: 400,
      current: 113,
      soc: 65,
      temperature: 38,
      lastHeartbeat: new Date().toISOString(),
    },
    {
      id: 'CP003',
      name: '充电桩-003',
      ocppId: 'EVSE-003',
      model: 'DC-120kW',
      status: 'offline',
      power: 0,
      voltage: 0,
      current: 0,
      soc: 0,
      temperature: 22,
      lastHeartbeat: '2024-01-10T10:15:00Z',
    },
  ])

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
