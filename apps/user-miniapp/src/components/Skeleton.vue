<template>
  <view class="skeleton-wrapper">
    <view v-if="avatar" class="skeleton-avatar" />
    <view class="skeleton-content">
      <view class="skeleton-title" />
      <view v-for="i in (rows || 3)" :key="i" class="skeleton-row" :style="{ width: i === (rows || 3) ? '60%' : '100%' }" />
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  rows?: number
  avatar?: boolean
}>()
</script>

<style scoped>
.skeleton-wrapper { display: flex; gap: 24rpx; padding: 24rpx; }
.skeleton-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #E8E8E8; flex-shrink: 0; animation: pulse 1.5s infinite; }
.skeleton-content { flex: 1; display: flex; flex-direction: column; gap: 16rpx; }
.skeleton-title { height: 32rpx; width: 40%; background: #E8E8E8; border-radius: 4rpx; animation: pulse 1.5s infinite; }
.skeleton-row { height: 24rpx; background: #E8E8E8; border-radius: 4rpx; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
