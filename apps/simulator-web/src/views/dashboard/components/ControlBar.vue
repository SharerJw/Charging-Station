<script setup lang="ts">
/**
 * ControlBar 组件 (simulator-web)
 * 功能: 仪表盘控制栏
 *
 * Props:
 *   - devices: 设备列表（用于选择器）
 *   - selectedDevice: 当前选中设备ID
 *   - refreshInterval: 当前刷新间隔(ms)
 *   - isPaused: 是否暂停
 *
 * Events:
 *   - update:selectedDevice: 设备切换
 *   - update:refreshInterval: 刷新间隔切换
 *   - toggle-pause: 暂停/继续
 */

import type { Device } from '@/store/simulator'

defineProps<{
  devices: Device[]
  selectedDevice: string
  refreshInterval: number
  isPaused: boolean
}>()

const emit = defineEmits<{
  'update:selectedDevice': [value: string]
  'update:refreshInterval': [value: number]
  'toggle-pause': []
}>()

const intervalOptions = [
  { label: '1s', value: 1000 },
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
]
</script>

<template>
  <div class="control-bar card">
    <div class="control-left">
      <span class="control-label">设备:</span>
      <el-select
        :model-value="selectedDevice"
        size="small"
        style="width: 160px"
        @update:model-value="(val: string) => emit('update:selectedDevice', val)"
      >
        <el-option v-for="d in devices" :key="d.id" :label="d.name" :value="d.id" />
      </el-select>
      <span class="control-label" style="margin-left: 16px">刷新:</span>
      <el-radio-group
        :model-value="refreshInterval"
        size="small"
        @update:model-value="(val: any) => emit('update:refreshInterval', Number(val))"
      >
        <el-radio-button v-for="opt in intervalOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div class="control-right">
      <el-button size="small" :type="isPaused ? 'success' : 'danger'" @click="emit('toggle-pause')">
        {{ isPaused ? '▶ 继续' : '⏸ 暂停' }}
      </el-button>
      <span class="live-indicator" :class="{ paused: isPaused }">● LIVE</span>
    </div>
  </div>
</template>

<style scoped>
.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}
.control-left, .control-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.control-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.live-indicator {
  color: #10B981;
  font-size: 12px;
  font-weight: bold;
  animation: blink 1.5s infinite;
}
.live-indicator.paused {
  color: #6B7280;
  animation: none;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
