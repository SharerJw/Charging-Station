<script setup lang="ts">
/**
 * AlertLevelTag 组件
 * 功能: 告警级别标签（P0-P3）
 */
import { computed } from 'vue'

const props = defineProps<{
  level: 'P0' | 'P1' | 'P2' | 'P3'
}>()

const levelMap: Record<string, { type: string }> = {
  P0: { type: 'danger' },
  P1: { type: 'warning' },
  P2: { type: '' },
  P3: { type: 'info' },
}

const type = computed(() => levelMap[props.level]?.type || 'info')
</script>

<template>
  <el-tag :type="(type as any)" size="small">{{ level }}</el-tag>
</template>
