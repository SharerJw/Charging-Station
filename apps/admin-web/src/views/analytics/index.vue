<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  LineChart,
  BarChart,
  PieChart,
  FunnelChart,
  HeatmapChart,
  ScatterChart,
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
  ToolboxComponent,
} from 'echarts/components'
import { useAnalyticsStore } from '@/store/analytics'
import type {
  UserGrowthItem,
  RfmSegment,
  StationRevenueItem,
  UtilizationCell,
  GeoStation,
  PeakHourItem,
  DurationBucket,
  SocBucket,
  EnergyTrendItem,
} from '@/store/analytics'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  FunnelChart,
  HeatmapChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  DataZoomComponent,
  ToolboxComponent,
])

const store = useAnalyticsStore()

// ==================== 响应式尺寸 ====================
const chartHeight = '320px'

// ==================== 生命周期 ====================
onMounted(() => {
  loadCurrentTab()
})

// 切换 tab 时加载对应数据
watch(() => store.activeTab, () => {
  loadCurrentTab()
})

// 切换时间范围时重新加载当前 tab 数据
watch(() => store.period, () => {
  loadCurrentTab()
})

function loadCurrentTab() {
  switch (store.activeTab) {
    case 'user':
      store.fetchAllUserAnalytics()
      break
    case 'station':
      store.fetchAllStationAnalytics()
      break
    case 'charging':
      store.fetchAllChargingAnalytics()
      break
  }
}

// ==================== 用户分析图表 ====================

const userGrowthOption = computed(() => {
  const data = store.userGrowth
  if (!data.length) return {}
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增用户', '活跃用户'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d: UserGrowthItem) => d.date),
      boundaryGap: true,
    },
    yAxis: [
      { type: 'value', name: '新增用户', position: 'left' },
      { type: 'value', name: '活跃用户', position: 'right' },
    ],
    series: [
      {
        name: '新增用户',
        type: 'bar',
        data: data.map((d: UserGrowthItem) => d.newUsers),
        itemStyle: { color: '#1677FF', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 24,
      },
      {
        name: '活跃用户',
        type: 'line',
        yAxisIndex: 1,
        data: data.map((d: UserGrowthItem) => d.activeUsers),
        smooth: true,
        lineStyle: { color: '#52C41A', width: 2 },
        itemStyle: { color: '#52C41A' },
        areaStyle: { color: 'rgba(82, 196, 26, 0.08)' },
      },
    ],
  }
})

const retentionFunnelOption = computed(() => {
  const data = store.retentionFunnel
  if (!data) return {}
  const funnelData = [
    { value: 100, name: '注册用户' },
    { value: data.firstCharge, name: '首次充电' },
    { value: data.secondCharge, name: '二次充电' },
    { value: data.d7Retention, name: '7日留存' },
    { value: data.d30Retention, name: '30日留存' },
  ]
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%',
    },
    series: [
      {
        type: 'funnel',
        left: '10%',
        top: 20,
        bottom: 20,
        width: '80%',
        min: 0,
        max: 100,
        minSize: '10%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: { show: true, position: 'inside', formatter: '{b}\n{c}%' },
        itemStyle: { borderWidth: 0 },
        data: funnelData,
        color: ['#1677FF', '#4096FF', '#69B1FF', '#52C41A', '#95DE64'],
      },
    ],
  }
})

const rfmOption = computed(() => {
  const data = store.rfmSegments
  if (!data.length) return {}
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const d = params.data
        return `${d[3]}<br/>用户数: ${d[2]}<br/>平均消费: ¥${d[4]?.toFixed(2) ?? '-'}`
      },
    },
    grid: { left: '12%', right: '12%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '消费频次',
      nameLocation: 'middle',
      nameGap: 30,
    },
    yAxis: {
      type: 'value',
      name: '最近消费(天前)',
      nameLocation: 'middle',
      nameGap: 40,
      inverse: true,
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (val: number[]) => Math.max(Math.sqrt(val[2]) * 4, 12),
        data: data.map((s: RfmSegment) => [s.percentage, s.count, s.count, s.label, s.avgRevenue]),
        itemStyle: {
          color: (params: any) => {
            const colors = ['#1677FF', '#52C41A', '#FAAD14', '#FF4D4F', '#722ED1', '#13C2C2']
            return colors[params.dataIndex % colors.length]
          },
          opacity: 0.75,
        },
        label: {
          show: true,
          formatter: (params: any) => params.data[3],
          position: 'top',
          fontSize: 11,
        },
      },
    ],
  }
})

