<template>
  <view class="index-page">
    <!-- 1. 顶部导航栏 -->
    <CustomNavBar
      :show-location="true"
      :show-scan="false"
      :unread-count="unreadCount"
      :default-city="currentCity"
      @scan="scanCode"
      @search="goToSearch"
      @location="switchCity"
      @messages="goToMessages"
    />

    <!-- 2. 充电状态卡 / 待支付提醒（条件渲染，置顶） -->
    <view v-if="chargingSession" class="charging-status-card" @tap="goToCharging">
      <view class="charging-pulse-bg" />
      <view class="charging-card-body">
        <view class="charging-card-left">
          <view class="charging-card-icon">
            <text class="charging-bolt">⚡</text>
          </view>
          <view class="charging-card-info">
            <view class="charging-tag-row">
              <view class="charging-tag-dot" />
              <text class="charging-tag-text">充电中</text>
            </view>
            <text class="charging-station-name">{{ chargingSession.stationName }}</text>
            <text class="charging-eta">预计 {{ estimatedFullTime }} 充满</text>
          </view>
        </view>
        <view class="charging-card-right">
          <view class="soc-wrap">
            <text class="soc-num">{{ Math.floor(chargingSession.currentSoc) }}</text>
            <text class="soc-unit">%</text>
          </view>
          <text class="charging-power">{{ chargingSession.power.toFixed(1) }}kW</text>
          <view class="charging-detail-btn">
            <text class="detail-btn-text">查看详情</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="pendingPayment" class="pending-payment-card" @tap="goToOrderDetail(pendingPayment.id)">
      <view class="pending-card-body">
        <view class="pending-card-left">
          <text class="pending-icon">💳</text>
          <view class="pending-info">
            <text class="pending-title">待支付订单</text>
            <text class="pending-station">{{ pendingPayment.stationName }}</text>
          </view>
        </view>
        <view class="pending-card-right">
          <text class="pending-amount">¥{{ pendingPayment.totalAmount.toFixed(2) }}</text>
          <view class="pending-pay-btn">
            <text class="pay-btn-text">立即支付</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 3. 金刚区（左右滑动分页，按常用性排序） -->
    <view class="diamond-section">
      <swiper
        class="diamond-swiper"
        :indicator-dots="true"
        indicator-color="rgba(0,0,0,0.15)"
        indicator-active-color="#07C160"
        :duration="300"
        :style="{ height: '340rpx' }"
      >
        <!-- 第1页：高频核心功能 -->
        <swiper-item>
          <view class="diamond-grid">
            <view class="diamond-item" @tap="scanCode">
              <view class="diamond-icon-wrap diamond-icon-scan">
                <text class="diamond-emoji">⚡</text>
              </view>
              <text class="diamond-label">扫码充电</text>
            </view>
            <view class="diamond-item" @tap="goToOrders">
              <view class="diamond-icon-wrap diamond-icon-order">
                <text class="diamond-emoji">📋</text>
              </view>
              <text class="diamond-label">充电记录</text>
            </view>
            <view class="diamond-item" @tap="goToMap">
              <view class="diamond-icon-wrap diamond-icon-nearby">
                <text class="diamond-emoji">📍</text>
              </view>
              <text class="diamond-label">附近桩站</text>
            </view>
            <view class="diamond-item" @tap="goToMap">
              <view class="diamond-icon-wrap diamond-icon-map">
                <text class="diamond-emoji">🗺</text>
              </view>
              <text class="diamond-label">充电地图</text>
            </view>
            <view class="diamond-item" @tap="goToWallet">
              <view class="diamond-icon-wrap diamond-icon-wallet">
                <text class="diamond-emoji">💰</text>
              </view>
              <text class="diamond-label">充值</text>
            </view>
            <view class="diamond-item" @tap="goToCoupons">
              <view class="diamond-icon-wrap diamond-icon-coupon">
                <text class="diamond-emoji">🎫</text>
              </view>
              <text class="diamond-label">优惠券</text>
            </view>
          </view>
        </swiper-item>
        <!-- 第2页：中频服务功能 -->
        <swiper-item>
          <view class="diamond-grid">
            <view class="diamond-item" @tap="goToMembership">
              <view class="diamond-icon-wrap diamond-icon-member">
                <text class="diamond-emoji">👑</text>
              </view>
              <text class="diamond-label">会员中心</text>
            </view>
            <view class="diamond-item" @tap="goToVehicles">
              <view class="diamond-icon-wrap diamond-icon-vehicle">
                <text class="diamond-emoji">🚗</text>
              </view>
              <text class="diamond-label">我的车辆</text>
            </view>
            <view class="diamond-item" @tap="goToFavorites">
              <view class="diamond-icon-wrap diamond-icon-fav">
                <text class="diamond-emoji">❤️</text>
              </view>
              <text class="diamond-label">收藏站点</text>
            </view>
            <view class="diamond-item" @tap="goToMessages">
              <view class="diamond-icon-wrap diamond-icon-msg">
                <text class="diamond-emoji">🔔</text>
              </view>
              <text class="diamond-label">消息中心</text>
            </view>
            <view class="diamond-item" @tap="goToCustomerService">
              <view class="diamond-icon-wrap diamond-icon-service">
                <text class="diamond-emoji">📞</text>
              </view>
              <text class="diamond-label">在线客服</text>
            </view>
            <view class="diamond-item" @tap="goToReport">
              <view class="diamond-icon-wrap diamond-icon-report">
                <text class="diamond-emoji">📊</text>
              </view>
              <text class="diamond-label">充电报告</text>
            </view>
          </view>
        </swiper-item>
        <!-- 第3页：低频辅助功能 -->
        <swiper-item>
          <view class="diamond-grid">
            <view class="diamond-item" @tap="goToHelp">
              <view class="diamond-icon-wrap diamond-icon-help">
                <text class="diamond-emoji">❓</text>
              </view>
              <text class="diamond-label">帮助中心</text>
            </view>
            <view class="diamond-item" @tap="goToInvoice">
              <view class="diamond-icon-wrap diamond-icon-invoice">
                <text class="diamond-emoji">📄</text>
              </view>
              <text class="diamond-label">发票管理</text>
            </view>
            <view class="diamond-item" @tap="goToPoints">
              <view class="diamond-icon-wrap diamond-icon-points">
                <text class="diamond-emoji">🎯</text>
              </view>
              <text class="diamond-label">积分商城</text>
            </view>
            <view class="diamond-item" @tap="goToFeedback">
              <view class="diamond-icon-wrap diamond-icon-feedback">
                <text class="diamond-emoji">💬</text>
              </view>
              <text class="diamond-label">意见反馈</text>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 4. Banner 轮播区域 -->
    <view class="banner-section">
      <swiper
        class="banner-swiper"
        :indicator-dots="true"
        indicator-color="rgba(0,0,0,0.2)"
        indicator-active-color="#07C160"
        :autoplay="true"
        :interval="4000"
        :duration="500"
        circular
      >
        <swiper-item v-for="banner in bannerList" :key="banner.id">
          <view class="banner-card" :style="{ background: banner.bgColor }">
            <view class="banner-content">
              <text class="banner-title">{{ banner.title }}</text>
              <text class="banner-desc">{{ banner.desc }}</text>
            </view>
            <text class="banner-emoji">{{ banner.emoji }}</text>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 5. 快捷入口行 -->
    <view class="quick-entry-section">
      <view class="quick-entry-row">
        <view class="quick-entry-item" @tap="goToCoupons">
          <text class="quick-entry-icon">🎫</text>
          <text class="quick-entry-text">领券中心</text>
        </view>
        <view class="quick-entry-divider" />
        <view class="quick-entry-item" @tap="goToMembership">
          <text class="quick-entry-icon">👑</text>
          <text class="quick-entry-text">会员权益</text>
        </view>
        <view class="quick-entry-divider" />
        <view class="quick-entry-item" @tap="goToHelp">
          <text class="quick-entry-icon">❓</text>
          <text class="quick-entry-text">帮助中心</text>
        </view>
      </view>
    </view>

    <!-- 6. 附近充电站列表 -->
    <view class="section station-section">
      <view class="section-header">
        <text class="section-title">附近充电站</text>
        <view class="section-more-wrap" @tap="goToMap">
          <text class="section-more">查看全部</text>
          <text class="section-arrow">›</text>
        </view>
      </view>
      <!-- 加载骨架屏（API 未返回时立即显示） -->
      <view v-if="stationsLoading" class="station-skeleton">
        <view class="skeleton-card" v-for="i in 3" :key="i">
          <view class="skeleton-line skeleton-title"></view>
          <view class="skeleton-line skeleton-sub"></view>
          <view class="skeleton-line skeleton-sub short"></view>
        </view>
      </view>
      <!-- 站点列表 -->
      <view v-else class="station-list">
        <view
          v-for="station in nearbyStations"
          :key="station.id"
          class="station-card"
          @tap="goToStation(station.id)"
        >
          <!-- 第一行：站名 + 距离 -->
          <view class="station-card-header">
            <view class="station-name-row">
              <text class="station-name">{{ station.name }}</text>
              <view class="station-distance-badge">
                <text class="station-distance-text">{{ formatDistance(station.distance) }}</text>
              </view>
            </view>
          </view>
          <!-- 第二行：地址 -->
          <view class="station-address-row">
            <text class="station-address">{{ station.address || '暂无地址信息' }}</text>
          </view>
          <!-- 第三行：标签组 -->
          <view class="station-card-tags">
            <view v-if="station.fastCharge !== false" class="station-tag tag-fast">
              <text class="tag-text">快充</text>
            </view>
            <view v-if="station.slowCharge" class="station-tag tag-slow">
              <text class="tag-text">慢充</text>
            </view>
            <view class="station-tag tag-24h">
              <text class="tag-text">24h</text>
            </view>
            <view v-if="station.hasFreeP" class="station-tag tag-parking">
              <text class="tag-text">免费停车</text>
            </view>
            <view v-if="station.isNew" class="station-tag tag-new">
              <text class="tag-text">新站</text>
            </view>
            <view v-if="station.hasPromo" class="station-tag tag-promo">
              <text class="tag-text">优惠中</text>
            </view>
          </view>
          <!-- 第四行：电价 + 空闲 -->
          <view class="station-card-footer">
            <view class="station-price-wrap">
              <text class="price-symbol">¥</text>
              <text class="price-value">{{ (station.electricityPrice + station.servicePrice).toFixed(2) }}</text>
              <text class="price-unit">/度</text>
            </view>
            <view class="station-avail-wrap">
              <text :class="['avail-label', station.availableCount === 0 ? 'avail-empty' : '']">
                空闲 {{ station.availableCount }}/{{ station.totalCount }}
              </text>
            </view>
          </view>
        </view>
      </view>
      <!-- 底部状态栏：始终显示 -->
      <view class="load-more">
        <text v-if="stationsLoading" class="load-more-text loading-dots">加载充电站中</text>
        <text v-else-if="loadingMore" class="load-more-text">加载中...</text>
        <text v-else-if="!allLoaded && nearbyStations.length > 0" class="load-more-text" @tap="loadMoreStations">加载更多</text>
        <text v-else-if="allLoaded && nearbyStations.length > 0" class="load-more-text load-more-end">— 没有更多了 —</text>
        <text v-else-if="allLoaded && nearbyStations.length === 0" class="load-more-text load-more-end">附近暂无充电站</text>
      </view>
    </view>

    <!-- 底部安全区占位 -->
    <view class="safe-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow, onReachBottom } from '@dcloudio/uni-app'
