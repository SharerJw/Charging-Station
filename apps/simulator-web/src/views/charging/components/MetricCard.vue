<script setup lang="ts">
/**
 * MetricCard 组件 (simulator-web)
 * 功能: 充电指标卡片（图标/数值/单位/标签）
 */
defineProps<{
  icon: string
  value: string | number
  unit: string
  label: string
}>()
</script>

<template>
  <div class="metric-card card">
    <div class="metric-icon">{{ icon }}</div>
    <div class="metric-value font-number">{{ value }}</div>
    <div class="metric-unit">{{ unit }}</div>
    <div class="metric-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.metric-card { padding: 16px; text-align: center; }
.metric-icon { font-size: 24px; margin-bottom: 8px; }
.metric-value { font-size: 24px; font-weight: bold; color: var(--color-text-primary); }
.metric-unit { font-size: 12px; color: var(--color-text-secondary); }
.metric-label { font-size: 12px; color: var(--color-text-secondary); margin-top: 8px; }
</style>