// RFM 汇总表
const rfmSummary = computed(() => store.rfmSegments)

// ==================== 站点分析图表 ====================

const revenueRankingOption = computed(() => {
  const data = store.stationRevenueRanking
  if (!data.length) return {}
  const sorted = [...data].sort((a: StationRevenueItem, b: StationRevenueItem) => a.revenue - b.revenue)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const d = params[0]
        const item = sorted[d.dataIndex]
        return `${item.stationName}<br/>营收: ¥${item.revenue.toLocaleString()}<br/>订单数: ${item.orderCount}`
      },
    },
    grid: { left: '3%', right: '10%', bottom: '3%', top: '6%', containLabel: true },
    xAxis: { type: 'value', name: '营收(元)' },
    yAxis: {
      type: 'category',
      data: sorted.map((d: StationRevenueItem) => d.stationName),
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((d: StationRevenueItem) => d.revenue),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#1677FF' },
              { offset: 1, color: '#4096FF' },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => `¥${params.value.toLocaleString()}`,
          fontSize: 11,
        },
        barMaxWidth: 20,
      },
    ],
  }
})

const utilizationOption = computed(() => {
  const data = store.utilizationData
  if (!data.length) return {}
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const matrix: number[][] = []
  let maxVal = 0
  data.forEach((cell: UtilizationCell) => {
    if (!matrix[cell.dayOfWeek]) matrix[cell.dayOfWeek] = []
    matrix[cell.dayOfWeek][cell.hour] = cell.value
    if (cell.value > maxVal) maxVal = cell.value
  })
  const flatData: number[][] = []
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      flatData.push([h, d, matrix[d]?.[h] ?? 0])
    }
  }
  return {
    tooltip: {
      formatter: (params: any) => `${days[params.data[1]]} ${hours[params.data[0]]}<br/>利用率: ${params.data[2]}%`,
    },
    grid: { left: '12%', right: '6%', bottom: '12%', top: '6%' },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true },
      axisLabel: { interval: 2 },
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: maxVal || 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#f0f5ff', '#bae0ff', '#69b1ff', '#1677ff', '#0050b3'],
      },
      text: ['高', '低'],
    },
    series: [
      {
        type: 'heatmap',
        data: flatData,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
        },
      },
    ],
  }
})

const geoDistributionOption = computed(() => {
  const data = store.geoDistribution
  if (!data.length) return {}
  // Scatter chart using lng/lat as x/y with bubble size = revenue
  const maxRevenue = Math.max(...data.map((d: GeoStation) => d.revenue), 1)
  return {
    tooltip: {
      formatter: (params: any) => {
        const d = params.data
        return `${d[3]}<br/>营收: ¥${d[4]?.toLocaleString()}<br/>设备: ${d[5]}台 (在线${d[6]}台)`
      },
    },
    grid: { left: '12%', right: '6%', bottom: '12%', top: '6%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '经度',
      nameLocation: 'middle',
      nameGap: 30,
    },
    yAxis: {
      type: 'value',
      name: '纬度',
      nameLocation: 'middle',
      nameGap: 40,
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (val: number[]) => Math.max((val[4] / maxRevenue) * 40, 10),
        data: data.map((d: GeoStation) => [d.lng, d.lat, d.revenue, d.stationName, d.revenue, d.deviceCount, d.onlineCount]),
        itemStyle: {
          color: '#1677FF',
          opacity: 0.7,
          borderColor: '#fff',
          borderWidth: 1,
        },
        label: {
          show: true,
          formatter: (params: any) => params.data[3],
          position: 'top',
          fontSize: 11,
        },
      },
    ],
  }
})

// ==================== 充电分析图表 ====================

