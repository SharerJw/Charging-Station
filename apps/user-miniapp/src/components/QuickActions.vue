<template>
  <!-- QuickActions 组件 (user-miniapp) -->
  <!-- 功能: 首页快捷操作网格 -->
  <view class="quick-actions">
    <view class="action-card" v-for="(item, index) in actions" :key="index" @tap="$emit('action', item.action)">
      <text class="action-icon">{{ item.icon }}</text>
      <text class="action-label">{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  actions: Array<{ icon: string; label: string; action: string }>
}>()

defineEmits(['action'])
</script>

<style scoped>
.quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16rpx; }
.action-card { background: #fff; border-radius: 12rpx; padding: 24rpx 12rpx; text-align: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.action-icon { font-size: 48rpx; display: block; margin-bottom: 8rpx; }
.action-label { font-size: 22rpx; color: #333; }
</style>
