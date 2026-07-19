<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @tap="handleTap"
  >
    <view v-if="loading" class="charge-btn__spinner" />
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'large' | 'medium' | 'small'
    loading?: boolean
    disabled?: boolean
    block?: boolean
    icon?: string
  }>(),
  {
    variant: 'primary',
    size: 'medium',
    loading: false,
    disabled: false,
    block: false,
    icon: '',
  }
)

const emit = defineEmits<{
  tap: []
}>()

const buttonClasses = computed(() => [
  'charge-btn',
  `charge-btn--${props.variant}`,
  `charge-btn--${props.size}`,
  {
    'charge-btn--block': props.block,
    'charge-btn--loading': props.loading,
    'charge-btn--disabled': props.disabled,
  },
])

function handleTap() {
  if (props.disabled || props.loading) return
  emit('tap')
}
</script>

<style scoped>
.charge-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: none;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  transition: opacity 200ms ease, transform 200ms ease, box-shadow 200ms ease;
  -webkit-tap-highlight-color: transparent;
}

.charge-btn::after {
  border: none;
}

/* ---- Sizes ---- */

.charge-btn--large {
  height: 96rpx;
  font-size: 32rpx;
  border-radius: 48rpx;
  padding: 0 48rpx;
}

.charge-btn--medium {
  height: 80rpx;
  font-size: 28rpx;
  border-radius: 40rpx;
  padding: 0 40rpx;
  min-width: 200rpx;
}

.charge-btn--small {
  height: 64rpx;
  font-size: 24rpx;
  border-radius: 32rpx;
  padding: 0 32rpx;
  min-width: 160rpx;
}

/* ---- Block ---- */

.charge-btn--block {
  display: flex;
  width: 100%;
}

/* ---- Variants ---- */

.charge-btn--primary {
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.35);
}

.charge-btn--secondary {
  background: #ffffff;
  color: #07C160;
  border: 2rpx solid #07C160;
}

.charge-btn--danger {
  background: linear-gradient(135deg, #FF4D4F 0%, #CF1322 100%);
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(255, 77, 79, 0.3);
}

.charge-btn--ghost {
  background: transparent;
  color: #07C160;
  box-shadow: none;
}

/* ---- Active / Press feedback ---- */

.charge-btn:active:not(.charge-btn--disabled):not(.charge-btn--loading) {
  transform: scale(0.97);
}

/* ---- Loading ---- */

.charge-btn--loading {
  opacity: 0.85;
}

.charge-btn__spinner {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: charge-spin 600ms linear infinite;
  margin-right: 12rpx;
}

.charge-btn--secondary .charge-btn__spinner {
  border-color: rgba(7, 193, 96, 0.3);
  border-top-color: #07C160;
}

.charge-btn--ghost .charge-btn__spinner {
  border-color: rgba(7, 193, 96, 0.3);
  border-top-color: #07C160;
}

/* ---- Disabled ---- */

.charge-btn--disabled {
  opacity: 0.5;
}

/* ---- Keyframes ---- */

@keyframes charge-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
