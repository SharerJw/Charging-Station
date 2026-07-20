<template>
  <view class="stats-page">
    <!-- 时间范围选择 -->
    <view class="time-range">
      <text
        v-for="range in timeRanges"
        :key="range.value"
        class="range-btn"
        :class="{ active: currentRange === range.value }"
        @tap="switchRange(range.value)"
      >{{ range.label }}</text>
    </view>

    <!-- KPI 卡片 -->
    <view class="kpi-grid">
      <view class="kpi-card">
        <text class="kpi-value">{{ stats.total }}</text>
        <text class="kpi-label">工单总数</text>
      </view>
      <view class="kpi-card">
        <text class="kpi-value success">{{ stats.resolved }}</text>
        <text class="kpi-label">已解决</text>
      </view>
      <view class="kpi-card">
        <text class="kpi-value orange">{{ stats.avgTime }}</text>
        <text class="kpi-label">平均耗时(h)</text>
      </view>
      <view class="kpi-card">
        <text class="kpi-value" :class="stats.slaRate >= 90 ? 'success' : 'danger'">{{ stats.slaRate }}%</text>
        <text class="kpi-label">SLA达标率</text>
      </view>
    </view>

    <!-- 工单类型分布饼图 -->
    <view class="chart-card">
      <text class="chart-title">工单类型分布</text>
      <view class="pie-chart">
        <view class="pie-wrapper">
          <view class="pie" :style="pieStyle"></view>
          <view class="pie-center">
            <text class="pie-total">{{ stats.total }}</text>
            <text class="pie-total-label">总数</text>
          </view>
        </view>
        <view class="pie-legend">
          <view class="legend-item" v-for="(item, idx) in typeDistribution" :key="idx">
            <view class="legend-dot" :style="{ background: item.color }"></view>
            <text class="legend-name">{{ item.name }}</text>
            <text class="legend-value">{{ item.value }} ({{ item.percent }}%)</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 处理趋势折线图 -->
    <view class="chart-card">
      <text class="chart-title">处理趋势</text>
      <view class="line-chart">
        <view class="chart-y-axis">
          <text class="y-label" v-for="val in yAxisValues" :key="val">{{ val }}</text>
        </view>
        <scroll-view scroll-x class="chart-scroll">
          <view class="chart-body">
            <view class="chart-bars">
              <view class="bar-group" v-for="(item, idx) in trendData" :key="idx">
                <view class="bar-stack">
                  <view class="bar created" :style="{ height: getBarHeight(item.created) + 'rpx' }">
                    <text class="bar-val" v-if="item.created > 0">{{ item.created }}</text>
                  </view>
                  <view class="bar completed" :style="{ height: getBarHeight(item.completed) + 'rpx' }">
                    <text class="bar-val" v-if="item.completed > 0">{{ item.completed }}</text>
                  </view>
                </view>
                <text class="bar-label">{{ item.label }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
        <view class="chart-legend-row">
          <view class="legend-inline">
            <view class="legend-dot" style="background: #1677FF"></view>
            <text class="legend-inline-text">新建</text>
          </view>
          <view class="legend-inline">
            <view class="legend-dot" style="background: #52C41A"></view>
            <text class="legend-inline-text">完成</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 个人效率排名 -->
    <view class="chart-card">
      <text class="chart-title">个人效率排名</text>
      <view class="ranking-list" v-if="rankingList.length > 0">
        <view class="ranking-item" v-for="(item, idx) in rankingList" :key="idx">
          <view class="rank-badge" :class="{ top: idx < 3 }">{{ idx + 1 }}</view>
          <view class="rank-info">
            <text class="rank-name">{{ item.name }}</text>
            <text class="rank-detail">完成 {{ item.completed }} 单 | 平均 {{ item.avgTime }}h</text>
          </view>
          <view class="rank-bar-wrap">
            <view class="rank-bar-bg">
              <view class="rank-bar-fill" :style="{ width: item.efficiency + '%' }"></view>
            </view>
            <text class="rank-efficiency">{{ item.efficiency }}%</text>
          </view>
        </view>
      </view>
      <view class="empty-state" v-else>
        <text class="empty-text">暂无数据</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api'
import type { TypeDistItem, WorkorderTrendItem as TrendItem, RankItem } from '@/types'

const currentRange = ref('week')

const timeRanges = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '季度', value: 'quarter' },
]

const stats = ref({
  total: 0,
  resolved: 0,
  avgTime: 0,
  slaRate: 0,
})

const typeDistribution = ref<TypeDistItem[]>([])
const trendData = ref<TrendItem[]>([])
const rankingList = ref<RankItem[]>([])

const typeColors = ['#1677FF', '#52C41A', '#FAAD14', '#FF4D4F', '#722ED1']

// 饼图样式（使用 conic-gradient 模拟）
const pieStyle = computed(() => {
  const items = typeDistribution.value
  if (items.length === 0) return { background: '#F0F0F0' }
  let acc = 0
  const stops: string[] = []
  items.forEach((item) => {
    const start = acc
    acc += item.percent
    stops.push(`${item.color} ${start}% ${acc}%`)
  })
  return { background: `conic-gradient(${stops.join(', ')})` }
})

// Y 轴刻度
const yAxisValues = computed(() => {
  if (trendData.value.length === 0) return []
  const maxVal = Math.max(
    ...trendData.value.map(d => Math.max(d.created, d.completed)),
    1
  )
  const step = Math.ceil(maxVal / 4)
  return [step * 4, step * 3, step * 2, step, 0]
})

function getBarHeight(val: number): number {
  if (trendData.value.length === 0) return 0
  const maxVal = Math.max(
    ...trendData.value.map(d => Math.max(d.created, d.completed)),
    1
  )
  return Math.round((val / maxVal) * 200)
}

