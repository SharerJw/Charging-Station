<template>
  <!-- AlertCard 组件 (ops-app) -->
  <!-- 功能: 告警列表卡片（级别/标题/描述/状态/操作） -->
  <view class="alert-card">
    <view class="alert-header">
      <view class="alert-level" :class="level.toLowerCase()">{{ level }}</view>
      <text class="alert-status" :class="status">{{ statusLabels[status] }}</text>
    </view>
    <text class="alert-title">{{ title }}</text>
    <text class="alert-desc">{{ description }}</text>
    <view class="alert-meta">
      <text class="meta-item">📍 {{ stationName }}</text>
      <text class="meta-item">🕐 {{ createTime }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  level: string
  title: string
  description: string
  stationName: string
  status: string
  createTime: string
}>()

const statusLabels: Record<string, string> = {
  pending: '待处理', processing: '处理中', resolved: '已解决', ignored: '已忽略',
}
</script>

<style scoped>
.alert-card { background: #fff; border-radius: 12rpx; padding: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.alert-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.alert-level { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 4rpx; font-weight: bold; }
.alert-level.p0 { background: #FFCCC7; color: #CF1322; }
.alert-level.p1 { background: #FFE7BA; color: #D46B08; }
.alert-level.p2 { background: #FFF7E6; color: #D48806; }
.alert-level.p3 { background: #E6F7FF; color: #1677FF; }
.alert-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 4rpx; }
.alert-status.pending { background: #FFF7E6; color: #D48806; }
.alert-status.resolved { background: #F6FFED; color: #52C41A; }
.alert-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.alert-desc { font-size: 24rpx; color: #666; margin-top: 8rpx; display: block; line-height: 1.5; }
.alert-meta { display: flex; gap: 16rpx; margin-top: 12rpx; }
.meta-item { font-size: 22rpx; color: #999; }
</style>
