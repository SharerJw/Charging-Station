<template>
  <view class="station-detail-page">
    <!-- ================================================================
         顶部地图区 — 400rpx 站点位置 + 用户位置 + 导航路线预览
         ================================================================ -->
    <view class="map-section">
      <!-- 地图容器 -->
      <map
        class="map-canvas"
        :latitude="station.latitude"
        :longitude="station.longitude"
        :markers="mapMarkers"
        :polyline="routePolyline"
        :scale="15"
        show-location
        enable-zoom
        enable-scroll
      />

      <!-- 左上返回按钮 -->
      <view class="map-btn-back" @tap="handleBack">
        <text class="back-arrow">&#x2190;</text>
      </view>

      <!-- 右上分享按钮 -->
      <view class="map-btn-share" @tap="handleShare">
        <text class="share-icon">&#x2B06;</text>
      </view>

      <!-- 底部渐变遮罩 + 站名 + 距离 -->
      <view class="map-gradient-overlay">
        <view class="map-station-info">
          <text class="map-station-name">{{ station.name }}</text>
          <text class="map-station-distance" v-if="station.distance">{{ formatDistance(station.distance) }}</text>
        </view>
      </view>
    </view>

    <!-- ================================================================
         站点信息卡片
         ================================================================ -->
    <view class="info-card">
      <!-- 站名 + 评分 + 评价数 -->
      <view class="info-name-row">
        <text class="info-station-name">{{ station.name }}</text>
        <view class="info-rating">
          <text class="rating-star">&#x2B50;</text>
          <text class="rating-value">{{ (station.rating || 5.0).toFixed(1) }}</text>
          <text class="rating-count">({{ station.reviewCount || 0 }}条评价)</text>
        </view>
      </view>

      <!-- 类型标签 -->
      <view class="info-tags">
        <text class="tag tag-green">{{ station.type || '公共快充站' }}</text>
        <text class="tag tag-blue" v-if="station.is24h">24h</text>
        <text class="tag tag-blue" v-if="station.freeParking">免费停车</text>
      </view>

      <!-- 地址 + 复制 + 导航 -->
      <view class="info-address-row">
        <text class="info-address ellipsis-2">{{ station.address }}</text>
        <view class="info-address-actions">
          <view class="mini-btn" @tap="copyAddress">
            <text class="mini-btn-icon">&#x1F4CB;</text>
            <text class="mini-btn-text">复制</text>
          </view>
          <view class="mini-btn" @tap="openNavigation">
            <text class="mini-btn-icon">&#x1F5FA;</text>
            <text class="mini-btn-text">导航</text>
          </view>
        </view>
      </view>

      <!-- 营业时间 -->
      <view class="info-row">
        <text class="info-label">营业时间</text>
        <text class="info-value" :class="{ 'text-closed': !isOpen }">{{ station.openHours || '24小时' }}</text>
        <text class="closed-badge" v-if="!isOpen">未营业</text>
      </view>

      <!-- 联系电话 -->
      <view class="info-row">
        <text class="info-label">联系电话</text>
        <view class="info-phone-row" @tap="callPhone">
          <text class="info-value">{{ station.phone || '--' }}</text>
          <view class="mini-btn-call" v-if="station.phone">
            <text class="call-icon">&#x1F4DE;</text>
            <text class="call-text">拨打</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ================================================================
         实时充电桩列表（核心）
         ================================================================ -->
    <view class="section-card">
      <text class="section-title">实时充电桩</text>

      <!-- 汇总条 -->
      <view class="pile-summary">
        <view class="summary-item">
          <text class="summary-num">{{ chargingPoints.length }}</text>
          <text class="summary-label">总桩数</text>
        </view>
        <view class="summary-divider" />
        <view class="summary-item">
          <text class="summary-num text-success">{{ statusCount('free') }}</text>
          <text class="summary-label">空闲</text>
        </view>
        <view class="summary-divider" />
        <view class="summary-item">
          <text class="summary-num text-charging">{{ statusCount('charging') }}</text>
          <text class="summary-label">充电中</text>
        </view>
        <view class="summary-divider" />
        <view class="summary-item">
          <text class="summary-num text-error">{{ statusCount('fault') }}</text>
          <text class="summary-label">故障</text>
        </view>
      </view>

      <!-- 类型筛选 -->
      <view class="pile-filter">
        <view
          class="filter-chip"
          :class="{ active: filterType === 'ALL' }"
          @tap="filterType = 'ALL'"
        >
          <text class="chip-text">全部</text>
        </view>
        <view
          class="filter-chip"
          :class="{ active: filterType === 'DC' }"
          @tap="filterType = 'DC'"
        >
          <text class="chip-text">直流快充</text>
        </view>
        <view
          class="filter-chip"
          :class="{ active: filterType === 'AC' }"
          @tap="filterType = 'AC'"
        >
          <text class="chip-text">交流慢充</text>
        </view>
      </view>

      <!-- 桩列表 -->
      <view class="pile-list">
        <view
          class="pile-card"
          v-for="point in filteredPoints"
          :key="point.id"
          @tap="togglePileExpand(point.id)"
        >
          <!-- 桩卡片头部 -->
          <view class="pile-header">
            <view class="pile-left">
              <view class="pile-status-dot" :class="point.status" />
              <text class="pile-code">{{ point.code }}</text>
              <text class="pile-model">{{ point.model || 'AC-7kW' }}</text>
            </view>
            <view class="pile-right">
              <text class="pile-price">
                <text class="price-symbol">&#xA5;</text>{{ pointPrice(point) }}
                <text class="price-unit">/kWh</text>
              </text>
              <view class="pile-action-btn" :class="point.status" @tap.stop="handlePileAction(point)">
                <text class="action-btn-text">{{ pileActionLabel(point.status) }}</text>
              </view>
            </view>
          </view>

          <!-- 展开详情 -->
          <view class="pile-detail" v-if="expandedPile === point.id">
            <view class="detail-divider" />
            <view class="detail-grid">
              <view class="detail-item">
                <text class="detail-label">额定功率</text>
                <text class="detail-value">{{ point.power }}kW</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">接口类型</text>
                <text class="detail-value">{{ point.connector || (point.type === 'DC' ? 'CCS2' : 'Type 2') }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">电压范围</text>
                <text class="detail-value">{{ point.voltageRange || (point.type === 'DC' ? '200-750V' : '220V') }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">24h使用率</text>
                <text class="detail-value">{{ point.usageRate || 0 }}%</text>
              </view>
            </view>
            <!-- 使用率进度条 -->
            <view class="usage-bar">
              <view class="usage-bar-track">
                <view class="usage-bar-fill" :style="{ width: (point.usageRate || 0) + '%' }" />
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view class="empty-pile" v-if="filteredPoints.length === 0">
          <text class="empty-text">暂无符合条件的充电桩</text>
        </view>
      </view>
    </view>

    <!-- ================================================================
         电价详情卡片 — 24h 电价时间轴（色块条形图）
         ================================================================ -->
    <view class="section-card">
      <text class="section-title">电价详情</text>

      <!-- 当前时段高亮 -->
      <view class="current-price-banner">
        <view class="current-price-left">
          <text class="current-label">当前时段</text>
          <text class="current-period" :style="{ color: currentPeriodColor }">{{ currentPeriodName }}</text>
        </view>
        <view class="current-price-right">
          <text class="current-price-num">&#xA5;{{ currentPrice }}</text>
          <text class="current-price-unit">/kWh</text>
        </view>
      </view>

      <!-- 24h 色块条形图 -->
      <view class="timeline-wrapper">
        <view class="timeline-row">
          <view
            class="timeline-block"
            v-for="(slot, idx) in priceTimeline"
            :key="idx"
            :class="slot.level"
            :style="{ background: slot.color }"
          >
            <text class="block-price" v-if="idx % 6 === 0">&#xA5;{{ slot.price }}</text>
          </view>
        </view>
        <view class="timeline-labels">
          <text class="tl-label">0</text>
          <text class="tl-label">6</text>
          <text class="tl-label">12</text>
          <text class="tl-label">18</text>
          <text class="tl-label">24</text>
        </view>
      </view>

      <!-- 图例 -->
      <view class="price-legend">
        <view class="legend-item">
          <view class="legend-dot" style="background: #FF4D4F" />
          <text class="legend-text">峰时</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot" style="background: #1677FF" />
          <text class="legend-text">平时</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot" style="background: #52C41A" />
          <text class="legend-text">谷时</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot" style="background: #237804" />
          <text class="legend-text">深谷</text>
        </view>
      </view>

      <!-- 省钱提示 -->
      <view class="save-tip">
        <text class="save-tip-icon">&#x1F4A1;</text>
        <text class="save-tip-text">{{ saveTip }}</text>
      </view>
    </view>

    <!-- ================================================================
         配套设施 — 图标网格 2×4
         ================================================================ -->
    <view class="section-card">
      <text class="section-title">配套设施</text>
      <view class="facilities-grid">
        <view
          class="facility-item"
          v-for="f in displayFacilities"
          :key="f.label"
        >
          <view class="facility-icon-wrap" :class="{ unavailable: !f.available }">
            <text class="facility-icon">{{ f.icon }}</text>
          </view>
          <text class="facility-label" :class="{ unavailable: !f.available }">{{ f.label }}</text>
        </view>
      </view>
    </view>

    <!-- ================================================================
         用户评价区 — 综合评分 + 热门标签 + 最新 3 条评价
         ================================================================ -->
    <view class="section-card review-section">
      <text class="section-title">用户评价</text>

      <!-- 综合评分 -->
      <view class="review-overview">
        <view class="review-score-box">
          <text class="review-score">{{ (station.rating || 5.0).toFixed(1) }}</text>
          <view class="review-stars-row">
            <text
              class="star-icon"
              v-for="s in 5"
              :key="s"
              :class="{ filled: s <= Math.round(station.rating || 5) }"
            >&#x2605;</text>
          </view>
          <text class="review-total">{{ station.reviewCount || 0 }}条评价</text>
        </view>
      </view>

      <!-- 热门标签 -->
      <view class="review-tags" v-if="reviewTags.length > 0">
        <view
          class="review-tag"
          v-for="tag in reviewTags"
          :key="tag.label"
          @tap="filterReviewTag = filterReviewTag === tag.label ? '' : tag.label"
          :class="{ active: filterReviewTag === tag.label }"
        >
          <text class="review-tag-text">{{ tag.label }}({{ tag.count }})</text>
        </view>
      </view>

      <!-- 最新 3 条评价 -->
      <view class="review-list">
        <view class="review-card" v-for="review in displayReviews" :key="review.id">
          <view class="review-header">
            <view class="review-user-info">
              <image class="review-avatar" :src="review.avatar || '/static/default-avatar.png'" mode="aspectFill" />
              <text class="review-nickname">{{ review.nickname }}</text>
            </view>
            <view class="review-rating-stars">
              <text
                class="mini-star"
                v-for="s in 5"
                :key="s"
                :class="{ filled: s <= review.rating }"
              >&#x2605;</text>
            </view>
          </view>
          <text class="review-content">{{ review.content }}</text>
          <view class="review-footer">
            <text class="review-time">{{ formatTime(review.time) }}</text>
            <view class="review-like" v-if="review.likeCount > 0">
              <text class="like-icon">&#x1F44D;</text>
              <text class="like-count">{{ review.likeCount }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 查看全部评价 -->
      <view class="view-all-reviews" v-if="reviews.length > 3" @tap="viewAllReviews">
        <text class="view-all-text">查看全部 {{ reviews.length }} 条评价</text>
        <text class="view-all-arrow">&gt;</text>
      </view>

      <!-- 空状态 -->
      <view class="empty-reviews" v-if="reviews.length === 0">
        <text class="empty-text">暂无评价，充电后可评价</text>
      </view>
    </view>

    <!-- 底部占位（避免被固定栏遮挡） -->
    <view class="bottom-placeholder" />

    <!-- ================================================================
         底部操作栏
         ================================================================ -->
    <view class="bottom-bar">
      <view class="bar-btn bar-btn-nav" @tap="openNavigation">
        <text class="bar-btn-icon">&#x1F5FA;</text>
        <text class="bar-btn-text">导航前往</text>
      </view>
      <view class="bar-btn bar-btn-charge" @tap="scanCharge">
        <text class="bar-btn-icon">&#x26A1;</text>
        <text class="bar-btn-text">扫码充电</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { api } from '@/api/index'
import { useLocationStore } from '@/store/location'
import type { ChargingPoint, Review, Facility, TimelineSlot } from '@/types'

const location = useLocationStore()
const { latitude: locLat, longitude: locLng, gpsGranted: locReady } = storeToRefs(location)

const stationId = ref('')
const station = ref<any>({
  id: '',
  name: '',
  address: '',
  latitude: 39.9042,
  longitude: 116.4074,
  phone: '',
  openHours: '',
  rating: 0,
  reviewCount: 0,
  electricityPrice: 0,
  servicePrice: 0,
  distance: 0,
  type: '',
  is24h: true,
  freeParking: false,
  facilities: [] as string[],
})
const chargingPoints = ref<ChargingPoint[]>([])
const reviews = ref<Review[]>([])
const reviewTags = ref<{ label: string; count: number }[]>([])
const filterType = ref<'ALL' | 'DC' | 'AC'>('ALL')
const expandedPile = ref<string | null>(null)
const filterReviewTag = ref('')
// 用户位置来自全局 store
const userLocation = computed(() =>
  locReady.value ? { latitude: locLat.value, longitude: locLng.value } : null,
)

// ---------------------------------------------------------------------------
// 计算属性
// ---------------------------------------------------------------------------

/** 当前是否营业 */
const isOpen = computed(() => {
  const hours = station.value.openHours || ''
  if (hours.includes('24') || hours.includes('全天')) return true
  if (!hours || hours === '--') return true
  // 简单解析 "08:00-22:00" 格式
  const match = hours.match(/(\d{1,2}):?(\d{2})?\s*[-~]\s*(\d{1,2}):?(\d{2})?/)
  if (!match) return true
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = parseInt(match[1]) * 60 + parseInt(match[2] || '0')
  const endMinutes = parseInt(match[3]) * 60 + parseInt(match[4] || '0')
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
})

/** 按类型筛选后的桩列表 */
const filteredPoints = computed(() => {
  if (filterType.value === 'ALL') return chargingPoints.value
  return chargingPoints.value.filter(p => p.type === filterType.value)
})

/** 24h 电价时间轴 */
const priceTimeline = computed<TimelineSlot[]>(() => {
  const base = station.value.electricityPrice || 0.6
  const service = station.value.servicePrice || 0.4
  const result: TimelineSlot[] = []
  for (let h = 0; h < 24; h++) {
    let multiplier = 1
    let level = 'flat'
    let color = '#1677FF' // 平-蓝
    if ((h >= 10 && h <= 12) || (h >= 15 && h <= 17) || (h >= 19 && h <= 21)) {
      multiplier = 1.8
      level = 'peak'
      color = '#FF4D4F' // 峰-红
    } else if ((h >= 8 && h <= 9) || (h >= 13 && h <= 14) || (h >= 18 && h <= 18) || (h >= 22 && h <= 23)) {
      multiplier = 1
      level = 'flat'
      color = '#1677FF' // 平-蓝
    } else if (h >= 0 && h <= 6) {
      if (h >= 0 && h <= 3) {
        multiplier = 0.25
        level = 'deep-valley'
        color = '#237804' // 深谷-深绿
      } else {
        multiplier = 0.45
        level = 'valley'
        color = '#52C41A' // 谷-绿
      }
    } else {
      multiplier = 0.6
      level = 'valley'
      color = '#52C41A'
    }
    const price = ((base + service) * multiplier)
    result.push({ price: price.toFixed(2), level, color, hour: h })
  }
  return result
})

/** 当前时段名称 */
const currentPeriodName = computed(() => {
  const now = new Date().getHours()
  const slot = priceTimeline.value[now]
  const map: Record<string, string> = {
    peak: '峰时',
    flat: '平时',
    valley: '谷时',
    'deep-valley': '深谷',
  }
  return map[slot?.level] || '平时'
})

/** 当前时段颜色 */
const currentPeriodColor = computed(() => {
  const now = new Date().getHours()
  return priceTimeline.value[now]?.color || '#1677FF'
})

/** 当前电价 */
const currentPrice = computed(() => {
  const now = new Date().getHours()
  return priceTimeline.value[now]?.price || '0.00'
})

/** 省钱提示 */
const saveTip = computed(() => {
  const minSlot = priceTimeline.value.reduce((min, s) => Number(s.price) < Number(min.price) ? s : min, priceTimeline.value[0])
  return `建议在 ${minSlot.hour}:00-${minSlot.hour + 1}:00 充电，低至 &#xA5;${minSlot.price}/kWh`
})

/** 配套设施列表 */
const displayFacilities = computed<Facility[]>(() => {
  const all: Facility[] = [
    { icon: '&#x1F17F;', label: '停车场', available: true },
    { icon: '&#x1F6BF;', label: '卫生间', available: true },
    { icon: '&#x1F3EA;', label: '便利店', available: true },
    { icon: '&#x2615;', label: '休息室', available: true },
    { icon: '&#x1F6BF;', label: '洗车', available: true },
    { icon: '&#x1F37D;', label: '餐饮', available: true },
    { icon: '&#x1F4F6;', label: 'WiFi', available: true },
    { icon: '&#x1F6E0;', label: '工具', available: true },
  ]
  const enabled = station.value.facilities || []
  if (enabled.length === 0) return all
  return all.map(f => ({
    ...f,
    available: enabled.some((e: string) => f.label.includes(e) || e.includes(f.label)),
  }))
})

/** 显示的评价（最多3条，可按标签筛选） */
const displayReviews = computed(() => {
  let list = reviews.value
  if (filterReviewTag.value) {
    list = list.filter(r => r.tags?.includes(filterReviewTag.value))
  }
  return list.slice(0, 3)
})

/** 地图标记点 */
const mapMarkers = computed(() => {
  const markers: any[] = []
  if (station.value.latitude && station.value.longitude) {
    markers.push({
      id: 1,
      latitude: station.value.latitude,
      longitude: station.value.longitude,
      title: station.value.name,
      callout: { content: station.value.name, display: 'ALWAYS', borderRadius: 8, padding: 8 },
      iconPath: '/static/station-marker.png',
      width: 32,
      height: 32,
    })
  }
  if (userLocation.value) {
    markers.push({
      id: 2,
      latitude: userLocation.value.latitude,
      longitude: userLocation.value.longitude,
      title: '我的位置',
      iconPath: '/static/user-marker.png',
      width: 24,
      height: 24,
    })
  }
  return markers
})

/** 路线预览 */
const routePolyline = computed(() => {
  if (!userLocation.value || !station.value.latitude) return []
  return [{
    points: [
      { latitude: userLocation.value.latitude, longitude: userLocation.value.longitude },
      { latitude: station.value.latitude, longitude: station.value.longitude },
    ],
    color: '#07C160',
    width: 4,
    dottedLine: true,
    arrowLine: true,
  }]
})

// ---------------------------------------------------------------------------
// 方法
// ---------------------------------------------------------------------------

function statusCount(status: string): number {
  return chargingPoints.value.filter(p => p.status === status).length
}

function pointPrice(point: ChargingPoint): string {
  const elec = point.electricityPrice ?? station.value.electricityPrice ?? 0.6
  const svc = point.servicePrice ?? station.value.servicePrice ?? 0.4
  return (elec + svc).toFixed(2)
}

function pileActionLabel(status: string): string {
  const map: Record<string, string> = { free: '扫码充电', charging: '充电中', fault: '故障' }
  return map[status] || status
}

function togglePileExpand(id: string) {
  expandedPile.value = expandedPile.value === id ? null : id
}

function handlePileAction(point: ChargingPoint) {
  if (point.status === 'fault') {
    uni.showToast({ title: '该桩故障，请选择其他充电桩', icon: 'none' })
    return
  }
  if (point.status === 'charging') {
    uni.showToast({ title: '该桩正在充电中', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/charging-settings/index?stationId=${stationId.value}&deviceCode=${point.code}` })
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function formatTime(time: string): string {
  if (!time) return '--'
  const d = new Date(time)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}小时前`
  return `${d.getMonth() + 1}-${d.getDate()}`
}

function handleBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

function handleShare() {
  // #ifdef MP-WEIXIN
  // 微信小程序中由 onShareAppMessage 处理
  // #endif
  // #ifdef H5
  if (navigator.share) {
    navigator.share({
      title: station.value.name,
      text: `我在${station.value.name}充电，快来吧！`,
      url: window.location.href,
    }).catch(() => {})
  } else {
    uni.setClipboardData({
      data: window.location.href,
      success: () => uni.showToast({ title: '链接已复制', icon: 'success' }),
    })
  }
  // #endif
}

function copyAddress() {
  uni.setClipboardData({
    data: station.value.address || '',
    success: () => uni.showToast({ title: '地址已复制', icon: 'success' }),
  })
}

function openNavigation() {
  if (station.value.latitude && station.value.longitude) {
    // #ifdef MP-WEIXIN
    uni.openLocation({
      latitude: station.value.latitude,
      longitude: station.value.longitude,
      name: station.value.name,
      address: station.value.address,
    })
    // #endif
    // #ifdef H5
    window.open(
      `https://uri.amap.com/marker?position=${station.value.longitude},${station.value.latitude}&name=${encodeURIComponent(station.value.name)}`,
      '_blank',
    )
    // #endif
  } else {
    uni.showToast({ title: '暂无位置信息', icon: 'none' })
  }
}

function callPhone() {
  if (!station.value.phone) return
  uni.makePhoneCall({ phoneNumber: station.value.phone })
}

function scanCharge() {
  // #ifdef MP-WEIXIN
  uni.scanCode({
    success: (res) => {
      uni.navigateTo({ url: `/pages/charging-settings/index?stationId=${stationId.value}&deviceCode=${res.result}` })
    },
    fail: () => {
      uni.showToast({ title: '扫码失败', icon: 'none' })
    },
  })
  // #endif
  // #ifdef H5
  uni.navigateTo({ url: `/pages/charging-settings/index?stationId=${stationId.value}` })
  // #endif
}

function viewAllReviews() {
  // 预留：跳转全部评价页面
  uni.showToast({ title: '全部评价页面开发中', icon: 'none' })
}

// ---------------------------------------------------------------------------
// 生命周期
// ---------------------------------------------------------------------------

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.$page?.options || (currentPage as any)?.options || {}
  stationId.value = options.id || options.stationId || ''

  if (!stationId.value) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }

  // 获取用户位置（全局 store，已定位则直接复用）
  await location.ensureLocation()

  // 加载站点详情
  try {
    const detail = await api.getStationDetail(stationId.value)
    station.value = { ...station.value, ...detail }
  } catch (e) {
    console.error('加载站点详情失败:', e)
  }

  // 加载充电桩列表
  try {
    const points = await api.getChargingPoints(stationId.value)
    chargingPoints.value = Array.isArray(points) ? points : []
  } catch (e) {
    chargingPoints.value = []
  }

  // 加载评价
  try {
    const data = await api.getStationReviews(stationId.value)
    const list = Array.isArray(data) ? data : []
    reviews.value = list.map((r: any) => ({
      id: String(r.id || ''),
      nickname: r.nickname || r.userName || '匿名用户',
      avatar: r.avatar || '',
      rating: r.rating || 5,
      content: r.content || '',
      time: r.time || r.createdAt || '',
      likeCount: r.likeCount || 0,
      tags: r.tags || [],
    }))
    // 统计热门标签
    const tagMap = new Map<string, number>()
    for (const r of reviews.value) {
      for (const t of r.tags || []) {
        tagMap.set(t, (tagMap.get(t) || 0) + 1)
      }
    }
    reviewTags.value = Array.from(tagMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  } catch (e) {
    reviews.value = []
  }
})
</script>

<style scoped lang="scss">
/* ==========================================================================
   页面基础
   ========================================================================== */
.station-detail-page {
  background: #F6F7FB;
  min-height: 100vh;
  padding-bottom: 0;
}

/* ==========================================================================
   顶部地图区 — 400rpx
   ========================================================================== */
.map-section {
  position: relative;
  width: 100%;
  height: 400rpx;
  overflow: hidden;
}

.map-canvas {
  width: 100%;
  height: 100%;
}

.map-btn-back,
.map-btn-share {
  position: absolute;
  top: 24rpx;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.map-btn-back {
  left: 24rpx;
}

.map-btn-share {
  right: 24rpx;
}

.back-arrow {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.share-icon {
  font-size: 28rpx;
  color: #fff;
}

.map-gradient-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65), transparent);
  display: flex;
  align-items: flex-end;
  padding: 0 24rpx 16rpx;
  z-index: 5;
}

.map-station-info {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.map-station-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

.map-station-distance {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}

/* ==========================================================================
   站点信息卡片
   ========================================================================== */
.info-card {
  background: #fff;
  margin: 24rpx;
  margin-top: -8rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.info-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8rpx;
}

.info-station-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #1A1A1A;
  max-width: 60%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.info-rating {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.rating-star {
  font-size: 24rpx;
}

.rating-value {
  font-size: 28rpx;
  color: #FAAD14;
  font-weight: 700;
}

.rating-count {
  font-size: 22rpx;
  color: #999;
  margin-left: 4rpx;
}

/* 标签 */
.info-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
  flex-wrap: wrap;
}

.tag {
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  line-height: 1.5;
}

.tag-green {
  background: #E8F8EE;
  color: #07C160;
}

.tag-blue {
  background: #E6F7FF;
  color: #1677FF;
}

/* 地址行 */
.info-address-row {
  margin-top: 20rpx;
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.info-address {
  flex: 1;
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

.info-address-actions {
  display: flex;
  gap: 12rpx;
  flex-shrink: 0;
}

.mini-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  background: #F5F5F5;
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
}

.mini-btn-icon {
  font-size: 22rpx;
}

.mini-btn-text {
  font-size: 22rpx;
  color: #1677FF;
}

/* 信息行 */
.info-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-top: 1rpx solid #F5F5F5;
  margin-top: 8rpx;
}

.info-label {
  font-size: 26rpx;
  color: #999;
  width: 140rpx;
  flex-shrink: 0;
}

.info-value {
  font-size: 26rpx;
  color: #1A1A1A;
  flex: 1;
}

.text-closed {
  color: #FF4D4F;
}

.closed-badge {
  font-size: 20rpx;
  color: #FF4D4F;
  background: #FFF2F0;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  margin-left: 12rpx;
}

.info-phone-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
}

.mini-btn-call {
  display: flex;
  align-items: center;
  gap: 4rpx;
  background: #E8F8EE;
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
}

.call-icon {
  font-size: 22rpx;
}

.call-text {
  font-size: 22rpx;
  color: #07C160;
}

/* ==========================================================================
   通用 section 卡片
   ========================================================================== */
.section-card {
  background: #fff;
  margin: 0 24rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 20rpx;
  display: block;
}

/* ==========================================================================
   充电桩列表
   ========================================================================== */

/* 汇总条 */
.pile-summary {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #FAFAFA;
  border-radius: 12rpx;
  padding: 20rpx 0;
  margin-bottom: 20rpx;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.summary-num {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  font-family: 'DIN Alternate', monospace;
}

.summary-label {
  font-size: 22rpx;
  color: #999;
}

.summary-divider {
  width: 1rpx;
  height: 40rpx;
  background: #E8E8E8;
}

.text-success {
  color: #52C41A;
}

.text-charging {
  color: #1677FF;
}

.text-error {
  color: #FF4D4F;
}

/* 类型筛选 */
.pile-filter {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.filter-chip {
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  background: #F5F5F5;
  transition: all 0.2s;
}

.filter-chip.active {
  background: #07C160;
}

.chip-text {
  font-size: 24rpx;
  color: #666;
}

.filter-chip.active .chip-text {
  color: #fff;
}

/* 桩卡片 */
.pile-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.pile-card {
  background: #FAFAFA;
  border-radius: 12rpx;
  padding: 20rpx;
  transition: all 0.2s;
}

.pile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pile-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pile-status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.pile-status-dot.free {
  background: #52C41A;
  box-shadow: 0 0 8rpx rgba(82, 196, 26, 0.4);
}

.pile-status-dot.charging {
  background: #1677FF;
  box-shadow: 0 0 8rpx rgba(22, 119, 255, 0.4);
  animation: pulse-blue 1.5s ease-in-out infinite;
}

.pile-status-dot.fault {
  background: #FF4D4F;
  box-shadow: 0 0 8rpx rgba(255, 77, 79, 0.4);
}

@keyframes pulse-blue {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.pile-code {
  font-size: 28rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.pile-model {
  font-size: 22rpx;
  color: #999;
  background: #E8E8E8;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.pile-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.pile-price {
  font-size: 28rpx;
  font-weight: 700;
  color: #FAAD14;
}

.price-symbol {
  font-size: 22rpx;
}

.price-unit {
  font-size: 20rpx;
  font-weight: 400;
  color: #999;
}

.pile-action-btn {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  background: #07C160;
}

.pile-action-btn.fault {
  background: #E8E8E8;
}

.pile-action-btn.charging {
  background: #E6F7FF;
}

.action-btn-text {
  font-size: 22rpx;
  color: #fff;
  white-space: nowrap;
}

.pile-action-btn.fault .action-btn-text {
  color: #999;
}

.pile-action-btn.charging .action-btn-text {
  color: #1677FF;
}

/* 展开详情 */
.pile-detail {
  margin-top: 16rpx;
}

.detail-divider {
  height: 1rpx;
  background: #E8E8E8;
  margin-bottom: 16rpx;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx 24rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 22rpx;
  color: #999;
}

.detail-value {
  font-size: 22rpx;
  color: #1A1A1A;
  font-weight: 500;
}

.usage-bar {
  margin-top: 12rpx;
}

.usage-bar-track {
  height: 8rpx;
  background: #E8E8E8;
  border-radius: 4rpx;
  overflow: hidden;
}

.usage-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #07C160, #FAAD14);
  border-radius: 4rpx;
  transition: width 0.3s;
}

.empty-pile {
  padding: 40rpx;
  text-align: center;
}

.empty-text {
  font-size: 26rpx;
  color: #999;
}

/* ==========================================================================
   电价详情卡片
   ========================================================================== */

.current-price-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FAFAFA;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 20rpx;
}

.current-price-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.current-label {
  font-size: 24rpx;
  color: #999;
}

.current-period {
  font-size: 28rpx;
  font-weight: 700;
}

.current-price-right {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.current-price-num {
  font-size: 36rpx;
  font-weight: 700;
  color: #FAAD14;
  font-family: 'DIN Alternate', monospace;
}

.current-price-unit {
  font-size: 22rpx;
  color: #999;
}

/* 时间轴色块 */
.timeline-wrapper {
  margin-bottom: 16rpx;
}

.timeline-row {
  display: flex;
  height: 80rpx;
  border-radius: 8rpx;
  overflow: hidden;
}

.timeline-block {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4rpx;
  opacity: 0.85;
  transition: opacity 0.2s;
  position: relative;
}

.timeline-block:first-child {
  border-radius: 8rpx 0 0 8rpx;
}

.timeline-block:last-child {
  border-radius: 0 8rpx 8rpx 0;
}

.block-price {
  font-size: 16rpx;
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  padding: 6rpx 0;
}

.tl-label {
  font-size: 20rpx;
  color: #999;
}

/* 图例 */
.price-legend {
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 4rpx;
}

.legend-text {
  font-size: 22rpx;
  color: #666;
}

/* 省钱提示 */
.save-tip {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #FFFBE6;
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
}

.save-tip-icon {
  font-size: 28rpx;
}

.save-tip-text {
  font-size: 24rpx;
  color: #FAAD14;
  flex: 1;
}

/* ==========================================================================
   配套设施 — 2×4 图标网格
   ========================================================================== */
.facilities-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx 0;
}

.facility-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.facility-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #F0FFF4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.facility-icon-wrap.unavailable {
  background: #F5F5F5;
  opacity: 0.5;
}

.facility-icon {
  font-size: 36rpx;
}

.facility-label {
  font-size: 22rpx;
  color: #666;
}

.facility-label.unavailable {
  color: #ccc;
}

/* ==========================================================================
   用户评价区
   ========================================================================== */
.review-section {
  margin-bottom: 24rpx;
}

.review-overview {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.review-score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40rpx;
}

.review-score {
  font-size: 56rpx;
  font-weight: 700;
  color: #FAAD14;
  font-family: 'DIN Alternate', monospace;
}

.review-stars-row {
  display: flex;
  gap: 2rpx;
  margin-top: 4rpx;
}

.star-icon {
  font-size: 24rpx;
  color: #E8E8E8;
}

.star-icon.filled {
  color: #FAAD14;
}

.review-total {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 热门标签 */
.review-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.review-tag {
  padding: 6rpx 18rpx;
  border-radius: 24rpx;
  background: #F5F5F5;
}

.review-tag.active {
  background: #E8F8EE;
}

.review-tag-text {
  font-size: 22rpx;
  color: #666;
}

.review-tag.active .review-tag-text {
  color: #07C160;
  font-weight: 500;
}

/* 评价卡片 */
.review-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.review-card {
  background: #FAFAFA;
  border-radius: 12rpx;
  padding: 20rpx;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-user-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.review-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #E8E8E8;
}

.review-nickname {
  font-size: 26rpx;
  font-weight: 600;
  color: #1A1A1A;
}

.review-rating-stars {
  display: flex;
  gap: 2rpx;
}

.mini-star {
  font-size: 20rpx;
  color: #E8E8E8;
}

.mini-star.filled {
  color: #FAAD14;
}

.review-content {
  font-size: 26rpx;
  color: #666;
  margin-top: 12rpx;
  display: block;
  line-height: 1.6;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.review-time {
  font-size: 22rpx;
  color: #ccc;
}

.review-like {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.like-icon {
  font-size: 22rpx;
}

.like-count {
  font-size: 22rpx;
  color: #999;
}

/* 查看全部 */
.view-all-reviews {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 20rpx;
  padding: 16rpx 0;
  border-top: 1rpx solid #F5F5F5;
}

.view-all-text {
  font-size: 26rpx;
  color: #1677FF;
}

.view-all-arrow {
  font-size: 24rpx;
  color: #1677FF;
}

.empty-reviews {
  padding: 40rpx;
  text-align: center;
}

/* ==========================================================================
   底部操作栏
   ========================================================================== */
.bottom-placeholder {
  height: 160rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.bar-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: 48rpx;
  padding: 20rpx 0;
}

.bar-btn-nav {
  background: #fff;
  border: 2rpx solid #07C160;
}

.bar-btn-nav .bar-btn-text {
  color: #07C160;
  font-size: 28rpx;
  font-weight: 600;
}

.bar-btn-charge {
  flex: 2;
  background: linear-gradient(135deg, #07C160, #06AD56);
}

.bar-btn-charge .bar-btn-text {
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
}

.bar-btn-icon {
  font-size: 28rpx;
}

.bar-btn-nav .bar-btn-icon {
  color: #07C160;
}

.bar-btn-charge .bar-btn-icon {
  color: #fff;
}

/* ==========================================================================
   辅助工具类
   ========================================================================== */
.ellipsis-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}
</style>
