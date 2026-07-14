<script setup lang="ts">
/**
 * RevenueChart 组件
 * 功能: 展示营收趋势折线图（电费+服务费堆叠柱状 + 订单量折线）
 *
 * Props:
 *   - dates: 日期数组
 *   - electricRevenues: 电费收入数组
 *   - serviceRevenues: 服务费收入数组
 *   - orderCounts: 订单量数组
 *   - loading: 加载状态
 *
 * Methods:
 *   - 无外部方法，纯展示组件
 */

import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const props = defineProps<{
  dates: string[]
  electricRevenues: number[]
  serviceRevenues: number[]
  orderCounts: number[]
  loading?: boolean
}>()

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: { data: ['电费收入', '服务费收入', '订单量'], top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: props.dates, axisLabel: { color: '#666' } },
  yAxis: [
    { type: 'value', name: '金额(元)', axisLabel: { color: '#666' } },
    { type: 'value', name: '订单量', axisLabel: { color: '#666' } },
  ],
  series: [
    {
      name: '电费收入', type: 'bar', stack: 'revenue',
      data: props.electricRevenues,
      itemStyle: { color: '#1677FF', borderRadius: [0, 0, 0, 0] },
    },
    {
      name: '服务费收入', type: 'bar', stack: 'revenue',
      data: props.serviceRevenues,
      itemStyle: { color: '#4096FF', borderRadius: [4, 4, 0, 0] },
    },
    {
      name: '订单量', type: 'line', yAxisIndex: 1, smooth: true,
      data: props.orderCounts,
      itemStyle: { color: '#FAAD14' },
    },
  ],
}))
</script>

<template>
  <el-card v-loading="loading">
    <template #header>
      <slot name="header">
        <span>营收趋势</span>
      </slot>
    </template>
    <v-chart :option="chartOption" style="height: 320px" autoresize />
  </el-card>
</template>
