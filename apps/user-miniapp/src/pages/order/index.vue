<template>
  <view class="order-page">
    <!-- 状态标签 -->
    <view class="tabs">
      <text
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >{{ tab.label }}</text>
    </view>

    <!-- 订单列表 -->
    <view class="order-list" v-if="orders.length > 0">
      <view class="order-card" v-for="order in orders" :key="order.id" @tap="viewOrder(order.id)">
        <view class="order-header">
          <text class="station-name">{{ order.stationName }}</text>
          <text class="order-status" :class="order.status">{{ statusLabels[order.status] }}</text>
        </view>
        <view class="order-info">
          <text class="info-text">{{ order.startTime }}</text>
          <text class="info-text">{{ order.consumedEnergy }} kWh</text>
        </view>
        <view class="order-footer">
          <text class="order-no">{{ order.orderNo }}</text>
          <text class="amount">¥{{ order.totalAmount.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无订单</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { mockApi, type Order } from '@/api/mock'

const currentTab = ref('all')
const orders = ref<Order[]>([])
const loading = ref(false)

const tabs = [
  { label: '全部', value: 'all' },
  { label: '充电中', value: 'charging' },
  { label: '已完成', value: 'completed' },
  { label: '已退款', value: 'refunded' },
]

const statusLabels: Record<string, string> = {
  charging: '充电中',
  completed: '已完成',
  refunded: '已退款',
  abnormal: '异常',
}

async function loadOrders() {
  loading.value = true
  try {
    orders.value = await mockApi.getOrders({
      status: currentTab.value === 'all' ? undefined : currentTab.value,
    })
  } catch (error) {
    uni.showToast({ title: '加载订单失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function switchTab(tab: string) {
  currentTab.value = tab
  loadOrders()
}

function viewOrder(id: string) {
  // 显示订单详情（由于小程序页面结构限制，使用弹窗展示）
  const order = orders.value.find(o => o.id === id)
  if (order) {
    uni.showModal({
      title: order.orderNo,
      content: `充电站: ${order.stationName}\n电量: ${order.consumedEnergy} kWh\n金额: ¥${order.totalAmount.toFixed(2)}\n状态: ${statusLabels[order.status]}`,
      showCancel: false,
      confirmText: '知道了',
    })
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-page {
  padding: 24rpx;
  background: #F6F7FB;
  min-height: 100vh;
}

.tabs {
  display: flex;
  gap: 32rpx;
  margin-bottom: 24rpx;
  padding: 0 8rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
}

.tab {
  font-size: 28rpx;
  color: #666;
  padding-bottom: 8rpx;
  position: relative;
}

.tab.active {
  color: #07C160;
  font-weight: bold;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: #07C160;
  border-radius: 2rpx;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.order-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.station-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.order-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.order-status.charging { background: #E6F7FF; color: #1677FF; }
.order-status.completed { background: #F6FFED; color: #52C41A; }
.order-status.refunded { background: #FFF7E6; color: #FAAD14; }
.order-status.abnormal { background: #FFF2F0; color: #FF4D4F; }

.order-info {
  display: flex;
  gap: 24rpx;
  margin-top: 12rpx;
}

.info-text {
  font-size: 24rpx;
  color: #999;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f5f5f5;
}

.order-no {
  font-size: 22rpx;
  color: #999;
}

.amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #FF4D4F;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
