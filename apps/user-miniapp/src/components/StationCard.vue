<template>
  <!-- StationCard 组件 (user-miniapp) -->
  <!-- 功能: 充电站列表卡片（名称/地址/距离/可用数/价格） -->
  <view class="station-card" :class="{ selected }">
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
</template>

<script setup lang="ts">
defineProps<{
  station: { name: string; address: string; distance: number; availableCount: number; totalCount: number; electricityPrice: number; servicePrice: number }
  selected?: boolean
}>()

function formatDistance(meters: number): string {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`
}
</script>

<style scoped>
.station-card { background: #fff; border-radius: 12rpx; padding: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.station-card.selected { border: 2rpx solid #07C160; }
.station-top { display: flex; justify-content: space-between; align-items: center; }
.station-name { font-size: 28rpx; font-weight: bold; color: #333; }
.station-distance { font-size: 22rpx; color: #999; }
.station-address { font-size: 22rpx; color: #999; margin-top: 8rpx; display: block; }
.station-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.station-availability { display: flex; align-items: baseline; }
.avail-count { font-size: 32rpx; font-weight: bold; color: #07C160; }
.avail-count.no-avail { color: #FF4D4F; }
.avail-total { font-size: 22rpx; color: #999; margin-left: 4rpx; }
.station-price { font-size: 24rpx; color: #FAAD14; font-weight: bold; }
</style>
