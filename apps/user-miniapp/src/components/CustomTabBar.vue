<template>
  <!-- CustomTabBar 自定义底部导航栏 (user-miniapp) -->
  <!-- 替代原生 tabBar，支持充电中浮层 -->
  <view class="custom-tabbar-wrapper">
    <!-- 充电中浮层 -->
    <view
      v-if="chargingSession"
      class="charging-bar"
      @tap="onChargingTap"
    >
      <view class="charging-bar__content">
        <view class="charging-bar__left">
          <text class="charging-bar__icon">⚡</text>
          <text class="charging-bar__label">充电中</text>
        </view>
        <view class="charging-bar__right">
          <view class="charging-bar__stat">
            <text class="charging-bar__stat-value">{{ chargingSession.soc }}</text>
            <text class="charging-bar__stat-unit">%</text>
          </view>
          <view class="charging-bar__divider" />
          <view class="charging-bar__stat">
            <text class="charging-bar__stat-value">{{ chargingSession.power }}</text>
            <text class="charging-bar__stat-unit">kW</text>
          </view>
          <view class="charging-bar__divider" />
          <view class="charging-bar__stat">
            <text class="charging-bar__stat-value">{{ formatDuration(chargingSession.duration) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部导航栏 -->
    <view class="tabbar" :class="{ 'tabbar--with-charging': !!chargingSession }">
      <view
        v-for="tab in tabs"
        :key="tab.path"
        class="tabbar__item"
        :class="{ 'tabbar__item--active': current === tab.path }"
        @tap="onTabTap(tab.path)"
      >
        <!-- 图标（Unicode 文本，兼容 UniApp H5/小程序） -->
        <view class="tabbar__icon-wrapper">
          <text class="tabbar__icon-text">{{ current === tab.path ? tab.activeIcon : tab.icon }}</text>
        </view>
        <!-- 文字 -->
        <text class="tabbar__label">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 底部安全区域占位 -->
    <view class="tabbar__safe-area" />
  </view>
</template>

<script setup lang="ts">
/**
 * CustomTabBar - 自定义底部导航栏
 *
 * 替代原生 UniApp tabBar，支持充电中浮层
 * 4 tabs: 首页 / 订单 / 钱包 / 我的
 */

interface ChargingSession {
  soc: number
  power: number
  duration: number
  orderId: string
}

interface TabItem {
  path: string
  label: string
  icon: string
  activeIcon: string
}

const props = defineProps<{
  current: string
  chargingSession?: ChargingSession | null
}>()

const emit = defineEmits<{
  change: [tabPath: string]
}>()

const tabs: TabItem[] = [
  { path: 'pages/index/index', label: '首页', icon: '🏠', activeIcon: '🏡' },
  { path: 'pages/order/index', label: '订单', icon: '📋', activeIcon: '📝' },
  { path: 'pages/wallet/index', label: '钱包', icon: '💰', activeIcon: '💳' },
  { path: 'pages/profile/index', label: '我的', icon: '👤', activeIcon: '👤' },
]

function onTabTap(path: string): void {
  if (path !== props.current) {
    emit('change', path)
  }
}

function onChargingTap(): void {
  if (props.chargingSession) {
    uni.navigateTo({
      url: `/pages/charging/index?orderId=${props.chargingSession.orderId}`,
    })
  }
}

/**
 * 将秒数格式化为 HH:MM:SS 或 MM:SS
 */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
</script>

<style scoped lang="scss">
// Design tokens (inlined to avoid import issues in mini-program compilation)
$color-primary: #07C160;
$color-primary-dark: #06AD56;
$color-text-tertiary: #999999;
$color-text-inverse: #FFFFFF;
$color-bg-card: #FFFFFF;
$color-border: #F0F0F0;
$radius-lg: 16rpx;
$font-size-xs: 20rpx;
$z-sticky: 100;

.custom-tabbar-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: $z-sticky;
}

// ---------------------------------------------------------------------------
// Charging floating bar
// ---------------------------------------------------------------------------
.charging-bar {
  background: linear-gradient(135deg, $color-primary, $color-primary-dark);
  border-radius: $radius-lg $radius-lg 0 0;
  padding: 0 32rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  // Slide-up entry animation
  animation: charging-slide-up 300ms ease-out both;

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__icon {
    font-size: 32rpx;
    line-height: 1;
  }

  &__label {
    font-size: 28rpx;
    font-weight: 600;
    color: $color-text-inverse;
    letter-spacing: 2rpx;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  &__stat {
    display: flex;
    align-items: baseline;
    gap: 2rpx;
  }

  &__stat-value {
    font-size: 30rpx;
    font-weight: 700;
    color: $color-text-inverse;
    font-family: 'DIN Alternate', 'DIN', monospace;
  }

  &__stat-unit {
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.85);
  }

  &__divider {
    width: 2rpx;
    height: 24rpx;
    background: rgba(255, 255, 255, 0.35);
  }
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------
.tabbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  height: 100rpx;
  background: $color-bg-card;
  border-top: 1rpx solid $color-border;
  padding-top: 6rpx;

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    padding: 10rpx 0;
    position: relative;
    // Touch feedback
    &:active {
      opacity: 0.7;
    }
  }

  &__item--active {
    .tabbar__label {
      color: $color-primary;
      font-weight: 600;
    }
    .tabbar__icon {
      color: $color-primary;
    }
    .tabbar__icon-wrapper {
      background: rgba($color-primary, 0.1);
      border-radius: 16rpx;
    }
  }

  &__icon-wrapper {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
    border-radius: 16rpx;
  }

  &__icon-text {
    font-size: 44rpx;
    line-height: 1;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-tertiary;
    line-height: 1.2;
    white-space: nowrap;
    margin-top: 2rpx;
    transition: color 0.2s ease;
  }
}

// Safe area inset at the very bottom
.tabbar__safe-area {
  height: env(safe-area-inset-bottom);
  background: $color-bg-card;
}

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------
@keyframes charging-slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
