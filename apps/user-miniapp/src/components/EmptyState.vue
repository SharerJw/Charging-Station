<template>
  <!-- EmptyState 组件 (user-miniapp) -->
  <!-- 功能: 通用空状态占位，支持多种类型、自定义图标/标题/描述/操作按钮 -->
  <view class="empty-state">
    <slot name="icon">
      <view class="icon-wrapper" :class="`icon-wrapper--${type}`">
        <text class="icon-emoji">{{ displayIcon }}</text>
      </view>
    </slot>

    <text v-if="title" class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>

    <slot />

    <view v-if="actionText || type === 'charging-empty'" class="action-area">
      <view class="action-btn" :class="`action-btn--${type}`" hover-class="action-btn--hover" @tap="handleAction">
        <text class="action-btn-text">{{ actionText || defaultActionText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface EmptyStateProps {
  /** 空状态类型，影响图标和配色 */
  type?: 'empty' | 'no-data' | 'no-network' | 'error' | 'no-orders' | 'no-favorites' | 'charging-empty'
  /** 标题文字 */
  title?: string
  /** 描述文字 */
  description?: string
  /** 操作按钮文字 */
  actionText?: string
  /** 自定义图标（emoji） */
  icon?: string
}

const props = withDefaults(defineProps<EmptyStateProps>(), {
  type: 'empty',
})

const emit = defineEmits<{
  action: []
}>()

const typeIconMap: Record<string, string> = {
  empty: '📋',
  'no-data': '📭',
  'no-network': '📡',
  error: '⚠️',
  'no-orders': '🧾',
  'no-favorites': '💚',
  'charging-empty': '🔋',
}

const defaultActionTextMap: Record<string, string> = {
  'charging-empty': '去找站充电',
  'no-network': '点击重试',
  error: '点击重试',
}

const displayIcon = computed(() => props.icon || typeIconMap[props.type] || '📋')

const defaultActionText = computed(() => defaultActionTextMap[props.type] || '')

function handleAction() {
  emit('action')
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  margin-bottom: 32rpx;
}

.icon-wrapper--empty {
  background: #F5F5F5;
}

.icon-wrapper--no-data {
  background: #E6F4FF;
}

.icon-wrapper--no-network {
  background: #FFF7E6;
}

.icon-wrapper--error {
  background: #FFF2F0;
}

.icon-wrapper--no-orders {
  background: #F6FFED;
}

.icon-wrapper--no-favorites {
  background: #F6FFED;
}

.icon-wrapper--charging-empty {
  background: #F6FFED;
}

.icon-emoji {
  font-size: 80rpx;
  line-height: 80rpx;
}

.empty-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  max-width: 400rpx;
  line-height: 1.6;
}

.action-area {
  margin-top: 40rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  padding: 0 48rpx;
  border-radius: 36rpx;
  background: #07C160;
}

.action-btn--no-network,
.action-btn--error {
  background: #1677FF;
}

.action-btn--hover {
  opacity: 0.85;
}

.action-btn-text {
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: 500;
}
</style>
