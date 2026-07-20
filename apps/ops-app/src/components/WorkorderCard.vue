<template>
  <view class="workorder-card" @click="$emit('click')">
    <view class="card-header">
      <view class="wo-info">
        <text class="wo-id">{{ orderId }}</text>
        <view class="priority-badge" :class="[`priority-${priority}`]">
          <text class="priority-text">{{ priorityText }}</text>
        </view>
      </view>
      <view class="status-tag" :class="[`status-${status}`]">
        <text class="status-text">{{ statusText }}</text>
      </view>
    </view>
    <view class="card-body">
      <text class="wo-title">{{ title }}</text>
      <view class="wo-meta">
        <text class="meta-item" v-if="stationName">
          <text class="meta-icon">📍</text> {{ stationName }}
        </text>
        <text class="meta-item" v-if="assignee">
          <text class="meta-icon">👤</text> {{ assignee }}
        </text>
        <text class="meta-item" v-if="deadline">
          <text class="meta-icon">⏰</text> {{ deadline }}
        </text>
      </view>
    </view>
    <view class="card-footer" v-if="$slots.footer">
      <slot name="footer" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  orderId: string
  title: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'pending' | 'accepted' | 'processing' | 'completed' | 'closed'
  stationName?: string
  assignee?: string
  deadline?: string
}>()

defineEmits<{
  click: []
}>()

const priorityText = computed(() => {
  const map: Record<string, string> = { urgent: '紧急', high: '高', medium: '中', low: '低' }
  return map[props.priority] || props.priority
})

const statusText = computed(() => {
  const map: Record<string, string> = {
    pending: '待接单',
    accepted: '已接单',
    processing: '处理中',
    completed: '已完成',
    closed: '已关闭',
  }
  return map[props.status] || props.status
})
</script>

<style scoped>
.workorder-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.wo-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.wo-id {
  font-size: 26rpx;
  font-weight: 600;
  color: #262626;
}

.priority-badge {
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
}
.priority-urgent { background: #FFF1F0; }
.priority-high { background: #FFF7E6; }
.priority-medium { background: #E6F4FF; }
.priority-low { background: #F6FFED; }
.priority-text { font-size: 20rpx; font-weight: 500; }
.priority-urgent .priority-text { color: #FF4D4F; }
.priority-high .priority-text { color: #FA8C16; }
.priority-medium .priority-text { color: #1677FF; }
.priority-low .priority-text { color: #52C41A; }

.status-tag {
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}
.status-pending { background: #FFF7E6; }
.status-accepted { background: #E6F4FF; }
.status-processing { background: #F0F5FF; }
.status-completed { background: #F6FFED; }
.status-closed { background: #F5F5F5; }
.status-text { font-size: 22rpx; }
.status-pending .status-text { color: #FA8C16; }
.status-accepted .status-text { color: #1677FF; }
.status-processing .status-text { color: #2F54EB; }
.status-completed .status-text { color: #52C41A; }
.status-closed .status-text { color: #8C8C8C; }

.wo-title {
  font-size: 28rpx;
  color: #262626;
  display: block;
  margin-bottom: 12rpx;
}

.wo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.meta-item {
  font-size: 22rpx;
  color: #8C8C8C;
}
.meta-icon {
  margin-right: 4rpx;
}

.card-footer {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}
</style>
