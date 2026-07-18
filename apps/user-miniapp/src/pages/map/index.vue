<template>
  <view class="map-page">
    <!-- 顶部导航栏：点击搜索栏跳转搜索页 -->
    <CustomNavBar
      :show-scan="false"
      :show-location="true"
      @search="goToSearch"
    />

    <!-- 地图区域（动态比例） -->
    <view class="map-container" :style="{ flex: mapFlex }">
      <view id="amap-container" class="amap-instance"></view>

      <!-- 筛选浮层（地图上方） -->
      <view class="filter-overlay">
        <view class="filter-bar">
          <view
            v-for="f in filterOptions"
            :key="f.key"
            class="filter-chip"
            :class="{ active: activeFilter === f.key }"
            @tap="setFilter(f.key)"
          >
            <text class="filter-chip-text">{{ f.label }}</text>
          </view>
        </view>
      </view>

      <!-- 定位按钮（右下角圆形） -->
      <view class="locate-btn" @tap="backToMyLocation">
        <view class="locate-icon">
          <svg viewBox="0 0 24 24" fill="none" class="locate-icon-svg">
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="#07C160"/>
          </svg>
        </view>
      </view>
    </view>

    <!-- 可拖拽分割线 -->
    <view
      class="drag-handle"
      @touchstart.prevent="onDragStart"
      @touchmove.prevent="onDragMove"
      @touchend="onDragEnd"
    >
      <view class="drag-bar"></view>
    </view>

    <!-- 站点列表（动态比例） -->
    <view class="list-section" :style="{ flex: listFlex }">
      <!-- 列表头 -->
      <view class="list-header">
        <text class="list-title">附近 {{ filteredStations.length }} 个充电站</text>
      </view>

      <!-- 定位中状态 -->
      <view v-if="locationStatus === 'locating'" class="locating-state">
        <view class="locating-spinner"></view>
        <text class="locating-text">定位中，获取附近充电站...</text>
      </view>

      <!-- 定位完成后显示内容 -->
      <template v-else>
      <!-- 排序切换 -->
      <view class="sort-tabs">
        <view
          v-for="s in sortOptions"
          :key="s.key"
          class="sort-tab"
          :class="{ active: activeSort === s.key }"
          @tap="setSort(s.key)"
        >
          <text class="sort-tab-text">{{ s.label }}</text>
        </view>
      </view>

      <!-- 站点列表 -->
      <scroll-view
        class="station-scroll"
        scroll-y
        @scrolltolower="loadMore"
        :lower-threshold="100"
        :scroll-into-view="scrollTargetId"
        scroll-with-animation
      >
        <view
          v-for="station in displayedStations"
          :key="station.id"
          :id="'station-' + station.id"
          class="station-card"
          :class="{ selected: selectedStation?.id === station.id }"
          @tap="selectStation(station)"
        >
          <view class="station-top">
            <view class="station-name-row">
              <text class="station-name">{{ station.name }}</text>
              <text
                class="station-tag"
                :class="{
                  warn: station.availableCount > 0 && station.availableCount <= 5,
                  full: station.availableCount === 0
                }"
              >{{ getStationStatusText(station) }}</text>
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

          <!-- 选中态展开操作按钮 -->
          <view class="station-actions" v-if="selectedStation?.id === station.id">
            <button class="nav-btn" size="mini" @tap.stop="navigateToStation(station)">导航</button>
            <button class="charge-btn" size="mini" @tap.stop="startCharge(station)">开始充电</button>
          </view>
        </view>

        <!-- 加载更多 / 到底提示 -->
        <view class="load-more" v-if="hasMore">
          <text class="load-more-text">{{ loadingMore ? '加载中...' : '上滑加载更多' }}</text>
        </view>
        <view class="no-more" v-else-if="displayedStations.length > 0">
          <text class="no-more-text">—— 没有更多了 ——</text>
        </view>
        <view class="empty-state" v-else-if="!loading">
          <text class="empty-text">暂无符合条件的充电站</text>
        </view>
      </scroll-view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, onBeforeUnmount } from 'vue'
import { api, type Station } from '@/api/index'
import CustomNavBar from '@/components/CustomNavBar.vue'

// ==================== 常量 ====================
const AMAP_KEY = 'c86443d9a8cd72e5a26af987f46345ca'

// ==================== 筛选配置 ====================
const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'fast', label: '快充' },
  { key: 'slow', label: '慢充' },
  { key: 'super', label: '超充' },
  { key: 'available', label: '空闲' },
]
const activeFilter = ref('all')

// ==================== 排序配置 ====================
const sortOptions = [
  { key: 'smart', label: '🎯智能推荐' },
  { key: 'distance', label: '📍距离最近' },
  { key: 'price', label: '💰价格最低' },
]
const activeSort = ref('smart')

