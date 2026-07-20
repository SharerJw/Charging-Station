<template>
  <view class="alert-card" :class="[`level-${level}`]" @click="$emit('click')">
    <view class="card-header">
      <view class="level-badge" :class="[`badge-${level}`]">
        <text class="badge-text">{{ levelText }}</text>
      </view>
      <view class="status-tag" :class="[`status-${status}`]">
        <text class="status-text">{{ statusText }}</text>
      </view>
    </view>
    <view class="card-body">
      <text class="alert-title">{{ title }}</text>
      <text class="alert-desc" v-if="description">{{ description }}</text>
      <view class="alert-meta">
        <text class="meta-item" v-if="stationName">
          <text class="meta-icon">📍</text> {{ stationName }}
        </text>
        <text class="meta-item" v-if="deviceCode">
          <text class="meta-icon">⚡</text> {{ deviceCode }}
        </text>
        <text class="meta-item" v-if="time">
          <text class="meta-icon">🕐</text> {{ time }}
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
  level: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'pending' | 'processing' | 'resolved' | 'ignored'
  title: string
  description?: string
  stationName?: string
  deviceCode?: string
  time?: string
}>()

defineEmits<{
  click: []
}>()

const levelText = computed(() => {
  const map: Record<string, string> = { P0: '紧急', P1: '严重', P2: '一般', P3: '提示' }
  return map[props.level] || props.level
})

const statusText = computed(() => {
  const map: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决', ignored: '已忽略' }
  return map[props.status] || props.status
})
</script>

<style scoped>
.alert-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  border-left: 6rpx solid #ccc;
}
.level-P0 { border-left-color: #FF4D4F; }
.level-P1 { border-left-color: #FAAD14; }
.level-P2 { border-left-color: #1677FF; }
.level-P3 { border-left-color: #52C41A; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.level-badge {
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}
.badge-P0 { background: #FFF1F0; }
.badge-P1 { background: #FFFBE6; }
.badge-P2 { background: #E6F4FF; }
.badge-P3 { background: #F6FFED; }
.badge-text { font-size: 22rpx; font-weight: 600; }
.badge-P0 .badge-text { color: #FF4D4F; }
.badge-P1 .badge-text { color: #FAAD14; }
.badge-P2 .badge-text { color: #1677FF; }
.badge-P3 .badge-text { color: #52C41A; }

.status-tag {
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}
.status-pending { background: #FFF7E6; }
.status-processing { background: #E6F4FF; }
.status-resolved { background: #F6FFED; }
.status-ignored { background: #F5F5F5; }
.status-text { font-size: 22rpx; }
.status-pending .status-text { color: #FA8C16; }
.status-processing .status-text { color: #1677FF; }
.status-resolved .status-text { color: #52C41A; }
.status-ignored .status-text { color: #8C8C8C; }

.alert-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #262626;
  display: block;
  margin-bottom: 8rpx;
}
.alert-desc {
  font-size: 24rpx;
  color: #8C8C8C;
  display: block;
  margin-bottom: 12rpx;
}
.alert-meta {
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
