<template>
  <view class="custom-navbar" :class="{ 'custom-navbar--transparent': transparent }" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="navbar-content">
      <!-- Left: Location -->
      <view v-if="showLocation" class="navbar-left" @tap="openCityPicker">
        <text class="location-icon">📍</text>
        <text class="city-name">{{ cityName }}</text>
        <text class="arrow-down-icon">▾</text>
      </view>
      <view v-else class="navbar-left" />

      <!-- Center: Title or Search bar -->
      <view v-if="title" class="navbar-center">
        <text class="navbar-title">{{ title }}</text>
      </view>
      <view v-else class="navbar-center" @tap="emit('search')">
        <view class="search-bar">
          <text class="search-icon">🔍</text>
          <text class="search-placeholder">搜索充电站/地址</text>
        </view>
      </view>

      <!-- Right: Messages only (预留胶囊按钮空间) -->
      <view v-if="showMessages" class="navbar-right" :style="{ paddingRight: capsuleRight + 'px' }">
        <view class="icon-btn" @tap="emit('messages')">
          <view class="bell-icon-wrapper">
            <text class="bell-icon">🔔</text>
            <view v-if="unreadCount > 0" class="badge-dot" />
          </view>
        </view>
      </view>
      <view v-else class="navbar-right" />
    </view>
  </view>
  <!-- Placeholder to prevent content from being hidden behind the fixed navbar -->
  <view v-if="!noPlaceholder" :style="{ height: navBarTotalHeight + 'px' }" />

  <!-- City Picker Popup -->
  <view v-if="showCityPicker" class="city-picker-mask" @tap="closeCityPicker">
    <view class="city-picker" @tap.stop>
      <!-- Header -->
      <view class="city-picker-header">
        <text class="city-picker-title">选择城市</text>
        <view class="city-picker-close" @tap="closeCityPicker">
          <text class="city-picker-close-text">✕</text>
        </view>
      </view>

      <scroll-view scroll-y class="city-picker-body" :scroll-into-view="scrollTarget">
        <!-- Hot Cities -->
        <view class="city-section">
          <text class="city-section-title">热门城市</text>
          <view class="hot-city-grid">
            <view
              v-for="city in hotCities"
              :key="city.name"
              class="hot-city-item"
              :class="{ 'hot-city-item--active': city.name === cityName }"
              @tap="selectCity(city.name)"
            >
              <text class="hot-city-text">{{ city.name }}</text>
            </view>
          </view>
        </view>

        <!-- All Cities grouped by letter -->
        <view
          v-for="group in groupedCities"
          :key="group.letter"
          :id="'letter-' + group.letter"
          class="city-section"
        >
          <text class="city-section-title">{{ group.letter }}</text>
          <view class="city-list">
            <view
              v-for="city in group.cities"
              :key="city.name"
              class="city-list-item"
              @tap="selectCity(city.name)"
            >
              <text class="city-list-item-text" :class="{ 'city-list-item-text--active': city.name === cityName }">{{ city.name }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- Letter Index Bar -->
      <view class="letter-index-bar">
        <view
          v-for="letter in letterIndex"
          :key="letter"
          class="letter-index-item"
          @tap="scrollToLetter(letter)"
        >
          <text class="letter-index-text">{{ letter }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getStatusBarHeight, getWindowWidth } from '@/utils/system'

interface CityItem {
  name: string
  hot?: boolean
}

const props = withDefaults(defineProps<{
  title?: string
  transparent?: boolean
  showScan?: boolean
  showLocation?: boolean
  showMessages?: boolean
  noPlaceholder?: boolean
  unreadCount?: number
  cityList?: CityItem[]
  defaultCity?: string
}>(), {
  transparent: false,
  showScan: true,
  showLocation: true,
  showMessages: true,
  noPlaceholder: false,
  unreadCount: 0,
  cityList: undefined,
  defaultCity: '定位中...',
})

const emit = defineEmits<{
  scan: []
  search: []
  location: []
  messages: []
  cityChange: [cityName: string]
}>()

const statusBarHeight = ref(0)
const capsuleRight = ref(0)
const cityName = ref(props.defaultCity)

// 监听 defaultCity prop 变化（GPS 定位完成后更新）
watch(() => props.defaultCity, (newCity) => {
  if (newCity && newCity !== '定位中...') {
    cityName.value = newCity
  }
})
const showCityPicker = ref(false)
const scrollTarget = ref('')

try {
  // H5 模式下无状态栏，statusBarHeight 设为 0
  // #ifdef H5
  statusBarHeight.value = 0
  // #endif
  // #ifndef H5
  statusBarHeight.value = getStatusBarHeight()
  // #endif

  // #ifdef MP-WEIXIN
  // 获取胶囊按钮位置，为右侧预留空间
  try {
    const capsule = wx.getMenuButtonBoundingClientRect()
    capsuleRight.value = capsule.width + 12
  } catch { /* ignore */ }
  // #endif
} catch {
  statusBarHeight.value = 20
}

/** Default city data */
const defaultCityList: CityItem[] = [
  { name: '北京', hot: true },
  { name: '上海', hot: true },
  { name: '广州', hot: true },
  { name: '深圳', hot: true },
  { name: '杭州', hot: true },
  { name: '成都', hot: true },
  { name: '武汉', hot: true },
  { name: '南京', hot: true },
  { name: '天津', hot: false },
  { name: '重庆', hot: false },
  { name: '苏州', hot: false },
  { name: '西安', hot: false },
  { name: '长沙', hot: false },
  { name: '郑州', hot: false },
  { name: '东莞', hot: false },
  { name: '青岛', hot: false },
  { name: '沈阳', hot: false },
  { name: '宁波', hot: false },
  { name: '昆明', hot: false },
  { name: '大连', hot: false },
  { name: '厦门', hot: false },
  { name: '合肥', hot: false },
  { name: '福州', hot: false },
  { name: '济南', hot: false },
  { name: '温州', hot: false },
  { name: '石家庄', hot: false },
  { name: '哈尔滨', hot: false },
  { name: '贵阳', hot: false },
  { name: '南宁', hot: false },
  { name: '长春', hot: false },
  { name: '泉州', hot: false },
  { name: '南昌', hot: false },
  { name: '太原', hot: false },
  { name: '乌鲁木齐', hot: false },
  { name: '兰州', hot: false },
  { name: '海口', hot: false },
  { name: '珠海', hot: false },
  { name: '无锡', hot: false },
  { name: '常州', hot: false },
  { name: '烟台', hot: false },
]

/** Pinyin initial mapping for common cities */
const cityPinyinMap: Record<string, string> = {
  '北京': 'B', '成都': 'C', '重庆': 'C', '长沙': 'C', '长春': 'C',
  '大连': 'D', '东莞': 'D',
  '福州': 'F',
  '广州': 'G', '贵阳': 'G',
  '杭州': 'H', '合肥': 'H', '哈尔滨': 'H', '海口': 'H',
  '济南': 'J',
  '昆明': 'K',
  '兰州': 'L',
  '南京': 'N', '南宁': 'N', '南昌': 'N', '宁波': 'N',
  '青岛': 'Q',
  '上海': 'S', '深圳': 'S', '苏州': 'S', '沈阳': 'S', '石家庄': 'S',
  '天津': 'T', '太原': 'T',
  '武汉': 'W', '温州': 'W', '乌鲁木齐': 'W', '无锡': 'W',
  '西安': 'X', '厦门': 'X',
  '烟台': 'Y',
  '郑州': 'Z', '珠海': 'Z', '常州': 'C', '泉州': 'Q',
}

/** Get letter for a city name */
function getCityLetter(name: string): string {
  return cityPinyinMap[name] || name.charAt(0).toUpperCase()
}

/** Full city list (prop or default) */
const allCities = computed<CityItem[]>(() => props.cityList ?? defaultCityList)

/** Hot cities */
const hotCities = computed<CityItem[]>(() => allCities.value.filter(c => c.hot))

/** Cities grouped by letter */
const groupedCities = computed(() => {
  const map = new Map<string, CityItem[]>()
  for (const city of allCities.value) {
    const letter = getCityLetter(city.name)
    if (!map.has(letter)) map.set(letter, [])
    map.get(letter)!.push(city)
  }
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  return sorted.map(([letter, cities]) => ({ letter, cities }))
})

/** Letter index for the sidebar */
const letterIndex = computed(() => groupedCities.value.map(g => g.letter))

function openCityPicker() {
  showCityPicker.value = true
  emit('location')
}

function closeCityPicker() {
  showCityPicker.value = false
}

function selectCity(name: string) {
  cityName.value = name
  showCityPicker.value = false
  emit('cityChange', name)
}

function scrollToLetter(letter: string) {
  scrollTarget.value = ''
  setTimeout(() => {
    scrollTarget.value = 'letter-' + letter
  }, 0)
}

/** Navbar body height in px (88rpx converted; 750rpx = screen width) */
const navBodyPx = computed(() => {
  return Math.round(88 * getWindowWidth() / 750)
})

/** Total height = statusBar + navbar body */
const navBarTotalHeight = computed(() => statusBarHeight.value + navBodyPx.value)
</script>

<style scoped>
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background-color: #ffffff;
  transition: background-color 0.2s;
}

