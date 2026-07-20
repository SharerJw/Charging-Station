<template>
  <view class="alert-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input class="search-input" placeholder="搜索告警标题、站点、设备" v-model="keyword" @confirm="loadAlerts" />
      <view class="search-btn" @tap="loadAlerts">
        <text class="search-btn-text">搜索</text>
      </view>
    </view>

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

    <!-- 加载状态 -->
    <Skeleton v-if="loading" variant="card" :rows="3" />

    <!-- 告警列表 -->
    <view class="alert-list" v-else-if="alerts.length > 0">
      <AlertCard
        v-for="alert in alerts"
        :key="alert.id"
        :level="alert.level"
        :status="alert.status"
        :title="alert.title"
        :description="alert.description"
        :station-name="alert.stationName"
        :device-code="alert.deviceCode"
        :time="alert.createTime"
        @click="goToDetail(alert.id)"
      >
        <template #footer>
          <view class="alert-actions" v-if="alert.status === 'pending'">
            <button class="action-btn primary" size="mini" @tap.stop="handleAlert(alert)">处理</button>
            <button class="action-btn outline" size="mini" @tap.stop="ignoreAlert(alert)">忽略</button>
          </view>
          <view class="alert-result" v-else-if="alert.status === 'resolved'">
            <text class="result-text">✅ {{ alert.handler }} - {{ alert.handleResult }}</text>
          </view>
        </template>
      </AlertCard>
    </view>

    <!-- 空状态 -->
    <EmptyState
      v-else
      icon="✅"
      title="暂无告警"
      description="当前没有符合条件的告警信息"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import { useAlertStore } from '@/store/alert'
import AlertCard from '@/components/AlertCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import Skeleton from '@/components/Skeleton.vue'
import type { Alert } from '@/types'

const alertStore = useAlertStore()
const currentTab = ref('all')
const alerts = ref<Alert[]>([])
const loading = ref(false)
const keyword = ref('')

const tabs = [
  { label: '全部', value: 'all' },
  { label: 'P0-紧急', value: 'P0' },
  { label: 'P1-严重', value: 'P1' },
  { label: 'P2-警告', value: 'P2' },
  { label: '待处理', value: 'pending' },
]

async function loadAlerts() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (currentTab.value === 'pending') {
      params.status = 'pending'
    } else if (currentTab.value !== 'all') {
      params.level = currentTab.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    const result = await api.getAlerts(params)
    alerts.value = result?.list || result || []
    // 同步到 store
    alertStore.alerts = alerts.value
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

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/alert-detail/index?id=${id}` })
}

function handleAlert(alert: Alert) {
  uni.showModal({
    title: `处理告警：${alert.title}`,
    editable: true,
    placeholderText: '请输入处理结果（选填）',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.handleAlert(alert.id, { result: res.content || '已处理' })
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
          await api.handleAlert(alert.id, { result: '已忽略' })
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

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.search-input {
  flex: 1;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
}

.search-btn {
  background: #1677FF;
  border-radius: 12rpx;
  padding: 20rpx 32rpx;
  display: flex;
  align-items: center;
}

.search-btn-text {
  color: #fff;
  font-size: 28rpx;
  white-space: nowrap;
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

.alert-actions {
  display: flex;
  gap: 16rpx;
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
  padding-top: 4rpx;
}

.result-text {
  font-size: 24rpx;
  color: #52C41A;
}
</style>
