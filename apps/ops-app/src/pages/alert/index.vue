<template>
  <view class="alert-page">
    <!-- 筛选标签 -->
    <view class="tabs">
      <text
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >{{ tab.label }}</text>
    </view>

    <!-- 告警列表 -->
    <view class="alert-list" v-if="alerts.length > 0">
      <view class="alert-card" v-for="alert in alerts" :key="alert.id">
        <view class="alert-header">
          <view class="alert-level" :class="alert.level.toLowerCase()">{{ alert.level }}</view>
          <text class="alert-status" :class="alert.status">
            {{ statusLabels[alert.status] }}
          </text>
        </view>
        <text class="alert-title">{{ alert.title }}</text>
        <text class="alert-desc">{{ alert.description }}</text>
        <view class="alert-meta">
          <text class="meta-item">📍 {{ alert.stationName }}</text>
          <text class="meta-item">🔧 {{ alert.deviceCode }}</text>
          <text class="meta-item">🕐 {{ alert.createTime }}</text>
        </view>
        <view class="alert-actions" v-if="alert.status === 'pending'">
          <button class="action-btn primary" size="mini" @tap="handleAlert(alert)">处理</button>
          <button class="action-btn outline" size="mini" @tap="ignoreAlert(alert)">忽略</button>
        </view>
        <view class="alert-result" v-if="alert.status === 'resolved'">
          <text class="result-text">✅ {{ alert.handler }} - {{ alert.handleResult }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">✅</text>
      <text class="empty-text">暂无告警</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { mockOpsApi, type Alert } from '@/api/mock'

const currentTab = ref('all')
const alerts = ref<Alert[]>([])
const loading = ref(false)

const tabs = [
  { label: '全部', value: 'all' },
  { label: 'P0-紧急', value: 'P0' },
  { label: 'P1-严重', value: 'P1' },
  { label: 'P2-警告', value: 'P2' },
  { label: '待处理', value: 'pending' },
]

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  ignored: '已忽略',
}

async function loadAlerts() {
  loading.value = true
  try {
    const params: any = {}
    if (currentTab.value === 'pending') {
      params.status = 'pending'
    } else if (currentTab.value !== 'all') {
      params.level = currentTab.value
    }
    alerts.value = await mockOpsApi.getAlerts(params)
  } catch (error) {
    uni.showToast({ title: '加载告警失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function switchTab(tab: string) {
  currentTab.value = tab
  loadAlerts()
}

function handleAlert(alert: Alert) {
  uni.showModal({
    title: `处理告警：${alert.title}`,
    editable: true,
    placeholderText: '请输入处理结果（选填）',
    success: async (res) => {
      if (res.confirm) {
        try {
          await mockOpsApi.handleAlert(alert.id, { result: res.content || '已处理' })
          uni.showToast({ title: '处理成功', icon: 'success' })
          loadAlerts()
        } catch (error) {
          uni.showToast({ title: '处理失败', icon: 'none' })
        }
      }
    }
  })
}

function ignoreAlert(alert: Alert) {
  uni.showModal({
    title: '忽略告警',
    content: `确定要忽略告警「${alert.title}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await mockOpsApi.ignoreAlert(alert.id)
          uni.showToast({ title: '已忽略', icon: 'success' })
          loadAlerts()
        } catch (error) {
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(() => {
  loadAlerts()
})
</script>

<style scoped>
.alert-page {
  padding: 24rpx;
  background: #F0F2F5;
  min-height: 100vh;
}

.tabs {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.tab {
  font-size: 26rpx;
  color: #666;
  padding-bottom: 8rpx;
  flex-shrink: 0;
}

.tab.active {
  color: #1677FF;
  border-bottom: 4rpx solid #1677FF;
  font-weight: bold;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.alert-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.alert-level {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
  font-weight: bold;
}

.alert-level.p0 { background: #FFCCC7; color: #CF1322; }
.alert-level.p1 { background: #FFE7BA; color: #D46B08; }
.alert-level.p2 { background: #FFF7E6; color: #D48806; }
.alert-level.p3 { background: #E6F7FF; color: #1677FF; }

.alert-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.alert-status.pending { background: #FFF7E6; color: #D48806; }
.alert-status.processing { background: #E6F7FF; color: #1677FF; }
.alert-status.resolved { background: #F6FFED; color: #52C41A; }
.alert-status.ignored { background: #F5F5F5; color: #999; }

.alert-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.alert-desc {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
  display: block;
  line-height: 1.5;
}

.alert-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 12rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #999;
}

.alert-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.action-btn {
  flex: 1;
  font-size: 24rpx;
  border-radius: 8rpx;
}

.action-btn.primary {
  background: #1677FF;
  color: #fff;
}

.action-btn.outline {
  background: #fff;
  color: #1677FF;
  border: 2rpx solid #1677FF;
}

.alert-result {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f5f5f5;
}

.result-text {
  font-size: 24rpx;
  color: #52C41A;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 16rpx; }
</style>
