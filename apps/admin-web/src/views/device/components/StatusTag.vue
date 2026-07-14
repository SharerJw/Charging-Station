<script setup lang="ts">
/**
 * DeviceStatusTag 组件
 * 功能: 设备状态标签（在线/离线/充电中/故障/维护中）
 */
import { computed } from 'vue'
import { DeviceStatus } from '@/types'

const props = defineProps<{
  status: DeviceStatus
}>()

const statusMap: Record<string, { label: string; type: string }> = {
  [DeviceStatus.ONLINE]: { label: '在线', type: 'success' },
  [DeviceStatus.OFFLINE]: { label: '离线', type: 'danger' },
  [DeviceStatus.CHARGING]: { label: '充电中', type: 'warning' },
  [DeviceStatus.FAULT]: { label: '故障', type: 'danger' },
  [DeviceStatus.MAINTENANCE]: { label: '维护中', type: 'info' },
}

const info = computed(() => statusMap[props.status] || { label: props.status, type: 'info' })
</script>

<template>
  <el-tag :type="(info.type as any)" size="small">{{ info.label }}</el-tag>
</template>
