<script setup lang="ts">
/**
 * AlertStatusTag 组件
 * 功能: 告警状态标签（待处理/处理中/已解决/已忽略）
 */
import { computed } from 'vue'

const props = defineProps<{
  status: 'pending' | 'processing' | 'resolved' | 'ignored'
}>()

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'danger' },
  processing: { label: '处理中', type: 'warning' },
  resolved: { label: '已解决', type: 'success' },
  ignored: { label: '已忽略', type: 'info' },
}

const info = computed(() => statusMap[props.status] || { label: props.status, type: 'info' })
</script>

<template>
  <el-tag :type="(info.type as any)" size="small">{{ info.label }}</el-tag>
</template>
