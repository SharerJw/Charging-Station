<template>
  <view class="search-page">
    <!-- 自定义导航栏 - 搜索栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-bar-inner">
        <view class="search-input-wrap">
          <text class="search-icon">🔍</text>
          <input
            class="search-input"
            placeholder="搜索充电站名称或地址"
            v-model="keyword"
            :focus="autoFocus"
            confirm-type="search"
            @input="onInput"
            @confirm="doSearch"
          />
          <text class="clear-btn" v-if="keyword" @tap="clearKeyword">✕</text>
        </view>
        <text class="cancel-btn" @tap="goBack">取消</text>
      </view>
    </view>

    <view class="content" :style="{ paddingTop: navBarTotalHeight + 'px' }">
      <!-- 搜索联想 -->
      <view class="suggest-list" v-if="keyword && !hasSearched && suggestions.length > 0">
        <view
          class="suggest-item"
          v-for="(item, idx) in suggestions"
          :key="idx"
          @tap="selectSuggestion(item)"
        >
          <text class="suggest-icon">🔍</text>
          <text class="suggest-text">{{ item.name }}</text>
          <text class="suggest-distance">{{ formatDistance(item.distance) }}</text>
        </view>
      </view>

      <!-- 搜索历史 & 热门搜索（未输入关键词时显示） -->
      <view class="discovery-section" v-if="!keyword && !hasSearched">
        <!-- 搜索历史 -->
        <view class="section-block" v-if="searchHistory.length > 0">
          <view class="section-header">
            <text class="section-title">搜索历史</text>
            <text class="section-action" @tap="clearHistory">清空</text>
          </view>
          <view class="tag-cloud">
            <view
              class="tag-item"
              v-for="(word, idx) in searchHistory"
              :key="idx"
              @tap="selectTag(word)"
            >
              <text class="tag-text">{{ word }}</text>
            </view>
          </view>
        </view>

        <!-- 热门搜索 -->
        <view class="section-block">
          <view class="section-header">
            <text class="section-title">热门搜索</text>
          </view>
          <view class="hot-list">
            <view
              class="hot-item"
              v-for="(item, idx) in hotSearches"
              :key="idx"
              @tap="selectTag(item)"
            >
              <text class="hot-rank" :class="{ 'top-3': idx < 3 }">{{ idx + 1 }}</text>
              <text class="hot-text">{{ item }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 搜索结果列表 -->
      <view class="result-section" v-if="hasSearched">
        <view class="result-header" v-if="results.length > 0">
          <text class="result-count">找到 {{ results.length }} 个充电站</text>
        </view>

        <view class="result-list" v-if="results.length > 0">
          <view
            class="result-card"
            v-for="station in results"
            :key="station.id"
            @tap="goToStation(station)"
          >
            <view class="result-top">
              <view class="result-name-row">
                <text class="result-name">{{ station.name }}</text>
                <text class="result-tag" v-if="station.availableCount > 5">充裕</text>
                <text class="result-tag warn" v-else-if="station.availableCount > 0">紧张</text>
                <text class="result-tag full" v-else>已满</text>
              </view>
              <text class="result-distance">{{ formatDistance(station.distance) }}</text>
            </view>
            <text class="result-address">{{ station.address }}</text>
            <view class="result-bottom">
              <view class="result-info-row">
                <view class="result-rating">
                  <text class="rating-star">⭐</text>
                  <text class="rating-value">{{ station.rating || '4.5' }}</text>
                </view>
                <view class="result-availability">
                  <text class="avail-icon">⚡</text>
                  <text class="avail-text">{{ station.availableCount }}/{{ station.totalCount }} 可用</text>
                </view>
              </view>
              <view class="result-price-info">
                <text class="price-label">综合电价</text>
                <text class="price-value">¥{{ (station.electricityPrice + station.servicePrice).toFixed(2) }}/kWh</text>
              </view>
            </view>
            <view class="result-actions">
              <button class="action-btn nav-action" size="mini" @tap.stop="navigateToStation(station)">导航</button>
              <button class="action-btn charge-action" size="mini" @tap.stop="startCharge(station)">开始充电</button>
            </view>
          </view>
        </view>

        <!-- 空结果 -->
        <view class="empty-result" v-else-if="!loading">
          <text class="empty-icon">🔍</text>
          <text class="empty-title">未找到匹配的充电站</text>
          <text class="empty-desc">换个关键词试试，或查看附近推荐站点</text>
          <view class="nearby-section" v-if="nearbyStations.length > 0">
            <text class="nearby-title">附近推荐站点</text>
            <view
              class="result-card"
              v-for="station in nearbyStations"
              :key="station.id"
              @tap="goToStation(station)"
            >
              <view class="result-top">
                <view class="result-name-row">
                  <text class="result-name">{{ station.name }}</text>
                </view>
                <text class="result-distance">{{ formatDistance(station.distance) }}</text>
              </view>
              <text class="result-address">{{ station.address }}</text>
              <view class="result-bottom">
                <view class="result-availability">
                  <text class="avail-icon">⚡</text>
                  <text class="avail-text">{{ station.availableCount }}/{{ station.totalCount }} 可用</text>
                </view>
                <text class="price-value">¥{{ (station.electricityPrice + station.servicePrice).toFixed(2) }}/kWh</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载中 -->
      <view class="loading-wrap" v-if="loading">
        <text class="loading-text">搜索中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type Station } from '@/api/index'

