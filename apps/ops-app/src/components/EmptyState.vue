<template>
  <view class="empty-state">
    <view class="empty-icon">
      <text class="icon-text">{{ icon }}</text>
    </view>
    <text class="empty-title">{{ title }}</text>
    <text class="empty-desc" v-if="description">{{ description }}</text>
    <view class="empty-action" v-if="$slots.action || actionText">
      <slot name="action" />
      <button
        v-if="actionText && !$slots.action"
        class="action-btn"
        @click="$emit('action')"
      >
        {{ actionText }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  title: string
  description?: string
  actionText?: string
}>(), {
  icon: '📭',
})

defineEmits<{
  action: []
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  min-height: 400rpx;
}
.empty-icon {
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}
.icon-text {
  font-size: 80rpx;
}
.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12rpx;
}
.empty-desc {
  font-size: 24rpx;
  color: #8C8C8C;
  text-align: center;
  line-height: 1.5;
  margin-bottom: 32rpx;
}
.empty-action {
  display: flex;
  justify-content: center;
}
.action-btn {
  background: #1677FF;
  color: #fff;
  font-size: 26rpx;
  padding: 16rpx 48rpx;
  border-radius: 8rpx;
  border: none;
}
.action-btn::after {
  border: none;
}
</style>
