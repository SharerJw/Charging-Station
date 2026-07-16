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

    <!-- 充电状态卡片（仅充电中显示） -->
    <view class="charging-card" v-if="chargingSession" @tap="goToCharging">
      <view class="charging-left">
        <text class="charging-icon">⚡</text>
        <view class="charging-info">
          <text class="charging-title">充电中</text>
          <text class="charging-station">{{ chargingSession.stationName }}</text>
        </view>
      </view>
      <view class="charging-right">
        <text class="charging-soc">{{ Math.floor(chargingSession.currentSoc) }}%</text>
        <text class="charging-power">{{ chargingSession.power.toFixed(1) }}kW</text>
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
        <view class="action-card" @tap="goToMap">
          <text class="icon">🗺</text>
          <text class="label">找桩充电</text>
        </view>
      </view>
    </view>

    <!-- 附近充电站 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">附近充电站</text>
        <text class="section-more" @tap="goToMap">查看全部 ›</text>
      </view>
      <view class="station-list">
        <view class="station-card" v-for="station in nearbyStations" :key="station.id" @tap="goToStation(station.id)">
          <view class="station-top">
            <text class="station-name">{{ station.name }}</text>
            <text class="station-distance">{{ formatDistance(station.distance) }}</text>
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
import { api, type Station, type UserInfo, type ChargingSession } from '@/api/index'

const userInfo = ref<UserInfo>({
  id: '', nickname: '用户', phone: '', avatar: '', balance: 0, couponCount: 0,
})
const nearbyStations = ref<Station[]>([])
const chargingSession = ref<ChargingSession | null>(null)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

function formatDistance(meters: number): string {
  if (!meters || meters <= 0) return ''
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

onMounted(async () => {
  try {
    const [user, stations] = await Promise.all([
      api.getUserInfo().catch(() => userInfo.value),
      api.getStations().catch(() => []),
    ])
    if (user) userInfo.value = user
    // API已映射数据，直接使用
    const stationList = (Array.isArray(stations) ? stations : []).map((s: any) => ({
      ...s,
      distance: s.distance || Math.round(Math.random() * 5000 + 500),
    }))
    stationList.sort((a: Station, b: Station) => a.distance - b.distance)
    nearbyStations.value = stationList.slice(0, 3)

    // 检查是否有充电中的会话
    try {
      const session = await api.getChargingStatus('current')
      if (session && (session as any).status === 'charging') {
        chargingSession.value = session as ChargingSession
      }
    } catch (e) {
      // 没有充电中会话，正常
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})

const goToMap = () => {
  uni.switchTab({ url: '/pages/map/index' })
}

const goToStation = (id: string) => {
  uni.switchTab({ url: '/pages/map/index' })
  // 通过全局事件通知地图页选中该站点
  setTimeout(() => {
    uni.$emit('selectStation', id)
  }, 500)
}

const goToCharging = () => {
  uni.navigateTo({ url: '/pages/charging/index' })
}

const scanCode = () => {
  // #ifdef MP-WEIXIN
  uni.scanCode({
    success: (res) => {
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

.title { font-size: 36rpx; font-weight: bold; }
.greeting { font-size: 24rpx; opacity: 0.8; }
.subtitle { font-size: 24rpx; opacity: 0.8; margin-top: 8rpx; display: block; }

.balance-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.3);
}

.balance-label { font-size: 24rpx; opacity: 0.8; }
.balance-value { font-size: 36rpx; font-weight: bold; }

/* 充电状态卡片 */
.charging-card {
  background: linear-gradient(135deg, #07C160, #06AD56);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}

.charging-left { display: flex; align-items: center; gap: 16rpx; }
.charging-icon { font-size: 48rpx; }
.charging-title { font-size: 28rpx; font-weight: bold; display: block; }
.charging-station { font-size: 22rpx; opacity: 0.8; display: block; margin-top: 4rpx; }
.charging-right { text-align: right; }
.charging-soc { font-size: 40rpx; font-weight: bold; display: block; }
.charging-power { font-size: 22rpx; opacity: 0.8; display: block; }

.section { margin-bottom: 24rpx; }

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

.section-more { font-size: 24rpx; color: #07C160; }

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.action-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx 12rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.icon { font-size: 48rpx; display: block; margin-bottom: 8rpx; }
.label { font-size: 22rpx; color: #333; }

.station-list { display: flex; flex-direction: column; gap: 12rpx; }

.station-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.station-top { display: flex; justify-content: space-between; align-items: center; }
.station-name { font-size: 28rpx; font-weight: bold; color: #333; }
.station-distance { font-size: 22rpx; color: #999; }
.station-address { font-size: 22rpx; color: #999; margin-top: 8rpx; display: block; }

.station-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.station-availability { display: flex; align-items: baseline; }
.avail-count { font-size: 32rpx; font-weight: bold; color: #07C160; }
.avail-count.no-avail { color: #FF4D4F; }
.avail-total { font-size: 22rpx; color: #999; margin-left: 4rpx; }
.station-price { font-size: 24rpx; color: #FAAD14; font-weight: bold; }

.tips-card { background: #fff; border-radius: 12rpx; padding: 24rpx; }
.tip-item { font-size: 24rpx; color: #666; line-height: 1.8; display: block; }
</style>
