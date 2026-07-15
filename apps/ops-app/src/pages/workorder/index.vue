<template>
  <view class="workorder-page">
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

    <!-- 工单列表 -->
    <view class="workorder-list" v-if="workorders.length > 0">
      <view class="workorder-card" v-for="order in workorders" :key="order.id">
        <view class="workorder-header">
          <text class="workorder-id">{{ order.orderNo }}</text>
          <view class="workorder-priority" :class="order.priority">{{ priorityLabels[order.priority] }}</view>
        </view>
        <view class="workorder-type">
          <text class="type-tag" :class="order.type">{{ typeLabels[order.type] }}</text>
          <text class="workorder-status" :class="order.status">{{ statusLabels[order.status] }}</text>
        </view>
        <text class="workorder-title">{{ order.title }}</text>
        <text class="workorder-desc">{{ order.description }}</text>
        <view class="workorder-meta">
          <text class="meta-item">📍 {{ order.stationName }}</text>
          <text class="meta-item">🔧 {{ order.deviceCode }}</text>
        </view>
        <view class="workorder-footer">
          <text class="workorder-time">创建: {{ order.createTime }}</text>
          <view class="workorder-actions">
            <button v-if="order.status === 'pending'" class="action-btn primary" size="mini" @tap="acceptOrder(order)">接单</button>
            <button v-if="order.status === 'accepted'" class="action-btn success" size="mini" @tap="completeOrder(order)">完成</button>
            <button v-if="order.status === 'completed'" class="action-btn" size="mini" disabled>已完成</button>
          </view>
        </view>
        <view class="workorder-result" v-if="order.result">
          <text class="result-label">处理结果:</text>
          <text class="result-text">{{ order.result }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无工单</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'

interface WorkOrder {
  id: string
  orderNo: string
  type: string
  title: string
  description: string
  stationName: string
  deviceCode: string
  priority: string
  status: string
  creator: string
  assignee?: string
  result?: string
  createTime: string
}

const currentTab = ref('all')
const workorders = ref<WorkOrder[]>([])
const loading = ref(false)

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

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const typeLabels: Record<string, string> = {
  repair: '维修',
  maintenance: '保养',
  inspection: '巡检',
}

async function loadWorkorders() {
  loading.value = true
  try {
    const result = await api.getWorkorders({
      status: currentTab.value === 'all' ? undefined : currentTab.value,
    })
    workorders.value = result?.list || result || []
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

.workorder-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.workorder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.workorder-id {
  font-size: 22rpx;
  color: #999;
  font-family: monospace;
}

.workorder-priority {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
  font-weight: bold;
}

.workorder-priority.high { background: #FFCCC7; color: #CF1322; }
.workorder-priority.medium { background: #FFF7E6; color: #D48806; }
.workorder-priority.low { background: #E6F7FF; color: #1677FF; }

.workorder-type {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.type-tag {
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  background: #F5F5F5;
  color: #666;
}

.type-tag.repair { background: #FFF2F0; color: #FF4D4F; }
.type-tag.maintenance { background: #E6F7FF; color: #1677FF; }
.type-tag.inspection { background: #F6FFED; color: #52C41A; }

.workorder-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.workorder-status.pending { background: #FFF7E6; color: #D48806; }
.workorder-status.accepted { background: #E6F7FF; color: #1677FF; }
.workorder-status.completed { background: #F6FFED; color: #52C41A; }

.workorder-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.workorder-desc {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
  display: block;
  line-height: 1.5;
}

.workorder-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 12rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #999;
}

.workorder-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 16rpx; }
</style>
