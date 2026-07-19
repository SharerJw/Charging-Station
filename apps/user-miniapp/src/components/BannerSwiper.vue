<template>
  <view class="banner-swiper">
    <swiper
      class="swiper"
      :autoplay="true"
      :interval="3000"
      :circular="true"
      indicator-dots
      indicator-color="rgba(255,255,255,0.4)"
      indicator-active-color="#FFFFFF"
    >
      <swiper-item v-for="banner in banners" :key="banner.id">
        <view
          class="banner-item"
          :style="{ background: banner.gradient }"
          @tap="handleClick(banner)"
        >
          <!-- 右上角标签 -->
          <view v-if="banner.tag" class="banner-tag">{{ banner.tag }}</view>

          <!-- 左侧文字区域 -->
          <view class="banner-content">
            <text class="banner-title">{{ banner.title }}</text>
            <text class="banner-subtitle">{{ banner.subtitle }}</text>
          </view>

          <!-- 右侧装饰 -->
          <view class="banner-decoration">
            <text class="banner-deco-icon">⚡</text>
          </view>
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup lang="ts">
interface Banner {
  id: string
  title: string
  subtitle: string
  gradient: string
  tag?: string
  link?: string
}

const props = withDefaults(defineProps<{
  banners?: Banner[]
}>(), {
  banners: () => [
    {
      id: '1',
      title: '新用户首单立减10元',
      subtitle: '限时3天',
      gradient: 'linear-gradient(135deg, #07C160, #06AD56)',
      tag: '新用户'
    },
    {
      id: '2',
      title: '充200送50',
      subtitle: '充值特惠',
      gradient: 'linear-gradient(135deg, #1677FF, #4096FF)',
      tag: '限时'
    },
    {
      id: '3',
      title: '会员专享95折',
      subtitle: '立即开通',
      gradient: 'linear-gradient(135deg, #722ED1, #B37FEB)',
      tag: '热门'
    }
  ]
})

const emit = defineEmits<{
  click: [banner: Banner]
}>()

function handleClick(banner: Banner) {
  emit('click', banner)
}
</script>

<style scoped>
.banner-swiper {
  padding: 0 24rpx;
}

.swiper {
  height: 200rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.banner-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 200rpx;
  border-radius: 16rpx;
  padding: 28rpx 32rpx;
  box-sizing: border-box;
  overflow: hidden;
}

.banner-tag {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 16rpx;
  border-radius: 0 16rpx 0 12rpx;
  backdrop-filter: blur(4px);
}

.banner-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  z-index: 1;
}

.banner-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
}

.banner-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.3;
}

.banner-decoration {
  z-index: 1;
}

.banner-deco-icon {
  font-size: 64rpx;
  opacity: 0.6;
}
</style>
