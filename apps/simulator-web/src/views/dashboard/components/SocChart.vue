<script setup lang="ts">
/**
 * SocChart 组件 (simulator-web)
 * 功能: SOC和温度趋势双线图
 */
import { computed } from 'vue'
import VChart from 'vue-echarts'

const props = defineProps<{
  timeLabels: string[]
  socData: number[]
  tempData: number[]
}>()

const COLORS = { success: '#10B981', error: '#EF4444' }

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['SOC(%)', '温度(°C)'], textStyle: { color: '#9CA3AF' }, top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '30px', containLabel: true },
  xAxis: { type: 'category', data: props.timeLabels, axisLabel: { color: '#6B7280', fontSize: 10 }, axisLine: { lineStyle: { color: '#374151' } } },
  yAxis: { type: 'value', min: 0, max: 100, axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#1F2937' } } },
  series: [
    { name: 'SOC(%)', type: 'line', smooth: true, data: props.socData, lineStyle: { color: COLORS.success, width: 2 }, itemStyle: { color: COLORS.success }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.3)' }, { offset: 1, color: 'rgba(16,185,129,0)' }] } } },
    { name: '温度(°C)', type: 'line', smooth: true, data: props.tempData, lineStyle: { color: COLORS.error, width: 1.5, type: 'dashed' }, itemStyle: { color: COLORS.error } },
  ],
}))
</script>

<template>
  <v-chart :option="chartOption" style="height: 220px" autoresize />
</template>