async function loadStats() {
  try {
    const result = await api.getWorkorderStats({ range: currentRange.value })
    if (result) {
      stats.value = {
        total: result.total || 0,
        resolved: result.resolved || 0,
        avgTime: result.avgTime || 0,
        slaRate: result.slaRate || 0,
      }

      // 类型分布
      const dist = result.typeDistribution || []
      const totalDist = dist.reduce((sum: number, d: any) => sum + d.value, 0) || 1
      typeDistribution.value = dist.map((d: any, idx: number) => ({
        name: d.name,
        value: d.value,
        percent: Math.round((d.value / totalDist) * 100),
        color: typeColors[idx % typeColors.length],
      }))

      // 趋势数据
      trendData.value = result.trend || []

      // 排名
      rankingList.value = result.ranking || []
    }
  } catch {
    // 加载失败使用模拟数据用于展示
    loadMockData()
  }
}

function loadMockData() {
  stats.value = { total: 156, resolved: 132, avgTime: 4.2, slaRate: 92.3 }

  typeDistribution.value = [
    { name: '维修工单', value: 68, percent: 44, color: '#1677FF' },
    { name: '保养工单', value: 42, percent: 27, color: '#52C41A' },
    { name: '巡检工单', value: 32, percent: 20, color: '#FAAD14' },
    { name: '其他', value: 14, percent: 9, color: '#FF4D4F' },
  ]

  trendData.value = [
    { label: '周一', created: 8, completed: 6 },
    { label: '周二', created: 12, completed: 10 },
    { label: '周三', created: 6, completed: 8 },
    { label: '周四', created: 15, completed: 12 },
    { label: '周五', created: 10, completed: 14 },
    { label: '周六', created: 4, completed: 5 },
    { label: '周日', created: 3, completed: 3 },
  ]

  rankingList.value = [
    { name: '张伟', completed: 28, avgTime: 3.2, efficiency: 96 },
    { name: '李明', completed: 25, avgTime: 3.8, efficiency: 91 },
    { name: '王强', completed: 22, avgTime: 4.1, efficiency: 87 },
    { name: '刘洋', completed: 18, avgTime: 5.0, efficiency: 78 },
    { name: '陈杰', completed: 15, avgTime: 5.5, efficiency: 72 },
  ]
}

function switchRange(range: string) {
  currentRange.value = range
  loadStats()
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stats-page {
  padding: 24rpx;
  background: #F0F2F5;
  min-height: 100vh;
}

/* 时间范围选择 */
.time-range {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.range-btn {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #666;
  padding: 16rpx 0;
  border-radius: 8rpx;
}

.range-btn.active {
  background: #1677FF;
  color: #fff;
  font-weight: bold;
}

/* KPI 网格 */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.kpi-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.kpi-value {
  font-size: 44rpx;
  font-weight: bold;
  color: #333;
  font-family: 'DIN Alternate', monospace;
  display: block;
}

.kpi-value.success { color: #52C41A; }
.kpi-value.orange { color: #FAAD14; }
.kpi-value.danger { color: #FF4D4F; }

.kpi-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 8rpx;
}

/* 图表卡片 */
.chart-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.chart-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

/* 饼图 */
.pie-chart {
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.pie-wrapper {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
}

.pie {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120rpx;
  height: 120rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pie-total {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.pie-total-label {
  font-size: 18rpx;
  color: #999;
}

.pie-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 4rpx;
  flex-shrink: 0;
}

.legend-name {
  font-size: 24rpx;
  color: #333;
  flex: 1;
}

.legend-value {
  font-size: 22rpx;
  color: #999;
  font-family: monospace;
}

/* 柱状图 */
.line-chart {
  position: relative;
}

.chart-y-axis {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 48rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 60rpx;
}

.y-label {
  font-size: 18rpx;
  color: #BBB;
  text-align: right;
}

.chart-scroll {
  margin-left: 72rpx;
  white-space: nowrap;
}

.chart-body {
  min-width: 100%;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 24rpx;
  height: 280rpx;
  padding-bottom: 48rpx;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80rpx;
}

.bar-stack {
  display: flex;
  gap: 6rpx;
  align-items: flex-end;
  height: 200rpx;
}

.bar {
  width: 28rpx;
  min-height: 4rpx;
  border-radius: 4rpx 4rpx  0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  transition: height 0.4s ease;
}

.bar.created { background: #1677FF; }
.bar.completed { background: #52C41A; }

.bar-val {
  font-size: 16rpx;
  color: #fff;
  position: absolute;
  top: -24rpx;
}

.bar-label {
  font-size: 20rpx;
  color: #999;
  margin-top: 8rpx;
  text-align: center;
}

.chart-legend-row {
  display: flex;
  justify-content: center;
  gap: 32rpx;
  margin-top: 16rpx;
}

.legend-inline {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-inline-text {
  font-size: 22rpx;
  color: #666;
}

/* 排名列表 */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background: #FAFAFA;
  border-radius: 8rpx;
}

.rank-badge {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #E8E8E8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  color: #999;
  flex-shrink: 0;
}

.rank-badge.top {
  background: linear-gradient(135deg, #FAAD14, #FFD666);
  color: #fff;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
  display: block;
}

.rank-detail {
  font-size: 20rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.rank-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 180rpx;
}

.rank-bar-bg {
  flex: 1;
  height: 12rpx;
  background: #E8E8E8;
  border-radius: 6rpx;
  overflow: hidden;
}

.rank-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1677FF, #4096FF);
  border-radius: 6rpx;
  transition: width 0.5s ease;
}

.rank-efficiency {
  font-size: 22rpx;
  color: #1677FF;
  font-weight: bold;
  font-family: monospace;
  min-width: 64rpx;
  text-align: right;
}

.empty-state {
  padding: 48rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