// ==================== 地图/列表分割比例 ====================
const DEFAULT_MAP_RATIO = 0.6
const MIN_MAP_RATIO = 0.3
const MAX_MAP_RATIO = 0.85
const mapRatio = ref(DEFAULT_MAP_RATIO)
const mapFlex = computed(() => mapRatio.value * 10)
const listFlex = computed(() => (1 - mapRatio.value) * 10)

// 拖拽状态
let dragStartY = 0
let dragStartRatio = 0
let pageHeight = 0

function onDragStart(e: TouchEvent) {
  const touch = e.touches[0]
  dragStartY = touch.clientY
  dragStartRatio = mapRatio.value
  // 获取页面总高度用于计算
  const sysInfo = uni.getSystemInfoSync()
  pageHeight = sysInfo.windowHeight
}

function onDragMove(e: TouchEvent) {
  const touch = e.touches[0]
  const deltaY = touch.clientY - dragStartY
  const deltaRatio = deltaY / pageHeight
  let newRatio = dragStartRatio + deltaRatio
  newRatio = Math.max(MIN_MAP_RATIO, Math.min(MAX_MAP_RATIO, newRatio))
  mapRatio.value = newRatio
}

function onDragEnd() {
  // 拖拽结束，无额外逻辑
}

// ==================== 数据状态 ====================
const allStations = ref<Station[]>([])
const selectedStation = ref<Station | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const scrollTargetId = ref('')
const pageSize = 10
const currentPage = ref(1)
const locationStatus = ref<'locating' | 'done' | 'failed'>('locating')
const userLat = ref(0)
const userLng = ref(0)
let map: any = null
let myPositionMarker: any = null
let stationMarkers: any[] = []

// ==================== 筛选 + 排序后的站点列表 ====================
const filteredStations = computed(() => {
  let list = [...allStations.value]

  // 筛选
  if (activeFilter.value === 'available') {
    list = list.filter(s => s.availableCount > 0)
  } else if (activeFilter.value === 'fast') {
    list = list.filter(s => (s as any).chargerType === 'fast' || (s as any).fastPortCount > 0)
  } else if (activeFilter.value === 'slow') {
    list = list.filter(s => (s as any).chargerType === 'slow' || (s as any).slowPortCount > 0)
  } else if (activeFilter.value === 'super') {
    list = list.filter(s => (s as any).chargerType === 'super' || (s as any).superPortCount > 0)
  }

  // 排序
  if (activeSort.value === 'distance') {
    list.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
  } else if (activeSort.value === 'price') {
    list.sort((a, b) => (a.electricityPrice + a.servicePrice) - (b.electricityPrice + b.servicePrice))
  }
  // smart 排序保持后端默认顺序

  return list
})

const displayedStations = computed(() => {
  return filteredStations.value.slice(0, currentPage.value * pageSize)
})

const hasMore = computed(() => {
  return displayedStations.value.length < filteredStations.value.length
})

// ==================== 方法 ====================

/** 跳转搜索页 */
function goToSearch() {
  uni.navigateTo({ url: '/pages/search/index/index' })
}

/** 切换筛选 */
function setFilter(key: string) {
  activeFilter.value = key
  currentPage.value = 1
  nextTick(() => updateMarkersForFilter())
}

/** 切换排序 */
function setSort(key: string) {
  activeSort.value = key
}

/** 分页加载 */
function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  setTimeout(() => {
    currentPage.value++
    loadingMore.value = false
  }, 300)
}

/** 距离格式化 */
function formatDistance(meters: number): string {
  if (!meters || meters <= 0) return '--'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

/** 站点状态标签文字 */
function getStationStatusText(station: Station): string {
  if (station.availableCount > 5) return '充裕'
  if (station.availableCount > 0) return '紧张'
  return '已满'
}

/** 根据站点可用数决定 Marker 颜色 */
function getMarkerColor(station: Station): string {
  if (station.availableCount > 5) return '#07C160'  // 绿色 - 空闲
  if (station.availableCount > 0) return '#FAAD14'  // 橙色 - 紧张
  return '#FF4D4F'                                    // 红色 - 已满
}

// ==================== 高德地图 ====================

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
    // 确保 DOM 容器已存在
    const container = document.getElementById('amap-container')
    if (!container) {
      console.warn('地图容器未就绪，延迟初始化')
      setTimeout(() => initMap(), 500)
      return
    }
    const AMap = (window as any).AMap
    map = new AMap.Map('amap-container', {
      zoom: 12,
      center: [116.46, 39.92],
      viewMode: '2D',
    })
    map.on('complete', () => {
      addMarkers()
    })
  } catch (e) {
    console.warn('地图初始化失败:', e)
  }
}

