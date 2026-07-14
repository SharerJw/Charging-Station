<script setup lang="ts">
/**
 * DeviceCard 组件 (simulator-web)
 * 功能: 设备状态卡片（功率/SOC/电压/温度）
 */
import type { Device } from '@/store/simulator'

defineProps<{
  device: Device
  selected?: boolean
}>()

const statusMap: Record<string, { label: string; class: string }> = {
  online: { label: '在线', class: 'online' },
  offline: { label: '离线', class: 'offline' },
  charging: { label: '充电中', class: 'charging' },
  fault: { label: '故障', class: 'fault' },
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}
</script>

<template>
  <div class="device-card card" :class="{ selected }">
    <div class="device-header">
      <div>
        <span class="device-name">{{ device.name }}</span>
        <span class="device-model">{{ device.model }}</span>
      </div>
      <span :class="['status-badge', statusMap[device.status]?.class]">
        {{ statusMap[device.status]?.label }}
      </span>
    </div>
    <div class="device-metrics">
      <div class="metric"><span class="metric-value font-number">{{ device.power.toFixed(1) }}</span><span class="metric-unit">kW</span></div>
      <div class="metric"><span class="metric-value font-number">{{ device.soc }}</span><span class="metric-unit">%</span></div>
      <div class="metric"><span class="metric-value font-number">{{ device.voltage }}</span><span class="metric-unit">V</span></div>
      <div class="metric"><span class="metric-value font-number">{{ device.temperature }}</span><span class="metric-unit">°C</span></div>
    </div>
    <div class="device-footer">
      <span class="heartbeat">心跳: {{ formatTime(device.lastHeartbeat) }}</span>
    </div>
  </div>
</template>

<style scoped>
.device-card { padding: 14px; cursor: pointer; transition: border-color 0.2s; border: 1px solid transparent; }
.device-card.selected { border-color: var(--color-primary); }
.device-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.device-name { font-size: 14px; font-weight: bold; color: var(--color-text-primary); display: block; }
.device-model { font-size: 11px; color: var(--color-text-secondary); }
.status-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
.status-badge.online { background: rgba(16,185,129,0.2); color: #10B981; }
.status-badge.offline { background: rgba(239,68,68,0.2); color: #EF4444; }
.status-badge.charging { background: rgba(245,158,11,0.2); color: #F59E0B; }
.status-badge.fault { background: rgba(239,68,68,0.2); color: #EF4444; }
.device-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 8px; }
.metric { text-align: center; }
.metric-value { font-size: 16px; color: var(--color-text-primary); font-weight: bold; }
.metric-unit { font-size: 10px; color: var(--color-text-secondary); margin-left: 1px; }
.device-footer { text-align: right; }
.heartbeat { font-size: 11px; color: var(--color-text-secondary); }
</style>
