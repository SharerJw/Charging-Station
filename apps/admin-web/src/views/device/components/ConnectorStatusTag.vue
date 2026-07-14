<script setup lang="ts">
/**
 * ConnectorStatusTag 组件
 * 功能: 充电接口状态标签
 */
import { computed } from 'vue'

const props = defineProps<{
  status: string
}>()

const statusMap: Record<string, { label: string; type: string }> = {
  AVAILABLE: { label: '空闲', type: 'success' },
  PREPARING: { label: '准备中', type: 'warning' },
  CHARGING: { label: '充电中', type: 'warning' },
  FINISHING: { label: '完成中', type: 'info' },
  UNAVAILABLE: { label: '不可用', type: 'danger' },
  FAULTED: { label: '故障', type: 'danger' },
}

const info = computed(() => statusMap[props.status] || { label: props.status, type: 'info' })
</script>

<template>
  <el-tag :type="(info.type as any)" size="small">{{ info.label }}</el-tag>
</template>
