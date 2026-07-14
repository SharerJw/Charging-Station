<template>
  <view class="workbench-page">
    <!-- 顶部统计 -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-value">{{ stats.onlineDevices }}</text>
        <text class="stat-label">在线设备</text>
      </view>
      <view class="stat-card" :class="{ warning: stats.pendingAlerts > 0 }">
        <text class="stat-value">{{ stats.pendingAlerts }}</text>
        <text class="stat-label">待处理告警</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.pendingWorkorders }}</text>
        <text class="stat-label">待办工单</text>
      </view>
    </view>

    <!-- 巡检进度 -->
    <view class="section">
      <text class="section-title">今日巡检</text>
      <view class="inspection-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: inspectionProgress + '%' }"></view>
        </view>
        <text class="progress-text">已完成 {{ stats.completedInspections }}/{{ stats.todayInspections }}</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="section">
      <text class="section-title">快捷操作</text>
      <view class="action-grid">
        <view class="action-item" @tap="navigateTo('/pages/station/index')">
          <text class="action-icon">🏭</text>
          <text class="action-label">充电站</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/alert/index')">
          <text class="action-icon">⚠️</text>
          <text class="action-label">告警</text>
          <text class="action-badge" v-if="stats.pendingAlerts > 0">{{ stats.pendingAlerts }}</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/workorder/index')">
          <text class="action-icon">📋</text>
          <text class="action-label">工单</text>
          <text class="action-badge" v-if="stats.pendingWorkorders > 0">{{ stats.pendingWorkorders }}</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/inspection/index')">
          <text class="action-icon">🔍</text>
          <text class="action-label">巡检</text>
        </view>
      </view>
    </view>

    <!-- 最近告警 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">最近告警</text>
        <text class="section-more" @tap="navigateTo('/pages/alert/index')">查看全部 ›</text>
      </view>
      <view class="alert-list">
        <view class="alert-item" v-for="alert in recentAlerts" :key="alert.id" @tap="navigateTo('/pages/alert/index')">
          <view class="alert-level" :class="alert.level.toLowerCase()">{{ alert.level }}</view>
          <view class="alert-content">
            <text class="alert-title">{{ alert.title }}</text>
            <text class="alert-desc">{{ alert.stationName }} - {{ alert.deviceCode }}</text>
          </view>
          <text class="alert-time">{{ formatTime(alert.createTime) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { mockOpsApi, type OpsStats, type Alert } from '@/api/mock'

const stats = ref<OpsStats>({
  onlineDevices: 0,
  pendingAlerts: 0,
  pendingWorkorders: 0,
  todayInspections: 0,
  completedInspections: 0,
})

const recentAlerts = ref<Alert[]>([])

const inspectionProgress = computed(() => {
  if (stats.value.todayInspections === 0) return 0
  return (stats.value.completedInspections / stats.value.todayInspections) * 100
})

function formatTime(time: string): string {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  try {
    const [s, alerts] = await Promise.all([
      mockOpsApi.getStats(),
      mockOpsApi.getAlerts(),
    ])
    stats.value = s
    recentAlerts.value = alerts.slice(0, 3)
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})

const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.workbench-page {
  padding: 24rpx;
  background: #F0F2F5;
  min-height: 100vh;
}

.stats-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.stat-card.warning {
  background: #FFF7E6;
  border: 2rpx solid #FAAD14;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #1677FF;
  display: block;
}

.stat-card.warning .stat-value { color: #FAAD14; }

.stat-label {
  font-size: 22rpx;
  color: #666;
  margin-top: 8rpx;
  display: block;
}

.section {
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.section-more {
  font-size: 24rpx;
  color: #1677FF;
}

.inspection-progress {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
}

.progress-bar {
  height: 16rpx;
  background: #E8E8E8;
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1677FF, #4096FF);
  border-radius: 8rpx;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 24rpx;
  color: #666;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.action-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx 12rpx;
  text-align: center;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.action-icon { font-size: 48rpx; display: block; }
.action-label { font-size: 22rpx; color: #333; margin-top: 8rpx; display: block; }

.action-badge {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  background: #FF4D4F;
  color: #fff;
  font-size: 18rpx;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  border-radius: 16rpx;
  text-align: center;
  padding: 0 8rpx;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
}

.alert-level {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  font-weight: bold;
  flex-shrink: 0;
}

.alert-level.p0 { background: #FFCCC7; color: #CF1322; }
.alert-level.p1 { background: #FFE7BA; color: #D46B08; }
.alert-level.p2 { background: #FFF7E6; color: #D48806; }
.alert-level.p3 { background: #E6F7FF; color: #1677FF; }

.alert-content { flex: 1; min-width: 0; }
.alert-title { font-size: 26rpx; color: #333; display: block; }
.alert-desc { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.alert-time { font-size: 22rpx; color: #999; flex-shrink: 0; }
</style>