import CustomNavBar from '@/components/CustomNavBar.vue'
import { api, type Station, type UserInfo, type ChargingSession, type Order } from '@/api/index'

// ===== 缓存工具 =====
const CACHE_KEYS = {
  USER_INFO: 'miniapp_user_info_cache',
  STATIONS: 'miniapp_stations_cache',
} as const

function getCachedData<T>(key: string, ttl?: number): T | null {
  try {
    const raw = uni.getStorageSync(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (ttl && Date.now() - timestamp > ttl) return null
    return data as T
  } catch {
    return null
  }
}

function setCachedData<T>(key: string, data: T): void {
  try {
    uni.setStorageSync(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // 缓存写入失败不阻塞主流程
  }
}

// ===== 状态数据 =====
const cachedUser = getCachedData<UserInfo>(CACHE_KEYS.USER_INFO)

const userInfo = ref<UserInfo>(
  cachedUser || { id: '', nickname: '用户', phone: '', avatar: '', balance: 0, couponCount: 0 },
)
const nearbyStations = ref<Station[]>([])
const currentPage = ref(1)
const pageSize = 5
const allLoaded = ref(false)
const loadingMore = ref(false)
const stationsLoading = ref(true)
const chargingSession = ref<ChargingSession | null>(null)
const pendingPayment = ref<Order | null>(null)
const unreadCount = ref(0)
const userLat = ref(0)
const userLng = ref(0)
const gpsGranted = ref(false) // 是否获取到真实GPS（非降级坐标）
const currentCity = ref('定位中...')

// Haversine 公式计算两点距离（米）
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 获取当前GPS定位
async function getCurrentLocation() {
  try {
    // #ifdef H5
    // H5 模式使用浏览器 Geolocation API（Promise 包装，确保 await 真正等待定位完成）
    if (navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            userLat.value = pos.coords.latitude
            userLng.value = pos.coords.longitude
            gpsGranted.value = true
            await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
            resolve()
          },
          () => {
            fallbackLocation()
            resolve()
          },
          { enableHighAccuracy: true, timeout: 8000 }
        )
      })
    } else {
      fallbackLocation()
    }
    return
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
    gpsGranted.value = true
    await reverseGeocode(loc.latitude, loc.longitude)
    // #endif
  } catch {
    fallbackLocation()
  }
}

