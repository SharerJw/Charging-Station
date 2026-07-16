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
        <view class="action-item" @tap="navigateTo('/pages/inspection/index')">
          <text class="action-icon">🔍</text>
          <text class="action-label">巡检</text>
        </view>
      </view>
    </view>

    <!-- 最近告警 -->
    <view class="section">
      <text class="section-title">最近告警</text>
      <!-- 告警级别筛选 -->
      <view class="alert-filter">
        <text
          v-for="f in alertFilters"
          :key="f.value"
          class="filter-tag"
          :class="{ active: alertFilterLevel === f.value }"
          @tap="changeAlertFilter(f.value)"
        >{{ f.label }}</text>
      </view>
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
      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMoreAlerts" @tap="loadMoreAlerts">
        <text class="load-more-text">{{ loadingAlerts ? '加载中...' : '加载更多' }}</text>
      </view>
      <view class="no-more" v-else-if="recentAlerts.length > 0">
        <text class="no-more-text">—— 没有更多了 ——</text>
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
  status: string
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
const alertPage = ref(1)
const alertPageSize = 10
const hasMoreAlerts = ref(true)
const loadingAlerts = ref(false)
const alertFilterLevel = ref('all')

const alertFilters = [
  { label: '全部', value: 'all' },
  { label: 'P0', value: 'P0' },
  { label: 'P1', value: 'P1' },
  { label: 'P2', value: 'P2' },
  { label: 'P3', value: 'P3' },
]

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

async function loadAlerts(reset = false) {
  if (loadingAlerts.value) return
  if (reset) {
    alertPage.value = 1
    recentAlerts.value = []
    hasMoreAlerts.value = true
  }
  loadingAlerts.value = true
  try {
    const params: any = { page: alertPage.value, size: alertPageSize }
    if (alertFilterLevel.value !== 'all') {
      params.level = alertFilterLevel.value
    }
    const result = await api.getAlerts(params)
    const list = result?.list || result || []
    if (reset) {
      recentAlerts.value = list
    } else {
      recentAlerts.value.push(...list)
    }
    if (list.length < alertPageSize) {
      hasMoreAlerts.value = false
    }
  } catch (error) {
    console.error('加载告警失败:', error)
  } finally {
    loadingAlerts.value = false
  }
}

function loadMoreAlerts() {
  if (!hasMoreAlerts.value || loadingAlerts.value) return
  alertPage.value++
  loadAlerts()
}

function changeAlertFilter(level: string) {
  alertFilterLevel.value = level
  loadAlerts(true)
}

onMounted(async () => {
  try {
    // 并行获取设备统计
    const token = uni.getStorageSync('ops_token')
    const deviceStats = await uni.request({
      url: 'http://localhost:8080/internal/stats',
      header: { Authorization: `Bearer ${token}` }
    }).then(res => res.data?.data || { onlineDeviceCount: 0 }).catch(() => ({ onlineDeviceCount: 0 }))

    // 获取工单和巡检统计
    const [workorders, inspections] = await Promise.all([
      api.getWorkorders({ page: 1, size: 100 }).catch(() => ({ list: [] })),
      api.getInspections().catch(() => ({ list: [] })),
    ])

    const workorderList = workorders?.list || workorders || []
    const inspectionList = inspections?.list || inspections || []

    stats.value = {
      onlineDevices: deviceStats?.onlineDeviceCount || 0,
      pendingAlerts: 0, // 将从告警接口获取
      pendingWorkorders: workorderList.filter((w: any) => w.status === 'pending').length,
      todayInspections: inspectionList.length,
      completedInspections: inspectionList.filter((i: any) => i.status === 'completed').length,
    }

    // 加载告警（先获取待处理数）
    await loadAlerts(true)
    // 获取待处理告警数量
    const pendingAlerts = await api.getAlerts({ status: 'pending', page: 1, size: 200 }).catch(() => [])
    const pendingList = (pendingAlerts as any)?.list || pendingAlerts || []
    stats.value.pendingAlerts = Array.isArray(pendingList) ? pendingList.length : 0
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
  grid-template-columns: repeat(2, 1fr);
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

.alert-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.filter-tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
}

.filter-tag.active {
  background: #1677ff;
  color: #fff;
}

.load-more {
  text-align: center;
  padding: 12px 0;
  cursor: pointer;
}

.load-more-text {
  font-size: 13px;
  color: #1677ff;
}

.no-more {
  text-align: center;
  padding: 12px 0;
}

.no-more-text {
  font-size: 12px;
  color: #ccc;
}
</style>