const HISTORY_KEY = 'search_history'
const MAX_HISTORY = 10

const keyword = ref('')
const results = ref<Station[]>([])
const suggestions = ref<Station[]>([])
const searchHistory = ref<string[]>([])
const nearbyStations = ref<Station[]>([])
const loading = ref(false)
const hasSearched = ref(false)
const autoFocus = ref(true)
const statusBarHeight = ref(0)
const navBarTotalHeight = ref(0)

const hotSearches = [
  '特斯拉超充',
  '24小时充电',
  '快充站',
  '免费停车',
  '特来电',
  '星星充电',
  '国家电网',
  '地下停车场',
]

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/** 获取状态栏高度，用于自定义导航栏适配 */
function getStatusBarHeight() {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 0
  // 状态栏 + 搜索栏高度(50px)
  navBarTotalHeight.value = statusBarHeight.value + 50
}

/** 加载搜索历史 */
function loadHistory() {
  try {
    const raw = uni.getStorageSync(HISTORY_KEY)
    if (raw) {
      searchHistory.value = JSON.parse(raw)
    }
  } catch (e) {
    searchHistory.value = []
  }
}

/** 保存搜索历史 */
function saveHistory(word: string) {
  if (!word || !word.trim()) return
  const trimmed = word.trim()
  // 去重，最新在前
  const idx = searchHistory.value.indexOf(trimmed)
  if (idx !== -1) {
    searchHistory.value.splice(idx, 1)
  }
  searchHistory.value.unshift(trimmed)
  // 限制最大数量
  if (searchHistory.value.length > MAX_HISTORY) {
    searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY)
  }
  try {
    uni.setStorageSync(HISTORY_KEY, JSON.stringify(searchHistory.value))
  } catch (e) {
    // 忽略存储异常
  }
}

/** 清空搜索历史 */
function clearHistory() {
  searchHistory.value = []
  try {
    uni.removeStorageSync(HISTORY_KEY)
  } catch (e) {
    // 忽略
  }
}

/** 清空关键词 */
function clearKeyword() {
  keyword.value = ''
  suggestions.value = []
  hasSearched.value = false
  results.value = []
  autoFocus.value = true
}

/** 格式化距离 */
function formatDistance(meters: number): string {
  if (!meters || meters <= 0) return '--'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

/** 输入事件 - 防抖搜索联想 */
function onInput() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  hasSearched.value = false
  results.value = []

  if (!keyword.value || !keyword.value.trim()) {
    suggestions.value = []
    return
  }

  debounceTimer = setTimeout(async () => {
    await fetchSuggestions(keyword.value.trim())
  }, 300)
}

/** 获取搜索联想 */
async function fetchSuggestions(word: string) {
  try {
    const stations = await api.getStations({ keyword: word })
    const list = Array.isArray(stations) ? stations : []
    suggestions.value = list.slice(0, 6)
  } catch (e) {
    suggestions.value = []
  }
}

