<template>
  <view class="map-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input class="search-input" placeholder="搜索充电站名称或地址" v-model="keyword" @confirm="handleSearch" />
      </view>
    </view>

    <!-- 地图区域 -->
    <view class="map-container">
      <view id="amap-container" class="amap-instance"></view>
      <!-- 模拟地图标记点 (H5 fallback) -->
      <view class="map-markers" v-if="!mapReady">
        <view
          v-for="station in stations"
          :key="station.id"
          class="map-marker"
          :class="{ 'no-avail': station.availableCount === 0 }"
          @tap="selectStation(station)"
        >
          <text class="marker-name">{{ station.name.substring(0, 4) }}</text>
          <text class="marker-count">{{ station.availableCount }}</text>
        </view>
      </view>
    </view>

    <!-- 充电站列表 -->
    <view class="list-header">
      <text class="list-title">附近充电站</text>
      <text class="list-count">共 {{ stations.length }} 个</text>
    </view>
    <view class="station-list">
      <view
        class="station-card"
        v-for="station in stations"
        :key="station.id"
        :class="{ selected: selectedStation?.id === station.id }"
        @tap="selectStation(station)"
      >
        <view class="station-top">
          <view class="station-name-row">
            <text class="station-name">{{ station.name }}</text>
            <text class="station-tag" v-if="station.availableCount > 5">充裕</text>
            <text class="station-tag warn" v-else-if="station.availableCount > 0">紧张</text>
            <text class="station-tag full" v-else>已满</text>
          </view>
          <text class="station-distance">{{ formatDistance(station.distance) }}</text>
        </view>
        <text class="station-address">{{ station.address }}</text>
        <view class="station-bottom">
          <view class="station-availability">
            <text class="avail-icon">⚡</text>
            <text class="avail-text">{{ station.availableCount }}/{{ station.totalCount }} 可用</text>
          </view>
          <view class="station-price-info">
            <text class="price-label">综合电价</text>
            <text class="price-value">¥{{ (station.electricityPrice + station.servicePrice).toFixed(2) }}/kWh</text>
          </view>
        </view>
        <view class="station-actions" v-if="selectedStation?.id === station.id">
          <button class="nav-btn" size="mini">导航</button>
          <button class="charge-btn" size="mini" @tap.stop="startCharge(station)">开始充电</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { mockApi, type Station } from '@/api/mock'

const AMAP_KEY = 'c86443d9a8cd72e5a26af987f46345ca'
const keyword = ref('')
const stations = ref<Station[]>([])
const selectedStation = ref<Station | null>(null)
const loading = ref(false)
const mapReady = ref(false)
let map: any = null

function loadAmapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).AMap) { resolve(); return }
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('高德地图加载失败'))
    document.head.appendChild(script)
  })
}

async function initMap() {
  try {
    await loadAmapScript()
    await nextTick()
    const AMap = (window as any).AMap
    map = new AMap.Map('amap-container', {
      zoom: 13,
      center: [116.46, 39.92],
      viewMode: '2D',
    })
    mapReady.value = true
    addMarkers()
  } catch (e) {
    console.warn('地图初始化失败，使用模拟模式:', e)
  }
}

function addMarkers() {
  if (!map) return
  const AMap = (window as any).AMap
  stations.value.forEach(station => {
    const marker = new AMap.Marker({
      position: [station.longitude, station.latitude],
      title: station.name,
      label: {
        content: `${station.name.substring(0, 4)} ${station.availableCount}`,
        direction: 'top',
      },
    })
    marker.on('click', () => selectStation(station))
    map.add(marker)
  })
}

async function loadStations() {
  loading.value = true
  try {
    stations.value = await mockApi.getStations({ keyword: keyword.value || undefined })
  } catch (error) {
    uni.showToast({ title: '加载充电站失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  loadStations()
}

function selectStation(station: Station) {
  selectedStation.value = selectedStation.value?.id === station.id ? null : station
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function startCharge(station: Station) {
  if (station.availableCount === 0) {
    uni.showToast({ title: '该充电站暂无可用充电桩', icon: 'none' })
    return
  }
  // 跳转到充电页面
  uni.navigateTo({
    url: `/pages/charging/index?stationId=${station.id}`,
  })
}

onMounted(async () => {
  await loadStations()
  initMap()
})
</script>

<style scoped>
.map-page {
  background: #F6F7FB;
  min-height: 100vh;
}

.search-bar {
  padding: 16rpx 24rpx;
  background: #fff;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 8rpx;
  padding: 16rpx 20rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  background: transparent;
}

.map-container {
  height: 360rpx;
  background: linear-gradient(135deg, #E8F4FD, #D1E8FF);
  position: relative;
  overflow: hidden;
}

.amap-instance {
  width: 100%;
  height: 100%;
}

.map-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx;
}

.map-marker {
  position: absolute;
  background: #07C160;
  color: #fff;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.map-marker:nth-child(1) { top: 30%; left: 20%; }
.map-marker:nth-child(2) { top: 50%; left: 60%; }
.map-marker:nth-child(3) { top: 20%; left: 70%; }
.map-marker:nth-child(4) { top: 60%; left: 30%; }

.map-marker.no-avail { background: #999; }

.marker-name { font-size: 18rpx; }
.marker-count { font-size: 24rpx; font-weight: bold; }

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
}

.list-title { font-size: 28rpx; font-weight: bold; color: #333; }
.list-count { font-size: 22rpx; color: #999; }

.station-list {
  padding: 0 24rpx;
}

.station-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.station-card.selected {
  border: 2rpx solid #07C160;
  box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.15);
}

.station-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.station-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.station-name { font-size: 28rpx; font-weight: bold; color: #333; }

.station-tag {
  font-size: 18rpx;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  background: #F6FFED;
  color: #52C41A;
}

.station-tag.warn { background: #FFF7E6; color: #FAAD14; }
.station-tag.full { background: #FFF2F0; color: #FF4D4F; }

.station-distance { font-size: 22rpx; color: #999; }

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
  align-items: center;
  gap: 4rpx;
}

.avail-icon { font-size: 24rpx; }
.avail-text { font-size: 22rpx; color: #666; }

.station-price-info {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.price-label { font-size: 20rpx; color: #999; }
.price-value { font-size: 24rpx; color: #FAAD14; font-weight: bold; }

.station-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.nav-btn {
  flex: 1;
  background: #fff;
  color: #07C160;
  border: 2rpx solid #07C160;
  font-size: 24rpx;
}

.charge-btn {
  flex: 1;
  background: #07C160;
  color: #fff;
  font-size: 24rpx;
}
</style>
