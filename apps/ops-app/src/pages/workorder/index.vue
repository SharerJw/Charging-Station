<template>
  <view class="workorder-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input class="search-input" placeholder="搜索工单标题、站点、设备" v-model="keyword" @confirm="loadWorkorders" />
      <view class="search-btn" @tap="loadWorkorders">
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
    <Skeleton v-if="loading" variant="card" :rows="4" />

    <!-- 工单列表 -->
    <view class="workorder-list" v-else-if="workorders.length > 0">
      <WorkorderCard
        v-for="order in workorders"
        :key="order.id"
        :order-id="order.orderNo"
        :title="order.title"
        :priority="order.priority || 'medium'"
        :status="order.status"
        :station-name="order.stationName"
        :assignee="order.assignee"
        :deadline="order.deadline"
        @click="goToDetail(order.id)"
      >
        <template #footer>
          <view class="workorder-footer">
            <text class="workorder-time">创建: {{ order.createTime }}</text>
            <view class="workorder-actions">
              <button v-if="order.status === 'pending'" class="action-btn primary" size="mini" @tap.stop="acceptOrder(order)">接单</button>
              <button v-else-if="order.status === 'accepted'" class="action-btn success" size="mini" @tap.stop="completeOrder(order)">完成</button>
              <button v-else-if="order.status === 'completed'" class="action-btn" size="mini" disabled>已完成</button>
              <button v-else class="action-btn" size="mini" disabled>{{ statusLabels[order.status] }}</button>
            </view>
          </view>
          <view class="workorder-result" v-if="order.result">
            <text class="result-label">处理结果:</text>
            <text class="result-text">{{ order.result }}</text>
          </view>
        </template>
      </WorkorderCard>
    </view>

    <!-- 空状态 -->
    <EmptyState
      v-else
      icon="📋"
      title="暂无工单"
      description="当前没有符合条件的工单"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import { useWorkorderStore } from '@/store/workorder'
import WorkorderCard from '@/components/WorkorderCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import Skeleton from '@/components/Skeleton.vue'
import type { WorkOrder } from '@/types'

const workorderStore = useWorkorderStore()
const currentTab = ref('all')
const workorders = ref<WorkOrder[]>([])
const loading = ref(false)
const keyword = ref('')

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'accepted' },
  { label: '已完成', value: 'completed' },
]

const statusLabels: Record<string, string> = {
  pending: '待处理',
  accepted: '已接单',
  processing: '处理中',
  completed: '已完成',
  closed: '已关闭',
}

async function loadWorkorders() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (currentTab.value !== 'all') {
      params.status = currentTab.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    const result = await api.getWorkorders(params)
    workorders.value = result?.list || result || []
    // 同步到 store
    workorderStore.workorders = workorders.value
  } catch (error) {
    uni.showToast({ title: '加载工单失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function switchTab(tab: string) {
  currentTab.value = tab
  loadWorkorders()
}

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/workorder-detail/index?id=${id}` })
}

function acceptOrder(order: WorkOrder) {
  uni.showModal({
    title: '接单确认',
    content: `确定要接受工单「${order.title}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.acceptWorkorder(order.id)
          uni.showToast({ title: '接单成功', icon: 'success' })
          loadWorkorders()
        } catch (error) {
          uni.showToast({ title: '接单失败', icon: 'none' })
        }
      }
    }
  })
}

function completeOrder(order: WorkOrder) {
  uni.showModal({
    title: `完成工单：${order.title}`,
    editable: true,
    placeholderText: '请输入处理结果（选填）',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.completeWorkorder(order.id, { result: res.content || '已完成' })
          uni.showToast({ title: '工单已完成', icon: 'success' })
          loadWorkorders()
        } catch (error) {
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(() => {
  loadWorkorders()
})
</script>

<style scoped>
.workorder-page {
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
  gap: 32rpx;
  margin-bottom: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
}

.tab {
  font-size: 26rpx;
  color: #666;
  padding-bottom: 8rpx;
}

.tab.active {
  color: #1677FF;
  border-bottom: 4rpx solid #1677FF;
  font-weight: bold;
}

.workorder-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.workorder-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.workorder-time {
  font-size: 22rpx;
  color: #999;
}

.workorder-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  font-size: 24rpx;
  border-radius: 8rpx;
  padding: 8rpx 24rpx;
}

.action-btn.primary {
  background: #1677FF;
  color: #fff;
}

.action-btn.success {
  background: #52C41A;
  color: #fff;
}

.workorder-result {
  margin-top: 12rpx;
  padding: 12rpx;
  background: #F6FFED;
  border-radius: 8rpx;
}

.result-label {
  font-size: 22rpx;
  color: #666;
  display: block;
}

.result-text {
  font-size: 24rpx;
  color: #333;
  margin-top: 4rpx;
  display: block;
}
</style>