.custom-navbar--transparent {
  background-color: transparent;
  backdrop-filter: blur(0);
}

.navbar-content {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 24rpx;
}

/* ---- Left ---- */
.navbar-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: 16rpx;
  min-width: 0;
}

.location-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.city-name {
  font-size: 26rpx;
  color: #333333;
  margin-left: 6rpx;
  max-width: 120rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-down-icon {
  font-size: 24rpx;
  color: #999999;
  flex-shrink: 0;
  margin-left: 4rpx;
}

/* ---- Center ---- */
.navbar-center {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-bar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 64rpx;
  background-color: #F5F5F5;
  border-radius: 999rpx;
  padding: 0 24rpx;
}

.search-icon {
  font-size: 28rpx;
  flex-shrink: 0;
}

.search-placeholder {
  font-size: 24rpx;
  color: #999999;
  margin-left: 12rpx;
  white-space: nowrap;
}

/* ---- Right ---- */
.navbar-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 16rpx;
  gap: 8rpx;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
}

/* Scan icon with pulse animation */
.scan-icon-wrapper {
  position: relative;
  animation: pulse-breathe 2s ease-in-out infinite;
}

.scan-icon {
  width: 44rpx;
  height: 44rpx;
  color: #07C160;
}

@keyframes pulse-breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.85;
  }
}

