<template>
  <view class="skeleton" :class="[`skeleton-${variant}`]" :style="customStyle">
    <view v-if="variant === 'card'" class="skeleton-card">
      <view class="skeleton-header">
        <view class="skeleton-avatar" />
        <view class="skeleton-lines">
          <view class="skeleton-line short" />
          <view class="skeleton-line medium" />
        </view>
      </view>
      <view class="skeleton-body">
        <view class="skeleton-line full" />
        <view class="skeleton-line full" />
        <view class="skeleton-line medium" />
      </view>
    </view>
    <view v-else-if="variant === 'list'" class="skeleton-list">
      <view v-for="i in rows" :key="i" class="skeleton-list-item">
        <view class="skeleton-avatar small" />
        <view class="skeleton-lines">
          <view class="skeleton-line full" />
          <view class="skeleton-line short" />
        </view>
      </view>
    </view>
    <view v-else class="skeleton-block" :style="{ width, height }" />
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'block' | 'card' | 'list'
  rows?: number
  width?: string
  height?: string
}>(), {
  variant: 'block',
  rows: 3,
  width: '100%',
  height: '40rpx',
})
</script>

<style scoped>
.skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.skeleton-block {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 8rpx;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.skeleton-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.skeleton-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #f0f0f0;
  margin-right: 16rpx;
  flex-shrink: 0;
}
.skeleton-avatar.small {
  width: 64rpx;
  height: 64rpx;
}

.skeleton-lines {
  flex: 1;
}

.skeleton-line {
  height: 24rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  margin-bottom: 12rpx;
}
.skeleton-line:last-child {
  margin-bottom: 0;
}
.skeleton-line.short { width: 40%; }
.skeleton-line.medium { width: 60%; }
.skeleton-line.full { width: 100%; }

.skeleton-body {
  display: flex;
  flex-direction: column;
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.skeleton-list-item:last-child {
  border-bottom: none;
}
</style>
