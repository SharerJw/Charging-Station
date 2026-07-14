<script setup lang="ts">
/**
 * StationRankChart 组件
 * 功能: 站点营收横向柱状图排行
 */
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent])

const props = defineProps<{
  names: string[]
  values: number[]
}>()

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value', axisLabel: { color: '#666' } },
  yAxis: { type: 'category', data: [...props.names].reverse(), axisLabel: { color: '#666' } },
  series: [{
    type: 'bar',
    data: [...props.values].reverse(),
    itemStyle: { color: '#1677FF', borderRadius: [0, 4, 4, 0] },
    label: { show: true, position: 'right', formatter: '¥{c}', color: '#666' },
  }],
}))
</script>

<template>
  <el-card>
    <template #header><span>站点营收排行 Top5</span></template>
    <v-chart :option="chartOption" style="height: 320px" autoresize />
  </el-card>
</template>