/* Bell icon */
.bell-icon-wrapper {
  position: relative;
}

.bell-icon {
  font-size: 40rpx;
}

/* Badge dot */
.badge-dot {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  width: 16rpx;
  height: 16rpx;
  background-color: #FF4D4F;
  border-radius: 50%;
  border: 2rpx solid #ffffff;
}

/* ---- City Picker ---- */
.city-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
}

.city-picker {
  position: relative;
  width: 100%;
  max-height: 70vh;
  background-color: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.city-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

.city-picker-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.city-picker-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.city-picker-close-text {
  font-size: 36rpx;
  color: #999999;
}

.city-picker-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 32rpx;
}

.city-section {
  padding: 24rpx 32rpx 0;
}

.city-section-title {
  font-size: 24rpx;
  color: #999999;
  font-weight: 500;
  margin-bottom: 16rpx;
}

/* Hot city grid */
.hot-city-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.hot-city-item {
  width: calc(33.333% - 11rpx);
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F5F6FA;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.hot-city-item--active {
  background-color: #E8F8EE;
  border: 2rpx solid #07C160;
}

.hot-city-text {
  font-size: 26rpx;
  color: #333333;
}

.hot-city-item--active .hot-city-text {
  color: #07C160;
  font-weight: 500;
}

/* All city list */
.city-list {
  display: flex;
  flex-direction: column;
}

.city-list-item {
  height: 80rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #f5f5f5;
}

.city-list-item:last-child {
  border-bottom: none;
}

.city-list-item-text {
  font-size: 28rpx;
  color: #333333;
}

.city-list-item-text--active {
  color: #07C160;
  font-weight: 500;
}

/* Letter index bar */
.letter-index-bar {
  position: absolute;
  right: 8rpx;
  top: 80rpx;
  bottom: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  z-index: 10;
}

.letter-index-item {
  width: 40rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.letter-index-text {
  font-size: 20rpx;
  color: #07C160;
  font-weight: 500;
}
</style>
