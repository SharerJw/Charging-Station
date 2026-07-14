<template>
  <!-- OrderCard 组件 (user-miniapp) -->
  <!-- 功能: 订单列表卡片 -->
  <view class="order-card">
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
</template>

<script setup lang="ts">
defineProps<{
  order: { orderNo: string; stationName: string; status: string; consumedEnergy: number; totalAmount: number; startTime: string }
}>()

const statusLabels: Record<string, string> = {
  charging: '充电中', completed: '已完成', refunded: '已退款', abnormal: '异常',
}
</script>

<style scoped>
.order-card { background: #fff; border-radius: 12rpx; padding: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.order-header { display: flex; justify-content: space-between; align-items: center; }
.station-name { font-size: 28rpx; font-weight: bold; color: #333; }
.order-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 4rpx; }
.order-status.charging { background: #E6F7FF; color: #1677FF; }
.order-status.completed { background: #F6FFED; color: #52C41A; }
.order-status.refunded { background: #FFF7E6; color: #FAAD14; }
.order-status.abnormal { background: #FFF2F0; color: #FF4D4F; }
.order-info { display: flex; gap: 24rpx; margin-top: 12rpx; }
.info-text { font-size: 24rpx; color: #999; }
.order-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; padding-top: 12rpx; border-top: 1rpx solid #f5f5f5; }
.order-no { font-size: 22rpx; color: #999; }
.amount { font-size: 32rpx; font-weight: bold; color: #FF4D4F; }
</style>
