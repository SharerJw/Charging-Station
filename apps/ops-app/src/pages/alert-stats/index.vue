<template>
  <view class="alert-stats-page">
    <!-- 时间范围选择 -->
    <view class="time-section">
      <view class="time-tabs">
        <text
          class="time-tab"
          :class="{ active: timeRange === tab.value }"
          v-for="tab in timeTabs"
          :key="tab.value"
          @tap="switchTimeRange(tab.value)"
        >{{ tab.label }}</text>
      </view>
      <view class="custom-range" v-if="timeRange === 'custom'">
        <picker mode="date" :value="customStart" @change="onStartChange">
          <text class="date-picker">{{ customStart || '开始日期' }}</text>
        </picker>
        <text class="range-sep">至</text>
        <picker mode="date" :value="customEnd" @change="onEndChange">
          <text class="date-picker">{{ customEnd || '结束日期' }}</text>
        </picker>
        <button class="query-btn" size="mini" @tap="loadStats">查询</button>
      </view>
    </view>

    <!-- 告警趋势图 -->
    <view class="chart-section">
      <text class="section-title">告警趋势</text>
      <view class="chart-container">
        <view class="trend-chart">
          <view class="chart-y-axis">
            <text class="y-label" v-for="val in yLabels" :key="val">{{ val }}</text>
          </view>
          <view class="chart-bars">
            <view class="bar-group" v-for="(item, idx) in trendData" :key="idx">
              <view class="bar-wrapper">
                <view
                  class="bar"
                  :style="{ height: getBarHeight(item.total) }"
                >
                  <view class="bar-p0" :style="{ height: getBarSegment(item.P0, item.total) }"></view>
                </view>
              </view>
              <text class="bar-label">{{ item.label }}</text>
            </view>
          </view>
        </view>
        <view class="chart-legend">
          <view class="legend-item">
            <view class="legend-dot p0"></view>
            <text class="legend-text">P0 紧急</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot p1"></view>
            <text class="legend-text">P1 严重</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot p2"></view>
            <text class="legend-text">P2 警告</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot p3"></view>
            <text class="legend-text">P3 提示</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 类型分布环形图 -->
    <view class="chart-section">
      <text class="section-title">告警类型分布</text>
      <view class="ring-chart-container">
        <view class="ring-chart">
          <view class="ring-center">
            <text class="ring-total">{{ totalAlerts }}</text>
            <text class="ring-total-label">告警总数</text>
          </view>
        </view>
        <view class="ring-legend">
          <view class="ring-legend-item" v-for="(item, idx) in typeDistribution" :key="idx">
            <view class="ring-legend-dot" :style="{ background: item.color }"></view>
            <text class="ring-legend-name">{{ item.name }}</text>
            <text class="ring-legend-count">{{ item.count }}</text>
            <text class="ring-legend-pct">{{ item.percent }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Top 10 告警编码 -->
    <view class="table-section">
      <text class="section-title">Top 10 告警编码</text>
      <view class="table">
        <view class="table-header">
          <text class="th th-rank">排名</text>
          <text class="th th-code">告警编码</text>
          <text class="th th-name">告警名称</text>
          <text class="th th-count">次数</text>
          <text class="th th-trend">趋势</text>
        </view>
        <view class="table-row" v-for="(item, idx) in top10Codes" :key="idx">
          <text class="td th-rank">
            <text class="rank-badge" :class="{ top: idx < 3 }">{{ idx + 1 }}</text>
          </text>
          <text class="td th-code">{{ item.code }}</text>
          <text class="td th-name">{{ item.name }}</text>
          <text class="td th-count">{{ item.count }}</text>
          <text class="td th-trend" :class="item.trend > 0 ? 'up' : 'down'">
            {{ item.trend > 0 ? '↑' : '↓' }}{{ Math.abs(item.trend) }}%
          </text>
        </view>
      </view>
    </view>

    <!-- 处理效率指标 -->
    <view class="metrics-section">
      <text class="section-title">处理效率</text>
      <view class="metrics-grid">
        <view class="metric-card">
          <text class="metric-number">{{ metrics.totalAlerts }}</text>
          <text class="metric-label">告警总数</text>
        </view>
        <view class="metric-card">
          <text class="metric-number">{{ metrics.resolvedCount }}</text>
          <text class="metric-label">已处理</text>
        </view>
        <view class="metric-card">
          <text class="metric-number highlight">{{ metrics.pendingCount }}</text>
          <text class="metric-label">待处理</text>
        </view>
        <view class="metric-card">
          <text class="metric-number">{{ metrics.resolveRate }}%</text>
          <text class="metric-label">处理率</text>
        </view>
      </view>
      <view class="metrics-detail">
        <view class="detail-row">
          <text class="detail-label">平均响应时间</text>
          <text class="detail-value">{{ metrics.avgResponseTime }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">平均处理时间</text>
          <text class="detail-value">{{ metrics.avgResolveTime }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">P0 平均响应</text>
          <text class="detail-value critical">{{ metrics.p0AvgResponse }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">超时未处理</text>
          <text class="detail-value critical">{{ metrics.timeoutCount }} 条</text>
        </view>
      </view>
    </view>

    <view class="bottom-spacer"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api'

interface TrendItem {
  label: string
  total: number
  P0: number
  P1: number
  P2: number
  P3: number
}

interface TypeItem {
  name: string
  count: number
  percent: string
  color: string
}

interface TopCode {
  code: string
  name: string
  count: number
  trend: number
}

interface MetricsData {
  totalAlerts: number
  resolvedCount: number
  pendingCount: number
  resolveRate: string
  avgResponseTime: string
  avgResolveTime: string
  p0AvgResponse: string
  timeoutCount: number
}

const timeRange = ref('7d')
const customStart = ref('')
const customEnd = ref('')
const trendData = ref<TrendItem[]>([])
const typeDistribution = ref<TypeItem[]>([])
const top10Codes = ref<TopCode[]>([])
const metrics = ref<MetricsData>({
  totalAlerts: 0,
  resolvedCount: 0,
  pendingCount: 0,
  resolveRate: '0',
  avgResponseTime: '-',
  avgResolveTime: '-',
  p0AvgResponse: '-',
  timeoutCount: 0,
})

const timeTabs = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '自定义', value: 'custom' },
]

const totalAlerts = computed(() => typeDistribution.value.reduce((s, i) => s + i.count, 0))

const yLabels = computed(() => {
  const maxVal = Math.max(...trendData.value.map(d => d.total), 1)
  const step = Math.ceil(maxVal / 4)
  return [step * 4, step * 3, step * 2, step, 0]
})

function getBarHeight(value: number): string {
  const maxVal = Math.max(...trendData.value.map(d => d.total), 1)
  return (value / (maxVal * 1.1)) * 100 + '%'
}

function getBarSegment(p0: number, total: number): string {
  if (total === 0) return '0%'
  return (p0 / total) * 100 + '%'
}

function switchTimeRange(val: string) {
  timeRange.value = val
  if (val !== 'custom') {
    loadStats()
  }
}

function onStartChange(e: any) {
  customStart.value = e.detail.value
}

function onEndChange(e: any) {
  customEnd.value = e.detail.value
}

async function loadStats() {
  try {
    const params: any = { range: timeRange.value }
    if (timeRange.value === 'custom') {
      params.startDate = customStart.value
      params.endDate = customEnd.value
    }
    const data = await api.getAlertStats(params)
    trendData.value = data.trend
    typeDistribution.value = data.typeDistribution
    top10Codes.value = data.top10Codes
    metrics.value = data.metrics
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.alert-stats-page {
  background: #F0F2F5;
  min-height: 100vh;
}

.time-section {
  background: #fff;
  padding: 20rpx 24rpx;
}

.time-tabs {
  display: flex;
  gap: 16rpx;
}

.time-tab {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.time-tab.active {
  background: #1677FF;
  color: #fff;
}

.custom-range {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
}

.date-picker {
  flex: 1;
  text-align: center;
  padding: 12rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #333;
}

.range-sep {
  font-size: 24rpx;
  color: #999;
}

.query-btn {
  background: #1677FF;
  color: #fff;
  font-size: 24rpx;
  border: none;
  border-radius: 8rpx;
}

.chart-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
  display: block;
}

.trend-chart {
  display: flex;
  height: 300rpx;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 12rpx;
  width: 80rpx;
}

.y-label {
  font-size: 20rpx;
  color: #bbb;
  text-align: right;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8rpx;
  border-bottom: 1rpx solid #e8e8e8;
  border-left: 1rpx solid #e8e8e8;
  padding: 0 8rpx;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-wrapper {
  width: 100%;
  height: 260rpx;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 70%;
  background: #1677FF;
  border-radius: 6rpx 6rpx 0 0;
  position: relative;
  overflow: hidden;
  min-height: 4rpx;
}

.bar-p0 {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FF4D4F;
}

.bar-label {
  font-size: 20rpx;
  color: #999;
  margin-top: 8rpx;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-top: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.legend-dot.p0 {
  background: #FF4D4F;
}

.legend-dot.p1 {
  background: #FA8C16;
}

.legend-dot.p2 {
  background: #FAAD14;
}

.legend-dot.p3 {
  background: #1677FF;
}

.legend-text {
  font-size: 22rpx;
  color: #666;
}

.ring-chart-container {
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.ring-chart {
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: conic-gradient(
    #FF4D4F 0% 15%,
    #FA8C16 15% 35%,
    #FAAD14 35% 60%,
    #1677FF 60% 80%,
    #d9d9d9 80% 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ring-center {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-total {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.ring-total-label {
  font-size: 20rpx;
  color: #999;
}

.ring-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.ring-legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.ring-legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 4rpx;
  flex-shrink: 0;
}

.ring-legend-name {
  font-size: 24rpx;
  color: #333;
  flex: 1;
}

.ring-legend-count {
  font-size: 24rpx;
  font-weight: 600;
  color: #333;
  min-width: 48rpx;
  text-align: right;
}

.ring-legend-pct {
  font-size: 22rpx;
  color: #999;
  min-width: 60rpx;
  text-align: right;
}

.table-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.table-header {
  display: flex;
  padding: 14rpx 0;
  background: #f7f8fa;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}

.th {
  font-size: 22rpx;
  font-weight: 600;
  color: #666;
  text-align: center;
}

.th-rank {
  width: 70rpx;
}

.th-code {
  width: 160rpx;
  text-align: left;
}

.th-name {
  flex: 1;
  text-align: left;
}

.th-count {
  width: 80rpx;
}

.th-trend {
  width: 100rpx;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #fafafa;
}

.td {
  font-size: 24rpx;
  color: #333;
  text-align: center;
}

.table-row .th-code,
.table-row .th-name {
  text-align: left;
}

.rank-badge {
  display: inline-block;
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #666;
  background: #f5f5f5;
}

.rank-badge.top {
  background: #1677FF;
  color: #fff;
}

.td.up {
  color: #FF4D4F;
}

.td.down {
  color: #52C41A;
}

.metrics-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.metric-card {
  text-align: center;
  padding: 24rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.metric-number {
  font-size: 44rpx;
  font-weight: 700;
  color: #333;
}

.metric-number.highlight {
  color: #FF4D4F;
}

.metric-label {
  font-size: 24rpx;
  color: #999;
}

.metrics-detail {
  background: #f7f8fa;
  border-radius: 12rpx;
  padding: 8rpx 24rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #eee;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 26rpx;
  color: #666;
}

.detail-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
}

.detail-value.critical {
  color: #FF4D4F;
}

.bottom-spacer {
  height: 40rpx;
}
</style>
