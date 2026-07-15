<script setup lang="ts">
/**
 * KpiCard 组件
 * 功能: 展示单个KPI指标，含数值、单位、环比趋势、图标
 *
 * Props:
 *   - title: 指标名称
 *   - value: 当前值
 *   - unit: 单位
 *   - trend: 环比值 (如 "+12.3%")
 *   - trendUp: 趋势方向
 *   - icon: 图标emoji
 *   - color: 主题色
 *   - loading: 加载状态
 */

import { computed } from 'vue'
import Skeleton from '@/components/Skeleton.vue'

const props = defineProps<{
  title: string
  value: string | number
  unit?: string
  trend?: string
  trendUp?: boolean
  icon?: string
  color?: string
  loading?: boolean
}>()

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

const trendClass = computed(() => {
  if (!props.trend) return ''
  return props.trendUp ? 'trend-up' : 'trend-down'
})

const iconBg = computed(() => {
  return `${props.color || '#1677FF'}15`
})
</script>

<template>
  <el-card shadow="hover" class="kpi-card">
    <Skeleton v-if="loading" :rows="2" />
    <template v-else>
      <div class="kpi-icon" :style="{ background: iconBg, color: color || '#1677FF' }">
        {{ icon || '📊' }}
      </div>
      <div class="kpi-body">
        <div class="kpi-value font-number">
          {{ displayValue }}<span class="kpi-unit">{{ unit }}</span>
        </div>
        <div class="kpi-bottom">
          <span class="kpi-title">{{ title }}</span>
          <span v-if="trend" class="kpi-trend" :class="trendClass">{{ trend }}</span>
        </div>
      </div>
    </template>
  </el-card>
</template>

<style scoped>
.kpi-card { position: relative; }
.kpi-card :deep(.el-card__body) {
  display: flex; align-items: center; gap: 12px; padding: 16px;
}

.kpi-icon {
  width: 48px; height: 48px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; flex-shrink: 0;
}

.kpi-body { flex: 1; min-width: 0; }
.kpi-value { font-size: 22px; font-weight: bold; color: #333; white-space: nowrap; }
.kpi-unit { font-size: 12px; font-weight: normal; color: #999; margin-left: 2px; }
.kpi-bottom { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.kpi-title { font-size: 12px; color: #999; }

.kpi-trend {
  font-size: 11px; font-weight: bold; padding: 1px 6px; border-radius: 4px;
  white-space: nowrap;
}
.trend-up { color: #52C41A; background: #F6FFED; }
.trend-down { color: #FF4D4F; background: #FFF2F0; }
</style>
