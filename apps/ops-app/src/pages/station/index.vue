<template>
  <view class="station-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input class="search-input" placeholder="搜索充电站" v-model="keyword" @confirm="loadStations" />
    </view>

    <!-- 地图区域 -->
    <view class="map-container">
      <view id="ops-amap" class="amap-instance"></view>
    </view>

    <!-- 充电站列表 -->
    <view class="station-list" v-if="stations.length > 0">
      <view class="station-card" v-for="station in stations" :key="station.id">
        <view class="station-header">
          <text class="station-name">{{ station.name }}</text>
          <text class="station-status" :class="station.onlineCount > 0 ? 'online' : 'offline'">
            {{ station.onlineCount > 0 ? '在线' : '离线' }}
          </text>
        </view>
        <text class="station-address">{{ station.address }}</text>
        <view class="station-stats">
          <view class="stat-item">
            <text class="stat-value">{{ station.onlineCount }}</text>
            <text class="stat-label">在线</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ station.deviceCount }}</text>
            <text class="stat-label">总数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">¥{{ station.price }}</text>
            <text class="stat-label">电价/kWh</text>
          </view>
        </view>
        <view class="station-actions">
          <button class="action-btn" size="mini" @tap="viewDevices(station)">设备列表</button>
          <button class="action-btn primary" size="mini" @tap="viewStationDetail(station)">详情</button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">🏭</text>
      <text class="empty-text">暂无充电站</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const AMAP_KEY = 'c86443d9a8cd72e5a26af987f46345ca'

interface Station {
  id: string
  name: string
  address: string
  deviceCount: number
  onlineCount: number
  price: number
  longitude: number
  latitude: number
}

const keyword = ref('')
const stations = ref<Station[]>([])
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
    map = new AMap.Map('ops-amap', {
      zoom: 12,
      center: [116.46, 39.92],
      viewMode: '2D',
    })
    addMarkers()
  } catch (e) {
    console.warn('地图初始化失败:', e)
  }
}

function addMarkers() {
  if (!map) return
  const AMap = (window as any).AMap
  stations.value.forEach(station => {
    const statusColor = station.onlineCount > 0 ? '#52C41A' : '#FF4D4F'
    const marker = new AMap.Marker({
      position: [station.longitude, station.latitude],
      title: station.name,
      label: {
        content: `<div style="background:${statusColor};color:#fff;padding:2px 6px;border-radius:4px;font-size:12px;white-space:nowrap">${station.name.substring(0, 4)} ${station.onlineCount}/${station.deviceCount}</div>`,
        direction: 'top',
      },
    })
    map.add(marker)
  })
}

async function loadStations() {
  // Mock 数据
  stations.value = [
    { id: 'S001', name: '北京朝阳充电站', address: '朝阳区建国路88号', deviceCount: 12, onlineCount: 10, price: 1.7, longitude: 116.46, latitude: 39.92 },
    { id: 'S002', name: '上海浦东快充站', address: '浦东新区张江高科技园区', deviceCount: 8, onlineCount: 7, price: 2.1, longitude: 121.59, latitude: 31.22 },
    { id: 'S003', name: '深圳南山超充站', address: '南山区科技园南路', deviceCount: 6, onlineCount: 6, price: 1.4, longitude: 113.94, latitude: 22.53 },
    { id: 'S004', name: '杭州西湖慢充站', address: '西湖区文三路', deviceCount: 20, onlineCount: 18, price: 1.1, longitude: 120.13, latitude: 30.27 },
  ]
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    stations.value = stations.value.filter(s => s.name.toLowerCase().includes(kw) || s.address.toLowerCase().includes(kw))
  }
}

function viewDevices(station: Station) {
  uni.showToast({ title: `${station.name}: ${station.onlineCount}/${station.deviceCount} 台在线`, icon: 'none' })
}

function viewStationDetail(station: Station) {
  uni.showModal({
    title: station.name,
    content: `地址: ${station.address}\n设备: ${station.onlineCount}/${station.deviceCount} 台在线\n电价: ¥${station.price}/kWh`,
    showCancel: false,
  })
}

onMounted(async () => {
  await loadStations()
  initMap()
})
</script>

<style scoped>
.station-page { padding: 24rpx; background: #F0F2F5; min-height: 100vh; }
.search-bar { margin-bottom: 16rpx; }
.search-input { background: #fff; border-radius: 8rpx; padding: 20rpx 24rpx; font-size: 28rpx; width: 100%; box-sizing: border-box; }
.map-container { height: 320rpx; border-radius: 12rpx; overflow: hidden; margin-bottom: 16rpx; }
.amap-instance { width: 100%; height: 100%; }
.station-list { display: flex; flex-direction: column; gap: 16rpx; }
.station-card { background: #fff; border-radius: 12rpx; padding: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.station-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.station-name { font-size: 28rpx; font-weight: bold; color: #333; }
.station-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 4rpx; }
.station-status.online { background: #F6FFED; color: #52C41A; }
.station-status.offline { background: #FFF2F0; color: #FF4D4F; }
.station-address { font-size: 22rpx; color: #999; display: block; margin-bottom: 12rpx; }
.station-stats { display: flex; gap: 24rpx; margin-bottom: 16rpx; padding: 12rpx 0; border-top: 1rpx solid #f5f5f5; border-bottom: 1rpx solid #f5f5f5; }
.stat-item { flex: 1; text-align: center; }
.stat-value { font-size: 28rpx; font-weight: bold; color: #1677FF; display: block; }
.stat-label { font-size: 20rpx; color: #999; display: block; }
.station-actions { display: flex; gap: 12rpx; }
.action-btn { flex: 1; font-size: 24rpx; border-radius: 8rpx; background: #f5f5f5; color: #666; }
.action-btn.primary { background: #1677FF; color: #fff; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 16rpx; }
</style>