const peakHoursOption = computed(() => {
  const data = store.peakHours
  if (!data.length) return {}
  const colorMap: Record<string, string> = {
    low: '#52C41A',
    medium: '#1677FF',
    high: '#FAAD14',
    peak: '#FF4D4F',
  }
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d: PeakHourItem) => `${d.hour}:00`),
    },
    yAxis: { type: 'value', name: '订单量' },
    series: [
      {
        type: 'bar',
        data: data.map((d: PeakHourItem) => ({
          value: d.orderCount,
          itemStyle: { color: colorMap[d.level] || '#1677FF' },
        })),
        barMaxWidth: 18,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  }
})

const durationOption = computed(() => {
  const data = store.durationDistribution
  if (!data.length) return {}
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        labelLine: { show: false },
        data: data.map((d: DurationBucket) => ({
          value: d.count,
          name: d.range,
        })),
        color: ['#1677FF', '#4096FF', '#69B1FF', '#95DE64', '#52C41A'],
      },
    ],
  }
})

const socOption = computed(() => {
  const data = store.socDistribution
  if (!data.length) return {}
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['开始SOC', '结束SOC'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d: SocBucket) => d.range),
      name: 'SOC区间',
    },
    yAxis: { type: 'value', name: '订单数' },
    series: [
      {
        name: '开始SOC',
        type: 'bar',
        data: data.map((d: SocBucket) => d.startCount),
        itemStyle: { color: '#FAAD14', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 20,
      },
      {
        name: '结束SOC',
        type: 'bar',
        data: data.map((d: SocBucket) => d.endCount),
        itemStyle: { color: '#52C41A', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 20,
      },
    ],
  }
})

const energyTrendOption = computed(() => {
  const data = store.energyTrend
  if (!data.length) return {}
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['充电量(kWh)', '订单数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d: EnergyTrendItem) => d.date),
      boundaryGap: true,
    },
    yAxis: [
      { type: 'value', name: '充电量(kWh)', position: 'left' },
      { type: 'value', name: '订单数', position: 'right' },
    ],
    series: [
      {
        name: '充电量(kWh)',
        type: 'line',
        data: data.map((d: EnergyTrendItem) => d.energy),
        smooth: true,
        lineStyle: { color: '#1677FF', width: 2 },
        itemStyle: { color: '#1677FF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.25)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.02)' },
            ],
          },
        },
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        data: data.map((d: EnergyTrendItem) => d.orderCount),
        itemStyle: { color: '#95DE64', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 18,
      },
    ],
  }
})
</script>

