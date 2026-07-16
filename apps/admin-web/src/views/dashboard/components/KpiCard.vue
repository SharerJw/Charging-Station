<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: string
  unit: string
  icon: string
  color: string
  loading?: boolean
}>()

const displayValue = computed(() => {
  if (props.loading) return '...'
  if (!props.value && props.value !== '0') return '--'
  return props.value
})
</script>

<template>
  <div class="kpi-card" :class="{ 'is-loading': loading }">
    <div class="kpi-icon" :style="{ background: color + '15', color }">
      {{ icon }}
    </div>
    <div class="kpi-body">
      <div class="kpi-value">
        {{ displayValue }}
        <span class="kpi-unit">{{ unit }}</span>
      </div>
      <div class="kpi-title">{{ title }}</div>
    </div>
  </div>
</template>

<style scoped>
.kpi-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
  transition: all 0.3s;
}

.kpi-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.kpi-card.is-loading {
  opacity: 0.6;
  pointer-events: none;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.kpi-body {
  flex: 1;
  min-width: 0;
}

.kpi-value {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
}

.kpi-unit {
  font-size: 12px;
  font-weight: normal;
  color: #999;
  margin-left: 2px;
}

.kpi-title {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
</style>
