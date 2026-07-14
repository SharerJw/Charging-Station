<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('Ops App Launch')
})

onShow(() => {
  console.log('Ops App Show')
})

onHide(() => {
  console.log('Ops App Hide')
})
</script>

<style>
/* ========================================
 * EV充电平台 - ops-app 设计令牌
 * 主色: #1677FF (品牌蓝)
 * 背景: #F0F2F5
 * ======================================== */

page {
  /* 品牌色 */
  --color-primary: #1677FF;
  --color-primary-dark: #0958D9;
  --color-primary-bg: #E6F4FF;

  /* 状态色 */
  --color-success: #52C41A;
  --color-success-bg: #F6FFED;
  --color-warning: #FAAD14;
  --color-warning-bg: #FFFBE6;
  --color-error: #FF4D4F;
  --color-error-bg: #FFF2F0;

  /* 告警级别色 */
  --color-alert-p0: #FF4D4F;
  --color-alert-p1: #FA8C16;
  --color-alert-p2: #FAAD14;
  --color-alert-p3: #1677FF;

  /* 中性色 */
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-border: #E8E8E8;
  --color-bg-page: #F0F2F5;
  --color-bg-card: #FFFFFF;

  /* 间距 */
  --space-8: 16rpx;
  --space-12: 24rpx;
  --space-16: 32rpx;
  --space-24: 48rpx;

  /* 圆角 */
  --radius-sm: 8rpx;
  --radius-md: 12rpx;
  --radius-lg: 16rpx;

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
</style>