// 逆地理编码获取城市名
async function reverseGeocode(lat: number, lng: number) {
  try {
    const res: any = await new Promise((resolve, reject) => {
      uni.request({
        url: `https://restapi.amap.com/v3/geocode/regeo?key=c86443d9a8cd72e5a26af987f46345ca&location=${lng},${lat}`,
        success: resolve,
        fail: reject,
      })
    })
    const city = res.data?.regeocode?.addressComponent?.city
    currentCity.value = (typeof city === 'string' && city) ? city.replace(/市$/, '') || '未知城市' : '未知城市'
  } catch {
    currentCity.value = '未知城市'
  }
}

// 定位降级
function fallbackLocation() {
  userLat.value = 39.92
  userLng.value = 116.46
  currentCity.value = '北京'
}
// 金刚区导航函数
const goToWallet = () => uni.navigateTo({ url: '/pages/wallet/index' })
const goToReport = () => uni.showToast({ title: '充电报告开发中', icon: 'none' })
const goToVehicles = () => uni.navigateTo({ url: '/pages/vehicles/index' })
const goToInvoice = () => uni.navigateTo({ url: '/pages/invoice/index' })
const goToPoints = () => uni.navigateTo({ url: '/pages/points/index' })
const goToFeedback = () => uni.showToast({ title: '意见反馈开发中', icon: 'none' })