/** 清除所有站点 Marker */
function clearMarkers() {
  stationMarkers.forEach(m => map.remove(m))
  stationMarkers = []
}

/** 根据当前筛选条件更新 Marker 显示 */
function updateMarkersForFilter() {
  if (!map) return
  clearMarkers()
  addMarkers()
}

/** 添加站点 Marker */
function addMarkers() {
  if (!map) return
  const AMap = (window as any).AMap
  clearMarkers()

  filteredStations.value.forEach(station => {
    const color = getMarkerColor(station)
    const shortName = station.name.length > 6
      ? station.name.substring(station.name.length - 6)
      : station.name
    const marker = new AMap.Marker({
      position: [station.longitude, station.latitude],
      title: station.name,
      label: {
        content: `<div style="background:${color};color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.2)">${shortName} ${station.availableCount}/${station.totalCount}</div>`,
        direction: 'top',
      },
    })
    marker.on('click', () => {
      selectStation(station)
      map.setCenter([station.longitude, station.latitude])
    })
    map.add(marker)
    stationMarkers.push(marker)
  })
}

/** 高亮并定位到站点 */
function highlightMarker(station: Station) {
  if (!map) return
  map.setCenter([station.longitude, station.latitude])
  map.setZoom(15)
}

/** 回到用户当前位置 */
function backToMyLocation() {
  if (!map) return
  const AMap = (window as any).AMap
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat.value = pos.coords.latitude
        userLng.value = pos.coords.longitude
        const lnglat = [pos.coords.longitude, pos.coords.latitude]
        map.setCenter(lnglat)
        map.setZoom(14)
        if (myPositionMarker) map.remove(myPositionMarker)
        myPositionMarker = new AMap.Marker({
          position: lnglat,
          content: '<div style="width:16px;height:16px;background:#1677FF;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          offset: new AMap.Pixel(-8, -8),
        })
        map.add(myPositionMarker)
      },
      () => {
        map.setCenter([116.46, 39.92])
        map.setZoom(12)
        uni.showToast({ title: '定位失败，使用默认位置', icon: 'none' })
      }
    )
  }
}

// ==================== 数据加载 ====================

/** 获取当前定位（H5 + 小程序双端） */
async function fetchCurrentLocation(): Promise<void> {
  locationStatus.value = 'locating'
  try {
    // #ifdef H5
    if (navigator.geolocation) {
      return new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            userLat.value = pos.coords.latitude
            userLng.value = pos.coords.longitude
            locationStatus.value = 'done'
            // 定位成功后更新地图中心点
            if (map) {
              map.setCenter([userLng.value, userLat.value])
              map.setZoom(14)
            }
            resolve()
          },
          () => {
            locationStatus.value = 'failed'
            resolve() // 失败也 resolve，不阻塞后续流程
          },
          { enableHighAccuracy: true, timeout: 8000 }
        )
      })
    }
    // #endif

    // #ifndef H5
    const loc: any = await new Promise((resolve, reject) => {
      uni.getLocation({
        type: 'gcj02',
        success: resolve,
        fail: reject,
      })
    })
    userLat.value = loc.latitude
    userLng.value = loc.longitude
    locationStatus.value = 'done'
    if (map) {
      map.setCenter([userLng.value, userLat.value])
      map.setZoom(14)
    }
    // #endif
  } catch {
    locationStatus.value = 'failed'
  }
}

