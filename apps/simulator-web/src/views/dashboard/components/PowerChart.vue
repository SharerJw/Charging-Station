<script setup lang="ts">
/**
 * PowerChart 组件 (simulator-web)
 * 功能: 实时功率/电压/电流多线图表
 */
import { computed } from 'vue'
import VChart from 'vue-echarts'

const props = defineProps<{
  timeLabels: string[]
  powerData: number[]
  voltageData: number[]
  currentData: number[]
}>()

const COLORS = { primary: '#3B82F6', success: '#10B981', warning: '#F59E0B' }

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['功率(kW)', '电压(V)', '电流(A)'], textStyle: { color: '#9CA3AF' }, top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
  xAxis: { type: 'category', data: props.timeLabels, axisLabel: { color: '#6B7280', fontSize: 10 }, axisLine: { lineStyle: { color: '#374151' } } },
  yAxis: [
    { type: 'value', name: 'kW/A', axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#1F2937' } } },
    { type: 'value', name: 'V', axisLabel: { color: '#6B7280' }, splitLine: { show: false } },
  ],
  series: [
    { name: '功率(kW)', type: 'line', smooth: true, data: props.powerData, lineStyle: { color: COLORS.primary, width: 2 }, itemStyle: { color: COLORS.primary }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.2)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } } },
    { name: '电流(A)', type: 'line', smooth: true, data: props.currentData, lineStyle: { color: COLORS.warning, width: 1.5 }, itemStyle: { color: COLORS.warning } },
    { name: '电压(V)', type: 'line', smooth: true, yAxisIndex: 1, data: props.voltageData, lineStyle: { color: COLORS.success, width: 1.5 }, itemStyle: { color: COLORS.success } },
  ],
}))
</script>

<template>
  <v-chart :option="chartOption" style="height: 280px" autoresize />
</template>