// 加载充电站（分页）
async function loadStations(page: number): Promise<Station[]> {
  const params: any = {
    page,
    size: pageSize,
  }
  // 只有真实 GPS 授权后才传距离参数（降级坐标不传，避免过滤掉所有站点）
  if (gpsGranted.value && userLat.value && userLng.value) {
    params.latitude = userLat.value
    params.longitude = userLng.value
    params.radius = 50
  }

  const result = await api.getStations(params).catch(() => [])

  const list = result
    .filter((s: any) => s.latitude && s.longitude)
    .map((s: any) => ({
      ...s,
      distance: (userLat.value && userLng.value)
        ? calcDistance(userLat.value, userLng.value, s.latitude, s.longitude)
        : 999999,
      availableCount: s.availablePorts ?? s.availableCount ?? 0,
      totalCount: s.totalPorts ?? s.deviceCount ?? 0,
      electricityPrice: s.electricityPrice ?? 0,
      servicePrice: s.servicePrice ?? 0,
    }))
    .filter((s: any) => !gpsGranted.value || s.distance <= 50000) // GPS 授权后按 50km 过滤

  list.sort((a: Station, b: Station) => a.distance - b.distance)

  if (list.length < pageSize) {
    allLoaded.value = true
  }

  return list
}

// 加载更多充电站（触底/点击触发）
function loadMoreStations() {
  if (loadingMore.value || allLoaded.value) return
  loadingMore.value = true
  currentPage.value++
  loadStations(currentPage.value).then(list => {
    nearbyStations.value.push(...list)
    loadingMore.value = false
    setCachedData(CACHE_KEYS.STATIONS, nearbyStations.value)
  })
}

