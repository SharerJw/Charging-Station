<script setup lang="ts">
/**
 * StatCard 组件 (simulator-web)
 * 功能: 模拟器统计卡片
 */
defineProps<{
  icon: string
  value: string | number
  label: string
}>()
</script>

<template>
  <div class="stat-card card">
    <div class="stat-icon">{{ icon }}</div>
    <div class="stat-info">
      <div class="stat-value font-number">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card { display: flex; align-items: center; gap: 16px; padding: 16px; }
.stat-icon { font-size: 28px; }
.stat-value { font-size: 24px; font-weight: bold; color: var(--color-text-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
</style>