// Haversine 公式计算两点距离（米）
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function loadStations() {
  loading.value = true
  try {
    const params: any = {}
    // 定位成功后才传坐标参数，实现就近查询
    if (userLat.value && userLng.value) {
      params.latitude = userLat.value
      params.longitude = userLng.value
      params.radius = 50
    }
    const stations = await api.getStations(params)
    allStations.value = (Array.isArray(stations) ? stations : [])
      .filter((s: any) => s.latitude && s.longitude)
      .map((s: any) => ({
        ...s,
        distance: (userLat.value && userLng.value)
          ? calcDistance(userLat.value, userLng.value, s.latitude, s.longitude)
          : (s.distance || 999999),
      }))
      .sort((a: any, b: any) => a.distance - b.distance)
    currentPage.value = 1
    await nextTick()
    addMarkers()
  } catch (error) {
    uni.showToast({ title: '加载充电站失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// ==================== 站点交互 ====================

function selectStation(station: Station) {
  if (selectedStation.value?.id === station.id) {
    selectedStation.value = null
    if (map) map.setZoom(12)
  } else {
    selectedStation.value = station
    highlightMarker(station)
    // 联动滚动列表到对应位置
    scrollTargetId.value = ''
    nextTick(() => {
      scrollTargetId.value = 'station-' + station.id
    })
  }
}

function navigateToStation(station: Station) {
  if (station.latitude && station.longitude) {
    // #ifdef H5
    window.open(
      `https://uri.amap.com/marker?position=${station.longitude},${station.latitude}&name=${encodeURIComponent(station.name)}`,
      '_blank'
    )
    // #endif
    // #ifdef MP-WEIXIN
    uni.openLocation({
      latitude: station.latitude,
      longitude: station.longitude,
      name: station.name,
      address: station.address,
    })
    // #endif
  }
}

async function startCharge(station: Station) {
  if (station.availableCount === 0) {
    uni.showToast({ title: '该充电站暂无可用充电桩', icon: 'none' })
    return
  }
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

// ==================== 生命周期 ====================

onMounted(async () => {
  // 先初始化地图（地图不依赖定位）
  await initMap()
  // 等待定位完成（成功或超时降级）后再加载充电站
  await fetchCurrentLocation()
  await loadStations()
  // 监听从首页传来的选中站点事件
  uni.$on('selectStation', (stationId: string) => {
    const station = allStations.value.find(s => s.id === stationId)
    if (station) {
      selectStation(station)
    }
  })
})

onBeforeUnmount(() => {
  uni.$off('selectStation')
  if (map) {
    map.destroy()
    map = null
  }
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

/* ==================== 地图区域 ==================== */
.map-container {
  height: 0;
  flex: 6;
  position: relative;
  overflow: hidden;
}

.amap-instance {
  width: 100%;
  height: 100%;
}

/* 筛选浮层 */
.filter-overlay {
  position: absolute;
  top: 16rpx;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 0 24rpx;
  pointer-events: none;
}

.filter-bar {
  display: flex;
  gap: 12rpx;
  pointer-events: auto;
}

.filter-chip {
  padding: 8rpx 24rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

.filter-chip.active {
  background: #07C160;
  box-shadow: 0 2rpx 12rpx rgba(7, 193, 96, 0.35);
}

.filter-chip-text {
  font-size: 24rpx;
  color: #333;
  white-space: nowrap;
}

.filter-chip.active .filter-chip-text {
  color: #fff;
}

/* 定位按钮 */
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

.locate-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.locate-icon-svg {
  width: 40rpx;
  height: 40rpx;
  color: #07C160;
}

/* ==================== 可拖拽分割线 ==================== */
.drag-handle {
  height: 36rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 5;
  /* 增大触摸区域 */
  padding: 6rpx 0;
}

.drag-bar {
  width: 64rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #D9D9D9;
}

/* ==================== 站点列表 ==================== */
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
  padding: 20rpx 24rpx 0;
  flex-shrink: 0;
}

.list-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

/* 排序切换 */
.sort-tabs {
  display: flex;
  gap: 0;
  padding: 12rpx 24rpx 16rpx;
  flex-shrink: 0;
}

.sort-tab {
  padding: 8rpx 20rpx;
  border-radius: 28rpx;
  margin-right: 12rpx;
  background: #F5F5F5;
  transition: all 0.2s;
}

.sort-tab.active {
  background: #E6FFF0;
}

.sort-tab-text {
  font-size: 24rpx;
  color: #666;
  white-space: nowrap;
}

.sort-tab.active .sort-tab-text {
  color: #07C160;
  font-weight: 600;
}

/* 站点滚动列表 */
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

.station-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.station-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.station-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.station-tag {
  font-size: 18rpx;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  background: #F6FFED;
  color: #52C41A;
  flex-shrink: 0;
}

.station-tag.warn {
  background: #FFF7E6;
  color: #FAAD14;
}

.station-tag.full {
  background: #FFF2F0;
  color: #FF4D4F;
}

.station-distance {
  font-size: 22rpx;
  color: #999;
  flex-shrink: 0;
  margin-left: 8rpx;
}

.station-address {
  font-size: 22rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

.station-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10rpx;
}

.station-availability {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.avail-icon {
  font-size: 24rpx;
}

.avail-text {
  font-size: 22rpx;
  color: #666;
}

.station-price-info {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.price-label {
  font-size: 20rpx;
  color: #999;
}

.price-value {
  font-size: 24rpx;
  color: #FAAD14;
  font-weight: bold;
}

/* 选中展开操作 */
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

/* 加载状态 */
.load-more,
.no-more,
.empty-state {
  text-align: center;
  padding: 24rpx 0;
}

.load-more-text {
  font-size: 24rpx;
  color: #07C160;
}

.no-more-text {
  font-size: 22rpx;
  color: #ccc;
}

.empty-text {
  font-size: 26rpx;
  color: #999;
}

/* 定位中状态 */
.locating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  gap: 20rpx;
}

.locating-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #E8E8E8;
  border-top-color: #07C160;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.locating-text {
  font-size: 26rpx;
  color: #999;
}
</style>