// 页面触底自动加载更多
onReachBottom(() => {
  loadMoreStations()
})

// ===== 数据加载 =====

// Banner 数据
const bannerList = ref([
  { id: '1', title: '新用户专享', desc: '首次充电立减5元', emoji: '🎁', bgColor: 'linear-gradient(135deg, #07C160, #06AD56)' },
  { id: '2', title: '充值满赠', desc: '充100送15，多充多送', emoji: '💰', bgColor: 'linear-gradient(135deg, #1677FF, #0958D9)' },
  { id: '3', title: '绿色出行', desc: '充电积分双倍，兑换好礼', emoji: '🌱', bgColor: 'linear-gradient(135deg, #52C41A, #389E0D)' },
])

// 充电预计充满时间
const estimatedFullTime = computed(() => {
  if (!chargingSession.value) return ''
  const remainingSoc = 100 - chargingSession.value.currentSoc
  if (remainingSoc <= 0) return '即将'
  const power = chargingSession.value.power || 60
  const estimatedMinutes = Math.round((remainingSoc / 100) * 60 * (60 / power))
  if (estimatedMinutes < 60) return `${estimatedMinutes}分钟`
  const hours = Math.floor(estimatedMinutes / 60)
  const mins = estimatedMinutes % 60
  return `${hours}小时${mins}分钟`
})

