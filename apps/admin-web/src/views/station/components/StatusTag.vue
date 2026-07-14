<script setup lang="ts">
/**
 * StationStatusTag 组件
 * 功能: 站点状态标签，含颜色映射
 */
import { computed } from 'vue'
import { StationStatus } from '@/types'

const props = defineProps<{
  status: StationStatus
}>()

const statusMap: Record<string, { label: string; type: string }> = {
  [StationStatus.ACTIVE]: { label: '运营中', type: 'success' },
  [StationStatus.INACTIVE]: { label: '已停运', type: 'info' },
  [StationStatus.MAINTENANCE]: { label: '维护中', type: 'warning' },
}

const info = computed(() => statusMap[props.status] || { label: props.status, type: 'info' })
</script>

<template>
  <el-tag :type="(info.type as any)" size="small">{{ info.label }}</el-tag>
</template>
