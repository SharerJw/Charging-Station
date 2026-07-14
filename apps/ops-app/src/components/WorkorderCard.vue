<template>
  <!-- WorkorderCard 组件 (ops-app) -->
  <!-- 功能: 工单列表卡片（类型/优先级/状态/操作） -->
  <view class="workorder-card">
    <view class="workorder-header">
      <text class="workorder-no">{{ orderNo }}</text>
      <view class="workorder-priority" :class="priority">{{ priorityLabels[priority] }}</view>
    </view>
    <view class="workorder-type">
      <text class="type-tag" :class="type">{{ typeLabels[type] }}</text>
      <text class="workorder-status" :class="status">{{ statusLabels[status] }}</text>
    </view>
    <text class="workorder-title">{{ title }}</text>
    <view class="workorder-meta">
      <text class="meta-item">📍 {{ station }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  orderNo: string
  type: string
  title: string
  station: string
  priority: string
  status: string
}>()

const typeLabels: Record<string, string> = { repair: '维修', maintenance: '保养', inspection: '巡检' }
const priorityLabels: Record<string, string> = { high: '高', medium: '中', low: '低' }
const statusLabels: Record<string, string> = { pending: '待处理', accepted: '已接单', completed: '已完成', closed: '已关闭' }
</script>

<style scoped>
.workorder-card { background: #fff; border-radius: 12rpx; padding: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.workorder-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.workorder-no { font-size: 22rpx; color: #999; font-family: monospace; }
.workorder-priority { font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 4rpx; font-weight: bold; }
.workorder-priority.high { background: #FFCCC7; color: #CF1322; }
.workorder-priority.medium { background: #FFF7E6; color: #D48806; }
.workorder-priority.low { background: #E6F7FF; color: #1677FF; }
.workorder-type { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.type-tag { font-size: 20rpx; padding: 2rpx 8rpx; border-radius: 4rpx; background: #F5F5F5; color: #666; }
.type-tag.repair { background: #FFF2F0; color: #FF4D4F; }
.type-tag.maintenance { background: #E6F7FF; color: #1677FF; }
.workorder-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 4rpx; }
.workorder-status.pending { background: #FFF7E6; color: #D48806; }
.workorder-status.accepted { background: #E6F7FF; color: #1677FF; }
.workorder-status.completed { background: #F6FFED; color: #52C41A; }
.workorder-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.workorder-meta { margin-top: 8rpx; }
.meta-item { font-size: 22rpx; color: #999; }
</style>
