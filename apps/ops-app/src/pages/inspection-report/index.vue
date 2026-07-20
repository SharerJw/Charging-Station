<template>
  <view class="inspection-report-page">
    <!-- 汇总信息 -->
    <view class="summary-section">
      <view class="summary-header">
        <text class="summary-title">巡检报告</text>
        <text class="summary-id">单号: {{ report.taskId }}</text>
      </view>

      <view class="summary-grid">
        <view class="summary-item">
          <text class="summary-label">充电站</text>
          <text class="summary-value">{{ report.stationName }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">巡检人</text>
          <text class="summary-value">{{ report.inspector }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">开始时间</text>
          <text class="summary-value">{{ report.startTime }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">完成时间</text>
          <text class="summary-value">{{ report.endTime }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">巡检耗时</text>
          <text class="summary-value highlight">{{ report.duration }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">设备数量</text>
          <text class="summary-value">{{ report.deviceCount }} 台</text>
        </view>
      </view>

      <!-- 统计卡片 -->
      <view class="stat-row">
        <view class="stat-card">
          <text class="stat-number">{{ report.totalItems }}</text>
          <text class="stat-label">巡检总项</text>
        </view>
        <view class="stat-card pass">
          <text class="stat-number">{{ report.passItems }}</text>
          <text class="stat-label">通过</text>
        </view>
        <view class="stat-card fail">
          <text class="stat-number">{{ report.failItems }}</text>
          <text class="stat-label">异常</text>
        </view>
        <view class="stat-card rate">
          <text class="stat-number">{{ report.passRate }}%</text>
          <text class="stat-label">通过率</text>
        </view>
      </view>
    </view>

    <!-- 异常列表 -->
    <view class="anomaly-section" v-if="report.anomalies.length > 0">
      <text class="section-title">异常项 ({{ report.anomalies.length }})</text>
      <view class="anomaly-card" v-for="(anomaly, idx) in report.anomalies" :key="idx">
        <view class="anomaly-header">
          <view class="anomaly-severity" :class="anomaly.severity">
            <text class="anomaly-severity-text">{{ severityLabel[anomaly.severity] }}</text>
          </view>
          <text class="anomaly-device">{{ anomaly.deviceName }}</text>
        </view>
        <text class="anomaly-item-name">{{ anomaly.itemName }}</text>
        <text class="anomaly-remark">{{ anomaly.remark }}</text>
        <view class="anomaly-photos" v-if="anomaly.photos.length > 0">
          <image
            class="anomaly-photo"
            v-for="(photo, pidx) in anomaly.photos"
            :key="pidx"
            :src="photo"
            mode="aspectFill"
            @tap="previewPhoto(anomaly.photos, pidx)"
          />
        </view>
      </view>
    </view>

    <!-- 完整巡检结果表 -->
    <view class="result-table-section">
      <text class="section-title">巡检结果明细</text>

      <view class="table-device" v-for="device in report.devices" :key="device.id">
        <view class="table-device-header">
          <text class="table-device-name">{{ device.name }}</text>
          <text class="table-device-code">{{ device.code }}</text>
        </view>

        <view class="table-row table-header-row">
          <text class="table-cell cell-category">类别</text>
          <text class="table-cell cell-item">检查项</text>
          <text class="table-cell cell-result">结果</text>
        </view>

        <view
          class="table-row"
          v-for="(item, idx) in getDeviceResults(device.id)"
          :key="idx"
        >
          <text class="table-cell cell-category">{{ categoryLabel[item.category] }}</text>
          <text class="table-cell cell-item">{{ item.name }}</text>
          <view class="table-cell cell-result">
            <text
              class="result-dot"
              :class="item.result === 'pass' ? 'pass' : 'fail'"
            >{{ item.result === 'pass' ? '✓' : '✗' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 导出按钮 -->
    <view class="export-bar">
      <button class="export-btn" @tap="exportReport">
        <text class="export-btn-text">📤 导出报告</text>
      </button>
    </view>

    <view class="bottom-spacer"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import type { Anomaly, ReportDevice, InspectionCheckResult as CheckResult, InspectionReport } from '@/types'

const reportId = ref('')
const report = ref<InspectionReport>({
  taskId: '',
  stationName: '',
  inspector: '',
  startTime: '',
  endTime: '',
  duration: '',
  deviceCount: 0,
  totalItems: 0,
  passItems: 0,
  failItems: 0,
  passRate: '0',
  anomalies: [],
  devices: [],
  checkResults: [],
})

const severityLabel: Record<string, string> = {
  high: '严重',
  medium: '中等',
  low: '轻微',
}

const categoryLabel: Record<string, string> = {
  appearance: '外观',
  electrical: '电气',
  functional: '功能',
  exception: '异常',
}

function getDeviceResults(deviceId: string): CheckResult[] {
  return report.value.checkResults.filter(r => r.deviceId === deviceId)
}

function previewPhoto(urls: string[], idx: number) {
  uni.previewImage({ urls, current: urls[idx] })
}

function exportReport() {
  uni.showActionSheet({
    itemList: ['导出为PDF', '导出为Excel', '分享链接'],
    success: (res) => {
      const formats = ['PDF', 'Excel', '链接']
      uni.showToast({ title: `${formats[res.tapIndex]} 导出中...`, icon: 'none' })
    },
  })
}

async function loadReport() {
  try {
    const data = await api.getInspectionReport(reportId.value)
    report.value = data
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as any
  reportId.value = current?.options?.id || ''
  if (reportId.value) {
    loadReport()
  }
})
</script>

<style scoped>
.inspection-report-page {
  background: #F0F2F5;
  min-height: 100vh;
}

.summary-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.summary-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.summary-id {
  font-size: 22rpx;
  color: #999;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.summary-label {
  font-size: 24rpx;
  color: #999;
}

.summary-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.summary-value.highlight {
  color: #1677FF;
  font-weight: 600;
}

.stat-row {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.stat-card {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  background: #f7f8fa;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.stat-card.pass .stat-number {
  color: #52C41A;
}

.stat-card.fail .stat-number {
  color: #FF4D4F;
}

.stat-card.rate .stat-number {
  color: #1677FF;
}

.stat-number {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.anomaly-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.anomaly-card {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.anomaly-card:last-child {
  border-bottom: none;
}

.anomaly-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.anomaly-severity {
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
}

.anomaly-severity.high {
  background: #fff2f0;
}

.anomaly-severity.medium {
  background: #fff7e6;
}

.anomaly-severity.low {
  background: #f6ffed;
}

.anomaly-severity-text {
  font-size: 22rpx;
  color: #333;
}

.anomaly-severity.high .anomaly-severity-text {
  color: #FF4D4F;
}

.anomaly-severity.medium .anomaly-severity-text {
  color: #FAAD14;
}

.anomaly-severity.low .anomaly-severity-text {
  color: #52C41A;
}

.anomaly-device {
  font-size: 24rpx;
  color: #666;
}

.anomaly-item-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.anomaly-remark {
  font-size: 26rpx;
  color: #666;
  margin-top: 8rpx;
}

.anomaly-photos {
  display: flex;
  gap: 12rpx;
  margin-top: 12rpx;
}

.anomaly-photo {
  width: 140rpx;
  height: 140rpx;
  border-radius: 8rpx;
}

.result-table-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.table-device {
  margin-bottom: 28rpx;
}

.table-device:last-child {
  margin-bottom: 0;
}

.table-device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.table-device-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.table-device-code {
  font-size: 22rpx;
  color: #999;
}

.table-row {
  display: flex;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #fafafa;
}

.table-header-row {
  background: #f7f8fa;
  border-radius: 8rpx;
  padding: 14rpx 8rpx;
}

.table-header-row .table-cell {
  font-weight: 600;
  color: #666;
  font-size: 24rpx;
}

.table-cell {
  font-size: 26rpx;
  color: #333;
}

.cell-category {
  width: 100rpx;
}

.cell-item {
  flex: 1;
}

.cell-result {
  width: 80rpx;
  text-align: center;
}

.result-dot {
  font-size: 28rpx;
  font-weight: 600;
}

.result-dot.pass {
  color: #52C41A;
}

.result-dot.fail {
  color: #FF4D4F;
}

.export-bar {
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.export-btn {
  width: 100%;
  height: 80rpx;
  background: #1677FF;
  border-radius: 12rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-btn-text {
  font-size: 30rpx;
  color: #fff;
}

.bottom-spacer {
  height: 140rpx;
}
</style>
