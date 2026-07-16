<template>
  <view class="map-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input class="search-input" placeholder="搜索充电站名称或地址" v-model="keyword" @confirm="handleSearch" />
      </view>
    </view>

    <!-- 地图区域 (60%) -->
    <view class="map-container">
      <view id="amap-container" class="amap-instance"></view>
      <!-- 回到我的位置按钮 -->
      <view class="locate-btn" @tap="backToMyLocation">
        <text class="locate-icon">📍</text>
      </view>
    </view>

    <!-- 充电站列表 (40%) -->
    <view class="list-section">
      <view class="list-header">
        <text class="list-title">附近充电站</text>
        <text class="list-count">共 {{ allStations.length }} 个</text>
      </view>
      <scroll-view
        class="station-scroll"
        scroll-y
        @scrolltolower="loadMore"
        :lower-threshold="100"
      >
        <view
          class="station-card"
          v-for="station in displayedStations"
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
            <button class="nav-btn" size="mini" @tap.stop="navigateToStation(station)">导航</button>
            <button class="charge-btn" size="mini" @tap.stop="startCharge(station)">开始充电</button>
          </view>
        </view>
        <view class="load-more" v-if="hasMore">
          <text class="load-more-text">{{ loadingMore ? '加载中...' : '上滑加载更多' }}</text>
        </view>
        <view class="no-more" v-else-if="displayedStations.length > 0">
          <text class="no-more-text">—— 没有更多了 ——</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { api, type Station } from '@/api/index'

const AMAP_KEY = 'c86443d9a8cd72e5a26af987f46345ca'
const keyword = ref('')
const allStations = ref<Station[]>([])
const selectedStation = ref<Station | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const pageSize = 10
const currentPage = ref(1)
let map: any = null
let myPositionMarker: any = null
let stationMarkers: any[] = []

const displayedStations = computed(() => {
  return allStations.value.slice(0, currentPage.value * pageSize)
})

const hasMore = computed(() => {
  return displayedStations.value.length < allStations.value.length
})

function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  setTimeout(() => {
    currentPage.value++
    loadingMore.value = false
  }, 300)
}

function formatDistance(meters: number): string {
  if (!meters || meters <= 0) return '--'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

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
      zoom: 12,
      center: [116.46, 39.92],
      viewMode: '2D',
    })
    // 尝试获取当前位置
    map.on('complete', () => {
      addMarkers()
    })
  } catch (e) {
    console.warn('地图初始化失败:', e)
  }
}

function addMarkers() {
  if (!map) return
  const AMap = (window as any).AMap
  // 清除旧标记
  stationMarkers.forEach(m => map.remove(m))
  stationMarkers = []

  allStations.value.forEach(station => {
    const color = station.availableCount > 0 ? '#07C160' : '#999'
    const marker = new AMap.Marker({
      position: [station.longitude, station.latitude],
      title: station.name,
      label: {
        content: `<div style="background:${color};color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.2)">${station.name.substring(station.name.length > 6 ? station.name.length - 6 : 0)} ${station.availableCount}/${station.totalCount}</div>`,
        direction: 'top',
      },
    })
    marker.on('click', () => {
      selectStation(station)
      // 滚动列表到对应位置
      map.setCenter([station.longitude, station.latitude])
    })
    map.add(marker)
    stationMarkers.push(marker)
  })
}

function highlightMarker(station: Station) {
  if (!map) return
  map.setCenter([station.longitude, station.latitude])
  map.setZoom(15)
}

function backToMyLocation() {
  if (!map) return
  const AMap = (window as any).AMap
  // 尝试浏览器定位
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lnglat = [pos.coords.longitude, pos.coords.latitude]
        map.setCenter(lnglat)
        map.setZoom(14)
        // 添加/移动我的位置标记
        if (myPositionMarker) map.remove(myPositionMarker)
        myPositionMarker = new AMap.Marker({
          position: lnglat,
          content: '<div style="width:16px;height:16px;background:#1677FF;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          offset: new AMap.Pixel(-8, -8),
        })
        map.add(myPositionMarker)
      },
      () => {
        // 定位失败，回到默认位置
        map.setCenter([116.46, 39.92])
        map.setZoom(12)
        uni.showToast({ title: '定位失败，使用默认位置', icon: 'none' })
      }
    )
  }
}

