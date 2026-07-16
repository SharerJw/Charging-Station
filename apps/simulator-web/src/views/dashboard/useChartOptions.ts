import { computed, type Ref } from 'vue'

export interface DeviceLike {
  status: string
}

export const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
}

export function useChartOptions(
  timeLabels: Ref<string[]>,
  powerHistory: Ref<number[]>,
  voltageHistory: Ref<number[]>,
  currentHistory: Ref<number[]>,
  socHistory: Ref<number[]>,
  tempHistory: Ref<number[]>,
  devices: DeviceLike[],
) {
  const realtimeChartOption = computed(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['功率(kW)', '电压(V)', '电流(A)'], textStyle: { color: '#9CA3AF' }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
    xAxis: { type: 'category', data: timeLabels.value, axisLabel: { color: '#6B7280', fontSize: 10 }, axisLine: { lineStyle: { color: '#374151' } } },
    yAxis: [
      { type: 'value', name: 'kW/A', axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#1F2937' } } },
      { type: 'value', name: 'V', axisLabel: { color: '#6B7280' }, splitLine: { show: false } },
    ],
    series: [
      { name: '功率(kW)', type: 'line', smooth: true, data: powerHistory.value, lineStyle: { color: COLORS.primary, width: 2 }, itemStyle: { color: COLORS.primary }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.2)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } } },
      { name: '电流(A)', type: 'line', smooth: true, data: currentHistory.value, lineStyle: { color: COLORS.warning, width: 1.5 }, itemStyle: { color: COLORS.warning } },
      { name: '电压(V)', type: 'line', smooth: true, yAxisIndex: 1, data: voltageHistory.value, lineStyle: { color: COLORS.success, width: 1.5 }, itemStyle: { color: COLORS.success } },
    ],
  }))

  const socChartOption = computed(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10px', containLabel: true },
    xAxis: { type: 'category', data: timeLabels.value, axisLabel: { color: '#6B7280', fontSize: 10 }, axisLine: { lineStyle: { color: '#374151' } } },
    yAxis: { type: 'value', name: '%', min: 0, max: 100, axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#1F2937' } } },
    series: [
      { name: 'SOC', type: 'line', smooth: true, data: socHistory.value, lineStyle: { color: COLORS.success, width: 2 }, itemStyle: { color: COLORS.success }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.3)' }, { offset: 1, color: 'rgba(16,185,129,0)' }] } } },
      { name: '温度(°C)', type: 'line', smooth: true, data: tempHistory.value, lineStyle: { color: COLORS.error, width: 1.5, type: 'dashed' }, itemStyle: { color: COLORS.error } },
    ],
  }))

  const statusPieOption = computed(() => ({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['45%', '75%'], center: ['50%', '50%'],
      label: { color: '#9CA3AF', fontSize: 11 },
      data: [
        { value: devices.filter(d => d.status === 'online').length, name: '在线', itemStyle: { color: COLORS.success } },
        { value: devices.filter(d => d.status === 'charging').length, name: '充电中', itemStyle: { color: COLORS.warning } },
        { value: devices.filter(d => d.status === 'offline').length, name: '离线', itemStyle: { color: COLORS.error } },
        { value: devices.filter(d => d.status === 'fault').length, name: '故障', itemStyle: { color: '#6B7280' } },
      ].filter(d => d.value > 0),
    }],
  }))

  return { realtimeChartOption, socChartOption, statusPieOption, COLORS }
}
