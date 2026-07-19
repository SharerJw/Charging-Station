<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

onLaunch(() => {
  console.log('App Launch')
  // 从本地存储恢复用户登录状态
  const userStore = useUserStore()
  userStore.initFromStorage()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style>
/* ========================================
 * EV充电平台 - user-miniapp 设计令牌
 * 主色: #07C160 (微信绿)
 * 背景: #F6F7FB
 * ======================================== */

page {
  /* 品牌色 */
  --color-primary: #07C160;
  --color-primary-dark: #06AD56;
  --color-primary-bg: #E8F8EE;

  /* 状态色 */
  --color-success: #07C160;
  --color-warning: #FAAD14;
  --color-error: #FF4D4F;

  /* 中性色 */
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-border: #E8E8E8;
  --color-bg-page: #F6F7FB;
  --color-bg-card: #FFFFFF;

  /* 间距 (12px网格) */
  --space-8: 16rpx;
  --space-12: 24rpx;
  --space-16: 32rpx;
  --space-24: 48rpx;

  /* 圆角 */
  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 24rpx;

  /* 字体 */
  --font-size-xs: 20rpx;
  --font-size-sm: 24rpx;
  --font-size-md: 28rpx;
  --font-size-lg: 32rpx;
  --font-size-xl: 36rpx;
  --font-size-2xl: 40rpx;

  /* 最小触摸目标 */
  --touch-min: 88rpx;

  background-color: var(--color-bg-page);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 全局禁用页面级滚动（找桩页/订单页等固定布局页面复用） */
uni-page-body,
.uni-page-body {
  overflow: hidden !important;
  height: 100% !important;
}
</style>
