<template>
  <view class="alert-detail-page">
    <!-- 告警级别标签 -->
    <view class="level-banner" :class="alert.level">
      <view class="level-badge">
        <text class="level-text">{{ alert.level }}</text>
      </view>
      <text class="level-title">{{ alert.title }}</text>
    </view>

    <!-- 告警详情 -->
    <view class="info-section">
      <text class="section-title">告警信息</text>
      <view class="info-grid">
        <view class="info-row">
          <text class="info-label">告警编号</text>
          <text class="info-value">{{ alert.id }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">告警级别</text>
          <text class="info-value" :class="'level-' + alert.level">{{ levelLabel[alert.level] }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">告警来源</text>
          <text class="info-value">{{ alert.source }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">告警编码</text>
          <text class="info-value">{{ alert.code }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">充电站</text>
          <text class="info-value">{{ alert.stationName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">设备</text>
          <text class="info-value">{{ alert.deviceName }} ({{ alert.deviceCode }})</text>
        </view>
        <view class="info-row">
          <text class="info-label">触发时间</text>
          <text class="info-value">{{ alert.createTime }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">持续时间</text>
          <text class="info-value highlight">{{ alert.duration }}</text>
        </view>
        <view class="info-row" v-if="alert.status === 'resolved'">
          <text class="info-label">处理人</text>
          <text class="info-value">{{ alert.handler }}</text>
        </view>
        <view class="info-row full">
          <text class="info-label">告警描述</text>
          <text class="info-value-desc">{{ alert.description }}</text>
        </view>
      </view>
    </view>

    <!-- 设备状态快照 -->
    <view class="snapshot-section">
      <text class="section-title">设备状态快照</text>
      <view class="snapshot-grid">
        <view class="snapshot-item" v-for="(item, idx) in deviceSnapshot" :key="idx">
          <text class="snapshot-label">{{ item.label }}</text>
          <text class="snapshot-value" :class="{ abnormal: item.abnormal }">{{ item.value }}</text>
        </view>
      </view>
      <text class="snapshot-time">快照时间: {{ snapshotTime }}</text>
    </view>

    <!-- 同设备24h告警历史 -->
    <view class="history-section">
      <view class="section-header">
        <text class="section-title">同设备24h告警历史</text>
        <text class="history-count">共 {{ alertHistory.length }} 条</text>
      </view>
      <view class="history-timeline">
        <view class="history-item" v-for="(item, idx) in alertHistory" :key="idx">
          <view class="timeline-dot" :class="item.level"></view>
          <view class="timeline-line" v-if="idx < alertHistory.length - 1"></view>
          <view class="history-content">
            <view class="history-top">
              <view class="history-level-tag" :class="item.level">
                <text class="history-level-text">{{ item.level }}</text>
              </view>
              <text class="history-time">{{ item.createTime }}</text>
            </view>
            <text class="history-title">{{ item.title }}</text>
            <text class="history-status">{{ item.status === 'resolved' ? '已处理' : item.status === 'pending' ? '待处理' : '处理中' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-bar" v-if="alert.status === 'pending'">
      <button class="action-btn handle" @tap="handleAlert">
        <text class="action-btn-text">处理告警</text>
      </button>
      <button class="action-btn ignore" @tap="ignoreAlert">
        <text class="action-btn-text">忽略</text>
      </button>
      <button class="action-btn dispatch" @tap="dispatchAlert">
        <text class="action-btn-text">派单</text>
      </button>
    </view>

    <view class="action-bar" v-else-if="alert.status === 'handling'">
      <button class="action-btn handle full" @tap="resolveAlert">
        <text class="action-btn-text">完成处理</text>
      </button>
    </view>

    <view class="bottom-spacer"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'

interface SnapshotItem {
  label: string
  value: string
  abnormal: boolean
}

interface HistoryItem {
  id: string
  level: string
  title: string
  status: string
  createTime: string
}

const alertId = ref('')
const alert = ref<any>({
  id: '',
  level: 'P2',
  title: '',
  source: '',
  code: '',
  stationName: '',
  deviceName: '',
  deviceCode: '',
  createTime: '',
  duration: '',
  description: '',
  status: 'pending',
  handler: '',
})

const deviceSnapshot = ref<SnapshotItem[]>([])
const snapshotTime = ref('')
const alertHistory = ref<HistoryItem[]>([])

const levelLabel: Record<string, string> = {
  P0: '紧急',
  P1: '严重',
  P2: '警告',
  P3: '提示',
}

function handleAlert() {
  uni.showModal({
    title: '确认处理',
    content: '是否确认处理该告警？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.handleAlert(alertId.value, { action: 'handle' })
          uni.showToast({ title: '已开始处理', icon: 'success' })
          loadDetail()
        } catch (e: any) {
          uni.showToast({ title: e.message || '操作失败', icon: 'none' })
        }
      }
    },
  })
}

function ignoreAlert() {
  uni.showModal({
    title: '确认忽略',
    content: '忽略后该告警将不再提醒，是否继续？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.handleAlert(alertId.value, { action: 'ignore' })
          uni.showToast({ title: '已忽略', icon: 'success' })
          loadDetail()
        } catch (e: any) {
          uni.showToast({ title: e.message || '操作失败', icon: 'none' })
        }
      }
    },
  })
}

function dispatchAlert() {
  uni.navigateTo({ url: `/pages/dispatch/index?alertId=${alertId.value}` })
}

async function resolveAlert() {
  uni.showModal({
    title: '完成处理',
    content: '请确认告警已解决',
    editable: true,
    placeholderText: '请输入处理说明',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        try {
          await api.handleAlert(alertId.value, {
            action: 'resolve',
            result: modalRes.content || '',
          })
          uni.showToast({ title: '处理完成', icon: 'success' })
          loadDetail()
        } catch (e: any) {
          uni.showToast({ title: e.message || '操作失败', icon: 'none' })
        }
      }
    },
  })
}

async function loadDetail() {
  try {
    const data = await api.getAlertDetail(alertId.value)
    alert.value = data.alert
    deviceSnapshot.value = data.snapshot.items
    snapshotTime.value = data.snapshot.time
    alertHistory.value = data.history
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as any
  alertId.value = current?.options?.id || ''
  if (alertId.value) {
    loadDetail()
  }
})
</script>

<style scoped>
.alert-detail-page {
  background: #F0F2F5;
  min-height: 100vh;
}

.level-banner {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 28rpx 32rpx;
}

.level-banner.P0 {
  background: linear-gradient(135deg, #FF4D4F 0%, #cf1322 100%);
}

.level-banner.P1 {
  background: linear-gradient(135deg, #FA8C16 0%, #d46b08 100%);
}

.level-banner.P2 {
  background: linear-gradient(135deg, #FAAD14 0%, #d48806 100%);
}

.level-banner.P3 {
  background: linear-gradient(135deg, #1677FF 0%, #0958d9 100%);
}

.level-badge {
  padding: 8rpx 20rpx;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 8rpx;
}

.level-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
}

.level-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.info-section,
.snapshot-section,
.history-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-header .section-title {
  margin-bottom: 0;
}

.history-count {
  font-size: 24rpx;
  color: #999;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #fafafa;
}

.info-row.full {
  flex-direction: column;
  gap: 8rpx;
}

.info-label {
  font-size: 26rpx;
  color: #999;
  min-width: 140rpx;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  text-align: right;
  flex: 1;
}

.info-value.level-P0 {
  color: #FF4D4F;
  font-weight: 600;
}

.info-value.level-P1 {
  color: #FA8C16;
  font-weight: 600;
}

.info-value.level-P2 {
  color: #FAAD14;
  font-weight: 600;
}

.info-value.level-P3 {
  color: #1677FF;
  font-weight: 600;
}

.info-value.highlight {
  color: #FF4D4F;
  font-weight: 600;
}

.info-value-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.snapshot-item {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 16rpx;
  background: #f7f8fa;
  border-radius: 10rpx;
}

.snapshot-label {
  font-size: 22rpx;
  color: #999;
}

.snapshot-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.snapshot-value.abnormal {
  color: #FF4D4F;
}

.snapshot-time {
  font-size: 22rpx;
  color: #bbb;
  margin-top: 16rpx;
  display: block;
}

.history-timeline {
  padding-left: 16rpx;
}

.history-item {
  position: relative;
  padding-left: 32rpx;
  padding-bottom: 28rpx;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 8rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #d9d9d9;
}

.timeline-dot.P0 {
  background: #FF4D4F;
}

.timeline-dot.P1 {
  background: #FA8C16;
}

.timeline-dot.P2 {
  background: #FAAD14;
}

.timeline-dot.P3 {
  background: #1677FF;
}

.timeline-line {
  position: absolute;
  left: 7rpx;
  top: 28rpx;
  bottom: 0;
  width: 2rpx;
  background: #e8e8e8;
}

.history-content {
  background: #f7f8fa;
  border-radius: 10rpx;
  padding: 16rpx 20rpx;
}

.history-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.history-level-tag {
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
}

.history-level-tag.P0 {
  background: #fff2f0;
}

.history-level-tag.P1 {
  background: #fff7e6;
}

.history-level-tag.P2 {
  background: #fffbe6;
}

.history-level-tag.P3 {
  background: #e6f4ff;
}

.history-level-text {
  font-size: 20rpx;
  color: #666;
}

.history-time {
  font-size: 22rpx;
  color: #bbb;
}

.history-title {
  font-size: 26rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.history-status {
  font-size: 22rpx;
  color: #999;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 16rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.full {
  flex: 1;
}

.action-btn.handle {
  background: #1677FF;
}

.action-btn.ignore {
  background: #fff;
  border: 2rpx solid #d9d9d9;
}

.action-btn.dispatch {
  background: #52C41A;
}

.action-btn-text {
  font-size: 28rpx;
  color: #fff;
}

.action-btn.ignore .action-btn-text {
  color: #666;
}

.bottom-spacer {
  height: 140rpx;
}
</style>
