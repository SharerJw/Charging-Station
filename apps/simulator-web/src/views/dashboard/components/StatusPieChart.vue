<script setup lang="ts">
/**
 * StatusPieChart 组件 (simulator-web)
 * 功能: 设备状态分布饼图
 */
import { computed } from 'vue'
import VChart from 'vue-echarts'

const props = defineProps<{
  online: number
  charging: number
  offline: number
  fault: number
}>()

const COLORS = { success: '#10B981', warning: '#F59E0B', error: '#EF4444' }

const chartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['45%', '75%'], center: ['50%', '50%'],
    label: { color: '#9CA3AF', fontSize: 11 },
    data: [
      { value: props.online, name: '在线', itemStyle: { color: COLORS.success } },
      { value: props.charging, name: '充电中', itemStyle: { color: COLORS.warning } },
      { value: props.offline, name: '离线', itemStyle: { color: COLORS.error } },
      { value: props.fault, name: '故障', itemStyle: { color: '#6B7280' } },
    ].filter(d => d.value > 0),
  }],
}))
</script>

<template>
  <v-chart :option="chartOption" style="height: 280px" autoresize />
</template>