<template>
  <div class="analytics-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="page-title">数据分析</span>
          <div class="header-controls">
            <el-radio-group v-model="store.activeTab" size="small" style="margin-right: 12px">
              <el-radio-button value="user">用户分析</el-radio-button>
              <el-radio-button value="station">站点分析</el-radio-button>
              <el-radio-button value="charging">充电行为</el-radio-button>
            </el-radio-group>
            <el-radio-group v-model="store.period" size="small">
              <el-radio-button value="7d">近7天</el-radio-button>
              <el-radio-button value="30d">近30天</el-radio-button>
              <el-radio-button value="90d">近90天</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- ==================== 用户分析 ==================== -->
      <div v-if="store.activeTab === 'user'">
        <el-skeleton :loading="store.loadingUser" animated :rows="8">
          <template #default>
            <el-row :gutter="16">
              <!-- 用户增长趋势 -->
              <el-col :span="14">
                <h4 class="chart-title">用户增长趋势</h4>
                <v-chart
                  v-if="store.userGrowth.length"
                  :option="userGrowthOption"
                  :style="{ height: chartHeight }"
                  autoresize
                />
                <el-empty v-else description="暂无数据" />
              </el-col>

              <!-- 留存漏斗 -->
              <el-col :span="10">
                <h4 class="chart-title">用户留存漏斗</h4>
                <v-chart
                  v-if="store.retentionFunnel"
                  :option="retentionFunnelOption"
                  :style="{ height: chartHeight }"
                  autoresize
                />
                <el-empty v-else description="暂无数据" />
              </el-col>
            </el-row>

            <el-divider />

            <!-- RFM 分析 -->
            <h4 class="chart-title">RFM 用户分群</h4>
            <el-row :gutter="16">
              <el-col :span="16">
                <v-chart
                  v-if="store.rfmSegments.length"
                  :option="rfmOption"
                  :style="{ height: chartHeight }"
                  autoresize
                />
                <el-empty v-else description="暂无数据" />
              </el-col>
              <el-col :span="8">
                <el-table :data="rfmSummary" size="small" border stripe max-height="320">
                  <el-table-column prop="label" label="分群" min-width="80" />
                  <el-table-column prop="count" label="用户数" min-width="70" align="right" />
                  <el-table-column prop="percentage" label="占比" min-width="60" align="right">
                    <template #default="{ row }">{{ row.percentage }}%</template>
                  </el-table-column>
                  <el-table-column prop="avgRevenue" label="平均消费" min-width="80" align="right">
                    <template #default="{ row }">¥{{ row.avgRevenue?.toFixed(2) }}</template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </template>
        </el-skeleton>
      </div>

      <!-- ==================== 站点分析 ==================== -->
      <div v-if="store.activeTab === 'station'">
        <el-skeleton :loading="store.loadingStation" animated :rows="8">
          <template #default>
            <el-row :gutter="16">
              <!-- 站点营收排行 -->
              <el-col :span="12">
                <h4 class="chart-title">站点营收排行</h4>
                <v-chart
                  v-if="store.stationRevenueRanking.length"
                  :option="revenueRankingOption"
                  :style="{ height: chartHeight }"
                  autoresize
                />
                <el-empty v-else description="暂无数据" />
              </el-col>

              <!-- 利用率热力图 -->
              <el-col :span="12">
                <h4 class="chart-title">利用率热力图 (时段 x 星期)</h4>
                <v-chart
                  v-if="store.utilizationData.length"
                  :option="utilizationOption"
                  :style="{ height: chartHeight }"
                  autoresize
                />
                <el-empty v-else description="暂无数据" />
              </el-col>
            </el-row>

            <el-divider />

            <!-- 地理分布 -->
            <h4 class="chart-title">站点地理分布</h4>
            <v-chart
              v-if="store.geoDistribution.length"
              :option="geoDistributionOption"
              style="height: 360px"
              autoresize
            />
            <el-empty v-else description="暂无数据" />
          </template>
        </el-skeleton>
      </div>

      <!-- ==================== 充电行为分析 ==================== -->
      <div v-if="store.activeTab === 'charging'">
        <el-skeleton :loading="store.loadingCharging" animated :rows="8">
          <template #default>
            <el-row :gutter="16">
              <!-- 高峰时段分布 -->
              <el-col :span="12">
                <h4 class="chart-title">高峰时段分布</h4>
                <v-chart
                  v-if="store.peakHours.length"
                  :option="peakHoursOption"
                  :style="{ height: chartHeight }"
                  autoresize
                />
                <el-empty v-else description="暂无数据" />
              </el-col>

              <!-- 充电时长分布 -->
              <el-col :span="12">
                <h4 class="chart-title">充电时长分布</h4>
                <v-chart
                  v-if="store.durationDistribution.length"
                  :option="durationOption"
                  :style="{ height: chartHeight }"
                  autoresize
                />
                <el-empty v-else description="暂无数据" />
              </el-col>
            </el-row>

            <el-divider />

            <el-row :gutter="16">
              <!-- SOC 分布 -->
              <el-col :span="12">
                <h4 class="chart-title">SOC 分布</h4>
                <v-chart
                  v-if="store.socDistribution.length"
                  :option="socOption"
                  :style="{ height: chartHeight }"
                  autoresize
                />
                <el-empty v-else description="暂无数据" />
              </el-col>

              <!-- 充电量趋势 -->
              <el-col :span="12">
                <h4 class="chart-title">充电量趋势</h4>
                <v-chart
                  v-if="store.energyTrend.length"
                  :option="energyTrendOption"
                  :style="{ height: chartHeight }"
                  autoresize
                />
                <el-empty v-else description="暂无数据" />
              </el-col>
            </el-row>
          </template>
        </el-skeleton>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;
}
.header-controls {
  display: flex;
  align-items: center;
}
.chart-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0 0 12px;
}
</style>
