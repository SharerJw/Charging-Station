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
      <text class="section-title">最近告警</text>
      <view class="alert-list">
        <view class="alert-item" v-for="alert in recentAlerts" :key="alert.id" @tap="navigateTo('/pages/alert/index')">
          <view class="alert-level" :class="alert.level?.toLowerCase()">{{ alert.level }}</view>
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
import { api } from '@/api'

interface OpsStats {
  onlineDevices: number
  pendingAlerts: number
  pendingWorkorders: number
  todayInspections: number
  completedInspections: number
}

interface Alert {
  id: string
  level: string
  title: string
  stationName: string
  deviceCode: string
  createTime: string
}

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

function navigateTo(url: string) {
  uni.navigateTo({ url })
}

onMounted(async () => {
  try {
    // 并行获取告警、工单、巡检、设备统计
    const token = uni.getStorageSync('ops_token')
    const [alerts, workorders, inspections, deviceStats] = await Promise.all([
      api.getAlerts({ page: 1, size: 3 }).catch(() => ({ list: [] })),
      api.getWorkorders({ page: 1, size: 100 }).catch(() => ({ list: [] })),
      api.getInspections().catch(() => ({ list: [] })),
      // 通过网关获取设备统计
      uni.request({
        url: 'http://localhost:8080/internal/stats',
        header: { Authorization: `Bearer ${token}` }
      }).then(res => res.data?.data || { onlineDeviceCount: 0 }).catch(() => ({ onlineDeviceCount: 0 })),
    ])

    recentAlerts.value = alerts?.list || alerts || []

    const workorderList = workorders?.list || workorders || []
    const inspectionList = inspections?.list || inspections || []

    stats.value = {
      onlineDevices: deviceStats?.onlineDeviceCount || 0,
      pendingAlerts: recentAlerts.value.filter(a => a.status === 'pending').length,
      pendingWorkorders: workorderList.filter(w => w.status === 'pending').length,
      todayInspections: inspectionList.length,
      completedInspections: inspectionList.filter(i => i.status === 'completed').length,
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})
</script>

<style scoped>
.workbench-page {
  padding: 16px;
  background: #f5f7fa;
  min-height: 100vh;
}

.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-card.warning {
  border: 1px solid #ff4d4f;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1677ff;
  display: block;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  display: block;
}

.section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  display: block;
}

.inspection-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1677ff;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
}

.action-item:hover {
  background: #e6f7ff;
}

.action-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.action-label {
  font-size: 12px;
  color: #333;
}

.action-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
}

.alert-item:hover {
  background: #fff7e6;
}

.alert-level {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  min-width: 32px;
  text-align: center;
}

.alert-level.p0 { background: #ff4d4f; color: #fff; }
.alert-level.p1 { background: #faad14; color: #fff; }
.alert-level.p2 { background: #1677ff; color: #fff; }
.alert-level.p3 { background: #999; color: #fff; }

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-size: 14px;
  color: #333;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-desc {
  font-size: 12px;
  color: #999;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}
</style>
