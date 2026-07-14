<script setup lang="ts">
/**
 * PriorityTag 组件
 * 功能: 优先级标签（高/中/低）
 */
import { computed } from 'vue'

const props = defineProps<{
  priority: 'high' | 'medium' | 'low'
}>()

const priorityMap: Record<string, { label: string; type: string }> = {
  high: { label: '高', type: 'danger' },
  medium: { label: '中', type: 'warning' },
  low: { label: '低', type: 'info' },
}

const info = computed(() => priorityMap[props.priority] || { label: props.priority, type: 'info' })
</script>

<template>
  <el-tag :type="(info.type as any)" size="small">{{ info.label }}</el-tag>
</template>
