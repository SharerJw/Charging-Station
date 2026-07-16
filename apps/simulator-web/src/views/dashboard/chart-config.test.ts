import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'
import { useChartOptions, COLORS } from './useChartOptions'
import type { DeviceLike } from './useChartOptions'

function createRefs() {
  return {
    timeLabels: ref<string[]>(['10:00:00', '10:00:03', '10:00:06']),
    powerHistory: ref<number[]>([12.5, 13.0, 12.8]),
    voltageHistory: ref<number[]>([380, 382, 379]),
    currentHistory: ref<number[]>([33, 34, 33.5]),
    socHistory: ref<number[]>([60, 62, 63]),
    tempHistory: ref<number[]>([25, 26, 27]),
    devices: ref<DeviceLike[]>([]),
  }
}

function makeDevice(status: string): DeviceLike {
  return { status }
}

describe('useChartOptions', () => {
  describe('realtimeChartOption', () => {
    it('has 3 series when data is present', () => {
      const refs = createRefs()
      const { realtimeChartOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      expect(realtimeChartOption.value.series).toHaveLength(3)
    })

    it('xAxis.data length matches timeLabels', () => {
      const refs = createRefs()
      const { realtimeChartOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      expect((realtimeChartOption.value.xAxis as any).data).toEqual(refs.timeLabels.value)
    })

    it('series is empty array when all data is empty', () => {
      const refs = createRefs()
      refs.timeLabels.value = []
      refs.powerHistory.value = []
      refs.voltageHistory.value = []
      refs.currentHistory.value = []
      refs.socHistory.value = []
      refs.tempHistory.value = []
      const { realtimeChartOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      // series is still defined with 3 entries but data arrays are empty
      expect(realtimeChartOption.value.series).toHaveLength(3)
      expect((realtimeChartOption.value.series as any[])[0].data).toEqual([])
    })

    it('yAxis is configured with dual axes', () => {
      const refs = createRefs()
      const { realtimeChartOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      const yAxis = realtimeChartOption.value.yAxis as any[]
      expect(yAxis).toHaveLength(2)
      expect(yAxis[0].name).toBe('kW/A')
      expect(yAxis[1].name).toBe('V')
    })

    it('series colors are correct (blue, yellow, green)', () => {
      const refs = createRefs()
      const { realtimeChartOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      const series = realtimeChartOption.value.series as any[]
      expect(series[0].itemStyle.color).toBe(COLORS.primary)   // blue
      expect(series[1].itemStyle.color).toBe(COLORS.warning)   // yellow
      expect(series[2].itemStyle.color).toBe(COLORS.success)   // green
    })
  })

  describe('socChartOption', () => {
    it('has 2 series (SOC + temperature)', () => {
      const refs = createRefs()
      const { socChartOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      expect(socChartOption.value.series).toHaveLength(2)
    })

    it('yAxis range is 0-100', () => {
      const refs = createRefs()
      const { socChartOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      const yAxis = socChartOption.value.yAxis as any
      expect(yAxis.min).toBe(0)
      expect(yAxis.max).toBe(100)
    })

    it('SOC series has areaStyle (gradient fill)', () => {
      const refs = createRefs()
      const { socChartOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      const socSeries = (socChartOption.value.series as any[])[0]
      expect(socSeries.areaStyle).toBeDefined()
      expect(socSeries.areaStyle.color.type).toBe('linear')
    })
  })

  describe('statusPieOption', () => {
    it('includes status entries when devices are present', () => {
      const refs = createRefs()
      refs.devices.value = [
        makeDevice('online'),
        makeDevice('charging'),
        makeDevice('offline'),
      ]
      const { statusPieOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      const pieData = (statusPieOption.value.series as any[])[0].data
      expect(pieData.length).toBe(3)
      expect(pieData.map((d: any) => d.name)).toEqual(['在线', '充电中', '离线'])
    })

    it('filters out statuses with value 0', () => {
      const refs = createRefs()
      refs.devices.value = [makeDevice('online'), makeDevice('online')]
      const { statusPieOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      const pieData = (statusPieOption.value.series as any[])[0].data
      expect(pieData).toHaveLength(1)
      expect(pieData[0].value).toBe(2)
    })

    it('handles empty device list without errors', () => {
      const refs = createRefs()
      refs.devices.value = []
      const { statusPieOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      const pieData = (statusPieOption.value.series as any[])[0].data
      expect(pieData).toHaveLength(0)
    })

    it('maps correct colors to statuses', () => {
      const refs = createRefs()
      refs.devices.value = [
        makeDevice('online'),
        makeDevice('charging'),
        makeDevice('offline'),
        makeDevice('fault'),
      ]
      const { statusPieOption } = useChartOptions(
        refs.timeLabels,
        refs.powerHistory,
        refs.voltageHistory,
        refs.currentHistory,
        refs.socHistory,
        refs.tempHistory,
        refs.devices,
      )
      const pieData = (statusPieOption.value.series as any[])[0].data
      const colorMap = Object.fromEntries(pieData.map((d: any) => [d.name, d.itemStyle.color]))
      expect(colorMap['在线']).toBe(COLORS.success)
      expect(colorMap['充电中']).toBe(COLORS.warning)
      expect(colorMap['离线']).toBe(COLORS.error)
      expect(colorMap['故障']).toBe('#6B7280')
    })
  })
})
