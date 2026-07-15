<template>
  <view class="index-page">
    <!-- 顶部横幅 -->
    <view class="header">
      <view class="header-top">
        <text class="title">EV充电平台</text>
        <text class="greeting">{{ greeting }}</text>
      </view>
      <text class="subtitle">绿色出行，智慧充电</text>
      <view class="balance-bar">
        <text class="balance-label">账户余额</text>
        <text class="balance-value">¥{{ userInfo.balance.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="section">
      <text class="section-title">快捷操作</text>
      <view class="quick-actions">
        <view class="action-card" @tap="scanCode">
          <text class="icon">⚡</text>
          <text class="label">扫码充电</text>
        </view>
        <view class="action-card" @tap="navigateTo('/pages/charging/index')">
          <text class="icon">🔋</text>
          <text class="label">充电状态</text>
        </view>
        <view class="action-card" @tap="navigateTo('/pages/order/index')">
          <text class="icon">📋</text>
          <text class="label">我的订单</text>
        </view>
        <view class="action-card" @tap="navigateTo('/pages/map/index')">
          <text class="icon">🗺</text>
          <text class="label">找桩充电</text>
        </view>
      </view>
    </view>

    <!-- 附近充电站 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">附近充电站</text>
        <text class="section-more" @tap="navigateTo('/pages/map/index')">查看全部 ›</text>
      </view>
      <view class="station-list">
        <view class="station-card" v-for="station in nearbyStations" :key="station.id" @tap="goToStation(station.id)">
          <view class="station-top">
            <text class="station-name">{{ station.name }}</text>
            <text class="station-distance">{{ station.distance }}m</text>
          </view>
          <text class="station-address">{{ station.address }}</text>
          <view class="station-bottom">
            <view class="station-availability">
              <text class="avail-count" :class="{ 'no-avail': station.availableCount === 0 }">{{ station.availableCount }}</text>
              <text class="avail-total">/{{ station.totalCount }} 可用</text>
            </view>
            <text class="station-price">¥{{ (station.electricityPrice + station.servicePrice).toFixed(2) }}/kWh</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 充电小贴士 -->
    <view class="section">
      <text class="section-title">充电小贴士</text>
      <view class="tips-card">
        <text class="tip-item">💡 建议在电量20%-80%之间充电，延长电池寿命</text>
        <text class="tip-item">🔌 充电前请确认充电枪已正确插入</text>
        <text class="tip-item">⚡ 直流快充适合应急，交流慢充适合日常</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api, type Station, type UserInfo } from '@/api/index'

const userInfo = ref<UserInfo>({
  id: '', nickname: '用户', phone: '', avatar: '', balance: 0, couponCount: 0,
})
const nearbyStations = ref<Station[]>([])

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

onMounted(async () => {
  try {
    const [user, stations] = await Promise.all([
      api.getUserInfo(),
      api.getStations(),
    ])
    userInfo.value = user
    nearbyStations.value = stations.slice(0, 3)
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})

const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}

const goToStation = (id: string) => {
  uni.navigateTo({ url: `/pages/map/index?stationId=${id}` })
}

const scanCode = () => {
  // #ifdef MP-WEIXIN
  uni.scanCode({
    success: (res) => {
      console.log('扫码结果:', res.result)
      // 解析二维码获取设备信息，跳转到充电页面
      uni.navigateTo({ url: `/pages/charging/index?deviceCode=${res.result}` })
    },
    fail: () => {
      uni.showToast({ title: '扫码失败', icon: 'none' })
    }
  })
  // #endif
  // #ifdef H5
  uni.showToast({ title: '请使用微信小程序扫码', icon: 'none' })
  // #endif
}
</script>

<style scoped>
.index-page {
  padding: 24rpx;
  background: #F6F7FB;
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #07C160, #06AD56);
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  color: #fff;
  margin-bottom: 24rpx;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
}

.greeting {
  font-size: 24rpx;
  opacity: 0.8;
}

.subtitle {
  font-size: 24rpx;
  opacity: 0.8;
  margin-top: 8rpx;
  display: block;
}

.balance-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.3);
}

.balance-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.balance-value {
  font-size: 36rpx;
  font-weight: bold;
}

.section {
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.section-more {
  font-size: 24rpx;
  color: #07C160;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.action-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx 12rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.icon {
  font-size: 48rpx;
  display: block;
  margin-bottom: 8rpx;
}

.label {
  font-size: 22rpx;
  color: #333;
}

.station-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.station-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.station-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.station-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.station-distance {
  font-size: 22rpx;
  color: #999;
}

.station-address {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.station-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.station-availability {
  display: flex;
  align-items: baseline;
}

.avail-count {
  font-size: 32rpx;
  font-weight: bold;
  color: #07C160;
}

.avail-count.no-avail {
  color: #FF4D4F;
}

.avail-total {
  font-size: 22rpx;
  color: #999;
  margin-left: 4rpx;
}

.station-price {
  font-size: 24rpx;
  color: #FAAD14;
  font-weight: bold;
}

.tips-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}

.tip-item {
  font-size: 24rpx;
  color: #666;
  line-height: 1.8;
  display: block;
}
</style>