// 格式化距离
function formatDistance(meters: number): string {
  if (!meters || meters <= 0) return ''
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

// 首屏核心：先定位，再加载充电站
onMounted(async () => {
  // 定位中状态：充电站暂不加载，等待定位完成后再查询
  stationsLoading.value = true

  // 先完成定位（内部已有 8s 超时 + 降级兜底，不会无限阻塞）
  await getCurrentLocation()

  // 定位完成（成功或降级）后，再加载充电站
  try {
    const firstPage = await loadStations(1)
    nearbyStations.value = firstPage
    setCachedData(CACHE_KEYS.STATIONS, firstPage)
  } catch (error) {
    console.error('加载充电站失败:', error)
  } finally {
    stationsLoading.value = false
  }

  // 延迟 200ms 加载用户信息，不阻塞首屏渲染
  setTimeout(async () => {
    try {
      const user = await api.getUserInfo().catch(() => null)
      if (user) {
        userInfo.value = user
        setCachedData(CACHE_KEYS.USER_INFO, user)
      }
    } catch {
      // 加载用户信息失败，静默处理
    }
  }, 200)

  // 延迟 500ms 检查待支付订单
  setTimeout(async () => {
    try {
      const orders = await api.getOrders({ status: 'pending_payment' })
      if (orders && orders.length > 0) {
        pendingPayment.value = orders[0]
      }
    } catch {
      // 无待支付订单，正常
    }
  }, 500)
})

// 每次页面可见时检查充电状态
onShow(async () => {
  try {
    const session = await api.getChargingStatus('current')
    if (session && (session as any).status === 'charging') {
      chargingSession.value = session as ChargingSession
    } else {
      chargingSession.value = null
    }
  } catch {
    // 没有充电中会话，正常
  }
})

// ===== 导航方法 =====
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

const goToSearch = () => {
  uni.navigateTo({ url: '/pages/search/index/index' })
}

const switchCity = () => {
  uni.showToast({ title: '城市切换功能开发中', icon: 'none' })
}

const goToMessages = () => {
  uni.navigateTo({ url: '/pages/messages/index' })
}

const goToMap = () => {
  uni.switchTab({ url: '/pages/map/index' })
}

const goToStation = (id: string) => {
  uni.switchTab({ url: '/pages/map/index' })
  setTimeout(() => {
    uni.$emit('selectStation', id)
  }, 500)
}

const goToCharging = () => {
  uni.navigateTo({ url: '/pages/charging/index' })
}

const goToOrders = () => {
  uni.switchTab({ url: '/pages/order/index' })
}

const goToOrderDetail = (id: string) => {
  uni.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
}

const goToMembership = () => {
  uni.navigateTo({ url: '/pages/membership/index' })
}

const goToCoupons = () => {
  uni.navigateTo({ url: '/pages/coupon/index' })
}

const goToHelp = () => {
  uni.showToast({ title: '帮助中心开发中', icon: 'none' })
}

const goToFavorites = () => {
  uni.navigateTo({ url: '/pages/favorites/index' })
}

const goToCustomerService = () => {
  uni.showToast({ title: '客服功能开发中', icon: 'none' })
}

const goToReserve = () => {
  uni.showToast({ title: '预约充电开发中', icon: 'none' })
}

const goToRepair = () => {
  uni.showToast({ title: '报修功能开发中', icon: 'none' })
}

// 更多服务已改为 swiper 分页，无需 toggle
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.index-page {
  min-height: 100vh;
  background: $color-bg-page;
  padding-bottom: $spacing-lg;
}

/* ===== 2. 充电状态卡 — 绿色渐变 ===== */
.charging-status-card {
  margin: $spacing-sm $spacing-lg $spacing-lg;
  background: linear-gradient(135deg, $color-primary, $color-primary-dark);
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  position: relative;
  overflow: hidden;
}

.charging-pulse-bg {
  position: absolute;
  top: -30rpx;
  right: -30rpx;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.4); opacity: 0.15; }
}

.charging-card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  position: relative;
  z-index: 1;
}

.charging-card-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.charging-card-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.charging-bolt {
  font-size: $font-size-3xl;
}

.charging-card-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.charging-tag-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.charging-tag-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #AFFFBE;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.charging-tag-text {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-inverse;
}

.charging-station-name {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.85);
  max-width: 280rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.charging-eta {
  font-size: $font-size-xs;
  color: rgba(255, 255, 255, 0.65);
}

.charging-card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.soc-wrap {
  display: flex;
  align-items: baseline;
}

.soc-num {
  font-size: $font-size-5xl;
  font-weight: $font-weight-bold;
  color: $color-text-inverse;
  font-family: $font-family-number;
}

.soc-unit {
  font-size: $font-size-lg;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 4rpx;
}

.charging-power {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.7);
}

.charging-detail-btn {
  margin-top: 8rpx;
  background: rgba(255, 255, 255, 0.25);
  border-radius: $radius-full;
  padding: 6rpx 20rpx;
}

.detail-btn-text {
  font-size: $font-size-xs;
  color: $color-text-inverse;
}

/* ===== 待支付提醒卡 — 橙色 ===== */
.pending-payment-card {
  margin: $spacing-sm $spacing-lg $spacing-lg;
  background: linear-gradient(135deg, #FAAD14, #D48806);
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  overflow: hidden;
}

.pending-card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
}

.pending-card-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.pending-icon {
  font-size: $font-size-3xl;
}

.pending-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.pending-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-inverse;
}

.pending-station {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.85);
}

.pending-card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.pending-amount {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $color-text-inverse;
  font-family: $font-family-number;
}

.pending-pay-btn {
  background: rgba(255, 255, 255, 0.9);
  border-radius: $radius-full;
  padding: 8rpx 28rpx;
}

.pay-btn-text {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: #D48806;
}

