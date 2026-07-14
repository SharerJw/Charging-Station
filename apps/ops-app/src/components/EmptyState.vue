<template>
  <view class="empty-state">
    <text class="empty-icon">{{ icon || '📭' }}</text>
    <text class="empty-title">{{ title || '暂无数据' }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  title?: string
  description?: string
}>()
</script>

<style scoped>
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 48rpx; }
.empty-icon { font-size: 96rpx; margin-bottom: 24rpx; opacity: 0.5; }
.empty-title { font-size: 30rpx; color: #999; margin-bottom: 12rpx; }
.empty-desc { font-size: 24rpx; color: #999; text-align: center; }
</style>