/** 执行搜索 */
async function doSearch() {
  const word = keyword.value.trim()
  if (!word) return

  saveHistory(word)
  loading.value = true
  hasSearched.value = true
  suggestions.value = []

  try {
    const stations = await api.getStations({ keyword: word })
    results.value = (Array.isArray(stations) ? stations : []).map((s: any) => ({
      ...s,
      distance: s.distance || Math.round(Math.random() * 5000 + 500),
      rating: s.rating || (4 + Math.random() * 0.9).toFixed(1),
    }))
  } catch (e) {
    results.value = []
    uni.showToast({ title: '搜索失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/** 选择搜索联想项 */
function selectSuggestion(station: Station) {
  keyword.value = station.name
  doSearch()
}

/** 选择标签（历史/热门） */
function selectTag(word: string) {
  keyword.value = word
  doSearch()
}

/** 跳转到站点详情 */
function goToStation(station: Station) {
  uni.navigateTo({
    url: `/pages/station-detail/index?id=${station.id}`,
  })
}

/** 导航到站点 */
function navigateToStation(station: Station) {
  if (station.latitude && station.longitude) {
    uni.openLocation({
      latitude: station.latitude,
      longitude: station.longitude,
      name: station.name,
      address: station.address,
    })
  }
}

/** 开始充电 */
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

/** 返回上一页 */
function goBack() {
  uni.navigateBack()
}

/** 加载附近推荐站点（用于空结果时展示） */
async function loadNearbyStations() {
  try {
    const stations = await api.getStations()
    const list = (Array.isArray(stations) ? stations : []).map((s: any) => ({
      ...s,
      distance: s.distance || Math.round(Math.random() * 5000 + 500),
    }))
    list.sort((a: Station, b: Station) => a.distance - b.distance)
    nearbyStations.value = list.slice(0, 3)
  } catch (e) {
    nearbyStations.value = []
  }
}

onMounted(() => {
  getStatusBarHeight()
  loadHistory()
  loadNearbyStations()
})
</script>

<style scoped>
.search-page {
  background: #F6F7FB;
  min-height: 100vh;
}

/* 自定义导航栏 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.nav-bar-inner {
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 24rpx;
  gap: 16rpx;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 32rpx;
  padding: 14rpx 24rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  background: transparent;
}

.clear-btn {
  font-size: 28rpx;
  color: #999;
  padding: 8rpx;
  flex-shrink: 0;
}

.cancel-btn {
  font-size: 28rpx;
  color: #07C160;
  flex-shrink: 0;
  padding: 8rpx 0;
}

/* 内容区域 */
.content {
  min-height: 100vh;
}

/* 搜索联想 */
.suggest-list {
  background: #fff;
  margin-top: 16rpx;
}

.suggest-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.suggest-icon {
  font-size: 28rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.suggest-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggest-distance {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
  margin-left: 16rpx;
}

/* 发现区域 */
.discovery-section {
  padding: 24rpx;
}

.section-block {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.section-action {
  font-size: 24rpx;
  color: #999;
}

/* 标签云 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  background: #F5F5F5;
  border-radius: 28rpx;
  padding: 12rpx 28rpx;
}

.tag-text {
  font-size: 24rpx;
  color: #666;
}

/* 热门搜索 */
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.hot-rank {
  width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: bold;
  color: #999;
  flex-shrink: 0;
}

.hot-rank.top-3 {
  color: #07C160;
}

.hot-text {
  font-size: 28rpx;
  color: #333;
}

/* 搜索结果 */
.result-section {
  padding: 16rpx 24rpx;
}

.result-header {
  padding: 8rpx 0 16rpx;
}

.result-count {
  font-size: 24rpx;
  color: #999;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.result-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.result-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.result-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-tag {
  font-size: 18rpx;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
  background: #F6FFED;
  color: #52C41A;
  flex-shrink: 0;
}

.result-tag.warn {
  background: #FFF7E6;
  color: #FAAD14;
}

.result-tag.full {
  background: #FFF2F0;
  color: #FF4D4F;
}

.result-distance {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
  margin-left: 8rpx;
}

.result-address {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.result-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.result-info-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.result-rating {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.rating-star {
  font-size: 24rpx;
}

.rating-value {
  font-size: 24rpx;
  color: #FAAD14;
  font-weight: bold;
}

.result-availability {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.avail-icon {
  font-size: 24rpx;
}

.avail-text {
  font-size: 24rpx;
  color: #666;
}

.result-price-info {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.price-label {
  font-size: 22rpx;
  color: #999;
}

.price-value {
  font-size: 26rpx;
  color: #FAAD14;
  font-weight: bold;
}

.result-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  font-size: 24rpx;
  border-radius: 8rpx;
}

.nav-action {
  background: #fff;
  color: #07C160;
  border: 2rpx solid #07C160;
}

.charge-action {
  background: #07C160;
  color: #fff;
}

/* 空结果 */
.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 24rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.nearby-section {
  width: 100%;
}

.nearby-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

/* 加载中 */
.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 60rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}
</style>