async function loadStations() {
  loading.value = true
  try {
    const stations = await api.getStations({ keyword: keyword.value || undefined })
    allStations.value = (Array.isArray(stations) ? stations : []).map((s: any, i: number) => ({
      ...s,
      distance: s.distance || Math.round(Math.random() * 5000 + 500),
    }))
    currentPage.value = 1
    await nextTick()
    addMarkers()
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
  if (selectedStation.value?.id === station.id) {
    selectedStation.value = null
    if (map) map.setZoom(12)
  } else {
    selectedStation.value = station
    highlightMarker(station)
  }
}

function navigateToStation(station: Station) {
  if (station.latitude && station.longitude) {
    window.open(`https://uri.amap.com/marker?position=${station.longitude},${station.latitude}&name=${encodeURIComponent(station.name)}`, '_blank')
  }
}

async function startCharge(station: Station) {
  if (station.availableCount === 0) {
    uni.showToast({ title: '该充电站暂无可用充电桩', icon: 'none' })
    return
  }
  // 直接启动充电会话
  uni.showLoading({ title: '启动充电中...' })
  try {
    const result = await api.startCharging({
      stationId: station.id,
      deviceCode: 'DEV-' + String(station.id).padStart(4, '0'),
      connectorId: '1',
    })
    uni.hideLoading()
    if (result && (result as any).orderId) {
      uni.showToast({ title: '充电已启动', icon: 'success' })
      setTimeout(() => {
        uni.navigateTo({ url: `/pages/charging/index?orderId=${(result as any).orderId}` })
      }, 500)
    }
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '启动充电失败', icon: 'none' })
  }
}

onMounted(async () => {
  await loadStations()
  await initMap()
  // 监听从首页传来的选中站点事件
  uni.$on('selectStation', (stationId: string) => {
    const station = allStations.value.find(s => s.id === stationId)
    if (station) {
      selectStation(station)
    }
  })
})
</script>

<style scoped>
.map-page {
  background: #F6F7FB;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-bar {
  padding: 16rpx 24rpx;
  background: #fff;
  flex-shrink: 0;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 8rpx;
  padding: 16rpx 20rpx;
}

.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-input { flex: 1; font-size: 26rpx; background: transparent; }

/* 地图区域 60% */
.map-container {
  height: 0;
  flex: 6;
  position: relative;
  overflow: hidden;
}

.amap-instance { width: 100%; height: 100%; }

.locate-btn {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
  width: 72rpx;
  height: 72rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.locate-icon { font-size: 36rpx; }

/* 列表区域 40% */
.list-section {
  height: 0;
  flex: 4;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx 12rpx;
  flex-shrink: 0;
}

.list-title { font-size: 28rpx; font-weight: bold; color: #333; }
.list-count { font-size: 22rpx; color: #999; }

.station-scroll {
  flex: 1;
  padding: 0 24rpx;
}

.station-card {
  background: #F6F7FB;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 12rpx;
  transition: all 0.2s;
  border: 2rpx solid transparent;
}

.station-card.selected {
  border-color: #07C160;
  background: #F0FFF4;
}

.station-top { display: flex; justify-content: space-between; align-items: flex-start; }
.station-name-row { display: flex; align-items: center; gap: 8rpx; flex: 1; min-width: 0; }
.station-name { font-size: 28rpx; font-weight: bold; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.station-tag {
  font-size: 18rpx;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  background: #F6FFED;
  color: #52C41A;
  flex-shrink: 0;
}

.station-tag.warn { background: #FFF7E6; color: #FAAD14; }
.station-tag.full { background: #FFF2F0; color: #FF4D4F; }
.station-distance { font-size: 22rpx; color: #999; flex-shrink: 0; margin-left: 8rpx; }
.station-address { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }

.station-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10rpx;
}

.station-availability { display: flex; align-items: center; gap: 4rpx; }
.avail-icon { font-size: 24rpx; }
.avail-text { font-size: 22rpx; color: #666; }

.station-price-info { display: flex; align-items: baseline; gap: 4rpx; }
.price-label { font-size: 20rpx; color: #999; }
.price-value { font-size: 24rpx; color: #FAAD14; font-weight: bold; }

.station-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #e8e8e8;
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

.load-more, .no-more {
  text-align: center;
  padding: 16rpx 0;
}

.load-more-text { font-size: 24rpx; color: #07C160; }
.no-more-text { font-size: 22rpx; color: #ccc; }
</style>