/* ===== 3. 金刚区（swiper 分页） ===== */
.diamond-section {
  margin: 0 $spacing-lg $spacing-lg;
  background: $color-bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg $spacing-lg $spacing-md;
  box-shadow: $shadow-sm;
}

.diamond-swiper {
  height: 340rpx;
}

.diamond-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-xl 0;
  padding: 0 $spacing-xs;
}

.diamond-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
}

.diamond-item:active {
  transform: scale(0.95);
}

.diamond-icon-wrap {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.diamond-emoji {
  font-size: $font-size-3xl;
}

// 金刚区图标背景色（每个功能独立配色）
.diamond-icon-scan    { background: linear-gradient(135deg, rgba(#07C160, 0.18), rgba(#07C160, 0.08)); }
.diamond-icon-order   { background: linear-gradient(135deg, rgba(#FAAD14, 0.18), rgba(#FAAD14, 0.08)); }
.diamond-icon-nearby  { background: linear-gradient(135deg, rgba(#1677FF, 0.18), rgba(#1677FF, 0.08)); }
.diamond-icon-map     { background: linear-gradient(135deg, rgba(#00BCD4, 0.18), rgba(#00BCD4, 0.08)); }
.diamond-icon-wallet  { background: linear-gradient(135deg, rgba(#FF6B35, 0.18), rgba(#FF6B35, 0.08)); }
.diamond-icon-coupon  { background: linear-gradient(135deg, rgba(#FF4D4F, 0.18), rgba(#FF4D4F, 0.08)); }
.diamond-icon-member  { background: linear-gradient(135deg, rgba(#722ED1, 0.18), rgba(#722ED1, 0.08)); }
.diamond-icon-vehicle { background: linear-gradient(135deg, rgba(#13C2C2, 0.18), rgba(#13C2C2, 0.08)); }
.diamond-icon-fav     { background: linear-gradient(135deg, rgba(#EB2F96, 0.18), rgba(#EB2F96, 0.08)); }
.diamond-icon-msg     { background: linear-gradient(135deg, rgba(#1677FF, 0.18), rgba(#1677FF, 0.08)); }
.diamond-icon-service { background: linear-gradient(135deg, rgba(#52C41A, 0.18), rgba(#52C41A, 0.08)); }
.diamond-icon-report  { background: linear-gradient(135deg, rgba(#2F54EB, 0.18), rgba(#2F54EB, 0.08)); }
.diamond-icon-help    { background: linear-gradient(135deg, rgba(#FAAD14, 0.18), rgba(#FAAD14, 0.08)); }
.diamond-icon-invoice { background: linear-gradient(135deg, rgba(#597EF7, 0.18), rgba(#597EF7, 0.08)); }
.diamond-icon-points  { background: linear-gradient(135deg, rgba(#FF6B35, 0.18), rgba(#FF6B35, 0.08)); }
.diamond-icon-feedback{ background: linear-gradient(135deg, rgba(#8C8C8C, 0.18), rgba(#8C8C8C, 0.08)); }
.diamond-icon-more    { background: linear-gradient(135deg, rgba(#8C8C8C, 0.18), rgba(#8C8C8C, 0.08)); }

.diamond-label {
  font-size: $font-size-sm;
  color: $color-text-primary;
  font-weight: $font-weight-medium;
}

/* ===== 4. Banner 轮播 ===== */

/* ===== 4. Banner 轮播 ===== */
.banner-section {
  margin: 0 $spacing-lg $spacing-lg;
}

.banner-swiper {
  height: 200rpx;
  border-radius: $radius-lg;
  overflow: hidden;
}

.banner-card {
  width: 100%;
  height: 200rpx;
  border-radius: $radius-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 $spacing-xl;
  box-sizing: border-box;
}

.banner-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.banner-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-inverse;
}

.banner-desc {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.85);
}

.banner-emoji {
  font-size: 80rpx;
}

/* ===== 5. 快捷入口行 ===== */
.quick-entry-section {
  margin: 0 $spacing-lg $spacing-lg;
  background: $color-bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  overflow: hidden;
}

.quick-entry-row {
  display: flex;
  align-items: center;
}

.quick-entry-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-lg 0;
}

.quick-entry-item:active {
  background: $color-bg-grey;
}

.quick-entry-icon {
  font-size: $font-size-2xl;
}

.quick-entry-text {
  font-size: $font-size-base;
  color: $color-text-primary;
  font-weight: $font-weight-medium;
}

.quick-entry-divider {
  width: 1rpx;
  height: 40rpx;
  background: $color-bg-grey;
}

/* ===== 6. 附近充电站 & 通用 Section ===== */
.section {
  margin: 0 $spacing-lg $spacing-lg;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.section-more-wrap {
  display: flex;
  align-items: center;
}

.section-more {
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.section-arrow {
  font-size: $font-size-lg;
  color: $color-text-tertiary;
  margin-left: 4rpx;
}

.station-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

/* 骨架屏 */
.station-skeleton {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.skeleton-card {
  background: $color-bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
}

.skeleton-line {
  height: 24rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 400% 100%;
  border-radius: 6rpx;
  animation: shimmer 1.5s ease infinite;
  margin-bottom: $spacing-sm;
}

.skeleton-title {
  width: 60%;
  height: 28rpx;
}

.skeleton-sub {
  width: 80%;
}

.skeleton-sub.short {
  width: 40%;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.load-more {
  text-align: center;
  padding: $spacing-md 0;
}

.load-more-text {
  font-size: $font-size-sm;
  color: $color-primary;
}

.load-more-end {
  color: $color-text-tertiary;
}

.loading-dots::after {
  content: '';
  animation: dots 1.5s steps(3, end) infinite;
}

@keyframes dots {
  0% { content: ''; }
  33% { content: '.'; }
  66% { content: '..'; }
  100% { content: '...'; }
}

.station-card {
  background: $color-bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
  transition: transform $transition-fast;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.station-card:active {
  transform: scale(0.98);
}

.station-card-header {
  display: flex;
  align-items: center;
}

.station-name-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex: 1;
  min-width: 0;
}

.station-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.station-distance-badge {
  flex-shrink: 0;
  background: rgba($color-primary, 0.1);
  border-radius: $radius-full;
  padding: 2rpx 14rpx;
}

.station-distance-text {
  font-size: $font-size-xs;
  color: $color-primary;
  font-weight: $font-weight-medium;
}

.station-address-row {
  overflow: hidden;
}

.station-address {
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.station-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.station-avail-wrap {
  display: flex;
  align-items: center;
}

.avail-label {
  font-size: $font-size-sm;
  color: $color-success;
  font-weight: $font-weight-medium;
}

.avail-empty {
  color: $color-error;
}

.station-price-wrap {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: $font-size-sm;
  color: $color-warning;
  font-weight: $font-weight-medium;
}

.price-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-warning;
  font-family: $font-family-number;
}

.price-unit {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-left: 4rpx;
}

.station-card-tags {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.station-tag {
  border-radius: $radius-full;
  padding: 2rpx 12rpx;
}

.tag-fast {
  background: rgba(#1677FF, 0.1);
}

.tag-fast .tag-text {
  color: #1677FF;
}

.tag-slow {
  background: rgba(#722ED1, 0.1);
}

.tag-slow .tag-text {
  color: #722ED1;
}

.tag-24h {
  background: rgba($color-primary, 0.1);
}

.tag-24h .tag-text {
  color: $color-primary;
}

.tag-parking {
  background: rgba($color-secondary, 0.1);
}

.tag-parking .tag-text {
  color: $color-secondary;
}

.tag-new {
  background: rgba($color-error, 0.1);
}

.tag-new .tag-text {
  color: $color-error;
}

.tag-promo {
  background: rgba($color-warning, 0.1);
}

.tag-promo .tag-text {
  color: $color-warning;
}

.tag-text {
  font-size: $font-size-xs;
}

/* ===== 底部安全区 ===== */
.safe-bottom {
  height: env(safe-area-inset-bottom, 0);
}
</style>
