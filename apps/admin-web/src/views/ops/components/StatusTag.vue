<script setup lang="ts">
/**
 * WorkorderStatusTag 组件
 * 功能: 工单状态标签（待处理/已接单/已完成/已关闭）
 */
import { computed } from 'vue'

const props = defineProps<{
  status: 'pending' | 'accepted' | 'completed' | 'closed'
}>()

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'warning' },
  accepted: { label: '已接单', type: '' },
  completed: { label: '已完成', type: 'success' },
  closed: { label: '已关闭', type: 'info' },
}

const info = computed(() => statusMap[props.status] || { label: props.status, type: 'info' })
</script>

<template>
  <el-tag :type="(info.type as any)" size="small">{{ info.label }}</el-tag>
</template>
