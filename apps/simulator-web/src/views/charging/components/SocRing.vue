<script setup lang="ts">
/**
 * SocRing 组件 (simulator-web)
 * 功能: SOC环形进度指示器
 */
defineProps<{
  value: number
  color?: string
}>()
</script>

<template>
  <div class="soc-ring-wrapper">
    <svg class="soc-ring" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="85" fill="none" stroke="#1F2937" stroke-width="12" />
      <circle cx="100" cy="100" r="85" fill="none" :stroke="color || '#3B82F6'" stroke-width="12" stroke-linecap="round" :stroke-dasharray="`${value * 5.34} 534`" transform="rotate(-90 100 100)" class="soc-progress" />
    </svg>
    <div class="soc-center">
      <span class="soc-value font-number">{{ Math.floor(value) }}%</span>
      <span class="soc-label">SOC</span>
    </div>
  </div>
</template>

<style scoped>
.soc-ring-wrapper { position: relative; width: 200px; height: 200px; }
.soc-ring { width: 100%; height: 100%; }
.soc-progress { transition: stroke-dasharray 1s ease; }
.soc-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.soc-value { font-size: 42px; font-weight: bold; color: var(--color-text-primary); display: block; }
.soc-label { font-size: 14px; color: var(--color-text-secondary); }
</style>
